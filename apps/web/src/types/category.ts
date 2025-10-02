/**
 * Types pour les catégories - Interface basée sur le schéma Prisma
 * Gestion des genres (Dark Romance, Spicy Romance, etc.)
 */

import type { BookSummary } from './book';

// ===== INTERFACE CATÉGORIE PRINCIPALE =====

export interface Category {
  // Identifiants
  id: string;
  
  // Champs principaux
  nom: string;
  couleur: string; // Couleur hex (#8B0000, #DC143C, etc.)
  icone?: string; // Nom de l'icône ou emoji (💀, 🌶️, 💜, etc.)
  description?: string;
  
  // Configuration d'affichage
  ordre_affichage: number;
  est_actif: boolean;
  
  // Métadonnées système
  date_creation: string; // ISO date string
  date_modification: string; // ISO date string
  
  // Relations (optionnelles selon le contexte)
  books?: CategoryWithBook[];
  _count?: {
    books: number;
  };
  
  // Comptage dynamique (ajouté par les sérialiseurs backend)
  book_count?: number;
}

// ===== INTERFACES DE RELATIONS =====

export interface CategoryWithBook {
  id: string;
  bookId: string;
  categoryId: string;
  book: BookSummary;
}

export interface CategoryWithStats extends Category {
  stats: {
    total_livres: number;
    livres_lus: number;
    livres_en_cours: number;
    livres_a_lire: number;
    note_moyenne: number;
    niveau_spicy_moyen: number;
    niveau_dark_moyen: number;
    niveau_romance_moyen: number;
    dernier_livre_ajoute?: {
      id: string;
      titre: string;
      date_creation: string;
    };
    livre_mieux_note?: {
      id: string;
      titre: string;
      note_generale: number;
    };
  };
}

// ===== TYPES POUR LES FORMULAIRES =====

export interface CategoryCreateInput {
  nom: string;
  couleur: string;
  icone?: string;
  description?: string;
  ordre_affichage?: number;
  est_actif?: boolean;
}

export interface CategoryUpdateInput extends Partial<CategoryCreateInput> {
  id: string;
}

// ===== TYPES POUR L'AFFICHAGE =====

export interface CategorySummary {
  id: string;
  nom: string;
  couleur: string;
  icone?: string;
  description?: string;
  ordre_affichage: number;
  est_actif: boolean;
  books_count?: number;
}

export interface CategoryDetail extends Category {
  books: CategoryWithBook[];
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
      livres_par_mois: Array<{
        mois: string;
        count: number;
      }>;
      auteurs_populaires: Array<{
        auteur: string;
        count: number;
      }>;
      tags_associes: Array<{
        tag_nom: string;
        count: number;
        couleur: string;
      }>;
    };
  };
}

// ===== TYPES POUR LA RECHERCHE =====

export interface CategorySearchResult {
  id: string;
  nom: string;
  couleur: string;
  icone?: string;
  description?: string;
  books_count: number;
  match_score?: number;
  highlight?: {
    nom?: string;
    description?: string;
  };
}

// ===== TYPES POUR LES STATISTIQUES =====

export interface CategoryStats {
  total_categories: number;
  categories_actives: number;
  categories_utilisees: number; // avec au moins un livre
  categories_vides: number;
  
  distribution: Array<{
    category: CategorySummary;
    count: number;
    pourcentage: number;
  }>;
  
  plus_populaires: Array<{
    category: CategorySummary;
    books_count: number;
  }>;
  
  moins_utilisees: Array<{
    category: CategorySummary;
    books_count: number;
  }>;
  
  par_couleur: Record<string, number>; // couleur -> count
  
  evolution: Array<{
    mois: string;
    categories_creees: number;
    categories_utilisees: number;
  }>;
}

// ===== TYPES POUR L'ORGANISATION =====

export interface CategoryReorderItem {
  id: string;
  ordre_affichage: number;
}

export interface CategoryBulkAction {
  action: 'activate' | 'deactivate' | 'delete' | 'update_color' | 'reorder';
  category_ids: string[];
  params?: {
    est_actif?: boolean;
    couleur?: string;
    reorder_data?: CategoryReorderItem[];
  };
}

// ===== TYPES POUR L'IMPORT/EXPORT =====

export interface CategoryImportData {
  nom: string;
  couleur: string;
  icone?: string;
  description?: string;
  ordre_affichage?: number;
  est_actif?: boolean;
}

