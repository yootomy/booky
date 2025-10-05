import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { CategoryErrorMessages } from "@/schemas/category.schemas";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import type { BookCategoryParams, ApiResponse } from "@/types/api";

// =============================================================================
// 🔗 API ROUTE BOOK CATEGORY SPECIFIC - /api/books/[id]/categories/[categoryId]
// =============================================================================

// DELETE /api/books/[id]/categories/[categoryId] - Dissocier une catégorie spécifique d'un livre (protégé)
export async function DELETE(
  request: NextRequest,
  { params }: BookCategoryParams
) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const { id: bookId, categoryId } = await params;
    
    // Vérifier que le livre existe et appartient à l'utilisateur
    const existingBook = await db.book.findUnique({
      where: { 
        id: bookId,
        createdBy: user.id,
      },
      select: { 
        id: true, 
        titre: true, 
        auteur: true,
      },
    });
    
    if (!existingBook) {
      return NextResponse.json({
        success: false,
        error: lang === 'fr' ? 'Livre non trouvé ou non autorisé' : 'Book not found or not authorized',
        code: 'BOOK_NOT_FOUND_OR_UNAUTHORIZED',
      }, { status: 404 });
    }
    
    // Vérifier que la catégorie existe
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
      select: { 
        id: true, 
        nom: true, 
        couleur: true, 
        icone: true 
      },
    });
    
    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: CategoryErrorMessages[lang].CATEGORY_NOT_FOUND,
        code: 'CATEGORY_NOT_FOUND',
      }, { status: 404 });
    }
    
    // Vérifier que l'association existe
    const existingAssociation = await db.book_category.findFirst({
      where: {
        bookId,
        categoryId,
      },
    });
    
    if (!existingAssociation) {
      return NextResponse.json({
        success: false,
        error: lang === 'fr' ? 'Cette catégorie n\'est pas associée à ce livre' : 'This category is not associated with this book',
        code: 'ASSOCIATION_NOT_FOUND',
      }, { status: 404 });
    }
    
    // Supprimer l'association spécifique
    const deletedAssociation = await db.book_category.delete({
      where: {
        id: existingAssociation.id,
      },
    });
    
    // Récupérer les catégories restantes du livre
    const remainingCategories = await db.book_category.findMany({
      where: { bookId },
      include: {
        category: {
          select: { id: true, nom: true, couleur: true, icone: true }
        }
      },
      orderBy: {
        category: {
          ordre_affichage: 'asc',
        },
      },
    });
    
    const remainingCats = remainingCategories.map(bc => bc.category);
    
    return NextResponse.json({
      success: true,
      data: {
        book: existingBook,
        dissociated_category: existingCategory,
        remaining_categories: remainingCats,
        total_remaining_categories: remainingCats.length,
      },
      message: lang === 'fr' 
        ? `Catégorie "${existingCategory.nom}" dissociée du livre "${existingBook.titre}"` 
        : `Category "${existingCategory.nom}" dissociated from book "${existingBook.titre}"`,
      execution_time_ms: Date.now() - startTime,
    });
  });
}
