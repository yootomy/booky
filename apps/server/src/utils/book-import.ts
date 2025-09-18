// =============================================================================
// 📖 UTILITAIRES D'IMPORT DE MÉTADONNÉES DE LIVRES
// =============================================================================
// Logique pour importer automatiquement des métadonnées depuis les APIs externes
// et les convertir au format interne de l'application

import { z } from "zod";
import { GoogleBooksService, BookMetadata, getGoogleBooksService } from "@/services/google-books.service";
import { OpenLibraryService, OpenLibraryBookMetadata, getOpenLibraryService } from "@/services/open-library.service";
import { createBookSchema } from "@/schemas/book";
import { db } from "@/utils/db";

// =============================================================================
// 📋 SCHÉMAS ET INTERFACES
// =============================================================================

export const ImportOptionsSchema = z.object({
  // Options de source de données
  preferredSource: z.enum(['google_books', 'open_library', 'auto']).default('auto'),
  
  // Options de recherche
  searchQuery: z.string().min(1, "La requête de recherche est obligatoire"),
  searchType: z.enum(['title', 'author', 'isbn', 'general']).default('general'),
  
  // Options de mapping
  autoMapFields: z.boolean().default(true),
  overrideExisting: z.boolean().default(false),
  validateData: z.boolean().default(true),
  
  // Options de sauvegarde
  saveToDatabase: z.boolean().default(false),
  userId: z.string().optional(),
  
  // Options de traitement d'images
  downloadImages: z.boolean().default(true),
  optimizeImages: z.boolean().default(true),
  
  // Valeurs personnalisées pour l'import
  noteGenerale: z.number().int().min(1).max(10).optional(),
  niveauSpicy: z.number().int().min(1).max(10).optional(),
  niveauDark: z.number().int().min(1).max(10).optional(),
  niveauRomance: z.number().int().min(1).max(10).optional(),
  statut: z.enum(['LU', 'EN_COURS', 'A_LIRE']).optional(),
});

export interface ImportResult {
  success: boolean;
  source: 'google_books' | 'open_library';
  originalData: BookMetadata | OpenLibraryBookMetadata;
  mappedData: any;
  bookId?: string;
  errors: string[];
  warnings: string[];
  executionTime: number;
}

export interface BatchImportResult {
  success: boolean;
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  results: ImportResult[];
  errors: string[];
  executionTime: number;
}

// =============================================================================
// 🔄 MAPPING DES CHAMPS
// =============================================================================

interface FieldMapping {
  [key: string]: {
    source: keyof BookMetadata | keyof OpenLibraryBookMetadata | string; // Union type + fallback string
    transform?: (value: any) => any;
    required?: boolean;
    default?: any;
  };
}

const GOOGLE_BOOKS_FIELD_MAPPING: FieldMapping = {
  // Mapping vers les noms du schéma createBookSchema
  title: {
    source: 'title',
    required: true,
  },
  author: {
    source: 'authors',
    transform: (authors: string[]) => authors.join(', '),
  },
  isbn: {
    source: 'isbn13',
    transform: (isbn13: string) => isbn13 || null,
  },
  coverImage: {
    source: 'imageUrl',
  },
  officialSummary: {
    source: 'description',
  },
  publisher: {
    source: 'publisher',
  },
  publishedDate: {
    source: 'publishedDate',
    transform: (date: string) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString();
      } catch {
        return null;
      }
    },
  },
  pageCount: {
    source: 'pageCount',
  },
  language: {
    source: 'language',
    transform: (lang: string) => lang?.toLowerCase() || 'en',
  },
  googleBooksId: {
    source: 'googleBooksId',
  },
  // Champs obligatoires avec des valeurs par défaut
  status: {
    source: '__default__', // Pas de source, utilise seulement default
    default: 'a_lire',
  },
  generalRating: {
    source: 'averageRating',
    transform: (rating: number) => rating ? Math.min(10, Math.max(1, Math.round(rating * 2))) : 5,
    default: 5,
  },
  spicyLevel: {
    source: '__default__', // Pas de source
    default: 1,
  },
  darkLevel: {
    source: '__default__', // Pas de source
    default: 1,
  },
  romanceLevel: {
    source: '__default__', // Pas de source
    default: 1,
  },
  emotionalIntensity: {
    source: '__default__', // Pas de source
    default: 5,
  },
  danger: {
    source: '__default__', // Pas de source
    default: 1,
  },
  violence: {
    source: '__default__', // Pas de source
    default: 1,
  },
  originality: {
    source: '__default__', // Pas de source
    default: 5,
  },
  rhythm: {
    source: '__default__', // Pas de source
    default: 'medium_burn',
  },
  manuallyAdded: {
    source: '__default__', // Pas de source
    default: false,
  },
};

