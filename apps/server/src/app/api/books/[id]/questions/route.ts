import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schéma pour créer une question
const createQuestionSchema = z.object({
  question: z.string().min(10, "La question doit faire au moins 10 caractères").max(1000, "La question ne peut pas dépasser 1000 caractères"),
});

// GET /api/books/[id]/questions - Récupérer les questions d'un livre (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId } = await params;

    if (!bookId || typeof bookId !== "string") {
      return NextResponse.json(
        { error: "Invalid book ID" },
        { status: 400 }
      );
    }

    // Vérifier que le livre existe
    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true }
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // Essayer d'obtenir l'utilisateur connecté (optionnel)
    let currentUserId: string | null = null;
    try {
      // Utiliser une approche simplifiée pour extraire l'utilisateur des cookies
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('booky_auth');

      if (authCookie) {
        // Décoder le JWT pour obtenir l'ID utilisateur (simple extraction)
        const payload = JSON.parse(Buffer.from(authCookie.value.split('.')[1], 'base64').toString());
        currentUserId = payload.sub || payload.id;
      }
    } catch {
      // Pas d'utilisateur connecté, c'est OK
    }

    const questions = await db.book_question.findMany({
      where: {
        bookId,
        is_public: true,
        status: { in: ['ANSWERED', 'PENDING'] }
      },
      include: {
        user_book_question_authorIdTouser: {
          select: {
            id: true,
            nom_complet: true,
            avatar: true
          }
        },
        user_book_question_answeredByIdTouser: {
          select: {
            id: true,
            nom_complet: true,
            avatar: true
          }
        },
        _count: {
          select: { book_question_like: true }
        },
        book_question_like: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true }
        } : false
      },
      orderBy: [
        { status: 'asc' }, // ANSWERED en premier
        { date_question: 'desc' }
      ]
    });

    // Transformer les données pour le frontend
    const questionsFormatted = questions.map(q => ({
      id: q.id,
      question: q.question,
      reponse: q.reponse,
      date_question: q.date_question.toISOString(),
      date_reponse: q.date_reponse?.toISOString() || null,
      status: q.status,
      user: {
        nom_complet: q.user_book_question_authorIdTouser.nom_complet || 'Utilisateur',
        avatar: q.user_book_question_authorIdTouser.avatar
      },
      answeredBy: q.user_book_question_answeredByIdTouser ? {
        nom_complet: q.user_book_question_answeredByIdTouser.nom_complet || 'Admin',
        avatar: q.user_book_question_answeredByIdTouser.avatar
      } : null,
      likes_count: q._count.book_question_like,
      is_liked: currentUserId && q.book_question_like && q.book_question_like.length > 0
    }));

    return NextResponse.json({
      success: true,
      data: questionsFormatted
    });

  } catch (error) {
    console.error("Get book questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST /api/books/[id]/questions - Créer une nouvelle question (authentifié)
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id: bookId } = await params;

      if (!bookId || typeof bookId !== "string") {
        return NextResponse.json(
          { error: "Invalid book ID" },
          { status: 400 }
        );
      }

      // Vérifier que le livre existe
      const book = await db.book.findUnique({
        where: { id: bookId },
        select: { id: true }
      });

      if (!book) {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }

      const body = await req.json();
      const validatedData = createQuestionSchema.parse(body);

      // Créer la question
      const { randomUUID } = await import('crypto');
      const question = await db.book_question.create({
        data: {
          id: randomUUID(),
          question: validatedData.question,
          bookId,
          authorId: user.id,
          status: 'PENDING'
        },
        include: {
          user_book_question_authorIdTouser: {
            select: { 
              id: true,
              nom_complet: true, 
              avatar: true 
            }
          },
          _count: {
            select: { book_question_like: true }
          }
        }
      });

      console.log(`❓ Question créée sur le livre "${bookId}" par ${user.nom_complet}`);

      const questionFormatted = {
        id: question.id,
        question: question.question,
        reponse: question.reponse,
        date_question: question.date_question.toISOString(),
        date_reponse: question.date_reponse?.toISOString() || null,
        status: question.status,
        user: {
          nom_complet: question.user_book_question_authorIdTouser.nom_complet || 'Utilisateur',
          avatar: question.user_book_question_authorIdTouser.avatar
        },
        likes_count: question._count.book_question_like,
        is_liked: false
      };

      return NextResponse.json({
        success: true,
        data: questionFormatted,
        message: "Question soumise avec succès ! Elle sera modérée avant publication."
      });

    } catch (error) {
      console.error("Create question error:", error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Validation error",
            details: error.issues 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create question" },
        { status: 500 }
      );
    }
  });
}