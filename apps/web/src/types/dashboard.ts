/**
 * Types pour le dashboard - Interface pour les statistiques et données du tableau de bord
 * Basé sur les endpoints /api/dashboard/* et /api/stats/*
 */

import type { BookSummary, BookRatingField } from './book';
import { BookStatus, BookRhythm } from './api';
import type { CategorySummary } from './category';
import type { TagSummary } from './tag';
import { TagType } from './api';
import type { AuthUser } from './auth';

// ===== INTERFACE DASHBOARD PRINCIPALE =====

export interface DashboardData {
  // Statistiques générales
  stats_generales: DashboardStats;
  
  // Lectures en cours
  lecture_en_cours: CurrentReading[];
  
  // Activité récente
  activite_recente: RecentActivity[];
  
  // Livres récents
  livres_recents: BookSummary[];
  
  // Top livres (mieux notés)
  livres_mieux_notes: TopRatedBook[];
  
  // Wishlist (à lire)
  wishlist: WishlistBook[];
  
  // Métadonnées
  derniere_mise_a_jour: string; // ISO date string
  execution_time_ms: number;
}

// ===== STATISTIQUES GÉNÉRALES =====

export interface DashboardStats {
  // Compteurs globaux
  total_livres: number;
  livres_lus: number;
  livres_en_cours: number;
  livres_a_lire: number;
  
  // Notes et moyennes
  note_moyenne_generale: number;
  niveau_spicy_moyen: number;
  niveau_dark_moyen: number;
  niveau_romance_moyen: number;
  
  // Pages et temps
  pages_totales: number;
  pages_lues: number;
  pages_restantes: number;
  temps_lecture_estime: number; // en heures
  
  // Tendances et dates
  livres_ce_mois: number;
  livres_cette_annee: number;
  premier_livre?: {
    date: string;
    titre: string;
  };
  dernier_livre?: {
    date: string;
    titre: string;
  };
  
  // Préférences déduites
  auteur_prefere?: {
    nom: string;
    nombre_livres: number;
    note_moyenne: number;
  };
  genre_prefere?: {
    nom: string;
    couleur: string;
    nombre_livres: number;
  };
  
  // Objectifs (si définis)
  objectif_annuel?: {
    cible: number;
    progres: number;
    pourcentage: number;
    reste_a_lire: number;
    en_avance: boolean;
    jours_restants: number;
  };
}

// ===== LECTURE EN COURS =====

export interface CurrentReading {
  livre: BookSummary & {
    progression?: number; // 0-100%
    pages_lues?: number;
    temps_ecoule?: number; // en jours depuis début lecture
    estimation_fin?: string; // Date estimée de fin
  };
  date_debut: string; // Date où le statut est passé à EN_COURS
  notes_intermediaires?: {
    note_actuelle?: number;
    impression?: string;
    page_actuelle?: number;
  };
}

// ===== ACTIVITÉ RÉCENTE =====

export interface RecentActivity {
  id: string;
  type: 'livre_ajoute' | 'livre_fini' | 'note_donnee' | 'critique_ecrite' | 'category_ajoutee' | 'tag_ajoute';
  timestamp: string; // ISO date string
  description: string;
  
  // Données associées selon le type
  livre?: {
    id: string;
    titre: string;
    auteur: string;
  };
  note?: number;
  category?: {
    id: string;
    nom: string;
    couleur: string;
  };
  tag?: {
    id: string;
    nom: string;
    couleur: string;
  };
  
  // Métadonnées
  important: boolean; // À mettre en évidence
  icone?: string;
  couleur?: string;
}

// ===== TOP LIVRES =====

export interface TopRatedBook extends BookSummary {
  rank: number; // Position dans le classement
  details: {
    raisons: string[]; // Pourquoi ce livre est bien classé
    points_forts: BookRatingField[]; // Notes élevées
    recommande_pour: string[]; // Types de lecteurs
  };
}

// ===== WISHLIST =====

