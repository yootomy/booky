import { z } from "zod";

// =============================================================================
// 🏷️ SCHÉMAS DE VALIDATION ZOD POUR LES TAGS
// =============================================================================

// =============================================================================
// Types et Énums
// =============================================================================

export const TagTypeSchema = z.enum(["GENRE", "TROPE", "TRIGGER", "PERSONNALISE"], {
  message: "Le type de tag est obligatoire"
});

// Palette de couleurs hexadécimales pour les tags
export const TagColorSchema = z.string({
  message: "La couleur du tag est obligatoire"
})
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "La couleur doit être un code hexadécimal valide (ex: #FF0000 ou #F00)",
  })
  .default("#6B7280"); // Couleur par défaut

// =============================================================================
// Schémas de base pour les tags
// =============================================================================

export const CreateTagSchema = z.object({
  nom: z.string({
    message: "Le nom du tag est obligatoire"
  })
    .min(1, "Le nom doit contenir au moins 1 caractère")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .trim()
    .transform(s => s.toLowerCase()), // Normalisation en minuscules
  couleur: TagColorSchema,
  type: TagTypeSchema.optional().default("PERSONNALISE"),
  est_favori: z.boolean().optional().default(false),
});

export const UpdateTagSchema = z.object({
  nom: z.string()
    .min(1, "Le nom doit contenir au moins 1 caractère")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .trim()
    .transform(s => s.toLowerCase())
    .optional(),
  couleur: TagColorSchema.optional(),
  type: TagTypeSchema.optional(),
  est_favori: z.boolean().optional(),
});

// =============================================================================
// Schémas pour les relations livre-tag
// =============================================================================

export const BookTagsSchema = z.object({
  tag_ids: z.array(z.string().cuid("ID de tag invalide"))
    .min(1, "Au moins un tag doit être fourni")
    .max(20, "Maximum 20 tags autorisés par livre"),
});

// =============================================================================
// Schémas de filtrage et pagination
// =============================================================================

export const TagFiltersSchema = z.object({
  // Recherche textuelle
  q: z.string()
    .max(100, "La recherche ne peut pas dépasser 100 caractères")
    .optional(),
  
  // Filtres par type
  type: TagTypeSchema.optional(),
  
  // Filtres par statut
  est_favori: z.boolean().optional(),
  
  // Filtres par utilisation
  min_utilisation: z.number()
    .int("Le minimum d'utilisation doit être un entier")
    .min(0, "Le minimum d'utilisation doit être positif ou nul")
    .optional(),
  max_utilisation: z.number()
    .int("Le maximum d'utilisation doit être un entier")
    .min(0, "Le maximum d'utilisation doit être positif ou nul")
    .optional(),
  
  // Tri et ordre
  sort: z.enum(["nom", "type", "utilisation_count", "date_creation", "date_modification"])
    .optional()
    .default("nom"),
  order: z.enum(["asc", "desc"])
    .optional()
    .default("asc"),
  
  // Pagination
  page: z.number()
    .int("La page doit être un entier")
    .min(1, "La page doit être supérieure à 0")
    .optional()
    .default(1),
  limit: z.number()
    .int("La limite doit être un entier")
    .min(1, "La limite doit être d'au moins 1")
    .max(100, "La limite ne peut pas dépasser 100")
    .optional()
    .default(20),
  
  // Options d'inclusion
  include_book_count: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.min_utilisation !== undefined && data.max_utilisation !== undefined) {
    return data.min_utilisation <= data.max_utilisation;
  }
  return true;
}, {
  message: "Le minimum d'utilisation doit être inférieur ou égal au maximum",
  path: ["min_utilisation", "max_utilisation"],
});

