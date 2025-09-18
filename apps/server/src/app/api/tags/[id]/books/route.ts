import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  TagBooksFiltersSchema, 
  TagErrorMessages 
} from "@/schemas/tag.schemas";
import { 
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
// 📚 API ROUTE BOOKS BY TAG - /api/tags/[id]/books
// =============================================================================

// GET /api/tags/[id]/books - Récupère les livres d'un tag
export const GET = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { id: tagId } = await params;
  
  // Vérifier que le tag existe
  const existingTag = await db.tag.findUnique({
    where: { id: tagId },
    select: { 
      id: true, 
      nom: true, 
      couleur: true, 
      type: true 
    },
  });
  
  if (!existingTag) {
    return NextResponse.json({
      success: false,
      error: TagErrorMessages[lang].TAG_NOT_FOUND,
      code: 'TAG_NOT_FOUND',
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
  const validatedQuery = TagBooksFiltersSchema.parse(transformedQuery);
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

  // Récupérer les associations livre-tag avec les filtres
  const [book_tags, totalCount] = await Promise.all([
    db.book_tag.findMany({
      where: {
        tagId,
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
    db.book_tag.count({
      where: {
        tagId,
        book: bookWhere,
      }
    })
  ]);

  // Extraire et sérialiser les livres
  const books = book_tags.map(bt => bt.book);
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
    tagId,
    statut, niveau_spicy, niveau_dark, min_rating, max_rating, sort, order
  };
  
  // Ajouter les métadonnées du tag
  const tagInfo = {
    id: existingTag.id,
    nom: existingTag.nom,
    couleur: existingTag.couleur,
    type: existingTag.type,
  };
  
  const response = {
    ...createPaginatedResponse(serializedBooks, pagination, filters, searchInfo),
    tag: tagInfo
  };
  
  return NextResponse.json(response);
});

// POST /api/tags/[id]/books - Associer des livres à un tag (protégé)
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
      error: TagErrorMessages[lang].UNAUTHORIZED,
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }
  
  const { id: tagId } = await params;
  
  // Vérifier que le tag existe
  const existingTag = await db.tag.findUnique({
    where: { id: tagId },
    select: { id: true, nom: true },
  });
  
  if (!existingTag) {
    return NextResponse.json({
      success: false,
      error: TagErrorMessages[lang].TAG_NOT_FOUND,
      code: 'TAG_NOT_FOUND',
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
      createdBy: user?.id, // S'assurer que l'utilisateur possède les livres
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
    tagId,
  }));
  
  try {
    const result = await db.book_tag.createMany({
      data: associations,
      skipDuplicates: true,
    });
    
    // Mettre à jour le compteur d'utilisation du tag
    await db.tag.update({
      where: { id: tagId },
      data: {
        utilisation_count: {
          increment: result.count,
        },
        date_modification: new Date(),
      },
    });
    
    // Compter les associations existantes pour ce tag
    const totalAssociations = await db.book_tag.count({
      where: { tagId },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        tag: existingTag,
        associations_created: result.count,
        total_books_in_tag: totalAssociations,
        associated_books: existingBooks,
      },
      message: lang === 'fr' 
        ? `${result.count} livre(s) associé(s) au tag "${existingTag.nom}"` 
        : `${result.count} book(s) associated with tag "${existingTag.nom}"`,
      execution_time_ms: Date.now() - startTime,
    });
    
  } catch (error) {
    // Gestion des erreurs de contraintes (doublons, etc.)
    return NextResponse.json({
      success: false,
      error: "Erreur lors de l'association des livres au tag",
      code: 'ASSOCIATION_ERROR',
    }, { status: 500 });
  }
});

// DELETE /api/tags/[id]/books - Dissocier tous les livres d'un tag (protégé)
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
      error: TagErrorMessages[lang].UNAUTHORIZED,
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }
  
  const { id: tagId } = await params;
  
  // Vérifier que le tag existe
  const existingTag = await db.tag.findUnique({
    where: { id: tagId },
    select: { id: true, nom: true },
  });
  
  if (!existingTag) {
    return NextResponse.json({
      success: false,
      error: TagErrorMessages[lang].TAG_NOT_FOUND,
      code: 'TAG_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Récupérer les paramètres optionnels
  const { searchParams } = new URL(request.url);
  const bookIds = searchParams.get('book_ids')?.split(',');
  
  const deleteWhere: any = { tagId };
  
  // Si des IDs de livres spécifiques sont fournis
  if (bookIds && bookIds.length > 0) {
    // S'assurer que l'utilisateur possède ces livres
    const userBooks = await db.book.findMany({
      where: {
        id: { in: bookIds },
        createdBy: user?.id,
      },
      select: { id: true },
    });
    
    const userBookIds = userBooks.map(book => book.id);
    deleteWhere.bookId = { in: userBookIds };
  } else {
    // Dissocier seulement les livres appartenant à l'utilisateur
    const userBooks = await db.book.findMany({
      where: { createdBy: user?.id },
      select: { id: true },
    });
    
    const userBookIds = userBooks.map(book => book.id);
    deleteWhere.bookId = { in: userBookIds };
  }
  
  // Supprimer les associations
  const deletedCount = await db.book_tag.deleteMany({
    where: deleteWhere,
  });
  
  // Mettre à jour le compteur d'utilisation du tag
  await db.tag.update({
    where: { id: tagId },
    data: {
      utilisation_count: Math.max(0, await db.book_tag.count({ where: { tagId } })),
      date_modification: new Date(),
    },
  });
  
  return NextResponse.json({
    success: true,
    data: {
      tag: existingTag,
      dissociations_count: deletedCount.count,
    },
    message: lang === 'fr' 
      ? `${deletedCount.count} livre(s) dissocié(s) du tag "${existingTag.nom}"` 
      : `${deletedCount.count} book(s) dissociated from tag "${existingTag.nom}"`,
    execution_time_ms: Date.now() - startTime,
  });
});