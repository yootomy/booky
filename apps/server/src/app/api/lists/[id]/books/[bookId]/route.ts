import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import {
  handleError,
  detectLanguageFromHeaders,
  withErrorHandler,
  ValidationError
} from "@/utils/error-handler";

// DELETE /api/lists/[id]/books/[bookId] - Retirer un livre de la liste (protégé)
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string; bookId: string } }
) => {
  return withBetterAuth(request, async (req, user) => {
    // Vérifier que la liste existe et appartient à l'utilisateur
    const list = await db.custom_list.findUnique({
      where: { id: params.id }
    });

    if (!list) {
      return NextResponse.json({
        success: false,
        error: "Liste non trouvée"
      }, { status: 404 });
    }

    if (list.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: "Non autorisé à modifier cette liste"
      }, { status: 403 });
    }

    // Vérifier que le livre est dans la liste
    const listBook = await db.list_book.findUnique({
      where: {
        listId_bookId: {
          listId: params.id,
          bookId: params.bookId
        }
      },
      include: {
        book: {
          select: { titre: true, auteur: true }
        }
      }
    });

    if (!listBook) {
      return NextResponse.json({
        success: false,
        error: "Ce livre n'est pas dans la liste"
      }, { status: 404 });
    }

    // Supprimer le livre de la liste
    await db.list_book.delete({
      where: {
        listId_bookId: {
          listId: params.id,
          bookId: params.bookId
        }
      }
    });

    console.log(`📋 Book "${listBook.book.titre}" removed from list "${list.nom}" by ${user.nom_complet}`);

    return NextResponse.json({
      success: true,
      message: "Livre retiré de la liste avec succès"
    });
  });
});