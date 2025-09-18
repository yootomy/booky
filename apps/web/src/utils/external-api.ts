// =============================================================================
// 🌐 SERVICES API EXTERNES - GOOGLE BOOKS & OPEN LIBRARY
// =============================================================================
// Services frontend pour intégrer les API externes via les endpoints backend
// Permet la recherche et l'import de livres depuis Google Books et Open Library

import { apiClient } from "./orpc";
import type {
  ExternalBookResult,
  ImportResult,
  GoogleBooksSearchParams,
  OpenLibrarySearchParams,
  ApiResponse
} from "../types/api";
import type { BookCreateInput } from "../types/book";

// =============================================================================
// 🔧 CONFIGURATION ET CONSTANTES
// =============================================================================

export const EXTERNAL_API_CONFIG = {
  GOOGLE_BOOKS: {
    maxResults: 40,
    defaultLanguage: 'fr',
    timeout: 10000,
    // Nouveaux paramètres optimisés
    defaultFilter: 'ebooks',
    defaultPrintType: 'books',
    defaultOrderBy: 'relevance',
  },
  OPEN_LIBRARY: {
    limit: 50,
    defaultSort: 'relevance',
    timeout: 12000, // Augmenté pour l'enrichissement
    // Nouveaux paramètres
    enrichedSearchLimit: 20, // Limite pour utiliser la recherche enrichie
    coverFallbackEnabled: true,
  },
} as const;

// =============================================================================
// 📚 TYPES SPÉCIFIQUES POUR LES SERVICES EXTERNES
// =============================================================================

export interface ExternalSearchOptions {
  // Paramètres communs
  query: string;
  maxResults?: number;
  startIndex?: number;
  language?: string;
  
  // Spécifique à Google Books
  searchType?: 'title' | 'author' | 'isbn' | 'general';
  orderBy?: 'relevance' | 'newest';
  printType?: 'all' | 'books' | 'magazines';
  
  // Spécifique à Open Library
  fields?: string;
  sort?: string;
}

export interface ExternalSearchResult {
  success: boolean;
  source: 'google_books' | 'open_library';
  totalItems: number;
  items: ExternalBookResult[];
  query: string;
  executionTime: number;
  cachedResult?: boolean;
}

export interface BookImportOptions {
  // Données du livre externe à importer
  externalId: string;
  source: 'google_books' | 'open_library';
  
  // Métadonnées à override/compléter
  customTitle?: string;
  customAuthor?: string;
  customDescription?: string;
  
  // Options d'import
  autoFillMetadata?: boolean;
  downloadCover?: boolean;
  createCategories?: boolean;
  createTags?: boolean;
  
  // Données personnelles à ajouter
  noteGenerale?: number;
  niveauSpicy?: number;
  niveauDark?: number;
  niveauRomance?: number;
  statut?: 'LU' | 'EN_COURS' | 'A_LIRE';
  categories?: string[];
  tags?: string[];
}

// =============================================================================
// 🔍 SERVICE GOOGLE BOOKS
// =============================================================================

