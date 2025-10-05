import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  BookCategoriesSchema, 
  CategoryErrorMessages 
} from "@/schemas/category.schemas";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { randomUUID } from "crypto";
import { formatCategoriesForDisplay } from "@/utils/category-serializers";
import { withBetterAuth } from "@/middlewares/auth-improved";

// =============================================================================
// 🔗 API ROUTE BOOK CATEGORIES - /api/books/[id]/categories
// =============================================================================

// GET /api/books/[id]/categories - Récupère les catégories d'un livre
export const GET = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { id: bookId } = await params;
  
  // Vérifier que le livre existe
  const existingBook = await db.book.findUnique({
    where: { id: bookId },
    select: { 
      id: true, 
      titre: true, 
      auteur: true,
      createdBy: true,
    },
  });
  
  if (!existingBook) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Livre non trouvé' : 'Book not found',
      code: 'BOOK_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Récupérer les catégories associées au livre
  const bookCategories = await db.book_category.findMany({
    where: { bookId },
    include: {
      category: true,
    },
    orderBy: {
      category: {
        ordre_affichage: 'asc',
      },
    },
  });
  
  // Extraire et formater les catégories
  const categories = bookCategories.map(bc => bc.category);
  const formattedCategories = formatCategoriesForDisplay(categories);
  
  // Informations du livre
  const bookInfo = {
    id: existingBook.id,
    titre: existingBook.titre,
    auteur: existingBook.auteur,
  };
  
  return NextResponse.json({
    success: true,
    data: {
      book: bookInfo,
      categories: formattedCategories,
      total_categories: categories.length,
    },
    execution_time_ms: Date.now() - startTime,
  });
});

// PUT /api/books/[id]/categories - Remplacer toutes les catégories d'un livre (protégé)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const { id: bookId } = await params;

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
    
    // Parser et valider les données
    const body = await request.json();
    const validatedData = BookCategoriesSchema.parse(body);
    const { category_ids } = validatedData;
    
    // Vérifier que toutes les catégories existent et sont actives
    const existingCategories = await db.category.findMany({
      where: {
        id: { in: category_ids },
        est_actif: true,
      },
      select: { id: true, nom: true, couleur: true, icone: true },
    });
    
    if (existingCategories.length !== category_ids.length) {
      const foundIds = existingCategories.map(cat => cat.id);
      const missingIds = category_ids.filter(id => !foundIds.includes(id));
      
      return NextResponse.json({
        success: false,
        error: "Certaines catégories n'ont pas été trouvées ou ne sont pas actives",
        code: 'CATEGORIES_NOT_FOUND_OR_INACTIVE',
        missing_category_ids: missingIds,
      }, { status: 404 });
    }
    
    // Utiliser une transaction pour remplacer toutes les catégories
    const result = await db.$transaction(async (tx) => {
      // Supprimer toutes les associations existantes
      await tx.book_category.deleteMany({
        where: { bookId },
      });
      
      // Créer les nouvelles associations
      const { randomUUID } = await import('crypto');
      const newAssociations = category_ids.map(categoryId => ({
        id: randomUUID(),
        bookId,
        categoryId,
      }));
      
      await tx.book_category.createMany({
        data: newAssociations,
      });
      
      return { updated: true };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        book: existingBook,
        categories: existingCategories,
        total_categories: existingCategories.length,
      },
      message: lang === 'fr' 
        ? `Catégories du livre "${existingBook.titre}" mises à jour` 
        : `Categories for book "${existingBook.titre}" updated`,
      execution_time_ms: Date.now() - startTime,
    });
  });
}

// POST /api/books/[id]/categories - Ajouter des catégories à un livre (protégé)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const { id: bookId } = await params;
    
    // Vérifier que le livre existe et appartient à l'utilisateur
    const existingBook = await db.book.findUnique({
      where: { 
        id: bookId,
        createdBy: user?.id,
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
    
    // Parser et valider les données
    const body = await request.json();
    const validatedData = BookCategoriesSchema.parse(body);
    const { category_ids } = validatedData;
    
    // Vérifier que toutes les catégories existent et sont actives
    const existingCategories = await db.category.findMany({
      where: {
        id: { in: category_ids },
        est_actif: true,
      },
      select: { id: true, nom: true, couleur: true, icone: true },
    });
    
    if (existingCategories.length !== category_ids.length) {
      const foundIds = existingCategories.map(cat => cat.id);
      const missingIds = category_ids.filter(id => !foundIds.includes(id));
      
      return NextResponse.json({
        success: false,
        error: "Certaines catégories n'ont pas été trouvées ou ne sont pas actives",
        code: 'CATEGORIES_NOT_FOUND_OR_INACTIVE',
        missing_category_ids: missingIds,
      }, { status: 404 });
    }
    
    // Créer les nouvelles associations (ignorer les doublons)
    const newAssociations = category_ids.map(categoryId => ({
      id: randomUUID(),
      bookId,
      categoryId,
    }));
    
    try {
      const result = await db.book_category.createMany({
        data: newAssociations,
        skipDuplicates: true,
      });
      
      // Récupérer toutes les catégories du livre après ajout
      const allBookCategories = await db.book_category.findMany({
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
      
      const allCategories = allBookCategories.map(bc => bc.category);
      
      return NextResponse.json({
        success: true,
        data: {
          book: existingBook,
          categories_added: existingCategories,
          all_categories: allCategories,
          associations_created: result.count,
          total_categories: allCategories.length,
        },
        message: lang === 'fr' 
          ? `${result.count} catégorie(s) ajoutée(s) au livre "${existingBook.titre}"` 
          : `${result.count} categor${result.count > 1 ? 'ies' : 'y'} added to book "${existingBook.titre}"`,
        execution_time_ms: Date.now() - startTime,
      });
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Erreur lors de l'ajout des catégories",
        code: 'ASSOCIATION_ERROR',
      }, { status: 500 });
    }
  });
}

// DELETE /api/books/[id]/categories - Supprimer des catégories d'un livre (protégé)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const { id: bookId } = await params;

    // Vérifier que le livre existe et appartient à l'utilisateur
    const existingBook = await db.book.findUnique({
      where: { 
        id: bookId,
        createdBy: user?.id,
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
    
    // Récupérer les catégories à supprimer depuis les paramètres de requête
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get('category_ids')?.split(',');
    
    const deleteWhere: any = { bookId };
    
    if (categoryIds && categoryIds.length > 0) {
      // Supprimer des catégories spécifiques
      deleteWhere.categoryId = { in: categoryIds };
    }
    // Sinon, supprimer toutes les catégories du livre (deleteWhere reste { bookId })
    
    // Supprimer les associations
    const deletedCount = await db.book_category.deleteMany({
      where: deleteWhere,
    });
    
    // Récupérer les catégories restantes
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
        remaining_categories: remainingCats,
        dissociations_count: deletedCount.count,
        total_remaining_categories: remainingCats.length,
      },
      message: lang === 'fr' 
        ? `${deletedCount.count} catégorie(s) supprimée(s) du livre "${existingBook.titre}"` 
        : `${deletedCount.count} categor${deletedCount.count > 1 ? 'ies' : 'y'} removed from book "${existingBook.titre}"`,
      execution_time_ms: Date.now() - startTime,
    });
  });
}
