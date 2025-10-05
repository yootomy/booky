import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  UpdateCategorySchema, 
  CategoryErrorMessages 
} from "@/schemas/category.schemas";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  serializeCategory,
  sanitizeCategoryData
} from "@/utils/category-serializers";
import { withBetterAuth } from "@/middlewares/auth-improved";

// =============================================================================
// 📂 API ROUTE CATEGORY INDIVIDUAL - /api/categories/[id]
// =============================================================================

// GET /api/categories/[id] - Récupère les détails d'une catégorie
export const GET = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { id: categoryId } = await params;
  
  // Vérifier les paramètres optionnels
  const { searchParams } = new URL(request.url);
  const includeBooks = searchParams.get('include_books') === 'true';
  const includeBookCount = searchParams.get('include_book_count') === 'true';
  
  // Construire les options d'inclusion
  const include: any = {};
  
  if (includeBookCount || includeBooks) {
    include._count = {
      select: { book_category: true }
    };
  }
  
  if (includeBooks) {
    include.books = {
      select: {
        book: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            image_couverture: true,
            statut: true,
            note_generale: true,
            date_creation: true,
            date_modification: true,
          }
        }
      },
      orderBy: {
        book: {
          date_creation: 'desc'
        }
      },
      take: 20, // Limiter à 20 livres pour éviter des réponses trop lourdes
    };
  }
  
  // Récupérer la catégorie
  const category = await db.category.findUnique({
    where: { id: categoryId },
    include,
  });
  
  if (!category) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].CATEGORY_NOT_FOUND,
      code: 'CATEGORY_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Sérialiser la réponse
  const serializedCategory = serializeCategory(category as any, {
    includeBookCount: includeBookCount || includeBooks,
    includeBooks,
  });
  
  return NextResponse.json({
    success: true,
    data: serializedCategory,
    execution_time_ms: Date.now() - startTime,
  });
});

// PUT /api/categories/[id] - Modifier une catégorie (protégé)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const { id: categoryId } = await params;
    
    // Vérifier que la catégorie existe
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: CategoryErrorMessages[lang].CATEGORY_NOT_FOUND,
        code: 'CATEGORY_NOT_FOUND',
      }, { status: 404 });
    }
    
    // Parser et valider les données
    const body = await request.json();
    const validatedData = UpdateCategorySchema.parse(body);
    
    // Nettoyer les données
    const cleanedData = sanitizeCategoryData(validatedData);
    
    // Vérifier l'unicité du nom si il est modifié
    if (cleanedData.nom && cleanedData.nom !== existingCategory.nom) {
      const categoryWithSameName = await db.category.findFirst({
        where: {
          nom: {
            equals: cleanedData.nom,
            mode: 'insensitive',
          },
          id: {
            not: categoryId,
          },
        },
      });
      
      if (categoryWithSameName) {
        return NextResponse.json({
          success: false,
          error: CategoryErrorMessages[lang].CATEGORY_NAME_EXISTS,
          code: 'CATEGORY_NAME_EXISTS',
          field: 'nom',
        }, { status: 409 });
      }
    }
    
    // Mettre à jour la catégorie
    const updatedCategory = await db.category.update({
      where: { id: categoryId },
      data: {
        ...cleanedData,
        date_modification: new Date(),
      },
      include: {
        _count: {
          select: { book_category: true }
        }
      }
    });
    
    // Sérialiser la réponse
    const serializedCategory = serializeCategory(updatedCategory, {
      includeBookCount: true,
    });
    
    return NextResponse.json({
      success: true,
      data: serializedCategory,
      message: lang === 'fr' ? 'Catégorie mise à jour avec succès' : 'Category updated successfully',
      execution_time_ms: Date.now() - startTime,
    });
  });
}

// DELETE /api/categories/[id] - Supprimer une catégorie (protégé)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const { id: categoryId } = await params;
    
    // Vérifier que la catégorie existe et récupérer le nombre de livres
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { book_category: true }
        }
      }
    });
    
    if (!existingCategory) {
      return NextResponse.json({
        success: false,
        error: CategoryErrorMessages[lang].CATEGORY_NOT_FOUND,
        code: 'CATEGORY_NOT_FOUND',
      }, { status: 404 });
    }
    
    // Vérifier si la catégorie est utilisée par des livres
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    if (existingCategory._count.book_category > 0 && !force) {
      return NextResponse.json({
        success: false,
        error: CategoryErrorMessages[lang].CATEGORY_IN_USE,
        code: 'CATEGORY_IN_USE',
        metadata: {
          book_count: existingCategory._count.book_category,
          can_force_delete: true,
        },
      }, { status: 409 });
    }
    
    // Si force=true, dissocier d'abord tous les livres
    if (existingCategory._count.book_category > 0 && force) {
      await db.book_category.deleteMany({
        where: {
          categoryId: categoryId,
        },
      });
    }
    
    // Supprimer la catégorie
    const deletedCategory = await db.category.delete({
      where: { id: categoryId },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: deletedCategory.id,
        nom: deletedCategory.nom,
      },
      message: lang === 'fr' ? 'Catégorie supprimée avec succès' : 'Category deleted successfully',
      metadata: {
        forced_deletion: force,
        books_dissociated: existingCategory._count.book_category,
      },
      execution_time_ms: Date.now() - startTime,
    });
  });
}