export const googleBooksApi = {
  // Recherche générale améliorée
  async search(options: ExternalSearchOptions): Promise<ExternalSearchResult> {
    // Optimiser la requête selon le type de recherche
    let optimizedQuery = options.query;
    
    // Détection automatique du type de recherche si non spécifié
    let searchType = options.searchType || this.detectSearchType(options.query);
    
    const params: GoogleBooksSearchParams = {
      q: optimizedQuery,
      startIndex: options.startIndex || 0,
      maxResults: Math.min(options.maxResults || 20, EXTERNAL_API_CONFIG.GOOGLE_BOOKS.maxResults),
      orderBy: options.orderBy || EXTERNAL_API_CONFIG.GOOGLE_BOOKS.defaultOrderBy,
      langRestrict: options.language || EXTERNAL_API_CONFIG.GOOGLE_BOOKS.defaultLanguage,
      printType: options.printType || EXTERNAL_API_CONFIG.GOOGLE_BOOKS.defaultPrintType,
    };
    
    // Construire l'URL avec les paramètres optimisés
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    // Ajouter le type de recherche optimisé
    if (searchType && searchType !== 'general') {
      searchParams.append('searchType', searchType);
    }
    
    // Ajouter des filtres de qualité
    searchParams.append('filter', EXTERNAL_API_CONFIG.GOOGLE_BOOKS.defaultFilter);
    
    return apiClient.get<ExternalSearchResult>(
      `/api/external/google-books/search?${searchParams.toString()}`
    );
  },

  // Détection automatique du type de recherche
  detectSearchType(query: string): 'title' | 'author' | 'isbn' | 'general' {
    // Nettoyer la requête
    const cleanQuery = query.trim().toLowerCase();
    
    // Détecter ISBN (10 ou 13 chiffres avec ou sans tirets)
    const isbnPattern = /^(?:\d{9}[\dx]|\d{13}|(?:\d{1,5}[-\s]?){2,4}\d{1,7}[-\s]?[\dx])$/;
    if (isbnPattern.test(cleanQuery.replace(/[-\s]/g, ''))) {
      return 'isbn';
    }
    
    // Détecter si c'est probablement un nom d'auteur (2+ mots, commence par une majuscule)
    const words = cleanQuery.split(' ').filter(w => w.length > 0);
    if (words.length >= 2 && words.every(word => 
      word.charAt(0).toUpperCase() === word.charAt(0) && 
      !/\d/.test(word) && 
      word.length <= 20
    )) {
      return 'author';
    }
    
    // Détecter si c'est probablement un titre (contient des mots communs de titre)
    const titleWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'the', 'a', 'an', 'of', 'and'];
    if (words.length >= 2 && words.some(word => titleWords.includes(word.toLowerCase()))) {
      return 'title';
    }
    
    return 'general';
  },

  // Recherche par titre
  async searchByTitle(title: string, options?: { maxResults?: number; language?: string }): Promise<ExternalSearchResult> {
    return this.search({
      query: title,
      searchType: 'title',
      maxResults: options?.maxResults || 10,
      language: options?.language,
    });
  },

  // Recherche par auteur
  async searchByAuthor(author: string, options?: { maxResults?: number; language?: string }): Promise<ExternalSearchResult> {
    return this.search({
      query: author,
      searchType: 'author',
      maxResults: options?.maxResults || 10,
      language: options?.language,
    });
  },

  // Recherche par ISBN
  async searchByISBN(isbn: string): Promise<ExternalSearchResult> {
    return this.search({
      query: isbn.replace(/[-\s]/g, ''), // Nettoyer l'ISBN
      searchType: 'isbn',
      maxResults: 1,
    });
  },

  // Obtenir les détails d'un livre spécifique
  async getBookDetails(googleBooksId: string): Promise<ApiResponse<ExternalBookResult>> {
    return apiClient.get<ApiResponse<ExternalBookResult>>(
      `/api/external/google-books/book/${googleBooksId}`
    );
  },

  // Importer un livre depuis Google Books
  async importBook(googleBooksId: string, options?: BookImportOptions): Promise<ImportResult> {
    const importData = {
      externalId: googleBooksId,
      source: 'google_books' as const,
      ...options,
    };
    
    return apiClient.post<ImportResult>(
      '/api/external/google-books/import',
      importData
    );
  },
};

// =============================================================================
// 📖 SERVICE OPEN LIBRARY
// =============================================================================

