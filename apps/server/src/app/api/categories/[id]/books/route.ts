import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  CategoryBooksFiltersSchema, 
  CategoryErrorMessages 
} from "@/schemas/category.schemas";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { randomUUID } from "crypto";
import { serializeBook } from "@/utils/serializers";
import {
  createPaginatedResponse,
  calculatePagination,
  createSearchInfo,
  getAppliedFilters
} from "@/utils/serializers";
import { getTypedSession } from "@/utils/auth-helpers";

// =============================================================================
// 📚 API ROUTE BOOKS BY CATEGORY - /api/categories/[id]/books
// =============================================================================

// GET /api/categories/[id]/books - Récupère les livres d'une catégorie
export const GET = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { id: categoryId } = await params;
  
  // Vérifier que la catégorie existe
  const existingCategory = await db.category.findUnique({
    where: { id: categoryId },
    select: { 
      id: true, 
      nom: true, 
      couleur: true, 
      icone: true, 
      est_actif: true 
    },
  });
  
  if (!existingCategory) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].CATEGORY_NOT_FOUND,
      code: 'CATEGORY_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Parser et valider les paramètres de requête
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Transformer les paramètres de requête
  const transformedQuery = {
    ...queryObject,
    page: queryObject.page ? parseInt(queryObject.page) : undefined,
    limit: queryObject.limit ? parseInt(queryObject.limit) : undefined,
    niveau_spicy: queryObject.niveau_spicy ? parseInt(queryObject.niveau_spicy) : undefined,
    niveau_dark: queryObject.niveau_dark ? parseInt(queryObject.niveau_dark) : undefined,
    min_rating: queryObject.min_rating ? parseFloat(queryObject.min_rating) : undefined,
    max_rating: queryObject.max_rating ? parseFloat(queryObject.max_rating) : undefined,
  };
  
  // Valider les paramètres
  const validatedQuery = CategoryBooksFiltersSchema.parse(transformedQuery);
  const { 
    statut, niveau_spicy, niveau_dark, min_rating, max_rating,
    sort, order, page, limit 
  } = validatedQuery;

  // Construire les filtres pour les livres
  const bookWhere: any = {};
  
  // Filtres spécifiques aux livres
  if (statut) {
    bookWhere.statut = statut;
  }
  
  if (niveau_spicy !== undefined) {
    bookWhere.niveau_spicy = niveau_spicy;
  }
  
  if (niveau_dark !== undefined) {
    bookWhere.niveau_dark = niveau_dark;
  }
  
  if (min_rating !== undefined) {
    bookWhere.note_generale = { 
      ...bookWhere.note_generale,
      gte: min_rating 
    };
  }
  
  if (max_rating !== undefined) {
    bookWhere.note_generale = { 
      ...bookWhere.note_generale,
      lte: max_rating 
    };
  }

  // Calculer la pagination
  const skip = (page - 1) * limit;
  
  // Construire l'ordre de tri pour les livres
  const orderBy: any = {};
  orderBy[sort] = order;

  // Récupérer les associations livre-catégorie avec les filtres
  const [bookCategories, totalCount] = await Promise.all([
    db.book_category.findMany({
      where: {
        categoryId,
        book: bookWhere,
      },
      skip,
      take: limit,
      include: {
        book: {
          include: {
            user: {
              select: { id: true, nom_complet: true, avatar: true }
            },
            book_category: {
              include: { category: true }
            },
            book_tag: {
              include: { tag: true }
            }
          }
        }
      },
      orderBy: {
        book: orderBy
      }
    }),
    db.book_category.count({
      where: {
        categoryId,
        book: bookWhere,
      }
    })
  ]);

  // Extraire et sérialiser les livres
  const books = bookCategories.map(bc => bc.book);
  const serializedBooks = books.map(book => serializeBook(book));
  
  // Calculer les informations de pagination
  const pagination = calculatePagination(page, limit, totalCount);
  
  // Créer les informations de recherche
  const appliedFilters = getAppliedFilters({
    statut, niveau_spicy, niveau_dark, min_rating, max_rating, sort, order
  });
  
  const searchInfo = createSearchInfo(
    totalCount,
    appliedFilters,
    undefined, // pas de recherche textuelle ici
    Date.now() - startTime
  );
  
  const filters = {
    categoryId,
    statut, niveau_spicy, niveau_dark, min_rating, max_rating, sort, order
  };
  
  // Ajouter les métadonnées de la catégorie
  const categoryInfo = {
    id: existingCategory.id,
    nom: existingCategory.nom,
    couleur: existingCategory.couleur,
    icone: existingCategory.icone,
    est_actif: existingCategory.est_actif,
  };
  
  const response = createPaginatedResponse(serializedBooks, pagination, filters, searchInfo);
  (response as any).category = categoryInfo;
  
  return NextResponse.json(response);
});

