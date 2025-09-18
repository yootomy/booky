/**
 * Types pour les tags - Interface basée sur le schéma Prisma
 * Gestion des tropes, genres, triggers et tags personnalisés
 */

import { TagType } from './api';
import type { BookSummary } from './book';

// ===== INTERFACE TAG PRINCIPALE =====

export interface Tag {
  // Identifiants
  id: string;
  
  // Champs principaux
  nom: string;
  couleur: string; // Couleur hex selon la palette dark romance
  type: TagType;
  
  // Statistiques et favoris
  utilisation_count: number;
  est_favori: boolean;
  
  // Métadonnées système
  date_creation: string; // ISO date string
  date_modification: string; // ISO date string
  
  // Relations (optionnelles selon le contexte)
  books?: TagWithBook[];
  _count?: {
    books: number;
  };
}

// ===== INTERFACES DE RELATIONS =====

export interface TagWithBook {
  id: string;
  bookId: string;
  tagId: string;
  book: BookSummary;
}

export interface TagWithStats extends Tag {
  stats: {
    total_livres: number;
    livres_lus: number;
    livres_en_cours: number;
    livres_a_lire: number;
    note_moyenne: number;
    niveau_spicy_moyen: number;
    niveau_dark_moyen: number;
    niveau_romance_moyen: number;
    premier_usage: string; // Date ISO
    dernier_usage: string; // Date ISO
    tendance: 'croissante' | 'stable' | 'decroissante';
    popularite_relative: number; // 0-100
  };
}

// ===== TYPES POUR LES FORMULAIRES =====

export interface TagCreateInput {
  nom: string;
  couleur: string;
  type: TagType;
  est_favori?: boolean;
}

export interface TagUpdateInput extends Partial<TagCreateInput> {
  id: string;
  utilisation_count?: number; // Calculé automatiquement mais peut être override
}

// ===== TYPES POUR L'AFFICHAGE =====

export interface TagSummary {
  id: string;
  nom: string;
  couleur: string;
  type: TagType;
  utilisation_count: number;
  est_favori: boolean;
}

export interface TagDetail extends Tag {
  books: TagWithBook[];
  stats: {
    total_livres: number;
    par_statut: {
      LU: number;
      EN_COURS: number;
      A_LIRE: number;
    };
    notes: {
      moyenne_generale: number;
      moyenne_spicy: number;
      moyenne_dark: number;
      moyenne_romance: number;
      distribution: Record<number, number>; // note -> count
    };
    tendances: {
      utilisation_par_mois: Array<{
        mois: string;
        count: number;
      }>;
      auteurs_associes: Array<{
        auteur: string;
        count: number;
      }>;
      categories_associees: Array<{
        category_nom: string;
        count: number;
        couleur: string;
      }>;
      tags_souvent_associes: Array<{
        tag: TagSummary;
        co_occurrence: number;
      }>;
    };
  };
}

// ===== TYPES POUR LA RECHERCHE =====

export interface TagSearchResult {
  id: string;
  nom: string;
  couleur: string;
  type: TagType;
  utilisation_count: number;
  est_favori: boolean;
  match_score?: number;
  highlight?: {
    nom?: string;
  };
}

// ===== TYPES POUR LES STATISTIQUES =====

export interface TagStats {
  total_tags: number;
  tags_favoris: number;
  tags_utilises: number; // avec au moins un livre
  tags_inutilises: number;
  
  par_type: {
    [K in TagType]: {
      count: number;
      utilisation_moyenne: number;
      plus_populaire?: TagSummary;
    };
  };
  
  plus_populaires: Array<{
    tag: TagSummary;
    books_count: number;
    pourcentage: number;
  }>;
  
  moins_utilises: Array<{
    tag: TagSummary;
    books_count: number;
  }>;
  
  par_couleur: Record<string, number>; // couleur -> count
  
  co_occurrences: Array<{
    tag1: TagSummary;
    tag2: TagSummary;
    count: number;
    force_association: number; // 0-1
  }>;
  
  evolution: Array<{
    mois: string;
    tags_crees: number;
    tags_utilises: number;
    utilisation_totale: number;
  }>;
}

// ===== TYPES POUR L'ORGANISATION =====

export interface TagBulkAction {
  action: 'favorite' | 'unfavorite' | 'delete' | 'update_type' | 'update_color' | 'merge';
  tag_ids: string[];
  params?: {
    est_favori?: boolean;
    type?: TagType;
    couleur?: string;
    merge_target?: string; // ID du tag de destination pour fusion
  };
}

