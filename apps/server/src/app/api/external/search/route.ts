import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { 
  getBookImportService, 
  ImportOptionsSchema,
  quickImportBook 
} from "@/utils/book-import";
import { getGoogleBooksService } from "@/services/google-books.service";
import { getOpenLibraryService } from "@/services/open-library.service";
import { getSession } from "@/utils/auth-helpers";

// =============================================================================
// 🔍 API ROUTE RECHERCHE COMBINÉE - GOOGLE BOOKS + OPEN LIBRARY
// =============================================================================
// GET /api/external/search - Recherche intelligente dans plusieurs sources

// Schéma pour les paramètres de recherche combinée
const CombinedSearchSchema = z.object({
  // Paramètres de recherche
  query: z.string().min(1, "La requête de recherche est obligatoire"),
  searchType: z.enum(['title', 'author', 'isbn', 'general', 'subject']).default('general'),
  
  // Sources à utiliser
  sources: z.array(z.enum(['google_books', 'open_library'])).default(['google_books', 'open_library']),
  combine_results: z.boolean().default(true),
  
  // Paramètres de pagination
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0),
  
  // Options d'affichage
  format: z.enum(['full', 'minimal', 'comparison']).default('full'),
  include_performance: z.boolean().default(false),
  deduplicate: z.boolean().default(true),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Transformer les paramètres
  const transformedQuery = {
    ...queryObject,
    limit: queryObject.limit ? parseInt(queryObject.limit) : undefined,
    offset: queryObject.offset ? parseInt(queryObject.offset) : undefined,
    sources: queryObject.sources ? queryObject.sources.split(',') : undefined,
    combine_results: queryObject.combine_results !== 'false',
    include_performance: queryObject.include_performance === 'true',
    deduplicate: queryObject.deduplicate !== 'false',
  };
  
  // Valider les paramètres
  const validatedQuery = CombinedSearchSchema.parse(transformedQuery);
  
  const searchResults: any = {};
  const performance: any = {};
  
  // Exécuter les recherches en parallèle
  const searchPromises: Promise<any>[] = [];
  
  if (validatedQuery.sources.includes('google_books')) {
    const googleBooksService = getGoogleBooksService();
    searchPromises.push(
      googleBooksService.search({
        query: validatedQuery.query,
        searchType: validatedQuery.searchType === 'subject' ? 'general' : validatedQuery.searchType,
        maxResults: validatedQuery.limit,
        startIndex: validatedQuery.offset,
        orderBy: 'relevance' as const,
        printType: 'all' as const,
      }).then(result => ({ source: 'google_books', data: result }))
       .catch(error => ({ source: 'google_books', error: error.message }))
    );
  }
  
  if (validatedQuery.sources.includes('open_library')) {
    const openLibraryService = getOpenLibraryService();
    searchPromises.push(
      openLibraryService.search({
        query: validatedQuery.query,
        searchType: validatedQuery.searchType,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      }).then(result => ({ source: 'open_library', data: result }))
       .catch(error => ({ source: 'open_library', error: error.message }))
    );
  }
  
  // Attendre tous les résultats
  const results = await Promise.all(searchPromises);
  
  // Traiter les résultats
  for (const result of results) {
    if (result.error) {
      searchResults[result.source] = {
        success: false,
        error: result.error,
        items: [],
        totalItems: 0,
      };
    } else {
      searchResults[result.source] = result.data;
      if (validatedQuery.include_performance) {
        performance[result.source] = {
          execution_time: result.data.executionTime,
          total_items: result.data.totalItems,
          returned_items: result.data.items?.length || 0,
          cached_result: result.data.cachedResult || false,
        };
      }
    }
  }
  
  // Préparer la réponse selon le format
  let responseData: any;
  
  if (validatedQuery.format === 'comparison') {
    // Format de comparaison - résultats séparés par source
    responseData = {
      success: true,
      query: validatedQuery.query,
      searchType: validatedQuery.searchType,
      sources: searchResults,
      executionTime: Date.now() - startTime,
    };
    
  } else if (validatedQuery.combine_results) {
    // Combiner les résultats de toutes les sources
    const allItems: any[] = [];
    let totalItems = 0;
    
    for (const [source, data] of Object.entries(searchResults) as [string, any][]) {
      if (data.success && data.items) {
        // Ajouter la source à chaque item
        const itemsWithSource = data.items.map((item: any) => ({
          ...item,
          _source: source,
          _score: calculateRelevanceScore(item, validatedQuery.query, source),
        }));
        allItems.push(...itemsWithSource);
        totalItems += data.totalItems || 0;
      }
    }
    
    // Dédupliquer si demandé
    let finalItems = allItems;
    if (validatedQuery.deduplicate) {
      finalItems = deduplicateBooks(allItems);
    }
    
    // Trier par score de pertinence
    finalItems.sort((a, b) => (b._score || 0) - (a._score || 0));
    
    // Limiter les résultats
    finalItems = finalItems.slice(0, validatedQuery.limit);
    
    // Format de réponse
    if (validatedQuery.format === 'minimal') {
      responseData = {
        success: true,
        query: validatedQuery.query,
        searchType: validatedQuery.searchType,
        totalItems: finalItems.length,
        items: finalItems.map(item => ({
          title: item.title,
          authors: item.authors || [],
          source: item._source,
          id: item._source === 'google_books' ? item.googleBooksId : item.openLibraryId,
          thumbnail: item.thumbnailUrl || item.thumbnail_url,
          year: item.publishedDate || item.firstPublishYear,
        })),
        executionTime: Date.now() - startTime,
      };
    } else {
      responseData = {
        success: true,
        query: validatedQuery.query,
        searchType: validatedQuery.searchType,
        totalItems: finalItems.length,
        originalTotalItems: totalItems,
        items: finalItems,
        sources_used: validatedQuery.sources,
        deduplication_applied: validatedQuery.deduplicate,
        executionTime: Date.now() - startTime,
      };
    }
    
  } else {
    // Résultats séparés mais dans un format unifié
    responseData = {
      success: true,
      query: validatedQuery.query,
      searchType: validatedQuery.searchType,
      sources: searchResults,
      executionTime: Date.now() - startTime,
    };
  }
  
  // Ajouter les informations de performance si demandé
  if (validatedQuery.include_performance) {
    responseData.performance = performance;
  }
  
  return NextResponse.json(responseData);
});