export interface WishlistBook extends BookSummary {
  priorite: 'haute' | 'moyenne' | 'basse';
  raison_ajout?: string;
  date_ajout_wishlist: string;
  estimation_lecture?: {
    difficulte: 'facile' | 'moyenne' | 'difficile';
    temps_estime: number; // en heures
    meilleur_moment: string; // "weekend", "vacances", etc.
  };
  disponibilite?: {
    possede: boolean;
    ou_trouver?: string;
    prix_estime?: number;
  };
}

// ===== GRAPHIQUES ET VISUALISATIONS =====

export interface ChartData {
  // Graphique lecture par mois
  lecture_par_mois: Array<{
    mois: string; // "2024-01"
    count: number;
    pages: number;
    note_moyenne: number;
  }>;
  
  // Distribution des notes
  distribution_notes: Array<{
    note: number; // 1-10
    count: number;
    pourcentage: number;
  }>;
  
  // Évolution des préférences
  evolution_preferences: {
    spicy: Array<{ mois: string; moyenne: number }>;
    dark: Array<{ mois: string; moyenne: number }>;
    romance: Array<{ mois: string; moyenne: number }>;
  };
  
  // Top genres
  top_genres: Array<{
    category: CategorySummary;
    count: number;
    pourcentage: number;
    evolution: "hausse" | "baisse" | "stable";
  }>;
  
  // Rythmes préférés
  rythmes_preferes: Array<{
    rythme: BookRhythm;
    count: number;
    pourcentage: number;
    satisfaction: number; // Note moyenne pour ce rythme
  }>;
}

// ===== RECOMMANDATIONS DASHBOARD =====

export interface DashboardRecommendations {
  // Prochains livres suggérés
  livres_suggerees: Array<{
    livre: BookSummary;
    score: number; // 0-100
    raisons: string[];
    basé_sur: 'preferences' | 'tendances' | 'auteur' | 'genre';
  }>;
  
  // Objectifs suggérés
  objectifs_suggerees: Array<{
    type: 'nombre_livres' | 'pages_lues' | 'nouveaux_genres' | 'authors_diversité';
    titre: string;
    description: string;
    cible_suggeree: number;
    difficulte: 'facile' | 'moderé' | 'difficile';
    benefices: string[];
  }>;
  
  // Actions recommandées
  actions_recommandees: Array<{
    type: 'organiser_bibliotheque' | 'ecrire_critiques' | 'explorer_genre' | 'relire_favoris';
    titre: string;
    description: string;
    priorite: 'haute' | 'moyenne' | 'basse';
    temps_estime: number; // en minutes
  }>;
}

// ===== WIDGETS DASHBOARD =====

export interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'list' | 'progress' | 'recommendation';
  titre: string;
  taille: 'small' | 'medium' | 'large' | 'xl';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  visible: boolean;
  config?: Record<string, unknown>;
  data?: unknown;
  derniere_mise_a_jour: string;
}

export interface DashboardLayout {
  user_id: string;
  widgets: DashboardWidget[];
  theme: 'default' | 'dark' | 'compact';
  derniere_modification: string;
}

// ===== OBJECTIFS DE LECTURE =====

export interface ReadingGoal {
  id: string;
  type: 'livres_par_an' | 'pages_par_mois' | 'genres_diversifies' | 'auteurs_nouveaux';
  titre: string;
  description?: string;
  
  // Cible et progrès
  cible: number;
  progres_actuel: number;
  unite: 'livres' | 'pages' | 'genres' | 'auteurs';
  
  // Période
  date_debut: string;
  date_fin: string;
  
  // Statut
  statut: 'actif' | 'complete' | 'echec' | 'pause';
  auto_renouvelable: boolean;
  
  // Calculs automatiques
  progres_pourcentage: number;
  jours_restants: number;
  rythme_requis: number; // Unités par jour/semaine/mois pour atteindre l'objectif
  en_avance: boolean;
  
  // Motivations
  recompense?: string;
  motivation?: string;
  partage_public: boolean;
}

// ===== COMPARAISONS ET BENCHMARKS =====