// Mapping spécifique pour Open Library  
const OPEN_LIBRARY_FIELD_MAPPING: FieldMapping = {
  // Mapping vers les noms du schéma createBookSchema
  title: {
    source: 'title',
    required: true,
  },
  author: {
    source: 'authors',
    transform: (authors: string[]) => authors.join(', '),
  },
  publisher: {
    source: 'publisher',
    transform: (publishers: string[]) => publishers?.[0] || null,
  },
  publishedDate: {
    source: 'firstPublishYear',
    transform: (year: number) => {
      if (!year) return null;
      try {
        return new Date(`${year}-01-01`).toISOString();
      } catch {
        return null;
      }
    },
  },
  officialSummary: {
    source: 'description',
  },
  isbn: {
    source: 'isbn',
    transform: (isbns: string[]) => {
      if (!isbns || isbns.length === 0) return null;
      // Préférer ISBN-13 puis ISBN-10
      const isbn13 = isbns.find(isbn => isbn.replace(/[-\s]/g, '').length === 13);
      const isbn10 = isbns.find(isbn => isbn.replace(/[-\s]/g, '').length === 10);
      return isbn13 || isbn10 || isbns[0] || null;
    },
  },
  pageCount: {
    source: 'pageCount',
  },
  language: {
    source: 'languages',
    transform: (languages: string[]) => {
      if (!languages || languages.length === 0) return 'en';
      const lang = languages[0];
      const langMap: { [key: string]: string } = {
        'eng': 'en',
        'fre': 'fr', 
        'fra': 'fr',
        'spa': 'es',
        'ger': 'de',
        'deu': 'de',
        'ita': 'it',
      };
      return langMap[lang.toLowerCase()] || lang.toLowerCase();
    },
  },
  coverImage: {
    source: 'coverUrl',
  },
  openLibraryId: {
    source: 'openLibraryId',
  },
  // Champs obligatoires avec des valeurs par défaut
  status: {
    source: '__default__', // Pas de source
    default: 'a_lire',
  },
  generalRating: {
    source: 'ratingsAverage',
    transform: (rating: number) => rating ? Math.min(10, Math.max(1, Math.round(rating * 2))) : 5,
    default: 5,
  },
  spicyLevel: {
    source: '__default__', // Pas de source
    default: 1,
  },
  darkLevel: {
    source: '__default__', // Pas de source
    default: 1,
  },
  romanceLevel: {
    source: '__default__', // Pas de source
    default: 1,
  },
  emotionalIntensity: {
    source: '__default__', // Pas de source
    default: 5,
  },
  danger: {
    source: '__default__', // Pas de source
    default: 1,
  },
  violence: {
    source: '__default__', // Pas de source
    default: 1,
  },
  originality: {
    source: '__default__', // Pas de source
    default: 5,
  },
  rhythm: {
    source: '__default__', // Pas de source
    default: 'medium_burn',
  },
  manuallyAdded: {
    source: '__default__', // Pas de source
    default: false,
  },
};

// =============================================================================
// 🛠️ UTILITAIRES DE MAPPING
// =============================================================================

