import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { DatabaseMonitor } from "@/middlewares/database-health";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { randomUUID } from "crypto";
import { 
  BookFiltersSchema, 
  CreateBookSchema,
  type CreateBookInput 
} from "@/schemas/book.schemas";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler,
  ValidationError 
} from "@/utils/error-handler";
import { memoryCache, createCacheKey, CACHE_TTL } from "@/lib/cache";
import {
  serializeBook,
  createPaginatedResponse,
  createSuccessResponse,
  calculatePagination,
  calculatePaginationParams,
  createSearchInfo,
  getAppliedFilters,
  measureExecutionTime
} from "@/utils/serializers";

// Les schémas sont maintenant centralisés dans @/schemas/book.schemas.ts

// Les schémas de validation sont maintenant centralisés

// GET /api/books - Liste tous les livres avec pagination
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Valider les paramètres de requête avec le nouveau schéma centralisé
  const validatedQuery = BookFiltersSchema.parse(queryObject);
  const { 
    page, limit, sort, order, search,
    statut, status, niveau_spicy, spicy_level, niveau_dark, dark_level,
    niveau_spicy_min, niveau_spicy_max, niveau_dark_min, niveau_dark_max,
    genre, category, author, auteur,
    min_rating, max_rating, note_min, note_max,
    language, langue, rythme, 
    date_lecture_after, date_lecture_before,
    tag, collection, ajout_manuel, categories, include_categories, include_tags
  } = validatedQuery;

  // Créer une clé de cache basée sur les paramètres de requête
  const cacheKey = createCacheKey('books_list', validatedQuery);
  
  // Vérifier le cache d'abord
  const cachedResult = memoryCache.get(cacheKey);
  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }

    // Construire les filtres avec logique AND
    const where: any = {
      AND: []
    };
    
    // Recherche textuelle étendue
    if (search) {
      where.AND.push({
        OR: [
          { titre: { contains: search, mode: "insensitive" } },
          { auteur: { contains: search, mode: "insensitive" } },
          { resume_officiel: { contains: search, mode: "insensitive" } },
          { resume_personnel: { contains: search, mode: "insensitive" } },
          { critique_detaillee: { contains: search, mode: "insensitive" } },
          { citations_favorites: { contains: search, mode: "insensitive" } },
          { editeur: { contains: search, mode: "insensitive" } },
          { isbn: { contains: search, mode: "insensitive" } },
        ]
      });
    }
    
    // Filtres par statut (support des deux formats)
    const finalStatut = statut || status;
    if (finalStatut) {
      where.AND.push({ statut: finalStatut });
    }
    
    // Filtres par niveaux spicy/dark (support des deux formats + ranges)
    const finalSpicy = niveau_spicy !== undefined ? niveau_spicy : spicy_level;
    if (finalSpicy !== undefined) {
      where.AND.push({ niveau_spicy: finalSpicy });
    } else if (niveau_spicy_min !== undefined || niveau_spicy_max !== undefined) {
      // Range pour niveau spicy
      const spicyFilter: any = {};
      if (niveau_spicy_min !== undefined) spicyFilter.gte = niveau_spicy_min;
      if (niveau_spicy_max !== undefined) spicyFilter.lte = niveau_spicy_max;
      where.AND.push({ niveau_spicy: spicyFilter });
    }
    
    const finalDark = niveau_dark !== undefined ? niveau_dark : dark_level;
    if (finalDark !== undefined) {
      where.AND.push({ niveau_dark: finalDark });
    } else if (niveau_dark_min !== undefined || niveau_dark_max !== undefined) {
      // Range pour niveau dark
      const darkFilter: any = {};
      if (niveau_dark_min !== undefined) darkFilter.gte = niveau_dark_min;
      if (niveau_dark_max !== undefined) darkFilter.lte = niveau_dark_max;
      where.AND.push({ niveau_dark: darkFilter });
    }

    // Filtres par auteur (support des deux formats)
    const finalAuthor = author || auteur;
    if (finalAuthor) {
      where.AND.push({ 
        auteur: { contains: finalAuthor, mode: "insensitive" }
      });
    }

    // Filtres par notes (support des deux formats)
    const finalMinRating = min_rating !== undefined ? min_rating : note_min;
    const finalMaxRating = max_rating !== undefined ? max_rating : note_max;
    
    if (finalMinRating !== undefined) {
      where.AND.push({ note_generale: { gte: finalMinRating } });
    }
    
    if (finalMaxRating !== undefined) {
      where.AND.push({ note_generale: { lte: finalMaxRating } });
    }

    // Filtres par langue (support des deux formats)
    const finalLanguage = language || langue;
    if (finalLanguage) {
      where.AND.push({ langue: finalLanguage });
    }

    // Filtre par rythme
    if (rythme) {
      where.AND.push({ rythme });
    }

    // Filtres par dates de lecture
    if (date_lecture_after) {
      where.AND.push({ 
        date_lecture: { gte: date_lecture_after }
      });
    }
    
    if (date_lecture_before) {
      where.AND.push({ 
        date_lecture: { lte: date_lecture_before }
      });
    }

    // Filtre par ajout manuel
    if (ajout_manuel !== undefined) {
      where.AND.push({ ajout_manuel });
    }

    // Filtrage par genre/catégorie (ID ou nom)
    const finalGenre = genre || category || categories;
    if (finalGenre) {
      where.AND.push({
        book_category: {
          some: {
            OR: [
              { categoryId: finalGenre }, // Recherche par ID
              { category: { nom: { contains: finalGenre, mode: "insensitive" } } } // Recherche par nom
            ]
          }
        }
      });
    }

    // Filtrage par tag (ID ou nom)
    if (tag) {
      where.AND.push({
        book_tag: {
          some: {
            OR: [
              { tagId: tag }, // Recherche par ID
              { tag: { nom: { contains: tag, mode: "insensitive" } } } // Recherche par nom
            ]
          }
        }
      });
    }

    // Filtrage par collection/liste
    if (collection) {
      where.AND.push({
        list_book: {
          some: {
            listId: collection // Recherche par ID de la liste
          }
        }
      });
    }

    // Si pas de filtres AND, on supprime le tableau vide
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Calculer la pagination
    const skip = (page - 1) * limit;
    
    // Construire l'ordre de tri
    const orderBy: any = {};
    orderBy[sort] = order;

    // Construire dynamiquement l'include seulement si nécessaire
    const includeConfig: any = {};
    
    // Include user seulement si explicitement demandé ou si pas de limit (pour éviter surcharge)
    if (include_categories || include_tags || limit <= 10) {
      includeConfig.user = {
        select: { id: true, nom_complet: true, avatar: true }
      };
    }
    
    // Include relations seulement si explicitement demandé
    if (include_categories) {
      includeConfig.book_category = {
        include: { category: true }
      };
    }
    
    if (include_tags) {
      includeConfig.book_tag = {
        include: { tag: true }
      };
    }

    // Exécuter les requêtes en parallèle avec monitoring
    const [books, totalCount] = await Promise.all([
      DatabaseMonitor.trackQuery('books_findMany', () =>
        db.book.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: includeConfig
        })
      ),
      DatabaseMonitor.trackQuery('books_count', () =>
        db.book.count({ where })
      )
    ]);

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Sérialiser les livres avec le nouveau système
    const serializedBooks = books.map(book => serializeBook(book));
    
    // Calculer les informations de pagination
    const pagination = calculatePagination(page, limit, totalCount);
    
    // Créer les informations de recherche
    const appliedFilters = getAppliedFilters({
      search, sort, order, statut: finalStatut, niveau_spicy: finalSpicy,
      niveau_dark: finalDark, author: finalAuthor, genre: finalGenre,
      tag, min_rating: finalMinRating, max_rating: finalMaxRating,
      language: finalLanguage, rythme, date_lecture_after, date_lecture_before,
      ajout_manuel, categories, include_categories, include_tags
    });
    
    const searchInfo = createSearchInfo(
      totalCount,
      appliedFilters,
      search,
      Date.now() - startTime
    );
    
    const filters = {
      search, sort, order,
      statut: finalStatut, niveau_spicy: finalSpicy, niveau_dark: finalDark,
      author: finalAuthor, genre: finalGenre, tag,
      min_rating: finalMinRating, max_rating: finalMaxRating,
      language: finalLanguage, rythme,
      date_lecture_after, date_lecture_before, ajout_manuel,
      categories, include_categories, include_tags
    };
    
    const response = createPaginatedResponse(serializedBooks, pagination, filters, searchInfo);
    
    // Stocker le résultat dans le cache
    memoryCache.set(cacheKey, response, CACHE_TTL.BOOKS_LIST);
    
    return NextResponse.json(response);

});

