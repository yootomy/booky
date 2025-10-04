import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { randomUUID } from "crypto";

// GET /api/questions - Récupérer les questions de l'utilisateur connecté
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || '';
      const include = searchParams.get('include') || '';

      const skip = (page - 1) * limit;

      // Construire les filtres
      const whereClause: any = {
        authorId: user.id // Seulement les questions de l'utilisateur connecté
      };
      
      if (status) {
        whereClause.status = status;
      }

      // Configuration des includes selon les paramètres
      const includeConfig: any = {
        book: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            image_couverture: true
          }
        },
        user_book_question_authorIdTouser: {
          select: {
            nom_complet: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            book_question_like: true
          }
        }
      };

      // Ajouter les données admin seulement si on demande les réponses
      if (include.includes('responses')) {
        includeConfig.user_book_question_answeredByIdTouser = {
          select: {
            nom_complet: true,
            username: true,
            avatar: true,
            role: true
          }
        };
      }

      // Récupérer les questions avec comptage
      const [questions, totalCount] = await Promise.all([
        db.book_question.findMany({
          where: whereClause,
          include: includeConfig,
          orderBy: {
            date_question: 'desc'
          },
          skip,
          take: limit
        }),
        db.book_question.count({
          where: whereClause
        })
      ]);

      // Transformer les données pour le frontend
      const questionsFormatted = questions.map(q => {
        const finalStatus = q.reponse ? 'APPROVED' : q.status;

        // Construire l'array des réponses si elles sont demandées et qu'il y en a
        const responses = [];
        if (include.includes('responses') && q.reponse && q.user_book_question_answeredByIdTouser && 'nom_complet' in q.user_book_question_answeredByIdTouser) {
          const answeredBy = q.user_book_question_answeredByIdTouser as any;
          responses.push({
            id: `${q.id}-response`, // ID unique pour la réponse
            contenu: q.reponse,
            date_creation: q.date_reponse?.toISOString() || q.date_question.toISOString(),
            author: {
              nom_complet: answeredBy.nom_complet,
              username: answeredBy.username,
              avatar: answeredBy.avatar,
              role: answeredBy.role || 'ADMIN'
            }
          });
        }

        const book = q.book as any;
        const author = q.user_book_question_authorIdTouser as any;
        const count = q._count as any;

        const result: any = {
          id: q.id,
          contenu: q.question, // Schema uses 'question' field
          status: finalStatus, // If there's a response, mark as APPROVED
          date_creation: q.date_question.toISOString(), // Schema uses 'date_question' field
          date_modification: q.date_reponse?.toISOString() || null, // Using date_reponse as modification date
          book: {
            id: book.id,
            titre: book.titre,
            auteur: book.auteur,
            image_couverture: book.image_couverture
          },
          author: {
            nom_complet: author.nom_complet,
            username: author.username,
            avatar: author.avatar
          },
          stats: {
            likes_count: count.book_question_like,
            responses_count: q.reponse ? 1 : 0 // Compter les réponses disponibles
          }
        };

        // Ajouter les réponses seulement si demandées
        if (include.includes('responses')) {
          result.responses = responses;
        }

        return result;
      });

      return NextResponse.json({
        success: true,
        data: questionsFormatted,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error("Get user questions error:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }
  });
}

// POST /api/questions - Créer une nouvelle question
export async function POST(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      const { bookId, contenu } = body;

      if (!bookId || !contenu) {
        return NextResponse.json(
          { error: "bookId and contenu are required" },
          { status: 400 }
        );
      }

      // Vérifier que le livre existe
      const book = await db.book.findUnique({
        where: { id: bookId }
      });

      if (!book) {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }

      // Créer la question
      const question = await db.book_question.create({
        data: {
          id: randomUUID(),
          question: contenu, // Schema uses 'question' field instead of 'contenu'
          bookId,
          authorId: user.id,
          status: 'PENDING'
        },
        include: {
          book: {
            select: {
              id: true,
              titre: true,
              auteur: true,
              image_couverture: true
            }
          },
          user_book_question_authorIdTouser: {
            select: {
              nom_complet: true,
              username: true,
              avatar: true
            }
          }
        }
      });

      const questionFormatted = {
        id: question.id,
        contenu: question.question, // Schema uses 'question' field
        status: question.status,
        date_creation: question.date_question.toISOString(), // Schema uses 'date_question' field
        book: question.book,
        author: question.user_book_question_authorIdTouser,
        stats: {
          likes_count: 0,
          responses_count: 0
        }
      };

      return NextResponse.json({
        success: true,
        data: questionFormatted
      });

    } catch (error) {
      console.error("Create question error:", error);
      return NextResponse.json(
        { error: "Failed to create question" },
        { status: 500 }
      );
    }
  });
}