export const TagBooksFiltersSchema = z.object({
  // Filtres spécifiques aux livres d'un tag
  statut: z.enum(["LU", "EN_COURS", "A_LIRE", "ABANDONNE"]).optional(),
  niveau_spicy: z.coerce.number()
    .int("Le niveau spicy doit être un entier")
    .min(0, "Le niveau spicy minimum est 0")
    .max(10, "Le niveau spicy maximum est 10")
    .optional(),
  niveau_dark: z.coerce.number()
    .int("Le niveau dark doit être un entier")
    .min(0, "Le niveau dark minimum est 0")
    .max(10, "Le niveau dark maximum est 10")
    .optional(),
  min_rating: z.coerce.number()
    .min(0, "La note minimum est 0")
    .max(10, "La note maximum est 10")
    .optional(),
  max_rating: z.coerce.number()
    .min(0, "La note minimum est 0")
    .max(10, "La note maximum est 10")
    .optional(),
  
  // Tri et ordre pour les livres
  sort: z.enum(["titre", "auteur", "note_generale", "date_creation", "date_lecture"])
    .optional()
    .default("date_creation"),
  order: z.enum(["asc", "desc"])
    .optional()
    .default("desc"),
  
  // Pagination
  page: z.coerce.number()
    .int("La page doit être un entier")
    .min(1, "La page doit être supérieure à 0")
    .optional()
    .default(1),
  limit: z.coerce.number()
    .int("La limite doit être un entier")
    .min(1, "La limite doit être d'au moins 1")
    .max(50, "La limite ne peut pas dépasser 50")
    .optional()
    .default(10),
}).refine((data) => {
  if (data.min_rating !== undefined && data.max_rating !== undefined) {
    return data.min_rating <= data.max_rating;
  }
  return true;
}, {
  message: "La note minimum doit être inférieure ou égale à la note maximum",
  path: ["min_rating", "max_rating"],
});

// =============================================================================
// Messages d'erreur localisés
// =============================================================================

export const TagErrorMessages = {
  fr: {
    TAG_NOT_FOUND: "Tag non trouvé",
    TAG_NAME_EXISTS: "Un tag avec ce nom existe déjà",
    TAG_IN_USE: "Ce tag est utilisé par des livres et ne peut pas être supprimé",
    UNAUTHORIZED: "Authentification requise",
    INVALID_TAG_DATA: "Données du tag invalides",
    TAGS_LIMIT_EXCEEDED: "Limite de tags par livre dépassée",
    BULK_OPERATION_FAILED: "Échec de l'opération groupée sur les tags",
  },
  en: {
    TAG_NOT_FOUND: "Tag not found",
    TAG_NAME_EXISTS: "A tag with this name already exists",
    TAG_IN_USE: "This tag is used by books and cannot be deleted",
    UNAUTHORIZED: "Authentication required",
    INVALID_TAG_DATA: "Invalid tag data",
    TAGS_LIMIT_EXCEEDED: "Book tags limit exceeded",
    BULK_OPERATION_FAILED: "Bulk tag operation failed",
  },
};

// =============================================================================
// Types TypeScript inférés
// =============================================================================

export type CreateTagData = z.infer<typeof CreateTagSchema>;
export type UpdateTagData = z.infer<typeof UpdateTagSchema>;
export type TagFilters = z.infer<typeof TagFiltersSchema>;
export type TagBooksFilters = z.infer<typeof TagBooksFiltersSchema>;
export type BookTagsData = z.infer<typeof BookTagsSchema>;
export type TagType = z.infer<typeof TagTypeSchema>;

// =============================================================================
// Constantes utiles
// =============================================================================

export const TAG_COLORS = {
  // Couleurs pour genres
  GENRE: {
    ROMANCE: "#EC4899", // Pink-500
    FANTASY: "#8B5CF6", // Violet-500
    THRILLER: "#EF4444", // Red-500
    MYSTERY: "#6366F1", // Indigo-500
    CONTEMPORARY: "#06B6D4", // Cyan-500
    HISTORICAL: "#D97706", // Amber-600
    PARANORMAL: "#7C3AED", // Violet-600
    URBAN_FANTASY: "#DC2626", // Red-600
  },
  // Couleurs pour tropes
  TROPE: {
    ENEMIES_TO_LOVERS: "#F59E0B", // Amber-500
    SLOW_BURN: "#10B981", // Emerald-500
    FAKE_DATING: "#F97316", // Orange-500
    SECOND_CHANCE: "#84CC16", // Lime-500
    FORBIDDEN_LOVE: "#E11D48", // Rose-600
    AGE_GAP: "#8B5CF6", // Violet-500
  },
  // Couleurs pour triggers
  TRIGGER: {
    VIOLENCE: "#B91C1C", // Red-700
    MATURE_CONTENT: "#991B1B", // Red-800
    PSYCHOLOGICAL: "#7C2D12", // Orange-800
    ABUSE: "#92400E", // Amber-800
  },
  // Couleur par défaut
  DEFAULT: "#6B7280", // Gray-500
} as const;

export const MAX_TAGS_PER_BOOK = 20;
export const TAG_NAME_MAX_LENGTH = 50;
export const TAG_SEARCH_MIN_LENGTH = 2;