export function mapBookMetadata(
  metadata: BookMetadata | OpenLibraryBookMetadata,
  mapping: FieldMapping = GOOGLE_BOOKS_FIELD_MAPPING
): Record<string, any> {
  const mappedData: Record<string, any> = {};
  
  for (const [targetField, config] of Object.entries(mapping)) {
    try {
      let value;
      
      // Gérer le cas des champs avec seulement des valeurs par défaut
      if (config.source === '__default__') {
        value = config.default;
      } else {
        value = (metadata as any)[config.source];
        
        // Appliquer la transformation si définie
        if (config.transform && value !== undefined && value !== null) {
          value = config.transform(value);
        }
        
        // Utiliser la valeur par défaut si nécessaire
        if ((value === undefined || value === null) && config.default !== undefined) {
          value = config.default;
        }
      }
      
      // Vérifier les champs obligatoires
      if (config.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Champ obligatoire manquant: ${targetField}`);
      }
      
      mappedData[targetField] = value;
    } catch (error) {
      console.warn(`Erreur lors du mapping du champ ${targetField}:`, error);
    }
  }
  
  return mappedData;
}

// =============================================================================
// 📚 SERVICE D'IMPORT PRINCIPAL
// =============================================================================

export class BookImportService {
  private googleBooksService: GoogleBooksService;
  private openLibraryService: OpenLibraryService;
  
  constructor() {
    this.googleBooksService = getGoogleBooksService();
    this.openLibraryService = getOpenLibraryService();
  }
  
  // =============================================================================
  // 🔍 IMPORT DEPUIS UNE RECHERCHE
  // =============================================================================
  
  async importFromSearch(
    query: string,
    options: z.infer<typeof ImportOptionsSchema>
  ): Promise<ImportResult> {
    const validatedOptions = ImportOptionsSchema.parse(options);
    
    // Utiliser la logique de sélection automatique de source
    return await this.importFromBestSource(query, validatedOptions);
  }
  
  // =============================================================================
  // 🤖 IMPORT AUTOMATIQUE (CHOISIT LA MEILLEURE SOURCE)
  // =============================================================================
  
  async importFromBestSource(
    query: string,
    options: z.infer<typeof ImportOptionsSchema>
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const validatedOptions = ImportOptionsSchema.parse(options);
    
    if (validatedOptions.preferredSource !== 'auto') {
      // Source préférée spécifiée
      return validatedOptions.preferredSource === 'google_books'
        ? await this.importFromGoogleBooks(query, validatedOptions)
        : await this.importFromOpenLibrary(query, validatedOptions);
    }
    
    // Stratégie automatique : essayer les deux sources et choisir la meilleure
    try {
      const [googleResult, openLibraryResult] = await Promise.allSettled([
        this.searchWithSource('google_books', query, validatedOptions),
        this.searchWithSource('open_library', query, validatedOptions),
      ]);
      
      let bestResult: ImportResult | null = null;
      let bestScore = 0;
      
      // Évaluer Google Books
      if (googleResult.status === 'fulfilled' && googleResult.value.success) {
        const score = this.scoreSearchResult(googleResult.value, 'google_books');
        if (score > bestScore) {
          bestScore = score;
          bestResult = googleResult.value;
        }
      }
      
      // Évaluer Open Library
      if (openLibraryResult.status === 'fulfilled' && openLibraryResult.value.success) {
        const score = this.scoreSearchResult(openLibraryResult.value, 'open_library');
        if (score > bestScore) {
          bestScore = score;
          bestResult = openLibraryResult.value;
        }
      }
      
      if (bestResult) {
        return bestResult;
      }
      
      // Aucun résultat trouvé
      return {
        success: false,
        source: 'google_books',
        originalData: {} as BookMetadata,
        mappedData: {},
        errors: ['Aucun livre trouvé dans les sources disponibles'],
        warnings: [],
        executionTime: Date.now() - startTime,
      };
      
    } catch (error) {
      return {
        success: false,
        source: 'google_books',
        originalData: {} as BookMetadata,
        mappedData: {},
        errors: [`Erreur lors de la recherche automatique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
        warnings: [],
        executionTime: Date.now() - startTime,
      };
    }
  }
  
  // =============================================================================
  // 📚 IMPORT DEPUIS GOOGLE BOOKS
  // =============================================================================
  
  async importFromGoogleBooks(
    query: string,
    options: z.infer<typeof ImportOptionsSchema>
  ): Promise<ImportResult> {
    return this.searchWithSource('google_books', query, options);
  }
  
  // =============================================================================
  // 📖 IMPORT DEPUIS OPEN LIBRARY
  // =============================================================================
  
  async importFromOpenLibrary(
    query: string,
    options: z.infer<typeof ImportOptionsSchema>
  ): Promise<ImportResult> {
    return this.searchWithSource('open_library', query, options);
  }
  
  // =============================================================================
  // 📖 IMPORT DEPUIS UN ID GOOGLE BOOKS
  // =============================================================================
  
  async importFromGoogleBooksId(
    googleBooksId: string,
    options: z.infer<typeof ImportOptionsSchema>
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const validatedOptions = ImportOptionsSchema.parse({ ...options, searchQuery: googleBooksId });
    
    const result: ImportResult = {
      success: false,
      source: 'google_books',
      originalData: {} as BookMetadata,
      mappedData: {},
      errors: [],
      warnings: [],
      executionTime: 0,
    };
    
    try {
      // Récupérer les métadonnées complètes
      const bookMetadata = await this.googleBooksService.getBookById(googleBooksId);
      
      if (!bookMetadata) {
        result.errors.push(`Livre non trouvé avec l'ID: ${googleBooksId}`);
        return result;
      }
      
      result.originalData = bookMetadata;
      
      // Mapper les données
      const mappedData = await this.mapAndValidateData(bookMetadata, validatedOptions);
      result.mappedData = mappedData.data;
      result.errors.push(...mappedData.errors);
      result.warnings.push(...mappedData.warnings);
      
      // Sauvegarder en base si demandé
      if (validatedOptions.saveToDatabase && mappedData.data && mappedData.errors.length === 0) {
        const savedBook = await this.saveBookToDatabase(mappedData.data, validatedOptions.userId);
        result.bookId = savedBook.id;
      }
      
      result.success = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      result.executionTime = Date.now() - startTime;
    }
    
    return result;
  }
  
  // =============================================================================
  // 📚 IMPORT PAR LOT
  // =============================================================================
  
  async importBatch(
    queries: string[],
    options: z.infer<typeof ImportOptionsSchema>
  ): Promise<BatchImportResult> {
    const startTime = Date.now();
    const validatedOptions = ImportOptionsSchema.parse(options);
    
    const result: BatchImportResult = {
      success: false,
      totalProcessed: 0,
      successfulImports: 0,
      failedImports: 0,
      results: [],
      errors: [],
      executionTime: 0,
    };
    
    try {
      for (const query of queries) {
        try {
          const importResult = await this.importFromSearch(query, validatedOptions);
          result.results.push(importResult);
          result.totalProcessed++;
          
          if (importResult.success) {
            result.successfulImports++;
          } else {
            result.failedImports++;
          }
          
          // Petite pause entre les imports pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          result.failedImports++;
          result.errors.push(`Erreur pour la requête "${query}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }
      
      result.success = result.successfulImports > 0;
      
    } catch (error) {
      result.errors.push(`Erreur générale lors de l'import par lot: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      result.executionTime = Date.now() - startTime;
    }
    
    return result;
  }
  
  // =============================================================================
  // 🔍 MÉTHODES PRIVÉES - RECHERCHE
  // =============================================================================
  
  private async searchWithSource(
    source: 'google_books' | 'open_library',
    query: string,
    options: z.infer<typeof ImportOptionsSchema>
  ): Promise<ImportResult> {
    const startTime = Date.now();
    
    const result: ImportResult = {
      success: false,
      source,
      originalData: {} as BookMetadata,
      mappedData: {},
      errors: [],
      warnings: [],
      executionTime: 0,
    };
    
    try {
      // Rechercher selon la source
      const searchResult = source === 'google_books'
        ? await this.searchBookGoogle(query, options)
        : await this.searchBookOpenLibrary(query, options);
      
      if (!searchResult.success || searchResult.items.length === 0) {
        result.errors.push(`Aucun livre trouvé sur ${source}`);
        return result;
      }
      
      // Prendre le premier résultat
      const bookMetadata = searchResult.items[0];
      result.originalData = bookMetadata;
      result.source = source;
      
      // Mapper les données selon la source
      const mapping = source === 'google_books' ? GOOGLE_BOOKS_FIELD_MAPPING : OPEN_LIBRARY_FIELD_MAPPING;
      const mappedData = await this.mapAndValidateData(bookMetadata, options, mapping);
      result.mappedData = mappedData.data;
      result.errors.push(...mappedData.errors);
      result.warnings.push(...mappedData.warnings);
      
      // Sauvegarder en base si demandé
      if (options.saveToDatabase && mappedData.data && mappedData.errors.length === 0) {
        const savedBook = await this.saveBookToDatabase(mappedData.data, options.userId);
        result.bookId = savedBook.id;
      }
      
      result.success = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Erreur lors de l'import depuis ${source}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      result.executionTime = Date.now() - startTime;
    }
    
    return result;
  }
  
  private async searchBookGoogle(
    query: string,
    options: z.infer<typeof ImportOptionsSchema>
  ) {
    switch (options.searchType) {
      case 'title':
        return await this.googleBooksService.searchByTitle(query);
      case 'author':
        return await this.googleBooksService.searchByAuthor(query);
      case 'isbn':
        return await this.googleBooksService.searchByISBN(query);
      default:
        return await this.googleBooksService.searchGeneral(query);
    }
  }
  
  private async searchBookOpenLibrary(
    query: string,
    options: z.infer<typeof ImportOptionsSchema>
  ) {
    switch (options.searchType) {
      case 'title':
        return await this.openLibraryService.searchByTitle(query);
      case 'author':
        return await this.openLibraryService.searchByAuthor(query);
      case 'isbn':
        return await this.openLibraryService.searchByISBN(query);
      default:
        return await this.openLibraryService.searchGeneral(query);
    }
  }
  
  private scoreSearchResult(result: ImportResult, source: 'google_books' | 'open_library'): number {
    let score = 0;
    
    if (!result.success || !result.originalData) return 0;
    
    const data = result.originalData;
    
    // Points pour la qualité des données
    if ('title' in data && data.title) score += 10;
    if ('authors' in data && data.authors && data.authors.length > 0) score += 8;
    if ('description' in data && data.description) score += 6;
    if ('publishedDate' in data && data.publishedDate || 'firstPublishYear' in data && data.firstPublishYear) score += 4;
    if ('pageCount' in data && data.pageCount) score += 3;
    if ('imageUrl' in data && data.imageUrl || 'coverUrl' in data && data.coverUrl) score += 5;
    
    // Points pour les identifiants
    if ('isbn13' in data && data.isbn13 || 'isbn' in data && data.isbn && data.isbn.length > 0) score += 7;
    if ('isbn10' in data && data.isbn10) score += 5;
    
    // Bonus/malus selon la source
    if (source === 'google_books') {
      score += 2; // Léger avantage à Google Books pour la qualité des métadonnées
    } else {
      score += 1; // Open Library a plus de livres mais parfois moins de détails
    }
    
    return score;
  }
  
  // =============================================================================
  // 🔄 MAPPING ET VALIDATION
  // =============================================================================
  
  private async mapAndValidateData(
    metadata: BookMetadata | OpenLibraryBookMetadata,
    options: z.infer<typeof ImportOptionsSchema>,
    mapping: FieldMapping = GOOGLE_BOOKS_FIELD_MAPPING
  ): Promise<{ data: any; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Mapper les données avec le mapping approprié
      const mappedData = mapBookMetadata(metadata, mapping);
      
      // Ajouter les champs obligatoires depuis les options
      if (options.userId) {
        mappedData.createdBy = options.userId;
      }
      
      // Override avec les valeurs personnalisées depuis les options d'import
      if (options.noteGenerale !== undefined) {
        mappedData.generalRating = options.noteGenerale;
      }
      if (options.niveauSpicy !== undefined) {
        mappedData.spicyLevel = options.niveauSpicy;
      }
      if (options.niveauDark !== undefined) {
        mappedData.darkLevel = options.niveauDark;
      }
      if (options.niveauRomance !== undefined) {
        mappedData.romanceLevel = options.niveauRomance;
      }
      if (options.statut !== undefined) {
        // Convertir les valeurs Prisma en valeurs du schéma
        const statusMap: { [key: string]: string } = {
          'LU': 'lu',
          'EN_COURS': 'en_cours', 
          'A_LIRE': 'a_lire'
        };
        mappedData.status = statusMap[options.statut] || 'a_lire';
      }
      
      // Les champs par défaut sont déjà gérés par le mapping
      
      // Valider si demandé
      if (options.validateData) {
        try {
          // Utiliser le schéma de création pour valider
          createBookSchema.parse(mappedData);
        } catch (validationError) {
          if (validationError instanceof z.ZodError) {
            errors.push(...validationError.issues.map((err: any) => 
              `Validation: ${err.path.join('.')} - ${err.message}`
            ));
          } else {
            errors.push('Erreur de validation des données');
          }
        }
      }
      
      // Vérifications et avertissements
      if (!mappedData.resume_officiel) {
        warnings.push('Aucune description disponible');
      }
      
      if (!mappedData.image_couverture) {
        warnings.push('Aucune image de couverture disponible');
      }
      
      if (!mappedData.date_publication) {
        warnings.push('Date de publication non disponible');
      }
      
      return { data: mappedData, errors, warnings };
      
    } catch (error) {
      errors.push(`Erreur lors du mapping des données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return { data: null, errors, warnings };
    }
  }
  
  // =============================================================================
  // 💾 SAUVEGARDE EN BASE DE DONNÉES
  // =============================================================================
  
  private convertSchemaFieldsToPrisma(data: any): any {
    // Conversion des noms du schéma vers les noms des colonnes Prisma
    const mapping = {
      title: 'titre',
      author: 'auteur',
      coverImage: 'image_couverture',
      officialSummary: 'resume_officiel',
      publisher: 'editeur',
      publishedDate: 'date_publication',
      pageCount: 'nombre_pages',
      language: 'langue',
      readDate: 'date_lecture',
      status: 'statut',
      generalRating: 'note_generale',
      spicyLevel: 'niveau_spicy',
      darkLevel: 'niveau_dark',
      romanceLevel: 'niveau_romance',
      emotionalIntensity: 'intensite_emotionnelle',
      personalSummary: 'resume_personnel',
      detailedReview: 'critique_detaillee',
      favoritQuotes: 'citations_favorites',
      whyYouMightLike: 'pourquoi_aimer',
      questionsAboutBook: 'questions_sur_le_livre',
      personalRecommendation: 'recommandation_personnalisee',
      googleBooksId: 'google_books_id',
      openLibraryId: 'open_library_id',
      manuallyAdded: 'ajout_manuel',
      rhythm: 'rythme',
    };
    
    const prismaData: any = {};
    
    for (const [schemaField, prismaField] of Object.entries(mapping)) {
      if (data[schemaField] !== undefined) {
        prismaData[prismaField] = data[schemaField];
      }
    }
    
    // Copier les champs qui ont le même nom
    const sameNameFields = ['isbn', 'danger', 'violence', 'createdBy'];
    for (const field of sameNameFields) {
      if (data[field] !== undefined) {
        prismaData[field] = data[field];
      }
    }
    
    // Champ avec nom différent
    if (data['originality'] !== undefined) {
      prismaData['originalite'] = data['originality'];
    }
    
    // Conversion des valeurs enum du schéma vers Prisma
    if (prismaData['statut'] !== undefined) {
      const statusMap: { [key: string]: string } = {
        'lu': 'LU',
        'en_cours': 'EN_COURS',
        'a_lire': 'A_LIRE'
      };
      prismaData['statut'] = statusMap[prismaData['statut']] || prismaData['statut'];
    }
    
    if (prismaData['rythme'] !== undefined) {
      const rhythmMap: { [key: string]: string } = {
        'slow_burn': 'SLOW_BURN',
        'medium_burn': 'MEDIUM_BURN',
        'fast_pace': 'FAST_PACE',
        'insta_love': 'INSTA_LOVE'
      };
      prismaData['rythme'] = rhythmMap[prismaData['rythme']] || prismaData['rythme'];
    }
    
    return prismaData;
  }
  
  private async saveBookToDatabase(data: any, userId?: string): Promise<{ id: string }> {
    try {
      // Ajouter l'userId si fourni (le champ s'appelle createdBy dans Prisma)
      if (userId) {
        data.createdBy = userId;
      }
      
      // Convertir les noms des champs du schéma vers les noms des colonnes Prisma
      const { randomUUID } = await import('crypto');
      const prismaData = this.convertSchemaFieldsToPrisma(data);
      
      // Ajouter les champs requis par Prisma
      prismaData.id = randomUUID();
      prismaData.date_modification = new Date();
      
      // Vérifier si le livre existe déjà (par ISBN ou Google Books ID)
      const existingBook = await db.book.findFirst({
        where: {
          OR: [
            ...(prismaData.isbn ? [{ isbn: prismaData.isbn }] : []),
            ...(prismaData.google_books_id ? [{ google_books_id: prismaData.google_books_id }] : []),
            ...(prismaData.open_library_id ? [{ open_library_id: prismaData.open_library_id }] : []),
          ],
        },
      });
      
      if (existingBook) {
        throw new Error('Ce livre existe déjà dans la base de données');
      }
      
      // Créer le livre
      const createdBook = await db.book.create({
        data: prismaData,
      });
      
      return { id: createdBook.id };
      
    } catch (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

// =============================================================================
// 🔧 UTILITAIRES D'EXPORT
// =============================================================================

export function getBookImportService(): BookImportService {
  return new BookImportService();
}

// Fonction utilitaire pour importer un livre rapidement
export async function quickImportBook(
  query: string,
  searchType: 'title' | 'author' | 'isbn' | 'general' = 'general',
  userId?: string,
  preferredSource: 'google_books' | 'open_library' | 'auto' = 'auto'
): Promise<ImportResult> {
  const importService = getBookImportService();
  
  return await importService.importFromSearch(query, {
    searchQuery: query,
    searchType,
    preferredSource,
    overrideExisting: false,
    saveToDatabase: true,
    userId,
    autoMapFields: true,
    validateData: true,
    downloadImages: true,
    optimizeImages: true,
  });
}

// Fonctions spécifiques pour chaque source
export async function importFromGoogleBooks(
  query: string,
  searchType: 'title' | 'author' | 'isbn' | 'general' = 'general',
  userId?: string
): Promise<ImportResult> {
  return quickImportBook(query, searchType, userId, 'google_books');
}

export async function importFromOpenLibrary(
  query: string,
  searchType: 'title' | 'author' | 'isbn' | 'general' = 'general',
  userId?: string
): Promise<ImportResult> {
  return quickImportBook(query, searchType, userId, 'open_library');
}

// Fonction pour importer depuis un ID Google Books
export async function importFromGoogleBooksId(
  googleBooksId: string,
  userId?: string
): Promise<ImportResult> {
  const importService = getBookImportService();
  
  return await importService.importFromGoogleBooksId(googleBooksId, {
    searchQuery: googleBooksId,
    searchType: 'isbn',
    preferredSource: 'google_books',
    overrideExisting: false,
    saveToDatabase: true,
    userId,
    autoMapFields: true,
    validateData: true,
    downloadImages: true,
    optimizeImages: true,
  });
}