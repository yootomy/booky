import { z } from "zod";

// =============================================================================
// 📚 SCHÉMAS DE VALIDATION POUR LES LIVRES
// =============================================================================

// Enums pour les constantes
export const BookStatus = z.enum(["LU", "EN_COURS", "A_LIRE"]);
export const BookRythm = z.enum(["SLOW_BURN", "MEDIUM_BURN", "FAST_PACE", "INSTA_LOVE"]);
export const TagType = z.enum(["TROPE", "GENRE", "TRIGGER"]);

// Messages d'erreur personnalisés
const ErrorMessages = {
  fr: {
    required: "Ce champ est obligatoire",
    title_min: "Le titre doit contenir au moins 1 caractère",
    title_max: "Le titre ne peut pas dépasser 500 caractères",
    author_min: "L'auteur doit contenir au moins 1 caractère", 
    author_max: "L'auteur ne peut pas dépasser 200 caractères",
    isbn_invalid: "Format ISBN invalide",
    url_invalid: "URL invalide",
    rating_range: "La note doit être entre 0 et 10",
    pages_positive: "Le nombre de pages doit être positif",
    date_invalid: "Date invalide",
    email_invalid: "Email invalide",
    string_max: (max: number) => `Ne peut pas dépasser ${max} caractères`,
    number_min: (min: number) => `Doit être au minimum ${min}`,
    number_max: (max: number) => `Doit être au maximum ${max}`
  },
  en: {
    required: "This field is required",
    title_min: "Title must contain at least 1 character",
    title_max: "Title cannot exceed 500 characters", 
    author_min: "Author must contain at least 1 character",
    author_max: "Author cannot exceed 200 characters",
    isbn_invalid: "Invalid ISBN format",
    url_invalid: "Invalid URL",
    rating_range: "Rating must be between 0 and 10",
    pages_positive: "Number of pages must be positive",
    date_invalid: "Invalid date",
    email_invalid: "Invalid email",
    string_max: (max: number) => `Cannot exceed ${max} characters`,
    number_min: (min: number) => `Must be at least ${min}`,
    number_max: (max: number) => `Must be at most ${max}`
  }
};

// Fonction pour obtenir les messages d'erreur selon la langue
export const getErrorMessages = (lang: 'fr' | 'en' = 'fr') => ErrorMessages[lang];

// =============================================================================
// 📖 SCHÉMAS DE BASE POUR LES LIVRES
// =============================================================================

// Validation ISBN (format basique)
const isbnRegex = /^(?:97[89]\d{10}|\d{9}[\dX])$/;

// Schéma pour les notes (0-10)
const RatingSchema = z.number()
  .int("La note doit être un nombre entier")
  .min(0, "La note doit être au minimum 0")
  .max(10, "La note doit être au maximum 10");

// Schéma pour les URLs optionnelles
const OptionalUrlSchema = z.string()
  .url("URL invalide")
  .optional()
  .or(z.literal(""))
  .transform(val => val === "" ? undefined : val);

// Schéma pour les dates optionnelles
const OptionalDateSchema = z.string()
  .datetime("Format de date invalide")
  .optional()
  .or(z.literal(""))
  .transform(val => val === "" ? undefined : val ? new Date(val) : undefined);

// Schéma pour les dates (string vers Date)
const DateTransformSchema = z.string()
  .optional()
  .transform(val => val ? new Date(val) : undefined);

// =============================================================================
// 🔧 SCHÉMAS DE VALIDATION POUR CRÉATION/MISE À JOUR
// =============================================================================

