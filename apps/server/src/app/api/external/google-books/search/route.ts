import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getGoogleBooksService, GoogleBooksSearchSchema } from "@/services/google-books.service";

// =============================================================================
// 📚 API ROUTE GOOGLE BOOKS - RECHERCHE
// =============================================================================
// GET /api/external/google-books/search - Recherche dans l'API Google Books

// Schéma pour les paramètres de requête
const QueryParamsSchema = GoogleBooksSearchSchema.extend({
  // Paramètres additionnels pour l'API web
  format: z.enum(['full', 'minimal']).default('full'),
  include_cache_info: z.coerce.boolean().default(false),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Transformer les paramètres de requête
  const transformedQuery = {
    ...queryObject,
    query: queryObject.q || queryObject.query, // Mapper 'q' vers 'query'
    maxResults: queryObject.maxResults ? parseInt(queryObject.maxResults) : undefined,
    startIndex: queryObject.startIndex ? parseInt(queryObject.startIndex) : undefined,
    include_cache_info: queryObject.include_cache_info === 'true',
  };
  
  // Valider les paramètres
  const validatedQuery = QueryParamsSchema.parse(transformedQuery);
  
  // Obtenir le service Google Books
  const googleBooksService = getGoogleBooksService();
  
  // Effectuer la recherche
  const searchResult = await googleBooksService.search({
    query: validatedQuery.query,
    searchType: validatedQuery.searchType,
    maxResults: validatedQuery.maxResults,
    startIndex: validatedQuery.startIndex,
    langRestrict: validatedQuery.langRestrict,
    orderBy: validatedQuery.orderBy,
    printType: validatedQuery.printType,
  });
  
  // Préparer la réponse selon le format demandé
  let responseData;
  
  if (validatedQuery.format === 'minimal') {
    // Format minimal - seulement les informations essentielles
    responseData = {
      success: true,
      source: 'google_books',
      totalItems: searchResult.totalItems,
      query: searchResult.query,
      searchType: searchResult.searchType,
      items: searchResult.items.map(item => ({
        id: item.googleBooksId,
        titre: item.title,
        auteur: item.authors?.join(', ') || 'Auteur inconnu',
        editeur: item.publisher,
        date_publication: item.publishedDate,
        image_couverture: item.imageUrl || item.thumbnailUrl,
        isbn: item.isbn13 || item.isbn10,
        source: 'google_books' as const,
        identifiant_externe: item.googleBooksId,
        // Nouveaux champs enrichis
        categories: item.categories?.slice(0, 3) || [],
        note_moyenne: item.averageRating,
        nombre_evaluations: item.ratingsCount,
      })),
      executionTime: Date.now() - startTime,
    };
  } else {
    // Format complet - transformer les items pour correspondre au type ExternalBookResult
    responseData = {
      success: searchResult.success,
      source: 'google_books' as const,
      totalItems: searchResult.totalItems,
      query: searchResult.query,
      searchType: searchResult.searchType,
      executionTime: searchResult.executionTime,
      items: searchResult.items.map(item => ({
        id: item.googleBooksId,
        source: 'google_books' as const,
        titre: item.title,
        auteur: item.authors?.join(', ') || 'Auteur inconnu',
        isbn: item.isbn13 || item.isbn10,
        image_couverture: item.imageUrl || item.thumbnailUrl,
        resume_officiel: item.description,
        editeur: item.publisher,
        date_publication: item.publishedDate,
        nombre_pages: item.pageCount,
        langue: item.language,
        identifiant_externe: item.googleBooksId,
        // Nouveaux champs enrichis
        categories: item.categories?.slice(0, 5) || [],
        note_moyenne: item.averageRating,
        nombre_evaluations: item.ratingsCount,
      })),
      api_execution_time: Date.now() - startTime,
    };
  }
  
  // Ajouter les informations de cache si demandé
  if (validatedQuery.include_cache_info) {
    responseData = {
      ...responseData,
      cache_info: {
        cached_result: searchResult.cachedResult || false,
        cache_size: googleBooksService.getCacheSize(),
      }
    };
  }
  
  return NextResponse.json(responseData);
});