export const openLibraryApi = {
  // Recherche générale
  async search(options: ExternalSearchOptions): Promise<ExternalSearchResult> {
    const params: OpenLibrarySearchParams = {
      q: options.query,
      limit: Math.min(options.maxResults || 10, EXTERNAL_API_CONFIG.OPEN_LIBRARY.limit),
      offset: options.startIndex || 0,
      fields: options.fields || 'key,title,author_name,first_publish_year,isbn,cover_i,publisher,language',
      sort: options.sort || EXTERNAL_API_CONFIG.OPEN_LIBRARY.defaultSort,
    };
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return apiClient.get<ExternalSearchResult>(
      `/api/external/open-library/search?${searchParams.toString()}`
    );
  },

  // Recherche par titre
  async searchByTitle(title: string, options?: { maxResults?: number }): Promise<ExternalSearchResult> {
    return this.search({
      query: `title:${title}`,
      maxResults: options?.maxResults || 10,
    });
  },

  // Recherche par auteur
  async searchByAuthor(author: string, options?: { maxResults?: number }): Promise<ExternalSearchResult> {
    return this.search({
      query: `author:${author}`,
      maxResults: options?.maxResults || 10,
    });
  },

  // Recherche par ISBN
  async searchByISBN(isbn: string): Promise<ExternalSearchResult> {
    return this.search({
      query: `isbn:${isbn.replace(/[-\s]/g, '')}`,
      maxResults: 1,
    });
  },

  // Obtenir les détails d'un livre spécifique
  async getBookDetails(openLibraryKey: string): Promise<ApiResponse<ExternalBookResult>> {
    return apiClient.get<ApiResponse<ExternalBookResult>>(
      `/api/external/open-library/book/${openLibraryKey.replace('/works/', '')}`
    );
  },

  // Importer un livre depuis Open Library
  async importBook(openLibraryKey: string, options?: BookImportOptions): Promise<ImportResult> {
    const importData = {
      externalId: openLibraryKey,
      source: 'open_library' as const,
      ...options,
    };
    
    return apiClient.post<ImportResult>(
      '/api/external/open-library/import',
      importData
    );
  },
};

// =============================================================================
// 🔄 SERVICE DE RECHERCHE COMBINÉE
// =============================================================================

export const externalSearchApi = {
  // Recherche dans les deux sources en parallèle
  async searchBoth(options: ExternalSearchOptions): Promise<{
    googleBooks?: ExternalSearchResult;
    openLibrary?: ExternalSearchResult;
    combinedResults: ExternalBookResult[];
    totalResults: number;
    executionTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Lancer les deux recherches en parallèle
      const [googleBooksPromise, openLibraryPromise] = await Promise.allSettled([
        googleBooksApi.search(options),
        openLibraryApi.search(options),
      ]);
      
      const result = {
        googleBooks: undefined as ExternalSearchResult | undefined,
        openLibrary: undefined as ExternalSearchResult | undefined,
        combinedResults: [] as ExternalBookResult[],
        totalResults: 0,
        executionTime: Date.now() - startTime,
      };
      
      // Traiter les résultats Google Books
      if (googleBooksPromise.status === 'fulfilled') {
        result.googleBooks = googleBooksPromise.value;
        result.combinedResults.push(...googleBooksPromise.value.items);
      }
      
      // Traiter les résultats Open Library
      if (openLibraryPromise.status === 'fulfilled') {
        result.openLibrary = openLibraryPromise.value;
        result.combinedResults.push(...openLibraryPromise.value.items);
      }
      
      // Dédupliquer par ISBN si possible
      result.combinedResults = this.deduplicateResults(result.combinedResults);
      result.totalResults = result.combinedResults.length;
      
      return result;
      
    } catch (error) {
      throw new Error(`Erreur lors de la recherche combinée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  },

  // Recherche intelligente avec fallback
  async smartSearch(query: string, options?: {
    preferredSource?: 'google_books' | 'open_library';
    maxResults?: number;
    fallbackOnError?: boolean;
  }): Promise<ExternalSearchResult> {
    const searchOptions: ExternalSearchOptions = {
      query,
      maxResults: options?.maxResults || 20,
    };
    
    const preferredSource = options?.preferredSource || 'google_books';
    const fallbackEnabled = options?.fallbackOnError !== false;
    
    try {
      // Essayer la source préférée
      if (preferredSource === 'google_books') {
        return await googleBooksApi.search(searchOptions);
      } else {
        return await openLibraryApi.search(searchOptions);
      }
      
    } catch (error) {
      if (!fallbackEnabled) {
        throw error;
      }
      
      // Fallback vers l'autre source
      const fallbackSource = preferredSource === 'google_books' ? 'open_library' : 'google_books';
      
      try {
        if (fallbackSource === 'google_books') {
          return await googleBooksApi.search(searchOptions);
        } else {
          return await openLibraryApi.search(searchOptions);
        }
      } catch (fallbackError) {
        throw new Error(`Erreur sur les deux sources: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  },

  // Dédupliquer les résultats par ISBN ou titre/auteur
  deduplicateResults(results: ExternalBookResult[]): ExternalBookResult[] {
    const seen = new Set<string>();
    const deduplicated: ExternalBookResult[] = [];
    
    for (const book of results) {
      // Créer une clé unique basée sur ISBN ou titre+auteur
      let uniqueKey = '';
      if (book.isbn && typeof book.isbn === 'string') {
        uniqueKey = book.isbn.replace(/[-\s]/g, '');
      } else {
        const titre = book.titre?.toLowerCase() || 'no-title';
        const auteur = book.auteur?.toLowerCase() || 'no-author';
        uniqueKey = `${titre}_${auteur}`;
      }
      
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        deduplicated.push(book);
      }
    }
    
    return deduplicated;
  },
};