// Schéma complet pour créer un livre
export const CreateBookSchema = z.object({
  // Champs obligatoires de base
  titre: z.string({
    message: "Le titre est obligatoire"
  })
    .min(1, "Le titre doit contenir au moins 1 caractère")
    .max(500, "Le titre ne peut pas dépasser 500 caractères")
    .trim(),
    
  auteur: z.string({
    message: "L'auteur est obligatoire"
  })
    .min(1, "L'auteur doit contenir au moins 1 caractère")
    .max(200, "L'auteur ne peut pas dépasser 200 caractères")
    .trim(),

  // Identifiants externes optionnels
  isbn: z.string()
    .regex(isbnRegex, "Format ISBN invalide (10 ou 13 chiffres)")
    .optional()
    .or(z.literal("")),
    
  google_books_id: z.string()
    .max(50, "ID Google Books trop long")
    .optional()
    .or(z.literal("")),
    
  open_library_id: z.string()
    .max(50, "ID Open Library trop long")
    .optional()
    .or(z.literal("")),

  // URLs et images
  image_couverture: OptionalUrlSchema,

  // Métadonnées du livre
  editeur: z.string()
    .max(200, "Le nom de l'éditeur ne peut pas dépasser 200 caractères")
    .optional()
    .or(z.literal("")),
    
  date_publication: DateTransformSchema,
  
  nombre_pages: z.number()
    .int("Le nombre de pages doit être un nombre entier")
    .positive("Le nombre de pages doit être positif")
    .max(10000, "Nombre de pages trop élevé")
    .optional()
    .nullable(),
    
  langue: z.string()
    .length(2, "Code langue doit faire 2 caractères (ex: FR, EN)")
    .toUpperCase()
    .default("FR"),

  // Données de lecture personnelles
  date_lecture: DateTransformSchema,
  statut: BookStatus.default("A_LIRE"),

  // Système de notation (obligatoire)
  note_generale: RatingSchema,
  niveau_spicy: RatingSchema,
  niveau_dark: RatingSchema,
  niveau_romance: RatingSchema,
  intensite_emotionnelle: RatingSchema,
  danger: RatingSchema,
  violence: RatingSchema,
  originalite: RatingSchema,

  // Rythme du livre
  rythme: BookRythm,

  // Contenus textuels longs
  resume_officiel: z.string()
    .max(5000, "Le résumé officiel ne peut pas dépasser 5000 caractères")
    .optional()
    .or(z.literal("")),
    
  resume_personnel: z.string()
    .max(3000, "Le résumé personnel ne peut pas dépasser 3000 caractères")
    .optional()
    .or(z.literal("")),
    
  critique_detaillee: z.string()
    .max(5000, "La critique détaillée ne peut pas dépasser 5000 caractères")
    .optional()
    .or(z.literal("")),
    
  citations_favorites: z.string()
    .max(2000, "Les citations ne peuvent pas dépasser 2000 caractères")
    .optional()
    .or(z.literal("")),
    
  pourquoi_aimer: z.string()
    .max(1000, "Ce champ ne peut pas dépasser 1000 caractères")
    .optional()
    .or(z.literal("")),
    
  questions_sur_le_livre: z.string()
    .max(1000, "Ce champ ne peut pas dépasser 1000 caractères")
    .optional()
    .or(z.literal("")),
    
  recommandation_personnalisee: z.string()
    .max(500, "La recommandation ne peut pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),

  // Flags
  ajout_manuel: z.boolean().default(true),

  // Saga information
  sagaId: z.string()
    .cuid("ID de saga invalide")
    .optional()
    .nullable()
    .or(z.literal("")),
    
  sagaOrder: z.number()
    .int("L'ordre dans la saga doit être un nombre entier")
    .positive("L'ordre dans la saga doit être positif")
    .optional()
    .nullable(),

  // Relations (IDs des catégories et tags)
  categories: z.array(z.string().cuid("ID de catégorie invalide"))
    .default([])
    .optional(),
    
  tags: z.array(z.string().cuid("ID de tag invalide"))
    .default([])
    .optional(),
    
}).strict(); // Rejette les propriétés non définies

// Schéma pour mettre à jour un livre (tous les champs optionnels sauf les relations)
export const UpdateBookSchema = CreateBookSchema.partial().extend({
  id: z.string().cuid("ID de livre invalide"),
  // Les relations sont gérées séparément
  categories: z.array(z.string().cuid()).optional(),
  tags: z.array(z.string().cuid()).optional(),
}).strict();

// =============================================================================
// 🔍 SCHÉMAS POUR LES REQUÊTES DE RECHERCHE ET FILTRAGE
// =============================================================================

// Schéma pour les paramètres de pagination
export const PaginationSchema = z.object({
  page: z.string()
    .optional()
    .default("1")
    .refine(val => /^\d+$/.test(val), "Page doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val > 0, "Page doit être supérieure à 0"),
    
  limit: z.string()
    .optional()
    .default("10")
    .refine(val => /^\d+$/.test(val), "Limit doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 100, "Limit doit être entre 1 et 100"),
});

// Options de tri disponibles
export const SortOptions = z.enum([
  "date_creation", "date_modification", "titre", "auteur", 
  "note_generale", "niveau_spicy", "niveau_dark", "niveau_romance",
  "date_lecture", "nombre_pages", "date_publication", "sagaOrder"
]);

export const SortOrder = z.enum(["asc", "desc"]);

// Schéma pour les filtres de recherche
export const BookFiltersSchema = z.object({
  // Pagination et tri
  ...PaginationSchema.shape,
  sort: SortOptions.default("date_creation"),
  order: SortOrder.default("desc"),
  
  // Recherche textuelle
  search: z.string()
    .min(1, "Terme de recherche trop court")
    .max(100, "Terme de recherche trop long")
    .optional(),
    
  q: z.string()
    .min(1, "Terme de recherche trop court")
    .max(100, "Terme de recherche trop long")
    .optional(),

  // Filtres par statut et niveaux (support bilingue)
  statut: BookStatus.optional(),
  status: BookStatus.optional(),
  
  niveau_spicy: z.string()
    .regex(/^\d+$/, "Niveau spicy doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Niveau spicy doit être entre 0 et 10")
    .optional(),
    
  spicy_level: z.string()
    .regex(/^\d+$/, "Spicy level must be a number")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Spicy level must be between 0 and 10")
    .optional(),

  // Support des ranges pour spicy
  niveau_spicy_min: z.string()
    .regex(/^\d+$/, "Niveau spicy min doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Niveau spicy min doit être entre 0 et 10")
    .optional(),

  niveau_spicy_max: z.string()
    .regex(/^\d+$/, "Niveau spicy max doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Niveau spicy max doit être entre 0 et 10")
    .optional(),

  niveau_dark: z.string()
    .regex(/^\d+$/, "Niveau dark doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Niveau dark doit être entre 0 et 10")
    .optional(),
    
  dark_level: z.string()
    .regex(/^\d+$/, "Dark level must be a number")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Dark level must be between 0 and 10")
    .optional(),

  // Support des ranges pour dark
  niveau_dark_min: z.string()
    .regex(/^\d+$/, "Niveau dark min doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Niveau dark min doit être entre 0 et 10")
    .optional(),

  niveau_dark_max: z.string()
    .regex(/^\d+$/, "Niveau dark max doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Niveau dark max doit être entre 0 et 10")
    .optional(),

  // Filtres par genre/catégorie
  genre: z.string().max(50, "Nom de genre trop long").optional(),
  category: z.string().max(50, "Category name too long").optional(),
  
  // Filtres par auteur
  author: z.string().max(100, "Author name too long").optional(),
  auteur: z.string().max(100, "Nom d'auteur trop long").optional(),
  
  // Filtres par notes
  min_rating: z.string()
    .regex(/^\d+$/, "Note minimum doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Note minimum doit être entre 0 et 10")
    .optional(),
    
  max_rating: z.string()
    .regex(/^\d+$/, "Note maximum doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Note maximum doit être entre 0 et 10")
    .optional(),
    
  note_min: z.string()
    .regex(/^\d+$/, "Note min doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Note min doit être entre 0 et 10")
    .optional(),
    
  note_max: z.string()
    .regex(/^\d+$/, "Note max doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val >= 0 && val <= 10, "Note max doit être entre 0 et 10")
    .optional(),

  // Filtres par langue et rythme
  language: z.string().length(2, "Code langue invalide").toUpperCase().optional(),
  langue: z.string().length(2, "Code langue invalide").toUpperCase().optional(),
  rythme: BookRythm.optional(),

  // Filtres par dates
  date_lecture_after: z.string()
    .datetime("Format de date invalide")
    .transform(val => new Date(val))
    .optional(),
    
  date_lecture_before: z.string()
    .datetime("Format de date invalide")
    .transform(val => new Date(val))
    .optional(),
    
  date_publication_after: z.string()
    .datetime("Format de date invalide")
    .transform(val => new Date(val))
    .optional(),
    
  date_publication_before: z.string()
    .datetime("Format de date invalide")
    .transform(val => new Date(val))
    .optional(),

  // Filtres par tags
  tag: z.string().max(50, "Nom de tag trop long").optional(),

  // Filtres par collection
  collection: z.string().max(50, "ID de collection trop long").optional(),

  // Filtres booléens
  ajout_manuel: z.string()
    .transform(val => val === "true")
    .optional(),
    
  // Filtres par catégorie/tag avec relations
  categories: z.string()
    .max(50, "ID de catégorie trop long")
    .optional(),
    
  // Filtres par saga
  sagaId: z.string()
    .cuid("ID de saga invalide")
    .optional(),
    
  sagaSlug: z.string()
    .min(1, "Slug de saga requis")
    .max(200, "Slug de saga trop long")
    .optional(),

  // Options d'inclusion des relations
  include_categories: z.string()
    .transform(val => val === "true")
    .optional(),
    
  include_tags: z.string()
    .transform(val => val === "true")
    .optional(),

  include_saga: z.string()
    .transform(val => val === "true")
    .optional(),
    
}).strict();

// Schéma spécifique pour l'endpoint de recherche (q obligatoire)
export const BookSearchSchema = BookFiltersSchema.extend({
  q: z.string({
    message: "Le terme de recherche est obligatoire"
  })
    .min(1, "Le terme de recherche doit contenir au moins 1 caractère")
    .max(100, "Le terme de recherche ne peut pas dépasser 100 caractères")
    .trim(),
});

// =============================================================================
// 📤 SCHÉMAS POUR LA SÉRIALISATION DES RÉPONSES
// =============================================================================

// Schéma pour sérialiser un utilisateur (sans données sensibles)
export const UserResponseSchema = z.object({
  id: z.string(),
  nom_complet: z.string().nullable(),
  avatar: z.string().nullable(),
});

// Schéma pour sérialiser une catégorie
export const CategoryResponseSchema = z.object({
  id: z.string(),
  nom: z.string(),
  couleur: z.string(),
  icone: z.string(),
  description: z.string().nullable(),
  ordre_affichage: z.number(),
  est_actif: z.boolean(),
});

// Schéma pour sérialiser un tag
export const TagResponseSchema = z.object({
  id: z.string(),
  nom: z.string(),
  couleur: z.string(),
  type: TagType,
  utilisation_count: z.number(),
  est_favori: z.boolean(),
});

// Schéma pour sérialiser un livre complet (réponse API)
export const BookResponseSchema = z.object({
  id: z.string(),
  titre: z.string(),
  auteur: z.string(),
  isbn: z.string().nullable(),
  image_couverture: z.string().nullable(),
  google_books_id: z.string().nullable(),
  open_library_id: z.string().nullable(),
  resume_officiel: z.string().nullable(),
  editeur: z.string().nullable(),
  date_publication: z.date().nullable(),
  nombre_pages: z.number().nullable(),
  langue: z.string(),
  date_lecture: z.date().nullable(),
  statut: BookStatus,
  note_generale: z.number(),
  niveau_spicy: z.number(),
  niveau_dark: z.number(),
  niveau_romance: z.number(),
  intensite_emotionnelle: z.number(),
  danger: z.number(),
  violence: z.number(),
  originalite: z.number(),
  rythme: BookRythm,
  resume_personnel: z.string().nullable(),
  critique_detaillee: z.string().nullable(),
  citations_favorites: z.string().nullable(),
  pourquoi_aimer: z.string().nullable(),
  questions_sur_le_livre: z.string().nullable(),
  recommandation_personnalisee: z.string().nullable(),
  ajout_manuel: z.boolean(),
  date_creation: z.date(),
  date_modification: z.date(),
  createdBy: z.string(),
  sagaId: z.string().nullable(),
  sagaOrder: z.number().nullable(),
  
  // Relations
  user: UserResponseSchema.optional(),
  saga: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    status: z.enum(["ONGOING", "COMPLETED", "HIATUS", "UNKNOWN"]),
  }).nullable().optional(),
  categories: z.array(z.object({
    id: z.string(),
    bookId: z.string(),
    categoryId: z.string(),
    category: CategoryResponseSchema,
  })).optional(),
  tags: z.array(z.object({
    id: z.string(),
    bookId: z.string(),
    tagId: z.string(),
    tag: TagResponseSchema,
  })).optional(),
  
  // Navigation dans la saga (optionnel)
  sagaNeighbors: z.object({
    previous: z.object({
      id: z.string(),
      titre: z.string(),
      sagaOrder: z.number(),
    }).nullable(),
    next: z.object({
      id: z.string(),
      titre: z.string(),
      sagaOrder: z.number(),
    }).nullable(),
  }).optional(),
});

// Schéma pour la réponse paginée
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  success: z.boolean(),
  data: z.array(itemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
  filters: z.record(z.string(), z.unknown()).optional(),
  search_info: z.object({
    total_results: z.number(),
    filters_applied: z.array(z.string()),
    available_filters: z.record(z.string(), z.unknown()),
  }).optional(),
});

// =============================================================================
// 🎯 TYPES TYPESCRIPT INFÉRÉS
// =============================================================================

export type CreateBookInput = z.infer<typeof CreateBookSchema>;
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;
export type BookFilters = z.infer<typeof BookFiltersSchema>;
export type BookSearch = z.infer<typeof BookSearchSchema>;
export type BookResponse = z.infer<typeof BookResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type TagResponse = z.infer<typeof TagResponseSchema>;

// Types pour les enums
export type BookStatusType = z.infer<typeof BookStatus>;
export type BookRythmType = z.infer<typeof BookRythm>;
export type TagTypeEnum = z.infer<typeof TagType>;