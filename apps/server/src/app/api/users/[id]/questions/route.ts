import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id]/questions - Récupérer les questions d'un utilisateur (authentifié)
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id: userId } = await params;

      if (!userId || typeof userId !== "string") {
        return NextResponse.json(
          { error: "Invalid user ID" },
          { status: 400 }
        );
      }

      // Vérifier que l'utilisateur peut accéder aux questions (soit ses propres questions, soit admin)
      if (user.id !== userId && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Unauthorized access" },
          { status: 403 }
        );
      }

      const questions = await db.book_question.findMany({
        where: { 
          authorId: userId
        },
        include: {
          book: {
            select: { 
              id: true,
              titre: true,
              image_couverture: true 
            }
          },
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
          }
        },
        orderBy: [
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
        book: {
          id: q.book.id,
          titre: q.book.titre,
          couverture: q.book.image_couverture
        },
        user: {
          nom_complet: q.user_book_question_authorIdTouser.nom_complet || 'Utilisateur',
          avatar: q.user_book_question_authorIdTouser.avatar
        },
        answeredBy: q.user_book_question_answeredByIdTouser ? {
          nom_complet: q.user_book_question_answeredByIdTouser.nom_complet || 'Admin',
          avatar: q.user_book_question_answeredByIdTouser.avatar
        } : null,
        likes_count: q._count.book_question_like,
        is_liked: false // TODO: vérifier si l'utilisateur connecté a liké
      }));

      return NextResponse.json({
        success: true,
        data: questionsFormatted
      });

    } catch (error) {
      console.error("Get user questions error:", error);
      return NextResponse.json(
        { error: "Failed to fetch user questions" },
        { status: 500 }
      );
    }
  });
}