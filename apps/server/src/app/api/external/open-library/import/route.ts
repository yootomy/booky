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
  importFromOpenLibrary 
} from "@/utils/book-import";
import { getSession } from "@/utils/auth-helpers";

// =============================================================================
// 📥 API ROUTE OPEN LIBRARY - IMPORT DE LIVRES
// =============================================================================
// POST /api/external/open-library/import - Importe un livre depuis Open Library

// Schéma pour les données d'import
const ImportRequestSchema = z.object({
  // Type d'import
  importType: z.enum(['search', 'work_id', 'batch']).default('search'),
  
  // Données de recherche (pour importType: 'search')
  query: z.string().optional(),
  searchType: z.enum(['title', 'author', 'isbn', 'general', 'subject']).default('general'),
  
  // ID Open Library Work (pour importType: 'work_id')
  openLibraryId: z.string().optional(),
  
  // Requêtes multiples (pour importType: 'batch')
  queries: z.array(z.string()).optional(),
  
  // Options d'import
  options: ImportOptionsSchema.partial().default({}),
}).refine(data => {
  // Validation conditionnelle selon le type d'import
  if (data.importType === 'search' && !data.query) {
    return false;
  }
  if (data.importType === 'work_id' && !data.openLibraryId) {
    return false;
  }
  if (data.importType === 'batch' && (!data.queries || data.queries.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Données manquantes pour le type d'import sélectionné",
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
  
  // Parser le body de la requête
  const body = await request.json();
  const validatedData = ImportRequestSchema.parse(body);
  
  // Préparer les options d'import avec l'userId et forcer Open Library comme source
  const importOptions = {
    preferredSource: 'open_library' as const,
    autoMapFields: validatedData.options.autoMapFields ?? true,
    overrideExisting: validatedData.options.overrideExisting ?? false,
    validateData: validatedData.options.validateData ?? true,
    downloadImages: validatedData.options.downloadImages ?? true,
    optimizeImages: validatedData.options.optimizeImages ?? true,
    userId,
    saveToDatabase: validatedData.options.saveToDatabase !== false, // Par défaut true
  };
  
  // Obtenir le service d'import
  const importService = getBookImportService();
  
  let result;
  
  try {
    switch (validatedData.importType) {
      case 'search':
        if (!validatedData.query) {
          throw new Error('Requête de recherche manquante');
        }
        
        result = await importService.importFromOpenLibrary(validatedData.query, {
          ...importOptions,
          searchQuery: validatedData.query,
          searchType: validatedData.searchType === 'subject' ? 'general' : validatedData.searchType,
        });
        break;
        
      case 'work_id':
        if (!validatedData.openLibraryId) {
          throw new Error('ID Open Library Work manquant');
        }
        
        // Pour l'instant, utiliser une recherche par ID comme workaround
        // Idéalement, on pourrait étendre le service pour accepter directement des Work IDs
        result = await importService.importFromOpenLibrary(validatedData.openLibraryId, {
          ...importOptions,
          searchQuery: validatedData.openLibraryId,
          searchType: 'general',
        });
        break;
        
      case 'batch':
        if (!validatedData.queries || validatedData.queries.length === 0) {
          throw new Error('Liste de requêtes manquante');
        }
        
        result = await importService.importBatch(validatedData.queries, {
          ...importOptions,
          searchQuery: validatedData.queries[0], // Première requête comme référence
          searchType: 'general' as const,
        });
        break;
        
      default:
        throw new Error(`Type d'import non supporté: ${validatedData.importType}`);
    }
    
    // Préparer la réponse
    const responseData = {
      success: result.success,
      source: 'open_library',
      importType: validatedData.importType,
      result,
      api_execution_time: Date.now() - startTime,
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'import',
      source: 'open_library',
      importType: validatedData.importType,
      api_execution_time: Date.now() - startTime,
    }, { status: 500 });
  }
});

// =============================================================================
// 🚀 FONCTIONS UTILITAIRES D'IMPORT RAPIDE
// =============================================================================
// GET /api/external/open-library/import - Endpoints pour import rapide

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'quick') {
    // Import rapide depuis les paramètres URL
    const query = searchParams.get('query');
    const searchType = searchParams.get('searchType') as 'title' | 'author' | 'isbn' | 'general' | 'subject' || 'general';
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Paramètre query manquant',
      }, { status: 400 });
    }
    
    // Vérifier l'authentification
    const session = await getSession(request);
    const userId = session?.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentification requise',
        code: 'AUTHENTICATION_REQUIRED',
      }, { status: 401 });
    }
    
    try {
      const result = await importFromOpenLibrary(query, searchType === 'subject' ? 'general' : searchType, userId);
      
      return NextResponse.json({
        success: result.success,
        source: 'open_library',
        result,
      });
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'import rapide',
        source: 'open_library',
      }, { status: 500 });
    }
  }
  
  // Documentation de l'API par défaut
  return NextResponse.json({
    success: true,
    message: 'API d\'import Open Library',
    endpoints: {
      'POST /api/external/open-library/import': {
        description: 'Importe un livre depuis Open Library',
        methods: ['search', 'work_id', 'batch'],
        authentication: 'required',
      },
      'GET /api/external/open-library/import?action=quick&query=...': {
        description: 'Import rapide depuis les paramètres URL',
        authentication: 'required',
      },
    },
    examples: {
      search_import: {
        importType: 'search',
        query: 'Harry Potter',
        searchType: 'title',
        options: {
          saveToDatabase: true,
          validateData: true,
        },
      },
      work_id_import: {
        importType: 'work_id',
        openLibraryId: 'OL82563W',
        options: {
          saveToDatabase: true,
        },
      },
      batch_import: {
        importType: 'batch',
        queries: ['Harry Potter', 'Lord of the Rings', 'Dune'],
        options: {
          saveToDatabase: true,
        },
      },
    },
    features: [
      'Recherche par titre, auteur, ISBN ou sujet',
      'Import direct par Work ID Open Library',
      'Import par lot de plusieurs livres',
      'Cache automatique des résultats',
      'Mapping automatique vers le format interne',
      'Validation des données importées',
      'Support des métadonnées étendues (sujets, lieux, personnes)',
    ],
  });
});