import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { BookSearchSchema } from "@/schemas/book.schemas";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  serializeBook,
  createPaginatedResponse,
  calculatePagination,
  calculatePaginationParams,
  createSearchInfo,
  getAppliedFilters
} from "@/utils/serializers";

// Les schémas de validation sont maintenant centralisés dans @/schemas/book.schemas.ts

// GET /api/books/search - Recherche avancée dans les livres
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Valider les paramètres de requête avec le schéma de recherche spécialisé
  const validatedQuery = BookSearchSchema.parse(queryObject);
    const { 
      q, page, limit, sort, order, statut, niveau_spicy, niveau_dark, 
      genre, author, min_rating, max_rating, language, rythme 
    } = validatedQuery;

    // Construire les filtres complexes
    const where: any = {
      AND: []
    };

    // Recherche textuelle principale (full-text search)
    if (q) {
      where.AND.push({
        OR: [
          { titre: { contains: q, mode: "insensitive" } },
          { auteur: { contains: q, mode: "insensitive" } },
          { resume_officiel: { contains: q, mode: "insensitive" } },
          { resume_personnel: { contains: q, mode: "insensitive" } },
          { critique_detaillee: { contains: q, mode: "insensitive" } },
          { citations_favorites: { contains: q, mode: "insensitive" } },
          { pourquoi_aimer: { contains: q, mode: "insensitive" } },
          { editeur: { contains: q, mode: "insensitive" } },
          { isbn: { contains: q, mode: "insensitive" } },
        ]
      });
    }

    // Filtres spécifiques
    if (statut) {
      where.AND.push({ statut });
    }

    if (niveau_spicy !== undefined) {
      where.AND.push({ niveau_spicy });
    }

    if (niveau_dark !== undefined) {
      where.AND.push({ niveau_dark });
    }

    if (author) {
      where.AND.push({ 
        auteur: { contains: author, mode: "insensitive" }
      });
    }

    if (min_rating !== undefined) {
      where.AND.push({ 
        note_generale: { gte: min_rating }
      });
    }

    if (max_rating !== undefined) {
      where.AND.push({ 
        note_generale: { lte: max_rating }
      });
    }

    if (language) {
      where.AND.push({ langue: language });
    }

    if (rythme) {
      where.AND.push({ rythme });
    }

    // Filtrage par genre/catégorie
    if (genre) {
      where.AND.push({
        book_category: {
          some: {
            categoryId: genre
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

    // Exécuter les requêtes en parallèle
    const [books, totalCount] = await Promise.all([
      db.book.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
      }),
      db.book.count({ where })
    ]);

    // Sérialiser les livres
    const serializedBooks = books.map(book => serializeBook(book));
    
    // Calculer les informations de pagination
    const pagination = calculatePagination(page, limit, totalCount);
    
    // Créer les informations de recherche
    const appliedFilters = getAppliedFilters({
      q, statut, niveau_spicy, niveau_dark, genre, author,
      min_rating, max_rating, language, rythme, sort, order
    });
    
    const searchInfo = createSearchInfo(
      totalCount,
      appliedFilters,
      q,
      Date.now() - startTime
    );
    
    const filters = {
      q, statut, niveau_spicy, niveau_dark, genre, author,
      min_rating, max_rating, language, rythme, sort, order
    };
    
    return NextResponse.json(
      createPaginatedResponse(serializedBooks, pagination, filters, searchInfo)
    );

});