export interface TagMergeAction {
  source_tags: string[]; // Tags à fusionner
  target_tag: string; // Tag de destination
  strategy: 'keep_target' | 'combine_names' | 'manual';
  new_name?: string; // Si strategy = 'manual'
  new_color?: string;
  new_type?: TagType;
}

// ===== TYPES POUR L'IMPORT/EXPORT =====

export interface TagImportData {
  nom: string;
  couleur: string;
  type: TagType;
  est_favori?: boolean;
}

export interface TagExportOptions {
  format: 'JSON' | 'CSV';
  types?: TagType[];
  inclure_statistiques?: boolean;
  inclure_livres?: boolean;
  seulement_favoris?: boolean;
  seulement_utilises?: boolean;
}

// ===== TYPES POUR LA VALIDATION =====

export interface TagValidationRules {
  nom: { required: true; minLength: 1; maxLength: 50; unique: true };
  couleur: { required: true; pattern: string }; // Pattern hex color
  type: { required: true; enum: TagType[] };
  utilisation_count: { min: 0 };
}

export type TagValidationError = {
  field: keyof TagCreateInput;
  message: string;
  value?: unknown;
};

// ===== CONSTANTES PRÉDÉFINIES =====

export const TAG_COLORS = {
  // Genre colors (elegant purples and teals)
  GENRE_BLUE: '#6B4C7B',        // Main site purple
  GENRE_PURPLE: '#8B6B97',      // Lighter elegant purple
  GENRE_TEAL: '#5B8A72',        // Soft romantic teal

  // Trope colors (warm romantic tones)
  TROPE_RED: '#8B1538',         // Main site crimson
  TROPE_CRIMSON: '#A0415D',     // Softer romantic pink
  TROPE_BURGUNDY: '#7D2E4A',    // Muted burgundy

  // Trigger colors (soft warning tones)
  TRIGGER_ORANGE: '#B8704F',    // Muted amber/orange
  TRIGGER_DARK_RED: '#8B1538',  // Using main site color
  TRIGGER_PURPLE: '#9B6B8C',    // Soft warning purple

  // Custom colors (sophisticated neutrals)
  CUSTOM_GRAY: '#7A6B7D',       // Warm gray with purple undertones
  CUSTOM_DARK: '#4A3E4B',       // Dark elegant neutral
  CUSTOM_BLUE: '#5D6B8D'        // Soft blue-gray
} as const;

export const PREDEFINED_TAGS: Array<{
  nom: string;
  couleur: string;
  type: TagType;
  est_favori: boolean;
}> = [
  // GENRES
  { nom: 'Urban Fantasy', couleur: TAG_COLORS.GENRE_PURPLE, type: TagType.GENRE, est_favori: false },
  { nom: 'Paranormal', couleur: TAG_COLORS.GENRE_BLUE, type: TagType.GENRE, est_favori: false },
  { nom: 'Historical', couleur: TAG_COLORS.GENRE_TEAL, type: TagType.GENRE, est_favori: false },
  { nom: 'Sci-Fi Romance', couleur: TAG_COLORS.GENRE_BLUE, type: TagType.GENRE, est_favori: false },
  
  // TROPES
  { nom: 'Enemies to Lovers', couleur: TAG_COLORS.TROPE_RED, type: TagType.TROPE, est_favori: true },
  { nom: 'Age Gap', couleur: TAG_COLORS.TROPE_CRIMSON, type: TagType.TROPE, est_favori: false },
  { nom: 'Reverse Harem', couleur: TAG_COLORS.TROPE_BURGUNDY, type: TagType.TROPE, est_favori: false },
  { nom: 'Mafia Romance', couleur: TAG_COLORS.TROPE_RED, type: TagType.TROPE, est_favori: false },
  { nom: 'Bully Romance', couleur: TAG_COLORS.TROPE_CRIMSON, type: TagType.TROPE, est_favori: false },
  { nom: 'Brother\'s Best Friend', couleur: TAG_COLORS.TROPE_BURGUNDY, type: TagType.TROPE, est_favori: false },
  { nom: 'Professor/Student', couleur: TAG_COLORS.TROPE_RED, type: TagType.TROPE, est_favori: false },
  { nom: 'Second Chance', couleur: TAG_COLORS.TROPE_CRIMSON, type: TagType.TROPE, est_favori: false },
  
  // TRIGGERS
  { nom: 'Violence', couleur: TAG_COLORS.TRIGGER_DARK_RED, type: TagType.TRIGGER, est_favori: false },
  { nom: 'Non-con', couleur: TAG_COLORS.TRIGGER_ORANGE, type: TagType.TRIGGER, est_favori: false },
  { nom: 'Dubcon', couleur: TAG_COLORS.TRIGGER_PURPLE, type: TagType.TRIGGER, est_favori: false },
  { nom: 'Death of Parent', couleur: TAG_COLORS.TRIGGER_DARK_RED, type: TagType.TRIGGER, est_favori: false }
];

