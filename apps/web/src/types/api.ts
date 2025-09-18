/**
 * Types pour les réponses API du backend Booky
 * Basé sur les 47 endpoints implémentés côté serveur
 */

// ===== TYPES GÉNÉRIQUES API =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  type?: string;
  details?: ValidationError[];
  execution_time_ms?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters?: Record<string, unknown>;
  search_info?: SearchInfo;
}

export interface SearchInfo {
  total_results: number;
  search_query?: string;
  filters_applied: FilterApplied[];
  available_filters: Record<string, unknown>;
  execution_time_ms?: number;
}

export interface FilterApplied {
  field: string;
  value: string;
  label: string;
}

export interface ValidationError {
  success: false;
  error: string;
  type: string;
  details?: Array<{
    path: string[];
    message: string;
    code: string;
  }>;
}

// ===== TYPES POUR LES REQUÊTES =====

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams, SortParams {
  q?: string;
}

// ===== FILTRES POUR LES LIVRES =====

export interface BookFilters extends PaginationParams, SortParams {
  // Filtres de recherche
  q?: string;
  titre?: string;
  auteur?: string;
  isbn?: string;
  
  // Filtres par statut et dates
  statut?: BookStatus | BookStatus[];
  date_lecture_from?: string;
  date_lecture_to?: string;
  date_creation_from?: string;
  date_creation_to?: string;
  
  // Filtres par notes (1-10)
  note_generale_min?: number;
  note_generale_max?: number;
  niveau_spicy_min?: number;
  niveau_spicy_max?: number;
  niveau_dark_min?: number;
  niveau_dark_max?: number;
  niveau_romance_min?: number;
  niveau_romance_max?: number;
  
  // Filtres par métadonnées
  langue?: string | string[];
  rythme?: BookRhythm | BookRhythm[];
  editeur?: string;
  
  // Filtres par relations
  categories?: string | string[];
  tags?: string | string[];
  tag_types?: TagType | TagType[];
  
  // Filtres par saga
  sagaId?: string;
  sagaSlug?: string;
  
  // Options d'affichage
  include_categories?: boolean;
  include_tags?: boolean;
  include_user?: boolean;
  include_saga?: boolean;
  
  // Index signature pour permettre l'utilisation avec Record<string, unknown>
  [key: string]: unknown;
}

// ===== FILTRES POUR LES CATÉGORIES =====

export interface CategoryFilters extends PaginationParams, SortParams {
  q?: string;
  nom?: string;
  couleur?: string;
  est_actif?: boolean;
  include_books?: boolean;
  include_stats?: boolean;
  include_book_count?: boolean;
  
  // Index signature pour permettre l'utilisation avec Record<string, unknown>
  [key: string]: unknown;
}

// ===== FILTRES POUR LES SAGAS =====

export interface SagaFilters extends PaginationParams, SortParams {
  q?: string;
  search?: string;
  name?: string;
  status?: SagaStatus | SagaStatus[];
  include_books?: boolean;
  include_stats?: boolean;
  
  // Index signature pour permettre l'utilisation avec Record<string, unknown>
  [key: string]: unknown;
}

export interface SagaBooksFilters extends PaginationParams, SortParams {
  include_categories?: boolean;
  include_tags?: boolean;
  
  // Index signature pour permettre l'utilisation avec Record<string, unknown>
  [key: string]: unknown;
}

// ===== FILTRES POUR LES TAGS =====

export interface TagFilters extends PaginationParams, SortParams {
  q?: string;
  nom?: string;
  type?: TagType | TagType[];
  couleur?: string;
  est_favori?: boolean;
  utilisation_count_min?: number;
  include_books?: boolean;
  include_stats?: boolean;
  
  // Index signature pour permettre l'utilisation avec Record<string, unknown>
  [key: string]: unknown;
}

// ===== TYPES POUR LES STATISTIQUES =====

export interface StatsGenerales {
  total_livres: number;
  livres_lus: number;
  livres_en_cours: number;
  livres_a_lire: number;
  note_moyenne: number;
  pages_totales: number;
  pages_lues: number;
  premier_livre?: string; // Date ISO
  dernier_livre?: string; // Date ISO
  auteur_prefere?: {
    nom: string;
    nombre_livres: number;
  };
  mois_le_plus_actif?: {
    mois: string;
    nombre_livres: number;
  };
}

export interface StatsGenres {
  total_categories: number;
  categories_utilisees: number;
  distribution: Array<{
    category: {
      id: string;
      nom: string;
      couleur: string;
      icone?: string;
    };
    count: number;
    pourcentage: number;
  }>;
}

