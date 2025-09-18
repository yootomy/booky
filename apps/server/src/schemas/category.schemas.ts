// =============================================================================
// 📂 SCHÉMAS DE VALIDATION POUR LES CATÉGORIES
// =============================================================================
// Schémas Zod centralisés pour toutes les opérations sur les catégories

import { z } from "zod";

// =============================================================================
// 🎨 SCHÉMAS DE BASE
// =============================================================================

// Validation des couleurs hexadécimales
const ColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (#RRGGBB)")
  .default("#3B82F6");

// Validation des icônes (classes CSS ou noms d'icônes)
const IconSchema = z.string()
  .min(1, "L'icône ne peut pas être vide")
  .max(100, "L'icône ne peut pas dépasser 100 caractères")
  .default("📚");

// =============================================================================
// 🆕 CRÉATION DE CATÉGORIE
// =============================================================================

export const CreateCategorySchema = z.object({
  nom: z.string({
    message: "Le nom de la catégorie est obligatoire"
  })
    .min(1, "Le nom doit contenir au moins 1 caractère")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),

  couleur: ColorSchema,

  icone: IconSchema,

  description: z.string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .trim()
    .optional(),

  ordre_affichage: z.number()
    .int("L'ordre d'affichage doit être un nombre entier")
    .min(0, "L'ordre d'affichage ne peut pas être négatif")
    .default(0),

  est_actif: z.boolean()
    .default(true),
});

// =============================================================================
// ✏️ MODIFICATION DE CATÉGORIE
// =============================================================================

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  // Tous les champs deviennent optionnels pour la modification
  // On peut ajouter des validations spécifiques ici si nécessaire
});

// =============================================================================
// 🔍 FILTRES ET RECHERCHE
// =============================================================================

export const CategoryFiltersSchema = z.object({
  // Filtres de recherche
  q: z.string()
    .min(1, "Le terme de recherche doit contenir au moins 1 caractère")
    .optional(),

  // Filtres par statut
  est_actif: z.boolean()
    .optional(),

  // Tri
  sort: z.enum([
    'nom', 'couleur', 'ordre_affichage', 'est_actif',
    'date_creation', 'date_modification', 'usage_count'
  ])
    .default('ordre_affichage'),

  order: z.enum(['asc', 'desc'])
    .default('asc'),

  // Pagination
  page: z.number()
    .int("Le numéro de page doit être un nombre entier")
    .min(1, "Le numéro de page doit être au moins 1")
    .default(1),

  limit: z.number()
    .int("La limite doit être un nombre entier")
    .min(1, "La limite doit être au moins 1")
    .max(100, "La limite ne peut pas dépasser 100")
    .default(20),

  // Inclure le nombre de livres par catégorie
  include_book_count: z.boolean()
    .default(false),
});

// =============================================================================
// 📊 SCHÉMAS DE RÉPONSE
// =============================================================================

// Schéma pour une catégorie dans les réponses API
export const CategoryResponseSchema = z.object({
  id: z.string(),
  nom: z.string(),
  couleur: z.string(),
  icone: z.string(),
  description: z.string().nullable(),
  ordre_affichage: z.number(),
  est_actif: z.boolean(),
  book_count: z.number().optional(),
  date_creation: z.string(), // ISO date string
  date_modification: z.string(), // ISO date string
});

// =============================================================================
// 🔗 SCHÉMAS POUR LES RELATIONS
// =============================================================================

// Schéma pour associer/dissocier des catégories à un livre
export const BookCategoriesSchema = z.object({
  category_ids: z.array(z.string().uuid("ID de catégorie invalide"))
    .min(1, "Au moins une catégorie doit être spécifiée")
    .max(10, "Un livre ne peut pas avoir plus de 10 catégories"),
});

