import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getOpenLibraryService } from "@/services/open-library.service";

// =============================================================================
// 📖 API ROUTE OPEN LIBRARY - DÉTAILS D'UN WORK (LIVRE)
// =============================================================================
// GET /api/external/open-library/works/[id] - Récupère les détails complets d'un work

// Schéma pour les paramètres de route et query
const ParamsSchema = z.object({
  id: z.string().min(1, "L'ID du work est obligatoire"),
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
  
  // Obtenir le service Open Library
  const openLibraryService = getOpenLibraryService();
  
  // Récupérer les détails du work
  const workMetadata = await openLibraryService.getWorkById(id);
  
  if (!workMetadata) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Work non trouvé' : 'Work not found',
      code: 'WORK_NOT_FOUND',
      openLibraryId: id,
    }, { status: 404 });
  }
  
  // Préparer la réponse selon le format demandé
  let responseData;
  
  if (validatedQuery.format === 'minimal') {
    // Format minimal
    responseData = {
      success: true,
      source: 'open_library',
      work: {
        id: workMetadata.openLibraryId,
        key: workMetadata.openLibraryKey,
        title: workMetadata.title,
        subtitle: workMetadata.subtitle,
        authors: workMetadata.authors,
        description: workMetadata.description ? workMetadata.description.substring(0, 200) + '...' : undefined,
        subjects: workMetadata.subjects.slice(0, 5),
        firstPublishYear: workMetadata.firstPublishYear,
        thumbnailUrl: workMetadata.thumbnailUrl,
        isbn: workMetadata.isbn[0],
        readingCounts: workMetadata.readingCounts,
      },
      executionTime: Date.now() - startTime,
    };
  } else {
    // Format complet
    responseData = {
      success: true,
      source: 'open_library',
      work: workMetadata,
      executionTime: Date.now() - startTime,
    };
  }
  
  // Ajouter les informations de cache si demandé
  if (validatedQuery.include_cache_info) {
    responseData = {
      ...responseData,
      cache_info: {
        cache_size: openLibraryService.getCacheSize(),
      }
    };
  }
  
  return NextResponse.json(responseData);
});