export interface StatsNotes {
  note_moyenne_generale: number;
  note_moyenne_spicy: number;
  note_moyenne_dark: number;
  note_moyenne_romance: number;
  distribution_notes: Record<string, number>;
  livres_mieux_notes: Array<{
    id: string;
    titre: string;
    auteur: string;
    note_generale: number;
  }>;
}

export interface StatsLecture {
  livres_par_mois: Array<{
    mois: string;
    count: number;
  }>;
  progression_annuelle: Array<{
    annee: number;
    total: number;
  }>;
  moyenne_pages_par_livre: number;
  temps_lecture_estime: number; // en heures
}

export interface StatsSpicyDark {
  niveau_spicy_moyen: number;
  niveau_dark_moyen: number;
  distribution_spicy: Record<number, number>;
  distribution_dark: Record<number, number>;
  livres_plus_spicy: Array<{
    id: string;
    titre: string;
    niveau_spicy: number;
  }>;
  livres_plus_dark: Array<{
    id: string;
    titre: string;
    niveau_dark: number;
  }>;
}

// ===== TYPES POUR LES EXPORTS =====

export interface ExportConfig {
  id: string;
  nom: string;
  format: 'PDF' | 'CSV' | 'JSON';
  champs_inclus: string[];
  filtres: Record<string, unknown>;
  template?: string;
  date_creation: string;
  date_modification: string;
  createdBy: string;
}

export interface ExportOptions {
  format: 'PDF' | 'CSV' | 'JSON';
  champs?: string[];
  filtres?: BookFilters;
  nom_fichier?: string;
  template?: string;
}

// ===== TYPES POUR LES APIS EXTERNES =====

export interface GoogleBooksSearchParams {
  q: string;
  startIndex?: number;
  maxResults?: number;
  orderBy?: 'relevance' | 'newest';
  langRestrict?: string;
  printType?: 'all' | 'books' | 'magazines';
}

export interface OpenLibrarySearchParams {
  q: string;
  limit?: number;
  offset?: number;
  fields?: string;
  sort?: string;
}

export interface ExternalBookResult {
  id: string;
  source: 'google_books' | 'open_library';
  titre: string;
  auteur: string;
  isbn?: string;
  image_couverture?: string;
  resume_officiel?: string;
  editeur?: string;
  date_publication?: string;
  nombre_pages?: number;
  langue?: string;
  identifiant_externe: string;
  // Nouveaux champs enrichis
  categories?: string[];
  note_moyenne?: number;
  nombre_evaluations?: number;
  subjects?: string[];
}

export interface ImportResult {
  success: boolean;
  source: 'google_books' | 'open_library';
  importType: string;
  result: {
    livre_cree?: {
      id: string;
      titre: string;
    };
    livre_existant?: {
      id: string;
      titre: string;
    };
    metadata_importees?: string[];
    erreurs?: string[];
  };
  api_execution_time: number;
}

// ===== TYPES POUR L'UPLOAD =====

export interface UploadResult {
  success: boolean;
  data?: {
    filename: string;
    url: string;
    size: number;
    type: string;
  };
  error?: string;
}

export interface UploadRecord {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  upload_date: string;
  bookId?: string;
  userId: string;
}

// ===== TYPES POUR LE DASHBOARD =====

export interface DashboardStats {
  stats_generales: StatsGenerales;
  lecture_en_cours: Array<{
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    progression?: number;
  }>;
  livres_recents: Array<{
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    date_lecture?: string;
    note_generale: number;
  }>;
  livres_mieux_notes: Array<{
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    note_generale: number;
  }>;
  wishlist: Array<{
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    date_creation: string;
  }>;
}

// ===== ENUMS (cohérents avec Prisma) =====

export enum BookStatus {
  LU = 'LU',
  EN_COURS = 'EN_COURS',
  A_LIRE = 'A_LIRE'
}

export enum BookRhythm {
  SLOW_BURN = 'SLOW_BURN',
  MEDIUM_BURN = 'MEDIUM_BURN',
  FAST_PACE = 'FAST_PACE',
  INSTA_LOVE = 'INSTA_LOVE'
}

export enum TagType {
  GENRE = 'GENRE',
  TROPE = 'TROPE',
  TRIGGER = 'TRIGGER',
  PERSONNALISE = 'PERSONNALISE'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum SagaStatus {
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  HIATUS = 'HIATUS',
  UNKNOWN = 'UNKNOWN'
}

// ===== TYPES UTILITAIRES =====

export type ApiEndpoint = 
  | 'auth'
  | 'books' 
  | 'categories' 
  | 'tags' 
  | 'dashboard'
  | 'stats'
  | 'external'
  | 'upload'
  | 'export';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  type?: string;
  statusCode: number;
  timestamp: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;