import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

// POST /api/books/[id]/questions/[questionId]/like - Liker/Unliker une question
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id: bookId, questionId } = await params;

      if (!bookId || !questionId) {
        return NextResponse.json(
          { error: "Invalid parameters" },
          { status: 400 }
        );
      }

      // Vérifier que la question existe
      const question = await db.book_question.findFirst({
        where: { 
          id: questionId,
          bookId,
          is_public: true
        }
      });

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Vérifier si l'utilisateur a déjà liké cette question
      const existingLike = await db.book_question_like.findUnique({
        where: {
          questionId_userId: {
            questionId,
            userId: user.id
          }
        }
      });

      let isLiked = false;
      let likesCount = 0;

      if (existingLike) {
        // Supprimer le like (unlike)
        await db.book_question_like.delete({
          where: { id: existingLike.id }
        });
        isLiked = false;
      } else {
        // Ajouter le like
        const { randomUUID } = await import('crypto');
        await db.book_question_like.create({
          data: {
            id: randomUUID(),
            questionId,
            userId: user.id
          }
        });
        isLiked = true;
      }

      // Récupérer le nombre total de likes
      const totalLikes = await db.book_question_like.count({
        where: { questionId }
      });

      likesCount = totalLikes;

      console.log(`${isLiked ? '👍' : '👎'} Question "${questionId}" ${isLiked ? 'likée' : 'unlikée'} par ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        data: {
          questionId,
          isLiked,
          likesCount
        },
        message: isLiked ? "Question likée !" : "Like retiré"
      });

    } catch (error) {
      console.error("Toggle question like error:", error);
      return NextResponse.json(
        { error: "Failed to toggle like" },
        { status: 500 }
      );
    }
  });
}

// GET /api/books/[id]/questions/[questionId]/like - Vérifier le statut de like
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id: bookId, questionId } = await params;

      if (!bookId || !questionId) {
        return NextResponse.json(
          { error: "Invalid parameters" },
          { status: 400 }
        );
      }

      // Vérifier si l'utilisateur a liké cette question
      const existingLike = await db.book_question_like.findUnique({
        where: {
          questionId_userId: {
            questionId,
            userId: user.id
          }
        }
      });

      // Récupérer le nombre total de likes
      const totalLikes = await db.book_question_like.count({
        where: { questionId }
      });

      return NextResponse.json({
        success: true,
        data: {
          questionId,
          isLiked: !!existingLike,
          likesCount: totalLikes
        }
      });

    } catch (error) {
      console.error("Get question like status error:", error);
      return NextResponse.json(
        { error: "Failed to get like status" },
        { status: 500 }
      );
    }
  });
}