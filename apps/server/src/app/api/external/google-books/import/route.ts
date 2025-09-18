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
  quickImportBook,
  importFromGoogleBooksId 
} from "@/utils/book-import";
import { getSession } from "@/utils/auth-helpers";

// =============================================================================
// 📥 API ROUTE GOOGLE BOOKS - IMPORT DE LIVRES
// =============================================================================
// POST /api/external/google-books/import - Importe un livre depuis Google Books

// Schéma pour les données d'import
const ImportRequestSchema = z.object({
  // Support du format frontend actuel
  externalId: z.string().optional(),
  source: z.enum(['google_books', 'open_library']).optional(),
  
  // Type d'import (optionnel, dérivé des autres champs)
  importType: z.enum(['search', 'id', 'batch']).optional(),
  
  // Données de recherche (pour importType: 'search')
  query: z.string().optional(),
  searchType: z.enum(['title', 'author', 'isbn', 'general']).default('general'),
  
  // ID Google Books (pour importType: 'id')
  googleBooksId: z.string().optional(),
  
  // Requêtes multiples (pour importType: 'batch')
  queries: z.array(z.string()).optional(),
  
  // Options d'import
  options: ImportOptionsSchema.partial().default({}),
  
  // Valeurs personnalisées directement à la racine
  noteGenerale: z.number().int().min(1).max(10).optional(),
  niveauSpicy: z.number().int().min(1).max(10).optional(),
  niveauDark: z.number().int().min(1).max(10).optional(),
  niveauRomance: z.number().int().min(1).max(10).optional(),
  statut: z.enum(['LU', 'EN_COURS', 'A_LIRE']).optional(),
}).transform(data => {
  // Auto-détection du type d'import et normalisation
  let importType = data.importType;
  let googleBooksId = data.googleBooksId;
  const query = data.query;
  
  // Si externalId est fourni, c'est un import par ID
  if (data.externalId) {
    importType = 'id';
    googleBooksId = data.externalId;
  }
  // Si query est fourni sans externalId, c'est une recherche
  else if (data.query) {
    importType = 'search';
  }
  // Si queries est fourni, c'est un import par lot
  else if (data.queries && data.queries.length > 0) {
    importType = 'batch';
  }
  // Par défaut, import par recherche
  else {
    importType = importType || 'search';
  }
  
  return {
    ...data,
    importType,
    googleBooksId,
    query,
  };
}).refine(data => {
  // Validation conditionnelle selon le type d'import
  if (data.importType === 'search' && !data.query) {
    return false;
  }
  if (data.importType === 'id' && !data.googleBooksId) {
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
  
  // Préparer les options d'import avec l'userId
  const importOptions = {
    preferredSource: validatedData.options.preferredSource || 'auto' as const,
    autoMapFields: validatedData.options.autoMapFields ?? true,
    overrideExisting: validatedData.options.overrideExisting ?? false,
    validateData: validatedData.options.validateData ?? true,
    downloadImages: validatedData.options.downloadImages ?? true,
    optimizeImages: validatedData.options.optimizeImages ?? true,
    userId,
    createdBy: userId, // Champ requis pour Prisma
    saveToDatabase: validatedData.options.saveToDatabase !== false, // Par défaut true
    
    // Valeurs personnalisées depuis la requête
    noteGenerale: validatedData.noteGenerale,
    niveauSpicy: validatedData.niveauSpicy,
    niveauDark: validatedData.niveauDark,
    niveauRomance: validatedData.niveauRomance,
    statut: validatedData.statut,
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
        
        result = await importService.importFromSearch(validatedData.query, {
          ...importOptions,
          searchQuery: validatedData.query,
          searchType: validatedData.searchType,
        });
        break;
        
      case 'id':
        if (!validatedData.googleBooksId) {
          throw new Error('ID Google Books manquant');
        }
        
        result = await importService.importFromGoogleBooksId(validatedData.googleBooksId, {
          ...importOptions,
          searchQuery: validatedData.googleBooksId,
          searchType: 'general' as const,
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
      importType: validatedData.importType,
      result,
      api_execution_time: Date.now() - startTime,
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'import',
      importType: validatedData.importType,
      api_execution_time: Date.now() - startTime,
    }, { status: 500 });
  }
});

// =============================================================================
// 🚀 FONCTIONS UTILITAIRES D'IMPORT RAPIDE
// =============================================================================
// GET /api/external/google-books/import - Endpoints pour import rapide

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'quick') {
    // Import rapide depuis les paramètres URL
    const query = searchParams.get('query');
    const searchType = searchParams.get('searchType') as 'title' | 'author' | 'isbn' | 'general' || 'general';
    
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
      const result = await quickImportBook(query, searchType, userId);
      
      return NextResponse.json({
        success: result.success,
        result,
      });
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'import rapide',
      }, { status: 500 });
    }
  }
  
  // Documentation de l'API par défaut
  return NextResponse.json({
    success: true,
    message: 'API d\'import Google Books',
    endpoints: {
      'POST /api/external/google-books/import': {
        description: 'Importe un livre depuis Google Books',
        methods: ['search', 'id', 'batch'],
        authentication: 'required',
      },
      'GET /api/external/google-books/import?action=quick&query=...': {
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
      id_import: {
        importType: 'id',
        googleBooksId: 'wrOQLV6xB-wC',
        options: {
          saveToDatabase: true,
        },
      },
      batch_import: {
        importType: 'batch',
        queries: ['Harry Potter', 'Lord of the Rings', 'Game of Thrones'],
        options: {
          saveToDatabase: true,
        },
      },
    },
  });
});