// =============================================================================
// 📚 SERVICE GOOGLE BOOKS API
// =============================================================================
// Intégration complète avec l'API Google Books pour la recherche et l'import
// de métadonnées de livres avec gestion d'erreurs et cache

import { z } from "zod";

// =============================================================================
// 🔧 CONFIGURATION ET TYPES
// =============================================================================

export interface GoogleBooksConfig {
  apiKey: string;
  baseUrl: string;
  maxResults: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const defaultConfig: GoogleBooksConfig = {
  apiKey: process.env.GOOGLE_BOOKS_API_KEY || '',
  baseUrl: 'https://www.googleapis.com/books/v1',
  maxResults: 40,
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// =============================================================================
// 📋 SCHÉMAS DE VALIDATION GOOGLE BOOKS
// =============================================================================

// Schéma pour les paramètres de recherche
export const GoogleBooksSearchSchema = z.object({
  query: z.string().min(1, "La requête de recherche est obligatoire"),
  searchType: z.enum(['title', 'author', 'isbn', 'intitle', 'inauthor', 'inpublisher', 'subject', 'general']).default('general'),
  maxResults: z.number().min(1).max(40).default(10),
  startIndex: z.number().min(0).default(0),
  langRestrict: z.string().optional(),
  orderBy: z.enum(['newest', 'relevance']).default('relevance'),
  printType: z.enum(['all', 'books', 'magazines']).default('books'),
});

// Schéma pour la réponse de l'API Google Books
export const GoogleBooksVolumeSchema = z.object({
  kind: z.string(),
  id: z.string(),
  etag: z.string().optional(),
  selfLink: z.string().optional(),
  volumeInfo: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    authors: z.array(z.string()).optional(),
    publisher: z.string().optional(),
    publishedDate: z.string().optional(),
    description: z.string().optional(),
    industryIdentifiers: z.array(z.object({
      type: z.string(),
      identifier: z.string(),
    })).optional(),
    readingModes: z.object({
      text: z.boolean(),
      image: z.boolean(),
    }).optional(),
    pageCount: z.number().optional(),
    printType: z.string().optional(),
    categories: z.array(z.string()).optional(),
    averageRating: z.number().optional(),
    ratingsCount: z.number().optional(),
    maturityRating: z.string().optional(),
    allowAnonLogging: z.boolean().optional(),
    contentVersion: z.string().optional(),
    panelizationSummary: z.object({
      containsEpubBubbles: z.boolean(),
      containsImageBubbles: z.boolean(),
    }).optional(),
    imageLinks: z.object({
      smallThumbnail: z.string().optional(),
      thumbnail: z.string().optional(),
      small: z.string().optional(),
      medium: z.string().optional(),
      large: z.string().optional(),
      extraLarge: z.string().optional(),
    }).optional(),
    language: z.string().optional(),
    previewLink: z.string().optional(),
    infoLink: z.string().optional(),
    canonicalVolumeLink: z.string().optional(),
  }),
  saleInfo: z.object({
    country: z.string(),
    saleability: z.string(),
    isEbook: z.boolean(),
    listPrice: z.object({
      amount: z.number(),
      currencyCode: z.string(),
    }).optional(),
    retailPrice: z.object({
      amount: z.number(),
      currencyCode: z.string(),
    }).optional(),
    buyLink: z.string().optional(),
  }).optional(),
  accessInfo: z.object({
    country: z.string(),
    viewability: z.string(),
    embeddable: z.boolean(),
    publicDomain: z.boolean(),
    textToSpeechPermission: z.string(),
    epub: z.object({
      isAvailable: z.boolean(),
      acsTokenLink: z.string().optional(),
    }),
    pdf: z.object({
      isAvailable: z.boolean(),
      acsTokenLink: z.string().optional(),
    }),
    webReaderLink: z.string(),
    accessViewStatus: z.string(),
    quoteSharingAllowed: z.boolean(),
  }).optional(),
  searchInfo: z.object({
    textSnippet: z.string().optional(),
  }).optional(),
});

export const GoogleBooksResponseSchema = z.object({
  kind: z.string(),
  totalItems: z.number(),
  items: z.array(GoogleBooksVolumeSchema).optional(),
});

// =============================================================================
// 🎯 INTERFACES DE DONNÉES NORMALISÉES
// =============================================================================