// POST /api/books - Créer un nouveau livre (protégé)
export const POST = withErrorHandler(async (request: NextRequest) => {
  return withBetterAuth(request, async (req, user) => {
    const lang = detectLanguageFromHeaders(request.headers);
    const body = await req.json();
    
    // Valider les données d'entrée avec le nouveau schéma
    const validatedData = CreateBookSchema.parse(body);
      const { categories, tags, sagaId, sagaOrder, ...bookData } = validatedData;

      // Créer le livre avec les relations
      const book = await db.$transaction(async (tx) => {
        // Créer le livre
        const { randomUUID } = await import('crypto');
        const newBook = await tx.book.create({
          data: {
            id: randomUUID(),
            ...bookData,
            sagaOrder,
            date_modification: new Date(),
            user: {
              connect: { id: user.id }
            },
            ...(sagaId && { saga: { connect: { id: sagaId } } })
          },
          include: {
            user: {
              select: { id: true, nom_complet: true, avatar: true }
            }
          }
        });

        // Associer les catégories si fournies
        if (categories && categories.length > 0) {
          const categoryConnections = categories.map(categoryId => ({
            id: randomUUID(),
            bookId: newBook.id,
            categoryId: categoryId
          }));
          
          await tx.book_category.createMany({
            data: categoryConnections
          });
        }

        // Associer les tags si fournis
        if (tags && tags.length > 0) {
          const tagConnections = tags.map(tagId => ({
            id: randomUUID(),
            bookId: newBook.id,
            tagId: tagId
          }));
          
          await tx.book_tag.createMany({
            data: tagConnections
          });
        }

        // Retourner le livre avec toutes les relations
        return tx.book.findUnique({
          where: { id: newBook.id },
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
        });
      });

      console.log(`📚 New book created: "${book?.titre}" by ${user.nom_complet}`);

      // Sérialiser le livre créé avec le nouveau système
      const serializedBook = serializeBook(book);
      
      return NextResponse.json(
        createSuccessResponse(serializedBook, "Book created successfully"),
        { status: 201 }
      );

  });
});
