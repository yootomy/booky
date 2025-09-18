import { z } from "zod";
import { 
  BookResponseSchema, 
  UserResponseSchema, 
  CategoryResponseSchema, 
  TagResponseSchema,
  PaginatedResponseSchema,
  type BookResponse,
  type UserResponse,
  type CategoryResponse,
  type TagResponse 
} from "@/schemas/book.schemas";

// =============================================================================
// 📤 SYSTÈME DE SÉRIALISATION DES RÉPONSES API
// =============================================================================

// Interface générique pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
  filters?: Record<string, unknown>;
  search_info?: SearchInfo;
  timestamp?: string;
}

// Interface pour les informations de pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Interface pour les informations de recherche
export interface SearchInfo {
  total_results: number;
  search_query?: string;
  filters_applied: string[];
  available_filters: Record<string, unknown>;
  execution_time_ms?: number;
}

// =============================================================================
// 🧹 FONCTIONS DE NETTOYAGE DES DONNÉES
// =============================================================================

/**
 * Nettoie et formate les données d'un livre pour la réponse API
 */
export function serializeBook(book: any): BookResponse {
  // Nettoyer les valeurs null/undefined et vides
  const cleanBook = {
    ...book,
    isbn: book.isbn || null,
    image_couverture: book.image_couverture || null,
    google_books_id: book.google_books_id || null,
    open_library_id: book.open_library_id || null,
    resume_officiel: book.resume_officiel || null,
    editeur: book.editeur || null,
    date_publication: book.date_publication ? new Date(book.date_publication) : null,
    nombre_pages: book.nombre_pages || null,
    date_lecture: book.date_lecture ? new Date(book.date_lecture) : null,
    resume_personnel: book.resume_personnel || null,
    critique_detaillee: book.critique_detaillee || null,
    citations_favorites: book.citations_favorites || null,
    pourquoi_aimer: book.pourquoi_aimer || null,
    questions_sur_le_livre: book.questions_sur_le_livre || null,
    recommandation_personnalisee: book.recommandation_personnalisee || null,
    
    // Assurer les dates
    date_creation: new Date(book.date_creation),
    date_modification: new Date(book.date_modification),
    
    // Sérialiser les relations
    user: book.user ? serializeUser(book.user) : undefined,
    categories: book.book_category ? book.book_category.map((bc: any) => ({
      ...bc,
      category: serializeCategory(bc.category)
    })) : undefined,
    tags: book.book_tag ? book.book_tag.map((bt: any) => ({
      ...bt,
      tag: serializeTag(bt.tag)
    })) : undefined,
  };

  // Valider avec le schéma Zod
  return BookResponseSchema.parse(cleanBook);
}

/**
 * Sérialise un utilisateur (sans données sensibles)
 */
export function serializeUser(user: any): UserResponse {
  return UserResponseSchema.parse({
    id: user.id,
    nom_complet: user.nom_complet,
    avatar: user.avatar || null,
  });
}

/**
 * Sérialise une catégorie
 */
export function serializeCategory(category: any): CategoryResponse {
  return CategoryResponseSchema.parse({
    id: category.id,
    nom: category.nom,
    couleur: category.couleur,
    icone: category.icone,
    description: category.description || null,
    ordre_affichage: category.ordre_affichage,
    est_actif: category.est_actif,
  });
}

/**
 * Sérialise un tag
 */
export function serializeTag(tag: any): TagResponse {
  return TagResponseSchema.parse({
    id: tag.id,
    nom: tag.nom,
    couleur: tag.couleur,
    type: tag.type,
    utilisation_count: tag.utilisation_count || 0,
    est_favori: tag.est_favori || false,
  });
}

// =============================================================================
// 🎯 FONCTIONS DE CRÉATION DE RÉPONSES
// =============================================================================

/**
 * Crée une réponse de succès simple
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Crée une réponse de succès avec pagination
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationInfo,
  filters?: Record<string, unknown>,
  searchInfo?: SearchInfo
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    pagination,
    filters,
    search_info: searchInfo,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Crée une réponse d'erreur
 */