// =============================================================================
// 🚀 FONCTIONS UTILITAIRES
// =============================================================================

// Transformer un résultat externe en données de livre pour l'import
export function transformExternalBookToBookInput(
  book: ExternalBookResult, 
  customData?: Partial<BookImportOptions>
): Partial<BookCreateInput> {
  return {
    titre: customData?.customTitle || book.titre,
    auteur: customData?.customAuthor || book.auteur,
    isbn: book.isbn,
    image_couverture: book.image_couverture,
    resume_officiel: customData?.customDescription || book.resume_officiel,
    editeur: book.editeur,
    date_publication: book.date_publication,
    nombre_pages: book.nombre_pages,
    langue: book.langue,
    
    // Champs obligatoires avec valeurs par défaut
    note_generale: customData?.noteGenerale || 5,
    niveau_spicy: customData?.niveauSpicy || 1,
    niveau_dark: customData?.niveauDark || 1,
    niveau_romance: customData?.niveauRomance || 1,
    intensite_emotionnelle: 5,
    danger: 1,
    violence: 1,
    originalite: 5,
    rythme: 'MEDIUM_BURN' as 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE',
    statut: customData?.statut || 'A_LIRE',
    
    // Identifiants externes pour traçabilité
    google_books_id: book.source === 'google_books' ? book.identifiant_externe : undefined,
    open_library_id: book.source === 'open_library' ? book.identifiant_externe : undefined,
    
    // Métadonnées
    ajout_manuel: false,
    
    // Relations (IDs uniquement pour la création)
    categories: customData?.categories,
    tags: customData?.tags,
  };
}

// Valider si un ISBN est valide
export function validateISBN(isbn: string): { valid: boolean; type?: 'ISBN-10' | 'ISBN-13'; cleaned?: string } {
  const cleaned = isbn.replace(/[-\s]/g, '');
  
  if (cleaned.length === 10) {
    // Validation ISBN-10
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    const checkDigit = cleaned[9] === 'X' ? 10 : parseInt(cleaned[9]);
    const isValid = (sum + checkDigit) % 11 === 0;
    
    return {
      valid: isValid,
      type: 'ISBN-10',
      cleaned: isValid ? cleaned : undefined,
    };
  } else if (cleaned.length === 13) {
    // Validation ISBN-13
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const isValid = checkDigit === parseInt(cleaned[12]);
    
    return {
      valid: isValid,
      type: 'ISBN-13',
      cleaned: isValid ? cleaned : undefined,
    };
  }
  
  return { valid: false };
}

// Formater une date de publication
export function formatPublicationDate(date?: string): string {
  if (!date) return 'Date inconnue';
  
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return date; // Retourner la date originale si impossible à parser
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(parsedDate);
  } catch {
    return date;
  }
}

// Générer une URL de couverture par défaut
export function getDefaultCoverUrl(title: string, width = 300, height = 400): string {
  const encodedTitle = encodeURIComponent(title);
  return `https://via.placeholder.com/${width}x${height}/4B0082/FFFFFF?text=${encodedTitle}`;
}

// =============================================================================
// 📤 EXPORTS PRINCIPAUX
// =============================================================================

export default {
  google: googleBooksApi,
  openLibrary: openLibraryApi,
  search: externalSearchApi,
  utils: {
    transformExternalBookToBookInput,
    validateISBN,
    formatPublicationDate,
    getDefaultCoverUrl,
  },
};