export interface ReadingComparison {
  // Comparaison avec l'année précédente
  vs_annee_precedente: {
    livres: { actuel: number; precedent: number; difference: number; pourcentage: number };
    pages: { actuel: number; precedent: number; difference: number; pourcentage: number };
    note_moyenne: { actuelle: number; precedente: number; difference: number };
    nouveaux_genres: number;
    nouveaux_auteurs: number;
  };
  
  // Moyennes communautaires (si applicable)
  vs_moyenne_communaute?: {
    livres_par_mois: { moi: number; moyenne: number; position_percentile: number };
    diversite_genres: { moi: number; moyenne: number };
    notes_attribuees: { moi: number; moyenne: number };
  };
  
  // Records personnels
  records_personnels: {
    plus_de_livres_en_un_mois: { count: number; mois: string };
    plus_de_pages_en_un_jour: { pages: number; date: string };
    plus_longue_serie_lecture: { jours: number; periode: string };
    genre_le_plus_explore: { nom: string; count: number };
  };
}

// ===== INSIGHTS ET ANALYSES =====

export interface ReadingInsights {
  // Patterns détectés
  patterns: Array<{
    type: 'saisonnier' | 'genre_preference' | 'longueur_preference' | 'rythme_lecture';
    titre: string;
    description: string;
    fiabilite: number; // 0-100%
    donnees_support: unknown;
  }>;
  
  // Évolutions notables
  evolutions: Array<{
    type: 'hausse' | 'baisse' | 'stabilisation';
    metrique: string;
    valeur_precedente: number;
    valeur_actuelle: number;
    periode: string;
    significatif: boolean;
  }>;
  
  // Prédictions
  predictions: Array<{
    type: 'objectif_atteint' | 'nouveau_genre_prefere' | 'rythme_lecture';
    titre: string;
    probabilite: number; // 0-100%
    horizon: string; // "dans 3 mois", etc.
    basé_sur: string[];
  }>;
}

// ===== TYPES POUR LA CONFIGURATION =====

export interface DashboardConfig {
  // Paramètres d'affichage
  affichage: {
    theme: 'light' | 'dark' | 'system';
    langue: 'fr' | 'en';
    format_date: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
    timezone: string;
  };
  
  // Paramètres des données
  donnees: {
    periode_par_defaut: '7d' | '30d' | '90d' | '1y' | 'all';
    inclure_livres_prives: boolean;
    masquer_notes_faibles: boolean;
    seuil_livre_recent: number; // en jours
  };
  
  // Notifications
  notifications: {
    objectifs: boolean;
    nouveaux_livres: boolean;
    anniversaires: boolean; // 1 an depuis lecture d'un livre
    rappels_lecture: boolean;
  };
  
  // Widgets activés
  widgets_actifs: string[];
  widgets_config: Record<string, unknown>;
}

// ===== TYPES UTILITAIRES =====

export type DashboardPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export type DashboardMetric = 
  | 'total_books'
  | 'books_read' 
  | 'average_rating'
  | 'pages_read'
  | 'reading_speed'
  | 'genre_diversity'
  | 'author_diversity';

export type DashboardChartType = 
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'radar'
  | 'scatter';

// ===== CONSTANTES =====

export const DASHBOARD_REFRESH_INTERVALS = {
  REAL_TIME: 30000, // 30 secondes
  FREQUENT: 300000, // 5 minutes
  NORMAL: 900000, // 15 minutes
  SLOW: 3600000 // 1 heure
} as const;

export const WIDGET_SIZES = {
  SMALL: { w: 2, h: 2 },
  MEDIUM: { w: 4, h: 3 },
  LARGE: { w: 6, h: 4 },
  XL: { w: 8, h: 6 }
} as const;

export const DEFAULT_READING_GOALS = [
  {
    type: 'livres_par_an' as const,
    titre: "12 livres par an",
    cible: 12,
    description: "Lire un livre par mois en moyenne"
  },
  {
    type: 'pages_par_mois' as const,
    titre: "1000 pages par mois",
    cible: 1000,
    description: "Maintenir un rythme de lecture régulier"
  },
  {
    type: 'genres_diversifies' as const,
    titre: "5 genres différents",
    cible: 5,
    description: "Explorer la diversité littéraire"
  }
] as const;