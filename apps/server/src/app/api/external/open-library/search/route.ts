import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getOpenLibraryService, OpenLibrarySearchSchema } from "@/services/open-library.service";

// =============================================================================
// 📚 API ROUTE OPEN LIBRARY - RECHERCHE
// =============================================================================
// GET /api/external/open-library/search - Recherche dans l'API Open Library

// Schéma pour les paramètres de requête
const QueryParamsSchema = OpenLibrarySearchSchema.extend({
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
    limit: queryObject.limit ? parseInt(queryObject.limit) : undefined,
    offset: queryObject.offset ? parseInt(queryObject.offset) : undefined,
    include_cache_info: queryObject.include_cache_info === 'true',
    language: queryObject.language ? queryObject.language.split(',') : undefined,
    // Mapper les valeurs de sort non supportées vers des valeurs valides
    sort: queryObject.sort === 'relevance' ? undefined : queryObject.sort,
  };
  
  // Valider les paramètres
  const validatedQuery = QueryParamsSchema.parse(transformedQuery);
  
  // Obtenir le service Open Library
  const openLibraryService = getOpenLibraryService();
  
  // Effectuer la recherche enrichie (pour les 5 premiers résultats)
  const useEnrichedSearch = validatedQuery.limit <= 20; // Seulement pour les petites recherches
  
  const searchResult = useEnrichedSearch 
    ? await openLibraryService.searchWithEnrichedData({
        query: validatedQuery.query,
        searchType: validatedQuery.searchType,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        sort: validatedQuery.sort,
        language: validatedQuery.language,
        subject: validatedQuery.subject,
        place: validatedQuery.place,
        person: validatedQuery.person,
        publisher: validatedQuery.publisher,
        first_publish_year: validatedQuery.first_publish_year,
      })
    : await openLibraryService.search({
        query: validatedQuery.query,
        searchType: validatedQuery.searchType,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        sort: validatedQuery.sort,
        language: validatedQuery.language,
        subject: validatedQuery.subject,
        place: validatedQuery.place,
        person: validatedQuery.person,
        publisher: validatedQuery.publisher,
        first_publish_year: validatedQuery.first_publish_year,
      });
  
  // Préparer la réponse selon le format demandé
  let responseData;
  
  if (validatedQuery.format === 'minimal') {
    // Format minimal - seulement les informations essentielles
    responseData = {
      success: true,
      source: 'open_library',
      totalItems: searchResult.totalItems,
      query: searchResult.query,
      searchType: searchResult.searchType,
      items: searchResult.items.map(item => ({
        id: item.openLibraryId,
        key: item.openLibraryKey,
        titre: item.title,
        auteur: item.authors?.join(', ') || 'Auteur inconnu',
        editeur: item.publisher?.[0],
        date_publication: item.publishDates?.[0] || item.firstPublishYear?.toString(),
        image_couverture: item.coverUrl || item.thumbnailUrl,
        isbn: item.isbn?.[0],
        nombre_pages: item.pageCount,
        langue: item.languages?.[0],
        source: 'open_library' as const,
        identifiant_externe: item.openLibraryId,
        // Nouveaux champs enrichis
        categories: item.subjects?.slice(0, 3) || [],
        subjects: item.subjects?.slice(0, 5) || [],
        note_moyenne: item.ratingsAverage,
        nombre_evaluations: item.ratingsCount,
      })),
      executionTime: Date.now() - startTime,
    };
  } else {
    // Format complet - transformer les items pour correspondre au type ExternalBookResult
    responseData = {
      success: searchResult.success,
      source: 'open_library' as const,
      totalItems: searchResult.totalItems,
      query: searchResult.query,
      searchType: searchResult.searchType,
      executionTime: searchResult.executionTime,
      items: searchResult.items.map(item => ({
        id: item.openLibraryId,
        source: 'open_library' as const,
        titre: item.title,
        auteur: item.authors?.join(', ') || 'Auteur inconnu',
        isbn: item.isbn?.[0],
        image_couverture: item.coverUrl || item.thumbnailUrl,
        resume_officiel: item.description,
        editeur: item.publisher?.[0], 
        date_publication: item.publishDates?.[0] || item.firstPublishYear?.toString(),
        nombre_pages: item.pageCount,
        langue: item.languages?.[0],
        identifiant_externe: item.openLibraryId,
        // Nouveaux champs enrichis  
        categories: item.subjects?.slice(0, 5) || [],
        subjects: item.subjects?.slice(0, 8) || [],
        note_moyenne: item.ratingsAverage,
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
        cache_size: openLibraryService.getCacheSize(),
      }
    };
  }
  
  return NextResponse.json(responseData);
});