export interface CategoryExportOptions {
  format: 'JSON' | 'CSV';
  inclure_statistiques?: boolean;
  inclure_livres?: boolean;
  filtres?: {
    est_actif?: boolean;
    avec_livres_seulement?: boolean;
  };
}

// ===== TYPES POUR LA VALIDATION =====

export interface CategoryValidationRules {
  nom: { required: true; minLength: 1; maxLength: 100; unique: true };
  couleur: { required: true; pattern: string }; // Pattern hex color
  icone?: { maxLength: 10 };
  description?: { maxLength: 500 };
  ordre_affichage: { min: 0; max: 999 };
}

export type CategoryValidationError = {
  field: keyof CategoryCreateInput;
  message: string;
  value?: unknown;
};

// ===== CONSTANTES PRÉDÉFINIES =====

export const CATEGORY_COLORS = {
  // Palette Dark Romance - Rouge sang
  DARK_RED: '#8B0000',
  CRIMSON: '#DC143C',
  
  // Noirs profonds
  BLACK_DEEP: '#0A0A0A',
  BLACK_LIGHT: '#1A1A1A',
  
  // Violets sombres
  INDIGO: '#4B0082',
  PURPLE_DARK: '#2E0854',
  PURPLE_ROYAL: '#6A0DAD',
  
  // Couleurs complémentaires
  BURGUNDY: '#800020',
  MAROON: '#722F37',
  PLUM: '#8E4585'
} as const;

export const PREDEFINED_CATEGORIES: Array<{
  nom: string;
  couleur: string;
  icone: string;
  description: string;
  ordre_affichage: number;
}> = [
  {
    nom: 'Dark Romance',
    couleur: CATEGORY_COLORS.DARK_RED,
    icone: "💀",
    description: "Romans sombres et passionnés avec des thèmes matures",
    ordre_affichage: 1
  },
  {
    nom: 'Spicy Romance',
    couleur: CATEGORY_COLORS.CRIMSON,
    icone: "🌶️",
    description: "Romans romantiques avec des scènes explicites",
    ordre_affichage: 2
  },
  {
    nom: 'Contemporary Romance',
    couleur: CATEGORY_COLORS.PURPLE_ROYAL,
    icone: "💜",
    description: "Romans romantiques contemporains",
    ordre_affichage: 3
  },
  {
    nom: 'Fantasy Romance',
    couleur: CATEGORY_COLORS.INDIGO,
    icone: "🔮",
    description: "Romans fantastiques avec une intrigue romantique",
    ordre_affichage: 4
  },
  {
    nom: 'Gothic Romance',
    couleur: CATEGORY_COLORS.PURPLE_DARK,
    icone: "🏰",
    description: "Romans gothiques sombres et mystérieux",
    ordre_affichage: 5
  }
];

export const CATEGORY_ICONS = [
  '💀', '🌶️', '💜', '🔮', '🏰', '❤️', '🖤', '💋', '🌹', '⚡',
  '🔥', '🗡️', '👑', '🦇', '🌙', '💎', '🍷', '⚔️', '🕷️', '🐺'
] as const;

// ===== TYPES UTILITAIRES =====

export type CategoryField = keyof Category;

export type CategoryColor = keyof typeof CATEGORY_COLORS;

export type CategoryIcon = typeof CATEGORY_ICONS[number];

export type CategorySortField = 
  | 'nom'
  | 'ordre_affichage' 
  | 'date_creation'
  | 'date_modification'
  | 'books_count';

// ===== TYPES POUR LES FILTRES UI =====

export interface CategoryFilters {
  search?: string;
  couleurs?: string[];
  est_actif?: boolean;
  avec_livres_seulement?: boolean;
  ordre_affichage_min?: number;
  ordre_affichage_max?: number;
  date_creation_from?: string;
  date_creation_to?: string;
}

export interface CategoryDisplayOptions {
  vue: 'grid' | 'list' | 'compact';
  tri: {
    field: CategorySortField;
    direction: 'asc' | 'desc';
  };
  affichage: {
    show_description: boolean;
    show_stats: boolean;
    show_books_count: boolean;
    show_inactive: boolean;
  };
  couleurs: {
    show_color_dot: boolean;
    show_icon: boolean;
    use_category_colors: boolean;
  };
}