import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";

// GET /api/admin/questions - Récupérer toutes les questions (admin seulement)
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      // Vérifier que l'utilisateur est admin
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Access denied - Admin required" },
          { status: 403 }
        );
      }

      const questions = await db.book_question.findMany({
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
        book_title: q.book.titre,
        book_id: q.book.id,
        user_name: q.user_book_question_authorIdTouser.nom_complet || 'Utilisateur',
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
      console.error("Get all questions error:", error);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }
  });
}