// ===== TYPES UTILITAIRES =====

export type TagField = keyof Tag;

export type TagColor = keyof typeof TAG_COLORS;

export type TagSortField = 
  | 'nom'
  | 'type'
  | 'utilisation_count'
  | 'date_creation'
  | 'date_modification'
  | 'est_favori';

// ===== TYPES POUR LES FILTRES UI =====

export interface TagFilters {
  search?: string;
  types?: TagType[];
  couleurs?: string[];
  est_favori?: boolean;
  utilisation_count_min?: number;
  utilisation_count_max?: number;
  seulement_utilises?: boolean; // utilisation_count > 0
  date_creation_from?: string;
  date_creation_to?: string;
}

export interface TagDisplayOptions {
  vue: 'grid' | 'list' | 'cloud' | 'compact';
  tri: {
    field: TagSortField;
    direction: 'asc' | 'desc';
  };
  grouper_par: 'type' | 'couleur' | 'popularite' | 'aucun';
  affichage: {
    show_type_badge: boolean;
    show_count: boolean;
    show_favorite_star: boolean;
    show_color_dot: boolean;
    use_tag_colors: boolean;
    size_by_usage: boolean; // Pour vue cloud
  };
  filtres: {
    show_unused: boolean;
    show_favorites_only: boolean;
    show_type_filter: boolean;
  };
}

// ===== TYPES POUR LES RECOMMANDATIONS =====

export interface TagRecommendation {
  tag: TagSummary;
  raison: 'livre_similaire' | 'auteur_commun' | 'category_commune' | 'co_occurrence';
  score: number; // 0-100
  contexte?: {
    livres_communs?: number;
    auteurs_communs?: string[];
    categories_communes?: string[];
  };
}

export interface TagCloud {
  tags: Array<{
    tag: TagSummary;
    size: number; // 1-10 basé sur utilisation_count
    weight: number; // Importance relative
  }>;
  max_count: number;
  min_count: number;
}

// ===== TYPES POUR L'ANALYSE =====

export interface TagAnalysis {
  correlations: Array<{
    tag1: TagSummary;
    tag2: TagSummary;
    correlation_score: number; // -1 to 1
    co_occurrence_count: number;
    significance: 'forte' | 'moyenne' | 'faible';
  }>;
  
  clusters: Array<{
    nom: string;
    tags: TagSummary[];
    centroid: {
      type_principal: TagType;
      couleur_dominante: string;
      utilisation_moyenne: number;
    };
    coherence_score: number; // 0-1
  }>;
  
  tendances: {
    tags_emergents: TagSummary[]; // Utilisation en croissance
    tags_declinants: TagSummary[]; // Utilisation en baisse
    tags_stables: TagSummary[];
  };
  
  recommandations: {
    tags_manquants: string[]; // Suggérés basés sur les livres existants
    fusions_possibles: Array<{
      tags: TagSummary[];
      similarite: number;
    }>;
    nettoyage_suggere: TagSummary[]; // Tags inutilisés ou redondants
  };
}

// ===== CONSTANTES POUR L'UI =====

export const TAG_TYPE_LABELS: Record<TagType, string> = {
  [TagType.GENRE]: 'Genre',
  [TagType.TROPE]: 'Trope',
  [TagType.TRIGGER]: 'Trigger/Avertissement',
  [TagType.PERSONNALISE]: 'Personnalisé'
};

export const TAG_TYPE_ICONS: Record<TagType, string> = {
  [TagType.GENRE]: '🎭',
  [TagType.TROPE]: '💫',
  [TagType.TRIGGER]: '⚠️',
  [TagType.PERSONNALISE]: '🏷️'
};

export const TAG_TYPE_COLORS: Record<TagType, string> = {
  [TagType.GENRE]: TAG_COLORS.GENRE_PURPLE,
  [TagType.TROPE]: TAG_COLORS.TROPE_RED,
  [TagType.TRIGGER]: TAG_COLORS.TRIGGER_ORANGE,
  [TagType.PERSONNALISE]: TAG_COLORS.CUSTOM_GRAY
};