// POST /api/categories/[id]/books - Associer des livres à une catégorie (protégé)
export const POST = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification
  const user = await getTypedSession(request);
  if (!user?.id) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].UNAUTHORIZED,
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }
  
  const { id: categoryId } = await params;
  
  // Vérifier que la catégorie existe
  const existingCategory = await db.category.findUnique({
    where: { id: categoryId },
    select: { id: true, nom: true },
  });
  
  if (!existingCategory) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].CATEGORY_NOT_FOUND,
      code: 'CATEGORY_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Parser les données
  const body = await request.json();
  const { book_ids } = body;
  
  if (!Array.isArray(book_ids) || book_ids.length === 0) {
    return NextResponse.json({
      success: false,
      error: "Une liste d'IDs de livres est requise",
      code: 'INVALID_BOOK_IDS',
    }, { status: 400 });
  }
  
  // Vérifier que tous les livres existent
  const existingBooks = await db.book.findMany({
    where: {
      id: { in: book_ids },
      user: { id: user?.id }, // S'assurer que l'utilisateur possède les livres
    },
    select: { id: true, titre: true },
  });
  
  if (existingBooks.length !== book_ids.length) {
    const foundIds = existingBooks.map(book => book.id);
    const missingIds = book_ids.filter(id => !foundIds.includes(id));
    
    return NextResponse.json({
      success: false,
      error: "Certains livres n'ont pas été trouvés ou ne vous appartiennent pas",
      code: 'BOOKS_NOT_FOUND',
      missing_book_ids: missingIds,
    }, { status: 404 });
  }
  
  // Créer les associations (en ignorant les doublons)
  const associations = book_ids.map(bookId => ({
    id: randomUUID(),
    bookId,
    categoryId,
  }));
  
  try {
    const result = await db.book_category.createMany({
      data: associations,
      skipDuplicates: true,
    });
    
    // Compter les associations existantes pour cette catégorie
    const totalAssociations = await db.book_category.count({
      where: { categoryId },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        category: existingCategory,
        associations_created: result.count,
        total_books_in_category: totalAssociations,
        associated_books: existingBooks,
      },
      message: lang === 'fr' 
        ? `${result.count} livre(s) associé(s) à la catégorie "${existingCategory.nom}"` 
        : `${result.count} book(s) associated with category "${existingCategory.nom}"`,
      execution_time_ms: Date.now() - startTime,
    });
    
  } catch (error) {
    // Gestion des erreurs de contraintes (doublons, etc.)
    return NextResponse.json({
      success: false,
      error: "Erreur lors de l'association des livres à la catégorie",
      code: 'ASSOCIATION_ERROR',
    }, { status: 500 });
  }
});

// DELETE /api/categories/[id]/books - Dissocier tous les livres d'une catégorie (protégé)
export const DELETE = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification
  const user = await getTypedSession(request);
  if (!user?.id) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].UNAUTHORIZED,
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }
  
  const { id: categoryId } = await params;
  
  // Vérifier que la catégorie existe
  const existingCategory = await db.category.findUnique({
    where: { id: categoryId },
    select: { id: true, nom: true },
  });
  
  if (!existingCategory) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].CATEGORY_NOT_FOUND,
      code: 'CATEGORY_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Récupérer les paramètres optionnels
  const { searchParams } = new URL(request.url);
  const bookIds = searchParams.get('book_ids')?.split(',');
  
  const deleteWhere: any = { categoryId };
  
  // Si des IDs de livres spécifiques sont fournis
  if (bookIds && bookIds.length > 0) {
    // S'assurer que l'utilisateur possède ces livres
    const userBooks = await db.book.findMany({
      where: {
        id: { in: bookIds },
        user: { id: user?.id },
      },
      select: { id: true },
    });
    
    const userBookIds = userBooks.map(book => book.id);
    deleteWhere.bookId = { in: userBookIds };
  } else {
    // Dissocier seulement les livres appartenant à l'utilisateur
    const userBooks = await db.book.findMany({
      where: { user: { id: user?.id } },
      select: { id: true },
    });
    
    const userBookIds = userBooks.map(book => book.id);
    deleteWhere.bookId = { in: userBookIds };
  }
  
  // Supprimer les associations
  const deletedCount = await db.book_category.deleteMany({
    where: deleteWhere,
  });
  
  return NextResponse.json({
    success: true,
    data: {
      category: existingCategory,
      dissociations_count: deletedCount.count,
    },
    message: lang === 'fr' 
      ? `${deletedCount.count} livre(s) dissocié(s) de la catégorie "${existingCategory.nom}"` 
      : `${deletedCount.count} book(s) dissociated from category "${existingCategory.nom}"`,
    execution_time_ms: Date.now() - startTime,
  });
});