// Schéma pour les paramètres de livres par catégorie
export const CategoryBooksFiltersSchema = z.object({
  // Filtres de base pour les livres
  statut: z.enum(['LU', 'EN_COURS', 'A_LIRE', 'ABANDONNE'])
    .optional(),

  niveau_spicy: z.coerce.number()
    .int()
    .min(0)
    .max(10)
    .optional(),

  niveau_dark: z.coerce.number()
    .int()
    .min(0)
    .max(10)
    .optional(),

  min_rating: z.coerce.number()
    .min(0)
    .max(10)
    .optional(),

  max_rating: z.coerce.number()
    .min(0)
    .max(10)
    .optional(),

  // Tri des livres
  sort: z.enum([
    'titre', 'auteur', 'date_creation', 'date_modification',
    'date_lecture', 'note_generale', 'niveau_spicy', 'niveau_dark'
  ])
    .default('date_creation'),

  order: z.enum(['asc', 'desc'])
    .default('desc'),

  // Pagination
  page: z.coerce.number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce.number()
    .int()
    .min(1)
    .max(50)
    .default(20),
});

// =============================================================================
// 🌍 SUPPORT MULTILINGUE
// =============================================================================

// Messages d'erreur en français et anglais
export const CategoryErrorMessages = {
  fr: {
    CATEGORY_NOT_FOUND: "Catégorie non trouvée",
    CATEGORY_NAME_EXISTS: "Une catégorie avec ce nom existe déjà",
    CATEGORY_IN_USE: "Cette catégorie est utilisée par des livres et ne peut pas être supprimée",
    INVALID_CATEGORY_DATA: "Données de catégorie invalides",
    UNAUTHORIZED: "Authentification requise pour cette action",
    FORBIDDEN: "Permissions insuffisantes pour cette action",
  },
  en: {
    CATEGORY_NOT_FOUND: "Category not found",
    CATEGORY_NAME_EXISTS: "A category with this name already exists",
    CATEGORY_IN_USE: "This category is used by books and cannot be deleted",
    INVALID_CATEGORY_DATA: "Invalid category data",
    UNAUTHORIZED: "Authentication required for this action",
    FORBIDDEN: "Insufficient permissions for this action",
  },
};

// =============================================================================
// 📋 TYPES TYPESCRIPT INFÉRÉS
// =============================================================================

export type CreateCategoryData = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryData = z.infer<typeof UpdateCategorySchema>;
export type CategoryFilters = z.infer<typeof CategoryFiltersSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type BookCategoriesData = z.infer<typeof BookCategoriesSchema>;
export type CategoryBooksFilters = z.infer<typeof CategoryBooksFiltersSchema>;

// =============================================================================
// 🎨 COULEURS ET ICÔNES PRÉDÉFINIES
// =============================================================================

export const PREDEFINED_COLORS = [
  "#3B82F6", // Bleu
  "#EF4444", // Rouge
  "#10B981", // Vert
  "#F59E0B", // Orange
  "#8B5CF6", // Violet
  "#EC4899", // Rose
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange foncé
  "#6366F1", // Indigo
];

export const PREDEFINED_ICONS = [
  "📚", // Livres généraux
  "💝", // Romance
  "🔮", // Fantasy
  "🚀", // Science-fiction
  "🔍", // Mystère/Thriller
  "💔", // Drame
  "😄", // Comédie
  "🎭", // Théâtre
  "🏛️", // Histoire
  "🧠", // Non-fiction
  "👶", // Jeunesse
  "🎨", // Art
  "🍳", // Cuisine
  "🧘", // Bien-être
  "💼", // Business
];

// =============================================================================
// 🔧 FONCTIONS UTILITAIRES
// =============================================================================

// Fonction pour valider et nettoyer le nom de catégorie
export function sanitizeCategoryName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[^\w\s\-\.]/g, '') // Supprimer les caractères spéciaux sauf tirets et points
    .substring(0, 100); // Limiter à 100 caractères
}

// Fonction pour valider une couleur hexadécimale
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Fonction pour générer une couleur aléatoire depuis les prédéfinies
export function getRandomPredefinedColor(): string {
  return PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
}

// Fonction pour générer une icône aléatoire depuis les prédéfinies
export function getRandomPredefinedIcon(): string {
  return PREDEFINED_ICONS[Math.floor(Math.random() * PREDEFINED_ICONS.length)];
}