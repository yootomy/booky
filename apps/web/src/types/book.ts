/**
 * Types pour les livres - Interface complète basée sur le schéma Prisma
 * Comprend tous les champs du cahier des charges et les relations
 */

import { TagType } from './api';
import type { AuthUser } from './auth';
import type { Category } from './category';
import type { Tag } from './tag';
import type { Saga, SagaNeighbors } from './saga';

// ===== INTERFACE LIVRE PRINCIPALE =====

export interface Book {
  // Identifiants
  id: string;
  
  // Champs de base
  titre: string;
  auteur: string;
  isbn?: string;
  image_couverture?: string;
  
  // Champs API externes
  google_books_id?: string;
  open_library_id?: string;
  
  // Métadonnées
  resume_officiel?: string;
  editeur?: string;
  date_publication?: string; // ISO date string
  nombre_pages?: number;
  langue?: string;
  
  // Champs personnels
  date_lecture?: string; // ISO date string
  statut: 'LU' | 'EN_COURS' | 'A_LIRE';
  
  // Système de notation (1-10)
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  intensite_emotionnelle: number;
  danger: number;
  violence: number;
  originalite: number;
  rythme: 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';
  
  // Critiques et recommandations
  resume_personnel?: string;
  critique_detaillee?: string;
  citations_favorites?: string;
  pourquoi_aimer?: string;
  questions_sur_le_livre?: string;
  recommandation_personnalisee?: string;
  
  // Flags et métadonnées système
  ajout_manuel: boolean;
  date_creation: string; // ISO date string
  date_modification: string; // ISO date string
  
  // Saga
  sagaId?: string;
  sagaOrder?: number;
  
  // Relations
  createdBy: string;
  user?: AuthUser;
  saga?: Saga;
  sagaNeighbors?: SagaNeighbors;
  categories?: BookWithCategory[];
  tags?: BookWithTag[];
  uploads?: UploadRecord[];
}

// ===== INTERFACES DE RELATIONS =====

export interface BookWithCategory {
  id: string;
  bookId: string;
  categoryId: string;
  category: Category;
}

export interface BookWithTag {
  id: string;
  bookId: string;
  tagId: string;
  tag: Tag;
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

// ===== TYPES POUR LES FORMULAIRES =====

export interface BookCreateInput {
  // Champs obligatoires
  titre: string;
  auteur: string;
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  intensite_emotionnelle: number;
  danger: number;
  violence: number;
  originalite: number;
  rythme: 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';
  statut?: 'LU' | 'EN_COURS' | 'A_LIRE';
  
  // Champs optionnels
  isbn?: string;
  image_couverture?: string;
  google_books_id?: string;
  open_library_id?: string;
  resume_officiel?: string;
  editeur?: string;
  date_publication?: string;
  nombre_pages?: number;
  langue?: string;
  date_lecture?: string;
  resume_personnel?: string;
  critique_detaillee?: string;
  citations_favorites?: string;
  pourquoi_aimer?: string;
  questions_sur_le_livre?: string;
  recommandation_personnalisee?: string;
  ajout_manuel?: boolean;
  
  // Saga
  sagaId?: string;
  sagaOrder?: number;
  
  // Relations (IDs uniquement pour la création)
  categories?: string[];
  tags?: string[];
}

export interface BookUpdateInput extends Partial<BookCreateInput> {
  id: string;
}

// ===== TYPES POUR L'AFFICHAGE =====

export interface BookSummary {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  statut: 'LU' | 'EN_COURS' | 'A_LIRE';
  date_lecture?: string;
  date_creation: string;
  categories?: Array<{
    id: string;
    nom: string;
    couleur: string;
    icone?: string;
  }>;
  tags?: Array<{
    id: string;
    nom: string;
    couleur: string;
    type: TagType;
  }>;
}

export interface BookDetail extends Book {
  // Relations complètes pour la page de détail
  user: AuthUser;
  categories: Array<BookWithCategory>;
  tags: Array<BookWithTag>;
  uploads: UploadRecord[];
  
  // Statistiques calculées côté serveur
  stats?: {
    position_dans_bibliotheque: number;
    livres_similaires_count: number;
    tags_communs: string[];
    note_relative_auteur: number;
  };
}

// ===== TYPES POUR LA RECHERCHE =====

export interface BookSearchResult {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  statut: 'LU' | 'EN_COURS' | 'A_LIRE';
  date_lecture?: string;
  categories: Array<{
    nom: string;
    couleur: string;
  }>;
  tags: Array<{
    nom: string;
    couleur: string;
    type: TagType;
  }>;
  match_score?: number; // Score de pertinence pour la recherche
  highlight?: {
    titre?: string;
    auteur?: string;
    resume_personnel?: string;
    critique_detaillee?: string;
  };
}

// ===== TYPES POUR LES STATISTIQUES DE LIVRES =====

export interface BookStats {
  total_livres: number;
  par_statut: {
    [K in 'LU' | 'EN_COURS' | 'A_LIRE']: number;
  };
  par_note: Record<number, number>; // note (1-10) -> nombre de livres
  par_niveau_spicy: Record<number, number>;
  par_niveau_dark: Record<number, number>;
  par_niveau_romance: Record<number, number>;
  par_rythme: {
    [K in 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE']: number;
  };
  par_langue: Record<string, number>;
  par_annee_lecture: Record<string, number>;
  par_annee_publication: Record<string, number>;
  moyennes: {
    note_generale: number;
    niveau_spicy: number;
    niveau_dark: number;
    niveau_romance: number;
    intensite_emotionnelle: number;
    danger: number;
    violence: number;
    originalite: number;
    pages_par_livre: number;
  };
  extremes: {
    plus_ancien: BookSummary;
    plus_recent: BookSummary;
    mieux_note: BookSummary;
    plus_spicy: BookSummary;
    plus_dark: BookSummary;
    plus_long: BookSummary;
    plus_court: BookSummary;
  };
}

// ===== TYPES POUR L'IMPORT EXTERNE =====

export interface ExternalBookSearchResult {
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
  
