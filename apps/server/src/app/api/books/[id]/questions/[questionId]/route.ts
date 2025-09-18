import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

// Schéma pour répondre à une question
const answerQuestionSchema = z.object({
  reponse: z.string().min(10, "La réponse doit faire au moins 10 caractères").max(2000, "La réponse ne peut pas dépasser 2000 caractères"),
});

// Schéma pour mettre à jour le statut d'une question
const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'ANSWERED', 'REJECTED']),
});

// PUT /api/books/[id]/questions/[questionId] - Répondre à une question (admin seulement)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id: bookId, questionId } = await params;

      if (!bookId || !questionId) {
        return NextResponse.json(
          { error: "Invalid parameters" },
          { status: 400 }
        );
      }

      // Vérifier que l'utilisateur est admin
      if (user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only admins can answer questions" },
          { status: 403 }
        );
      }

      // Vérifier que la question existe
      const existingQuestion = await db.book_question.findFirst({
        where: { 
          id: questionId,
          bookId 
        }
      });

      if (!existingQuestion) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      const body = await req.json();
      const validatedData = answerQuestionSchema.parse(body);

      // Mettre à jour la question avec la réponse
      const updatedQuestion = await db.book_question.update({
        where: { id: questionId },
        data: {
          reponse: validatedData.reponse,
          date_reponse: new Date(),
          status: 'ANSWERED',
          answeredById: user.id
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
          }
        }
      });

      console.log(`✅ Question "${questionId}" répondue par ${user.nom_complet}`);

      const questionFormatted = {
        id: updatedQuestion.id,
        question: updatedQuestion.question,
        reponse: updatedQuestion.reponse,
        date_question: updatedQuestion.date_question.toISOString(),
        date_reponse: updatedQuestion.date_reponse?.toISOString() || null,
        status: updatedQuestion.status,
        user: {
          nom_complet: updatedQuestion.user_book_question_authorIdTouser.nom_complet || 'Utilisateur',
          avatar: updatedQuestion.user_book_question_authorIdTouser.avatar
        },
        answeredBy: updatedQuestion.user_book_question_answeredByIdTouser ? {
          nom_complet: updatedQuestion.user_book_question_answeredByIdTouser.nom_complet || 'Admin',
          avatar: updatedQuestion.user_book_question_answeredByIdTouser.avatar
        } : null,
        likes_count: updatedQuestion._count.book_question_like,
        is_liked: false
      };

      return NextResponse.json({
        success: true,
        data: questionFormatted,
        message: "Réponse ajoutée avec succès !"
      });

    } catch (error) {
      console.error("Answer question error:", error);
      
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
        { error: "Failed to answer question" },
        { status: 500 }
      );
    }
  });
}

// PATCH /api/books/[id]/questions/[questionId] - Modérer une question (admin seulement)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id: bookId, questionId } = await params;

      if (!bookId || !questionId) {
        return NextResponse.json(
          { error: "Invalid parameters" },
          { status: 400 }
        );
      }

      // Vérifier que l'utilisateur est admin
      if (user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only admins can moderate questions" },
          { status: 403 }
        );
      }

      // Vérifier que la question existe
      const existingQuestion = await db.book_question.findFirst({
        where: { 
          id: questionId,
          bookId 
        }
      });

      if (!existingQuestion) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      const body = await req.json();
      const validatedData = updateStatusSchema.parse(body);

      // Mettre à jour le statut
      const updatedQuestion = await db.book_question.update({
        where: { id: questionId },
        data: {
          status: validatedData.status,
          is_public: validatedData.status !== 'REJECTED'
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

      console.log(`🛡️ Question "${questionId}" modérée par ${user.nom_complet}: ${validatedData.status}`);

      return NextResponse.json({
        success: true,
        data: {
          id: updatedQuestion.id,
          status: updatedQuestion.status,
          is_public: updatedQuestion.is_public
        },
        message: `Question ${validatedData.status.toLowerCase()}`
      });

    } catch (error) {
      console.error("Moderate question error:", error);
      
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
        { error: "Failed to moderate question" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/books/[id]/questions/[questionId] - Supprimer une question
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      const existingQuestion = await db.book_question.findFirst({
        where: { 
          id: questionId,
          bookId 
        },
        include: {
          user_book_question_authorIdTouser: { select: { id: true } }
        }
      });

      if (!existingQuestion) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Vérifier les permissions (auteur ou admin)
      if (existingQuestion.authorId !== user.id && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "You don't have permission to delete this question" },
          { status: 403 }
        );
      }

      // Supprimer la question (et ses likes grâce au CASCADE)
      await db.book_question.delete({
        where: { id: questionId }
      });

      console.log(`🗑️ Question "${questionId}" supprimée par ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        message: "Question supprimée avec succès"
      });

    } catch (error) {
      console.error("Delete question error:", error);
      return NextResponse.json(
        { error: "Failed to delete question" },
        { status: 500 }
      );
    }
  });
}