// =============================================================================
// 📥 IMPORT INTELLIGENT DEPUIS PLUSIEURS SOURCES
// =============================================================================
// POST /api/external/search - Import avec sélection automatique de la meilleure source

const SmartImportSchema = z.object({
  query: z.string().min(1, "La requête est obligatoire"),
  searchType: z.enum(['title', 'author', 'isbn', 'general']).default('general'),
  options: ImportOptionsSchema.partial().default({}),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification
  const session = await getSession(request);
  const userId = session?.id;
  
  if (!userId) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Authentification requise' : 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED',
    }, { status: 401 });
  }
  
  // Parser les données
  const body = await request.json();
  const validatedData = SmartImportSchema.parse(body);
  
  try {
    // Utiliser l'import intelligent qui choisit automatiquement la meilleure source
    const result = await quickImportBook(
      validatedData.query,
      validatedData.searchType,
      userId,
      'auto' // Sélection automatique de source
    );
    
    return NextResponse.json({
      success: result.success,
      result,
      smart_import: true,
      selected_source: result.source,
      api_execution_time: Date.now() - startTime,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'import intelligent',
      api_execution_time: Date.now() - startTime,
    }, { status: 500 });
  }
});

// =============================================================================
// 🧠 FONCTIONS UTILITAIRES
// =============================================================================

function calculateRelevanceScore(item: any, query: string, source: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  // Points pour la correspondance du titre
  if (item.title && item.title.toLowerCase().includes(queryLower)) {
    score += 10;
  }
  
  // Points pour la correspondance de l'auteur
  if (item.authors && item.authors.some((author: string) => 
    author.toLowerCase().includes(queryLower)
  )) {
    score += 8;
  }
  
  // Points pour la qualité des métadonnées
  if (item.description) score += 3;
  if (item.thumbnailUrl || item.thumbnail_url) score += 2;
  if (item.publishedDate || item.firstPublishYear) score += 2;
  if (item.isbn || (item.isbn13 || item.isbn10)) score += 4;
  
  // Bonus selon la source
  if (source === 'google_books') {
    score += 1; // Léger avantage Google Books
  }
  
  return score;
}

function deduplicateBooks(books: any[]): any[] {
  const seen = new Map();
  const duplicates: any[] = [];
  
  for (const book of books) {
    // Créer une clé unique basée sur le titre et l'auteur principal
    const title = book.title?.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const author = book.authors?.[0]?.toLowerCase().replace(/[^\w\s]/g, '').trim() || '';
    const key = `${title}|${author}`;
    
    if (seen.has(key)) {
      // Garder celui avec le meilleur score
      const existing = seen.get(key);
      if ((book._score || 0) > (existing._score || 0)) {
        duplicates.push(existing);
        seen.set(key, book);
      } else {
        duplicates.push(book);
      }
    } else {
      seen.set(key, book);
    }
  }
  
  return Array.from(seen.values());
}