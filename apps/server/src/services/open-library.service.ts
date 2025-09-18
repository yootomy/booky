// =============================================================================
// 📚 SERVICE OPEN LIBRARY API
// =============================================================================
// Intégration complète avec l'API Open Library pour la recherche et l'import
// de métadonnées de livres (sans clé API requise)

import { z } from "zod";

// =============================================================================
// 🔧 CONFIGURATION ET TYPES
// =============================================================================

export interface OpenLibraryConfig {
  baseUrl: string;
  coversUrl: string;
  maxResults: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const defaultConfig: OpenLibraryConfig = {
  baseUrl: 'https://openlibrary.org',
  coversUrl: 'https://covers.openlibrary.org',
  maxResults: 50,
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// =============================================================================
// 📋 SCHÉMAS DE VALIDATION OPEN LIBRARY
// =============================================================================

// Schéma pour les paramètres de recherche
export const OpenLibrarySearchSchema = z.object({
  query: z.string().min(1, "La requête de recherche est obligatoire"),
  searchType: z.enum(['title', 'author', 'isbn', 'general', 'subject']).default('general'),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  sort: z.enum(['new', 'old', 'random', 'rating']).optional(),
  language: z.array(z.string()).optional(),
  subject: z.string().optional(),
  place: z.string().optional(),
  person: z.string().optional(),
  publisher: z.string().optional(),
  first_publish_year: z.string().optional(),
});

// Schéma pour un document Open Library (livre)
export const OpenLibraryDocSchema = z.object({
  key: z.string(),
  type: z.string().optional(),
  seed: z.array(z.string()).optional(),
  title: z.string(),
  title_suggest: z.string().optional(),
  title_sort: z.string().optional(),
  edition_count: z.number().optional(),
  edition_key: z.array(z.string()).optional(),
  publish_date: z.array(z.string()).optional(),
  publish_year: z.array(z.number()).optional(),
  first_publish_year: z.number().optional(),
  number_of_pages_median: z.number().optional(),
  lccn: z.array(z.string()).optional(),
  publish_place: z.array(z.string()).optional(),
  oclc: z.array(z.string()).optional(),
  contributor: z.array(z.string()).optional(),
  lcc: z.array(z.string()).optional(),
  ddc: z.array(z.string()).optional(),
  isbn: z.array(z.string()).optional(),
  last_modified_i: z.number().optional(),
  ebook_count_i: z.number().optional(),
  ebook_access: z.string().optional(),
  has_fulltext: z.boolean().optional(),
  public_scan_b: z.boolean().optional(),
  readinglog_count: z.number().optional(),
  want_to_read_count: z.number().optional(),
  currently_reading_count: z.number().optional(),
  already_read_count: z.number().optional(),
  cover_edition_key: z.string().optional(),
  cover_i: z.number().optional(),
  publisher: z.array(z.string()).optional(),
  language: z.array(z.string()).optional(),
  author_key: z.array(z.string()).optional(),
  author_name: z.array(z.string()).optional(),
  author_alternative_name: z.array(z.string()).optional(),
  subject: z.array(z.string()).optional(),
  person: z.array(z.string()).optional(),
  place: z.array(z.string()).optional(),
  time: z.array(z.string()).optional(),
  id_amazon: z.array(z.string()).optional(),
  id_goodreads: z.array(z.string()).optional(),
  id_librarything: z.array(z.string()).optional(),
  id_google: z.array(z.string()).optional(),
  id_paperback_swap: z.array(z.string()).optional(),
  id_wikidata: z.array(z.string()).optional(),
  ratings_average: z.number().optional(),
  ratings_sortable: z.number().optional(),
  ratings_count: z.number().optional(),
  ratings_count_1: z.number().optional(),
  ratings_count_2: z.number().optional(),
  ratings_count_3: z.number().optional(),
  ratings_count_4: z.number().optional(),
  ratings_count_5: z.number().optional(),
});

// Schéma pour la réponse de recherche Open Library
export const OpenLibrarySearchResponseSchema = z.object({
  numFound: z.number(),
  start: z.number(),
  numFoundExact: z.boolean().optional(),
  docs: z.array(OpenLibraryDocSchema),
  num_found: z.number().optional(),
  q: z.string().optional(),
  offset: z.number().optional(),
});

// Schéma pour les détails d'un livre (Work)
export const OpenLibraryWorkSchema = z.object({
  key: z.string(),
  type: z.object({
    key: z.string(),
  }),
  title: z.string(),
  subtitle: z.string().optional(),
  authors: z.array(z.object({
    author: z.object({
      key: z.string(),
    }),
    type: z.object({
      key: z.string(),
    }),
  })).optional(),
  description: z.union([z.string(), z.object({
    type: z.string(),
    value: z.string(),
  })]).optional(),
  covers: z.array(z.number()).optional(),
  subject_places: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  subject_people: z.array(z.string()).optional(),
  subject_times: z.array(z.string()).optional(),
  location: z.string().optional(),
  latest_revision: z.number().optional(),
  revision: z.number().optional(),
  created: z.object({
    type: z.string(),
    value: z.string(),
  }).optional(),
  last_modified: z.object({
    type: z.string(),
    value: z.string(),
  }).optional(),
});

// Schéma pour les détails d'un auteur
export const OpenLibraryAuthorSchema = z.object({
  key: z.string(),
  type: z.object({
    key: z.string(),
  }),
  name: z.string(),
  personal_name: z.string().optional(),
  alternate_names: z.array(z.string()).optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  bio: z.union([z.string(), z.object({
    type: z.string(),
    value: z.string(),
  })]).optional(),
  location: z.string().optional(),
  wikipedia: z.string().optional(),
  links: z.array(z.object({
    title: z.string(),
    url: z.string(),
    type: z.object({
      key: z.string(),
    }),
  })).optional(),
  photos: z.array(z.number()).optional(),
  latest_revision: z.number().optional(),
  revision: z.number().optional(),
  created: z.object({
    type: z.string(),
    value: z.string(),
  }).optional(),
  last_modified: z.object({
    type: z.string(),
    value: z.string(),
  }).optional(),
});

// =============================================================================
// 🎯 INTERFACES DE DONNÉES NORMALISÉES
// =============================================================================

export interface OpenLibraryBookMetadata {
  title: string;
  subtitle?: string;
  authors: string[];
  authorKeys: string[];
  description?: string;
  publisher?: string[];
  publishDates: string[];
  firstPublishYear?: number;
  isbn: string[];
  pageCount?: number;
  subjects: string[];
  places: string[];
  persons: string[];
  times: string[];
  languages: string[];
  coverId?: number;
  coverUrl?: string;
  thumbnailUrl?: string;
  ratingsAverage?: number;
  ratingsCount?: number;
  readingCounts: {
    want_to_read: number;
    currently_reading: number;
    already_read: number;
  };
  openLibraryKey: string;
  openLibraryId: string;
  externalIds: {
    amazon?: string[];
    goodreads?: string[];
    google?: string[];
    librarything?: string[];
    wikidata?: string[];
  };
}

export interface OpenLibrarySearchResult {
  success: boolean;
  totalItems: number;
  items: OpenLibraryBookMetadata[];
  query: string;
  searchType: string;
  executionTime: number;
  source: 'open_library';
  cachedResult?: boolean;
}

export interface OpenLibrarySearchError {
  success: false;
  error: string;
  code: string;
  query: string;
  source: 'open_library';
}

// =============================================================================
// ⚡ CACHE SYSTÈME (similaire à Google Books)
// =============================================================================

interface CacheEntry {
  data: OpenLibrarySearchResult;
  timestamp: number;
  ttl: number;
}

class OpenLibraryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 45 * 60 * 1000; // 45 minutes (plus long car pas de limite d'API)

  private generateKey(query: string, params: any): string {
    return `ol_${query}_${JSON.stringify(params)}`.replace(/\s+/g, '_').toLowerCase();
  }

  set(query: string, params: any, data: OpenLibrarySearchResult, ttl?: number): void {
    const key = this.generateKey(query, params);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get(query: string, params: any): OpenLibrarySearchResult | null {
    const key = this.generateKey(query, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    const result = { ...entry.data };
    result.cachedResult = true;
    return result;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// =============================================================================
// 🔄 GESTION DES ERREURS
// =============================================================================

class OpenLibraryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'OpenLibraryError';
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// =============================================================================
// 🚀 SERVICE PRINCIPAL OPEN LIBRARY
// =============================================================================

export class OpenLibraryService {
  private config: OpenLibraryConfig;
  private cache: OpenLibraryCache;

  constructor(config?: Partial<OpenLibraryConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.cache = new OpenLibraryCache();
  }

  // =============================================================================
  // 🔍 RECHERCHE PRINCIPALE
  // =============================================================================

  async search(params: z.infer<typeof OpenLibrarySearchSchema>): Promise<OpenLibrarySearchResult> {
    const startTime = Date.now();
    
    try {
      const validatedParams = OpenLibrarySearchSchema.parse(params);
      
      // Vérifier le cache
      const cachedResult = this.cache.get(validatedParams.query, validatedParams);
      if (cachedResult) {
        return cachedResult;
      }

      // Construire l'URL de recherche
      const searchUrl = this.buildSearchUrl(validatedParams);
      
      // Exécuter la recherche avec retry
      const response = await withRetry(
        () => this.executeRequest(searchUrl),
        this.config.retryAttempts,
        this.config.retryDelay
      );

      // Parser et valider la réponse
      const parsedResponse = OpenLibrarySearchResponseSchema.parse(response);
      
      // Normaliser les données
      const normalizedBooks = await this.normalizeBooks(parsedResponse.docs);
      
      // Créer le résultat
      const result: OpenLibrarySearchResult = {
        success: true,
        totalItems: parsedResponse.numFound,
        items: normalizedBooks,
        query: validatedParams.query,
        searchType: validatedParams.searchType,
        executionTime: Date.now() - startTime,
        source: 'open_library',
      };

      // Mettre en cache
      this.cache.set(validatedParams.query, validatedParams, result);

      return result;

    } catch (error) {
      throw this.handleError(error, params.query || '');
    }
  }

  // =============================================================================
  // 📖 RECHERCHE PAR TYPE SPÉCIFIQUE
  // =============================================================================

  async searchByTitle(title: string, options?: { limit?: number; language?: string[] }): Promise<OpenLibrarySearchResult> {
    return this.search({
      query: `title:"${title}"`,
      searchType: 'title',
      limit: options?.limit || 10,
      offset: 0,
      language: options?.language,
    });
  }

  async searchByAuthor(author: string, options?: { limit?: number; language?: string[] }): Promise<OpenLibrarySearchResult> {
    return this.search({
      query: `author:"${author}"`,
      searchType: 'author',
      limit: options?.limit || 10,
      offset: 0,
      language: options?.language,
    });
  }

  async searchByISBN(isbn: string): Promise<OpenLibrarySearchResult> {
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    
    return this.search({
      query: `isbn:${cleanIsbn}`,
      searchType: 'isbn',
      limit: 1,
      offset: 0,
    });
  }

  async searchBySubject(subject: string, options?: { limit?: number; sort?: 'new' | 'old' | 'rating' }): Promise<OpenLibrarySearchResult> {
    return this.search({
      query: subject,
      searchType: 'subject',
      subject,
      limit: options?.limit || 10,
      offset: 0,
      sort: options?.sort,
    });
  }

  async searchGeneral(query: string, options?: { 
    limit?: number; 
    language?: string[];
    sort?: 'new' | 'old' | 'rating';
  }): Promise<OpenLibrarySearchResult> {
    return this.search({
      query,
      searchType: 'general',
      limit: options?.limit || 10,
      offset: 0,
      language: options?.language,
      sort: options?.sort,
    });
  }

  // =============================================================================
  // 🔍 RECHERCHE ENRICHIE AVEC WORKS API
  // =============================================================================

  async searchWithEnrichedData(params: z.infer<typeof OpenLibrarySearchSchema>): Promise<OpenLibrarySearchResult> {
    const startTime = Date.now();
    
    try {
      // Effectuer la recherche de base
      const searchResult = await this.search(params);
      
      // Enrichir les résultats avec l'API Works (en parallèle, limitée aux 5 premiers)
      const enrichmentPromises = searchResult.items.slice(0, 5).map(async (item) => {
        try {
          const workDetails = await this.getWorkById(item.openLibraryId);
          if (workDetails && workDetails.description && workDetails.description.length > (item.description?.length || 0)) {
            // Fusionner les données enrichies
            return {
              ...item,
              description: workDetails.description,
              subjects: [...(item.subjects || []), ...(workDetails.subjects || [])].slice(0, 10), // Limiter à 10
            };
          }
        } catch (error) {
          // En cas d'erreur, garder l'item original
        }
        return item;
      });

      const enrichedItems = await Promise.all(enrichmentPromises);
      
      // Remplacer les 5 premiers items par les versions enrichies
      searchResult.items.splice(0, 5, ...enrichedItems);
      
      return {
        ...searchResult,
        executionTime: Date.now() - startTime,
      };

    } catch (error) {
      throw this.handleError(error, params.query || '');
    }
  }

  // =============================================================================
  // 📚 RÉCUPÉRATION DE MÉTADONNÉES COMPLÈTES
  // =============================================================================

  async getWorkById(openLibraryId: string): Promise<OpenLibraryBookMetadata | null> {
    try {
      const workKey = openLibraryId.startsWith('/works/') ? openLibraryId : `/works/${openLibraryId}`;
      const url = `${this.config.baseUrl}${workKey}.json`;
      
      const response = await withRetry(
        () => this.executeRequest(url),
        this.config.retryAttempts,
        this.config.retryDelay
      );

      const work = OpenLibraryWorkSchema.parse(response);
      return await this.normalizeWork(work);

    } catch (error) {
      if (error instanceof OpenLibraryError && error.statusCode === 404) {
        return null;
      }
      throw this.handleError(error, openLibraryId);
    }
  }

  async getAuthorById(authorKey: string): Promise<any> {
    try {
      const key = authorKey.startsWith('/authors/') ? authorKey : `/authors/${authorKey}`;
      const url = `${this.config.baseUrl}${key}.json`;
      
      const response = await withRetry(
        () => this.executeRequest(url),
        this.config.retryAttempts,
        this.config.retryDelay
      );

      return OpenLibraryAuthorSchema.parse(response);

    } catch (error) {
      return null; // Auteur non trouvé ou erreur
    }
  }

  // =============================================================================
  // 🖼️ AMÉLIORATION DE LA QUALITÉ DES IMAGES
  // =============================================================================

  private enhanceOpenLibraryImageUrl(coverId: number, type: 'cover' | 'thumbnail'): string {
    // Open Library propose différentes tailles: S (Small), M (Medium), L (Large)
    // Pour optimiser la qualité, on utilise L pour les covers et M pour les thumbnails
    const size = type === 'cover' ? 'L' : 'M';
    
    // Construire l'URL optimisée
    return `${this.config.coversUrl}/b/id/${coverId}-${size}.jpg?default=false`;
  }

  private selectBestIsbn(isbns: string[]): string | undefined {
    // Préférer ISBN-13, puis ISBN-10
    // Filtrer les ISBNs valides (longueur appropriée)
    const validIsbns = isbns.filter(isbn => {
      const clean = isbn.replace(/[-\s]/g, '');
      return clean.length === 10 || clean.length === 13;
    });
    
    if (validIsbns.length === 0) return undefined;
    
    // Préférer ISBN-13
    const isbn13 = validIsbns.find(isbn => {
      const clean = isbn.replace(/[-\s]/g, '');
      return clean.length === 13;
    });
    
    if (isbn13) return isbn13;
    
    // Fallback vers ISBN-10
    return validIsbns[0];
  }

  // =============================================================================
  // 🔧 MÉTHODES PRIVÉES - CONSTRUCTION D'URL
  // =============================================================================

  private buildSearchUrl(params: z.infer<typeof OpenLibrarySearchSchema>): string {
    const baseUrl = `${this.config.baseUrl}/search.json`;
    const searchParams = new URLSearchParams();

    // Construire la requête selon le type de recherche
    let query = params.query;
    switch (params.searchType) {
      case 'title':
        query = params.query.includes('title:') ? params.query : `title:"${params.query}"`;
        break;
      case 'author':
        query = params.query.includes('author:') ? params.query : `author:"${params.query}"`;
        break;
      case 'isbn':
        query = params.query.includes('isbn:') ? params.query : `isbn:${params.query.replace(/[-\s]/g, '')}`;
        break;
      case 'subject':
        query = params.subject || params.query;
        break;
      default:
        query = params.query;
    }

    searchParams.set('q', query);
    searchParams.set('limit', params.limit.toString());
    searchParams.set('offset', params.offset.toString());

    if (params.sort) {
      searchParams.set('sort', params.sort);
    }

    if (params.language && params.language.length > 0) {
      searchParams.set('language', params.language.join(','));
    }

    if (params.publisher) {
      searchParams.set('publisher', params.publisher);
    }

    if (params.first_publish_year) {
      searchParams.set('first_publish_year', params.first_publish_year);
    }

    return `${baseUrl}?${searchParams.toString()}`;
  }

  // =============================================================================
  // 🌐 EXÉCUTION DE REQUÊTE HTTP
  // =============================================================================

  private async executeRequest(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Booky/1.0 (Open Library Integration)',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new OpenLibraryError(
          `Open Library API request failed: ${response.statusText}`,
          'API_REQUEST_FAILED',
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof OpenLibraryError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenLibraryError(
          'Open Library API request timeout',
          'REQUEST_TIMEOUT',
          408
        );
      }

      throw new OpenLibraryError(
        'Network error during Open Library API request',
        'NETWORK_ERROR',
        0,
        error as Error
      );
    }
  }

  // =============================================================================
  // 🔄 NORMALISATION DES DONNÉES
  // =============================================================================

  private async normalizeBooks(docs: z.infer<typeof OpenLibraryDocSchema>[]): Promise<OpenLibraryBookMetadata[]> {
    const normalizedBooks: OpenLibraryBookMetadata[] = [];
    
    for (const doc of docs) {
      try {
        const normalized = await this.normalizeDoc(doc);
        normalizedBooks.push(normalized);
      } catch (error) {
        console.warn(`Erreur lors de la normalisation du document ${doc.key}:`, error);
      }
    }
    
    return normalizedBooks;
  }

  private async normalizeDoc(doc: z.infer<typeof OpenLibraryDocSchema>): Promise<OpenLibraryBookMetadata> {
    // Extraire l'ID Open Library
    const openLibraryId = doc.key.replace('/works/', '');
    
    // Améliorer la génération des URLs d'images avec multiples sources et résolution optimisée
    let coverUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    
    if (doc.cover_i) {
      // Utiliser l'API Covers d'Open Library avec optimisation de qualité
      coverUrl = this.enhanceOpenLibraryImageUrl(doc.cover_i, 'cover');
      thumbnailUrl = this.enhanceOpenLibraryImageUrl(doc.cover_i, 'thumbnail');
    } else if (doc.isbn && doc.isbn.length > 0) {
      // Fallback: essayer de récupérer la couverture par ISBN avec le meilleur ISBN disponible
      const bestIsbn = this.selectBestIsbn(doc.isbn);
      if (bestIsbn) {
        const cleanIsbn = bestIsbn.replace(/[-\s]/g, '');
        coverUrl = `${this.config.coversUrl}/b/isbn/${cleanIsbn}-L.jpg`;
        thumbnailUrl = `${this.config.coversUrl}/b/isbn/${cleanIsbn}-M.jpg`;
      }
    } else if (doc.edition_key && doc.edition_key.length > 0) {
      // Fallback secondaire: utiliser l'edition_key
      const editionId = doc.edition_key[0];
      coverUrl = `${this.config.coversUrl}/b/olid/${editionId}-L.jpg`;
      thumbnailUrl = `${this.config.coversUrl}/b/olid/${editionId}-M.jpg`;
    }
    
    // Améliorer l'extraction de la description
    let description: string | undefined;
    
    // Normaliser les ISBNs avec validation
    const isbns = doc.isbn?.filter(isbn => isbn && isbn.length >= 10) || [];
    
    return {
      title: doc.title,
      authors: doc.author_name || [],
      authorKeys: doc.author_key || [],
      description,
      publisher: doc.publisher,
      publishDates: doc.publish_date || [],
      firstPublishYear: doc.first_publish_year,
      isbn: isbns,
      pageCount: doc.number_of_pages_median,
      subjects: doc.subject || [],
      places: doc.place || [],
      persons: doc.person || [],
      times: doc.time || [],
      languages: doc.language || [],
      coverId: doc.cover_i,
      coverUrl,
      thumbnailUrl,
      ratingsAverage: doc.ratings_average,
      ratingsCount: doc.ratings_count,
      readingCounts: {
        want_to_read: doc.want_to_read_count || 0,
        currently_reading: doc.currently_reading_count || 0,
        already_read: doc.already_read_count || 0,
      },
      openLibraryKey: doc.key,
      openLibraryId,
      externalIds: {
        amazon: doc.id_amazon,
        goodreads: doc.id_goodreads,
        google: doc.id_google,
        librarything: doc.id_librarything,
        wikidata: doc.id_wikidata,
      },
    };
  }

  private async normalizeWork(work: z.infer<typeof OpenLibraryWorkSchema>): Promise<OpenLibraryBookMetadata> {
    // Récupérer les noms des auteurs
    const authors: string[] = [];
    const authorKeys: string[] = [];
    
    if (work.authors) {
      for (const authorRef of work.authors) {
        authorKeys.push(authorRef.author.key);
        
        // Essayer de récupérer le nom de l'auteur
        try {
          const author = await this.getAuthorById(authorRef.author.key);
          if (author && author.name) {
            authors.push(author.name);
          }
        } catch (error) {
          // Ignorer les erreurs d'auteur
        }
      }
    }
    
    // Traiter la description
    let description: string | undefined;
    if (work.description) {
      if (typeof work.description === 'string') {
        description = work.description;
      } else if (work.description && typeof work.description === 'object' && 'value' in work.description) {
        description = work.description.value;
      }
    }
    
    // Générer les URLs d'images avec optimisation de qualité
    let coverUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    
    if (work.covers && work.covers[0]) {
      coverUrl = this.enhanceOpenLibraryImageUrl(work.covers[0], 'cover');
      thumbnailUrl = this.enhanceOpenLibraryImageUrl(work.covers[0], 'thumbnail');
    }
    
    const openLibraryId = work.key.replace('/works/', '');
    
    return {
      title: work.title,
      subtitle: work.subtitle,
      authors,
      authorKeys,
      description,
      publisher: [],
      publishDates: [],
      pageCount: undefined,
      subjects: work.subjects || [],
      places: work.subject_places || [],
      persons: work.subject_people || [],
      times: work.subject_times || [],
      languages: [],
      isbn: [],
      coverId: work.covers?.[0],
      coverUrl,
      thumbnailUrl,
      readingCounts: {
        want_to_read: 0,
        currently_reading: 0,
        already_read: 0,
      },
      openLibraryKey: work.key,
      openLibraryId,
      externalIds: {},
    };
  }

  // =============================================================================
  // ⚠️ GESTION DES ERREURS
  // =============================================================================

  private handleError(error: unknown, query: string): OpenLibraryError {
    if (error instanceof OpenLibraryError) {
      return error;
    }

    if (error instanceof z.ZodError) {
      return new OpenLibraryError(
        'Invalid response format from Open Library API',
        'INVALID_RESPONSE_FORMAT',
        0,
        error
      );
    }

    return new OpenLibraryError(
      'Unknown error occurred during Open Library API request',
      'UNKNOWN_ERROR',
      0,
      error as Error
    );
  }

  // =============================================================================
  // 🧹 MÉTHODES UTILITAIRES
  // =============================================================================

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size();
  }

  cleanupCache(): void {
    this.cache.cleanup();
  }

  getConfig(): OpenLibraryConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<OpenLibraryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// =============================================================================
// 📤 INSTANCE SINGLETON POUR L'APPLICATION
// =============================================================================

let openLibraryServiceInstance: OpenLibraryService | null = null;

export function getOpenLibraryService(): OpenLibraryService {
  if (!openLibraryServiceInstance) {
    openLibraryServiceInstance = new OpenLibraryService();
  }
  return openLibraryServiceInstance;
}

export { OpenLibraryError };