  // Métadonnées de recherche
  match_score?: number;
  preview_link?: string;
  info_link?: string;
}

export interface BookImportPreview {
  source_data: ExternalBookSearchResult;
  mapped_data: Partial<BookCreateInput>;
  conflicts?: Array<{
    field: string;
    current_value?: unknown;
    new_value: unknown;
    action: 'keep' | 'replace' | 'merge';
  }>;
  validation_errors?: string[];
}

// ===== TYPES POUR LES RECOMMANDATIONS =====

export interface BookRecommendation {
  livre_recommande: BookSummary;
  raisons: string[];
  score_similarite: number;
  criteres_communs: Array<{
    type: 'category' | 'tag' | 'author' | 'rating' | 'rhythm';
    valeur: string;
    poids: number;
  }>;
}

export interface RecommendationQuery {
  base_sur?: 'livre' | 'preferences';
  livre_reference?: string; // ID du livre de référence
  preferences?: {
    categories_preferees?: string[];
    tags_preferes?: string[];
    note_minimale?: number;
    niveau_spicy_prefere?: number;
    niveau_dark_prefere?: number;
    rythme_prefere?: ('SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE')[];
    auteurs_preferes?: string[];
    langues_preferees?: string[];
  };
  limite?: number;
  exclure_deja_lus?: boolean;
}

// ===== TYPES POUR L'EXPORT =====

export interface BookExportOptions {
  format: 'PDF' | 'CSV' | 'JSON' | 'EXCEL';
  champs: Array<keyof Book>;
  inclure_relations?: {
    categories?: boolean;
    tags?: boolean;
    user?: boolean;
  };
  filtres?: {
    statuts?: ('LU' | 'EN_COURS' | 'A_LIRE')[];
    notes_min?: number;
    notes_max?: number;
    date_lecture_debut?: string;
    date_lecture_fin?: string;
    categories?: string[];
    tags?: string[];
  };
  tri?: {
    champ: keyof Book;
    ordre: 'asc' | 'desc';
  };
  template?: 'simple' | 'detaille' | 'personnalise';
  nom_fichier?: string;
}

// ===== TYPES UTILITAIRES =====

export type BookField = keyof Book;

export type BookRatingField = 
  | 'note_generale'
  | 'niveau_spicy' 
  | 'niveau_dark'
  | 'niveau_romance'
  | 'intensite_emotionnelle'
  | 'danger'
  | 'violence'
  | 'originalite';

export type BookDateField = 
  | 'date_lecture'
  | 'date_publication'
  | 'date_creation'
  | 'date_modification';

export type BookTextField = 
  | 'titre'
  | 'auteur'
  | 'isbn'
  | 'resume_officiel'
  | 'resume_personnel'
  | 'critique_detaillee'
  | 'citations_favorites'
  | 'pourquoi_aimer'
  | 'questions_sur_le_livre'
  | 'recommandation_personnalisee';

// ===== CONSTANTES =====

export const BOOK_RATING_MIN = 1;
export const BOOK_RATING_MAX = 10;

export const BOOK_STATUS_LABELS: Record<'LU' | 'EN_COURS' | 'A_LIRE', string> = {
  'LU': 'Lu',
  'EN_COURS': 'En cours',
  'A_LIRE': 'À lire'
};

export const BOOK_RHYTHM_LABELS: Record<'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE', string> = {
  'SLOW_BURN': 'Slow Burn',
  'MEDIUM_BURN': 'Medium Burn', 
  'FAST_PACE': 'Rythme rapide',
  'INSTA_LOVE': 'Insta Love'
};

export const BOOK_RATING_LABELS: Record<BookRatingField, string> = {
  note_generale: 'Note générale',
  niveau_spicy: 'Niveau Spicy 🌶️',
  niveau_dark: 'Niveau Dark 💀',
  niveau_romance: 'Niveau Romance ❤️',
  intensite_emotionnelle: 'Intensité émotionnelle',
  danger: 'Danger',
  violence: 'Violence', 
  originalite: 'Originalité'
};

// ===== TYPES POUR LA VALIDATION =====

export interface BookValidationRules {
  titre: { required: true; minLength: 1; maxLength: 255 };
  auteur: { required: true; minLength: 1; maxLength: 255 };
  note_generale: { required: true; min: 1; max: 10 };
  niveau_spicy: { required: true; min: 1; max: 10 };
  niveau_dark: { required: true; min: 1; max: 10 };
  niveau_romance: { required: true; min: 1; max: 10 };
  intensite_emotionnelle: { required: true; min: 1; max: 10 };
  danger: { required: true; min: 1; max: 10 };
  violence: { required: true; min: 1; max: 10 };
  originalite: { required: true; min: 1; max: 10 };
  isbn?: { pattern: string }; // Pattern ISBN-10 ou ISBN-13
  nombre_pages?: { min: 1; max: 9999 };
  date_publication?: { format: 'ISO_DATE' };
  date_lecture?: { format: 'ISO_DATE' };
}

export type BookValidationError = {
  field: keyof BookCreateInput;
  message: string;
  value?: unknown;
};