export function createErrorResponse(
  error: string,
  details?: unknown,
  statusCode: number = 500
): ApiResponse<never> {
  return {
    success: false,
    error,
    ...(details && typeof details === 'object' ? { details } : {}),
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// 📊 FONCTIONS UTILITAIRES POUR LA PAGINATION
// =============================================================================

/**
 * Calcule les informations de pagination
 */
export function calculatePagination(
  page: number,
  limit: number,
  totalCount: number
): PaginationInfo {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Calcule les paramètres de skip/take pour Prisma
 */
export function calculatePaginationParams(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

// =============================================================================
// 🔍 FONCTIONS UTILITAIRES POUR LA RECHERCHE
// =============================================================================

/**
 * Crée les informations de recherche
 */
export function createSearchInfo(
  totalResults: number,
  filtersApplied: string[],
  searchQuery?: string,
  executionTime?: number
): SearchInfo {
  return {
    total_results: totalResults,
    search_query: searchQuery,
    filters_applied: filtersApplied,
    available_filters: {
      statut: ["LU", "EN_COURS", "A_LIRE"],
      niveaux: "0-10 pour spicy/dark/romance",
      tri: [
        "date_creation", "titre", "auteur", "note_generale", 
        "niveau_spicy", "niveau_dark", "niveau_romance",
        "date_lecture", "nombre_pages"
      ],
      langues: ["FR", "EN"],
      rythmes: ["SLOW_BURN", "MEDIUM_BURN", "FAST_PACE", "INSTA_LOVE"]
    },
    ...(executionTime && { execution_time_ms: executionTime }),
  };
}

/**
 * Détecte quels filtres sont appliqués
 */
export function getAppliedFilters(filters: Record<string, unknown>): string[] {
  const appliedFilters: string[] = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      switch (key) {
        case 'search':
        case 'q':
          appliedFilters.push('text_search');
          break;
        case 'statut':
        case 'status':
          appliedFilters.push('status_filter');
          break;
        case 'niveau_spicy':
        case 'spicy_level':
          appliedFilters.push('spicy_level_filter');
          break;
        case 'niveau_dark':
        case 'dark_level':
          appliedFilters.push('dark_level_filter');
          break;
        case 'author':
        case 'auteur':
          appliedFilters.push('author_filter');
          break;
        case 'genre':
        case 'category':
          appliedFilters.push('genre_filter');
          break;
        case 'tag':
          appliedFilters.push('tag_filter');
          break;
        case 'min_rating':
        case 'max_rating':
        case 'note_min':
        case 'note_max':
          if (!appliedFilters.includes('rating_filter')) {
            appliedFilters.push('rating_filter');
          }
          break;
        case 'language':
        case 'langue':
          appliedFilters.push('language_filter');
          break;
        case 'rythme':
          appliedFilters.push('rhythm_filter');
          break;
        case 'date_lecture_after':
        case 'date_lecture_before':
        case 'date_publication_after':
        case 'date_publication_before':
          if (!appliedFilters.includes('date_filter')) {
            appliedFilters.push('date_filter');
          }
          break;
        case 'ajout_manuel':
          appliedFilters.push('manual_add_filter');
          break;
      }
    }
  });

  return appliedFilters;
}

// =============================================================================
// 🧼 FONCTIONS DE NETTOYAGE DE DONNÉES
// =============================================================================

/**
 * Supprime les champs undefined/null des objets
 */
export function removeEmptyFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.trim() === '') {
        return; // Skip empty strings
      }
      (cleaned as any)[key] = value;
    }
  });
  
  return cleaned;
}

/**
 * Transforme les chaînes vides en null
 */
export function emptyStringToNull<T extends Record<string, unknown>>(obj: T): T {
  const result: any = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() === '') {
      result[key] = null;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = emptyStringToNull(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  });
  
  return result;
}

// =============================================================================
// 📈 FONCTIONS DE PERFORMANCE ET MONITORING
// =============================================================================

/**
 * Mesure le temps d'exécution d'une fonction
 */
export function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
  return new Promise(async (resolve) => {
    const startTime = Date.now();
    const result = await fn();
    const executionTime = Date.now() - startTime;
    
    resolve({ result, executionTime });
  });
}

/**
 * Limite la profondeur des objets sérialisés pour éviter les références circulaires
 */
export function limitObjectDepth(obj: any, maxDepth: number = 3, currentDepth: number = 0): any {
  if (currentDepth >= maxDepth) {
    return "[Object: Max depth reached]";
  }
  
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => limitObjectDepth(item, maxDepth, currentDepth + 1));
  }
  
  const result: any = {};
  Object.entries(obj).forEach(([key, value]) => {
    result[key] = limitObjectDepth(value, maxDepth, currentDepth + 1);
  });
  
  return result;
}

// =============================================================================
// 🎨 FONCTIONS DE FORMATAGE SPÉCIALISÉES
// =============================================================================

/**
 * Formate les livres pour l'affichage en liste (données minimales)
 */
export function serializeBooksForList(books: any[]): Partial<BookResponse>[] {
  return books.map(book => ({
    id: book.id,
    titre: book.titre,
    auteur: book.auteur,
    image_couverture: book.image_couverture,
    note_generale: book.note_generale,
    niveau_spicy: book.niveau_spicy,
    niveau_dark: book.niveau_dark,
    statut: book.statut,
    date_creation: new Date(book.date_creation),
    categories: book.book_category?.map((bc: any) => ({
      id: bc.id,
      category: {
        id: bc.category.id,
        nom: bc.category.nom,
        couleur: bc.category.couleur,
        icone: bc.category.icone,
      }
    })) || []
  }));
}

/**
 * Formate un livre pour l'affichage détaillé (toutes les données)
 */
export function serializeBookForDetail(book: any): BookResponse {
  return serializeBook(book);
}

// =============================================================================
// 🔒 SÉRIALISATION SÉCURISÉE
// =============================================================================

/**
 * Supprime les données sensibles avant sérialisation
 */
export function sanitizeForPublicApi<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = ['password', 'email', 'token', 'secret']
): Partial<T> {
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    delete sanitized[field];
  });
  
  return sanitized;
}

// =============================================================================
// 🧪 FONCTIONS UTILITAIRES POUR LES TESTS
// =============================================================================

/**
 * Valide qu'une réponse respecte le format API attendu
 */
export function validateApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean' &&
    (response.success === false || response.data !== undefined)
  );
}

/**
 * Crée une réponse de test factice
 */
export function createMockApiResponse<T>(data: T): ApiResponse<T> {
  return createSuccessResponse(data, "Test response");
}