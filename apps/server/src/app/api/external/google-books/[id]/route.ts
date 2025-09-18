import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getGoogleBooksService } from "@/services/google-books.service";

// =============================================================================
// 📖 API ROUTE GOOGLE BOOKS - DÉTAILS D'UN LIVRE
// =============================================================================
// GET /api/external/google-books/[id] - Récupère les détails complets d'un livre

// Schéma pour les paramètres de route et query
const ParamsSchema = z.object({
  id: z.string().min(1, "L'ID du livre est obligatoire"),
});

const QueryParamsSchema = z.object({
  format: z.enum(['full', 'minimal']).default('full'),
  include_cache_info: z.coerce.boolean().default(false),
});

export const GET = withErrorHandler(async (
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Résoudre les paramètres asynchrones
  const params = await context.params;
  // Valider les paramètres de route
  const { id } = ParamsSchema.parse(params);
  
  // Valider les paramètres de requête
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  const transformedQuery = {
    ...queryObject,
    include_cache_info: queryObject.include_cache_info === 'true',
  };
  
  const validatedQuery = QueryParamsSchema.parse(transformedQuery);
  
  // Obtenir le service Google Books
  const googleBooksService = getGoogleBooksService();
  
  // Récupérer les détails du livre
  const bookMetadata = await googleBooksService.getBookById(id);
  
  if (!bookMetadata) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Livre non trouvé' : 'Book not found',
      code: 'BOOK_NOT_FOUND',
      googleBooksId: id,
    }, { status: 404 });
  }
  
  // Préparer la réponse selon le format demandé
  let responseData;
  
  if (validatedQuery.format === 'minimal') {
    // Format minimal
    responseData = {
      success: true,
      source: 'google_books',
      book: {
        id: bookMetadata.googleBooksId,
        title: bookMetadata.title,
        subtitle: bookMetadata.subtitle,
        authors: bookMetadata.authors,
        publisher: bookMetadata.publisher,
        publishedDate: bookMetadata.publishedDate,
        description: bookMetadata.description ? bookMetadata.description.substring(0, 200) + '...' : undefined,
        isbn: bookMetadata.isbn13 || bookMetadata.isbn10,
        pageCount: bookMetadata.pageCount,
        categories: bookMetadata.categories,
        language: bookMetadata.language,
        thumbnailUrl: bookMetadata.thumbnailUrl,
        averageRating: bookMetadata.averageRating,
        ratingsCount: bookMetadata.ratingsCount,
      },
      executionTime: Date.now() - startTime,
    };
  } else {
    // Format complet
    responseData = {
      success: true,
      source: 'google_books',
      book: bookMetadata,
      executionTime: Date.now() - startTime,
    };
  }
  
  // Ajouter les informations de cache si demandé
  if (validatedQuery.include_cache_info) {
    responseData = {
      ...responseData,
      cache_info: {
        cache_size: googleBooksService.getCacheSize(),
      }
    };
  }
  
  return NextResponse.json(responseData);
});