export interface BookMetadata {
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  isbn10?: string;
  isbn13?: string;
  pageCount?: number;
  categories: string[];
  language?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  averageRating?: number;
  ratingsCount?: number;
  previewLink?: string;
  infoLink?: string;
  googleBooksId: string;
}

export interface SearchResult {
  success: boolean;
  totalItems: number;
  items: BookMetadata[];
  query: string;
  searchType: string;
  executionTime: number;
  source: 'google_books';
  cachedResult?: boolean;
}

export interface SearchError {
  success: false;
  error: string;
  code: string;
  query: string;
  source: 'google_books';
}

// =============================================================================
// ⚡ CACHE SYSTÈME
// =============================================================================

interface CacheEntry {
  data: SearchResult;
  timestamp: number;
  ttl: number;
}

class GoogleBooksCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 30 * 60 * 1000; // 30 minutes

  private generateKey(query: string, params: any): string {
    return `gb_${query}_${JSON.stringify(params)}`.replace(/\s+/g, '_').toLowerCase();
  }

  set(query: string, params: any, data: SearchResult, ttl?: number): void {
    const key = this.generateKey(query, params);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get(query: string, params: any): SearchResult | null {
    const key = this.generateKey(query, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Marquer comme résultat mis en cache
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
// 🔄 GESTION DES ERREURS ET RETRY
// =============================================================================

class GoogleBooksError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'GoogleBooksError';
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

      // Attendre avant le prochain essai avec backoff exponentiel
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// =============================================================================
// 🚀 SERVICE PRINCIPAL GOOGLE BOOKS
// =============================================================================

export class GoogleBooksService {
  private config: GoogleBooksConfig;
  private cache: GoogleBooksCache;

  constructor(config?: Partial<GoogleBooksConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.cache = new GoogleBooksCache();

    if (!this.config.apiKey) {
      throw new GoogleBooksError(
        'Google Books API key is required',
        'MISSING_API_KEY'
      );
    }
  }

  // =============================================================================
  // 🔍 RECHERCHE PRINCIPALE
  // =============================================================================

  async search(params: z.infer<typeof GoogleBooksSearchSchema>): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Valider les paramètres
      const validatedParams = GoogleBooksSearchSchema.parse(params);
      
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
      const parsedResponse = GoogleBooksResponseSchema.parse(response);
      
      // Normaliser les données
      const normalizedBooks = this.normalizeBooks(parsedResponse.items || []);
      
      // Créer le résultat
      const result: SearchResult = {
        success: true,
        totalItems: parsedResponse.totalItems,
        items: normalizedBooks,
        query: validatedParams.query,
        searchType: validatedParams.searchType,
        executionTime: Date.now() - startTime,
        source: 'google_books',
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

  async searchByTitle(title: string, options?: { maxResults?: number; language?: string }): Promise<SearchResult> {
    return this.search({
      query: title,
      searchType: 'intitle',
      maxResults: options?.maxResults || 10,
      startIndex: 0,
      orderBy: 'relevance',
      printType: 'books',
      langRestrict: options?.language,
    });
  }

  async searchByAuthor(author: string, options?: { maxResults?: number; language?: string }): Promise<SearchResult> {
    return this.search({
      query: author,
      searchType: 'inauthor',
      maxResults: options?.maxResults || 10,
      startIndex: 0,
      orderBy: 'relevance',
      printType: 'books',
      langRestrict: options?.language,
    });
  }

  async searchByISBN(isbn: string): Promise<SearchResult> {
    // Nettoyer l'ISBN
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    
    return this.search({
      query: `isbn:${cleanIsbn}`,
      searchType: 'isbn',
      maxResults: 1,
      startIndex: 0,
      orderBy: 'relevance',
      printType: 'books',
    });
  }

  async searchGeneral(query: string, options?: { 
    maxResults?: number; 
    language?: string; 
    orderBy?: 'newest' | 'relevance' 
  }): Promise<SearchResult> {
    return this.search({
      query,
      searchType: 'general',
      maxResults: options?.maxResults || 10,
      startIndex: 0,
      orderBy: options?.orderBy || 'relevance',
      printType: 'books',
      langRestrict: options?.language,
    });
  }

  // =============================================================================
  // 📚 RÉCUPÉRATION DE MÉTADONNÉES COMPLÈTES
  // =============================================================================

  async getBookById(googleBooksId: string): Promise<BookMetadata | null> {
    try {
      const url = `${this.config.baseUrl}/volumes/${googleBooksId}?key=${this.config.apiKey}`;
      
      const response = await withRetry(
        () => this.executeRequest(url),
        this.config.retryAttempts,
        this.config.retryDelay
      );

      const volume = GoogleBooksVolumeSchema.parse(response);
      return this.normalizeBook(volume);

    } catch (error) {
      if (error instanceof GoogleBooksError && error.statusCode === 404) {
        return null;
      }
      throw this.handleError(error, googleBooksId);
    }
  }

  // =============================================================================
  // 🖼️ AMÉLIORATION DE LA QUALITÉ DES IMAGES
  // =============================================================================

  private enhanceImageUrl(imageUrl?: string, type: 'full' | 'thumbnail' = 'full'): string | undefined {
    if (!imageUrl) return undefined;

    try {
      const url = new URL(imageUrl);
      
      // Paramètres pour améliorer la qualité des images Google Books
      if (type === 'full') {
        // Pour les images principales - haute résolution
        url.searchParams.set('zoom', '1');
        url.searchParams.set('edge', 'curl');
        url.searchParams.set('source', 'gbs_api');
        
        // Remplacer les paramètres de taille s'ils existent
        if (url.searchParams.has('w')) {
          url.searchParams.set('w', '512');
        }
        if (url.searchParams.has('h')) {
          url.searchParams.set('h', '512');
        }
        
        // Forcer HTTPS pour la sécurité
        url.protocol = 'https:';
        
        // Essayer de remplacer l'URL avec une version de meilleure qualité
        let enhancedUrl = url.toString();
        
        // Si c'est une image Google Books, essayer d'améliorer l'URL
        if (enhancedUrl.includes('books.google.com') || enhancedUrl.includes('books.googleusercontent.com')) {
          // Remplacer les paramètres de taille courants par des versions plus grandes
          enhancedUrl = enhancedUrl.replace(/&w=\d+/, '&w=512');
          enhancedUrl = enhancedUrl.replace(/&h=\d+/, '&h=512');
          enhancedUrl = enhancedUrl.replace(/&zoom=\d+/, '&zoom=1');
          
          // Si aucun paramètre de taille n'existe, les ajouter
          if (!enhancedUrl.includes('w=') && !enhancedUrl.includes('h=')) {
            const separator = enhancedUrl.includes('?') ? '&' : '?';
            enhancedUrl += `${separator}w=512&h=512&zoom=1&edge=curl`;
          }
        }
        
        return enhancedUrl;
        
      } else {
        // Pour les miniatures - résolution moyenne
        url.searchParams.set('zoom', '1');
        url.searchParams.set('edge', 'curl');
        
        if (url.searchParams.has('w')) {
          url.searchParams.set('w', '256');
        }
        if (url.searchParams.has('h')) {
          url.searchParams.set('h', '256');
        }
        
        url.protocol = 'https:';
        return url.toString();
      }
      
    } catch (error) {
      // Si on ne peut pas parser l'URL, retourner l'original
      console.warn('Failed to enhance image URL:', error);
      return imageUrl;
    }
  }

  // =============================================================================
  // 🔧 MÉTHODES PRIVÉES - CONSTRUCTION D'URL
  // =============================================================================

  private buildSearchUrl(params: z.infer<typeof GoogleBooksSearchSchema>): string {
    const baseUrl = `${this.config.baseUrl}/volumes`;
    const searchParams = new URLSearchParams();

    // Construire la requête selon le type de recherche
    let query = params.query;
    switch (params.searchType) {
      case 'title':
      case 'intitle':
        query = `intitle:"${params.query}"`;
        break;
      case 'author':
      case 'inauthor':
        query = `inauthor:"${params.query}"`;
        break;
      case 'isbn':
        query = params.query.startsWith('isbn:') ? params.query : `isbn:${params.query}`;
        break;
      case 'inpublisher':
        query = `inpublisher:"${params.query}"`;
        break;
      case 'subject':
        query = `subject:"${params.query}"`;
        break;
      default:
        query = params.query;
    }

    searchParams.set('q', query);
    searchParams.set('key', this.config.apiKey);
    searchParams.set('maxResults', params.maxResults.toString());
    searchParams.set('startIndex', params.startIndex.toString());
    searchParams.set('orderBy', params.orderBy);
    searchParams.set('printType', params.printType);

    if (params.langRestrict) {
      searchParams.set('langRestrict', params.langRestrict);
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
          'User-Agent': 'Booky/1.0 (Google Books Integration)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new GoogleBooksError(
          `Google Books API request failed: ${response.statusText}`,
          'API_REQUEST_FAILED',
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof GoogleBooksError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GoogleBooksError(
          'Google Books API request timeout',
          'REQUEST_TIMEOUT',
          408
        );
      }

      throw new GoogleBooksError(
        'Network error during Google Books API request',
        'NETWORK_ERROR',
        0,
        error as Error
      );
    }
  }

  // =============================================================================
  // 🔄 NORMALISATION DES DONNÉES
  // =============================================================================

  private normalizeBooks(volumes: z.infer<typeof GoogleBooksVolumeSchema>[]): BookMetadata[] {
    return volumes.map(volume => this.normalizeBook(volume));
  }

  private normalizeBook(volume: z.infer<typeof GoogleBooksVolumeSchema>): BookMetadata {
    const { volumeInfo } = volume;
    
    // Extraire les ISBNs
    let isbn10: string | undefined;
    let isbn13: string | undefined;
    
    if (volumeInfo.industryIdentifiers) {
      for (const identifier of volumeInfo.industryIdentifiers) {
        if (identifier.type === 'ISBN_10') {
          isbn10 = identifier.identifier;
        } else if (identifier.type === 'ISBN_13') {
          isbn13 = identifier.identifier;
        }
      }
    }

    // Choisir la meilleure image disponible et améliorer la qualité
    let imageUrl: string | undefined;
    let thumbnailUrl: string | undefined;
    
    if (volumeInfo.imageLinks) {
      // Préférer les images de haute qualité
      const baseImageUrl = volumeInfo.imageLinks.large || 
                           volumeInfo.imageLinks.medium || 
                           volumeInfo.imageLinks.small || 
                           volumeInfo.imageLinks.thumbnail;
      
      // Améliorer la qualité de l'image en modifiant les paramètres d'URL
      imageUrl = this.enhanceImageUrl(baseImageUrl);
      
      const baseThumbnailUrl = volumeInfo.imageLinks.thumbnail || 
                               volumeInfo.imageLinks.smallThumbnail;
      
      thumbnailUrl = this.enhanceImageUrl(baseThumbnailUrl, 'thumbnail');
    }

    // Normaliser la date de publication
    let publishedDate: string | undefined;
    if (volumeInfo.publishedDate) {
      // Essayer de parser la date et la formater en ISO
      try {
        const date = new Date(volumeInfo.publishedDate);
        if (!isNaN(date.getTime())) {
          publishedDate = date.toISOString().split('T')[0];
        } else {
          publishedDate = volumeInfo.publishedDate;
        }
      } catch {
        publishedDate = volumeInfo.publishedDate;
      }
    }

    return {
      title: volumeInfo.title || 'Titre inconnu',
      subtitle: volumeInfo.subtitle,
      authors: volumeInfo.authors || [],
      publisher: volumeInfo.publisher,
      publishedDate,
      description: volumeInfo.description,
      isbn10,
      isbn13,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories || [],
      language: volumeInfo.language,
      imageUrl,
      thumbnailUrl,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      googleBooksId: volume.id,
    };
  }

  // =============================================================================
  // ⚠️ GESTION DES ERREURS
  // =============================================================================

  private handleError(error: unknown, query: string): GoogleBooksError {
    if (error instanceof GoogleBooksError) {
      return error;
    }

    if (error instanceof z.ZodError) {
      return new GoogleBooksError(
        'Invalid response format from Google Books API',
        'INVALID_RESPONSE_FORMAT',
        0,
        error
      );
    }

    return new GoogleBooksError(
      'Unknown error occurred during Google Books API request',
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

  getConfig(): GoogleBooksConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<GoogleBooksConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// =============================================================================
// 📤 INSTANCE SINGLETON POUR L'APPLICATION
// =============================================================================

let googleBooksServiceInstance: GoogleBooksService | null = null;

export function getGoogleBooksService(): GoogleBooksService {
  if (!googleBooksServiceInstance) {
    googleBooksServiceInstance = new GoogleBooksService();
  }
  return googleBooksServiceInstance;
}

export { GoogleBooksError };