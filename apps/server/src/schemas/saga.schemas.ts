import { z } from "zod";

// =============================================================================
// 📚 SCHÉMAS DE VALIDATION POUR LES SAGAS
// =============================================================================

// Enum pour le statut des sagas
export const SagaStatus = z.enum(["ONGOING", "COMPLETED", "HIATUS", "UNKNOWN"]);

// Messages d'erreur personnalisés
const ErrorMessages = {
  fr: {
    required: "Ce champ est obligatoire",
    name_min: "Le nom doit contenir au moins 2 caractères",
    name_max: "Le nom ne peut pas dépasser 200 caractères",
    slug_invalid: "Format de slug invalide (lettres, chiffres, tirets uniquement)",
    description_max: "La description ne peut pas dépasser 1000 caractères",
    sagaOrder_positive: "L'ordre dans la saga doit être positif"
  },
  en: {
    required: "This field is required",
    name_min: "Name must contain at least 2 characters",
    name_max: "Name cannot exceed 200 characters",
    slug_invalid: "Invalid slug format (letters, numbers, hyphens only)",
    description_max: "Description cannot exceed 1000 characters",
    sagaOrder_positive: "Saga order must be positive"
  }
};

// Fonction pour obtenir les messages d'erreur selon la langue
export const getErrorMessages = (lang: 'fr' | 'en' = 'fr') => ErrorMessages[lang];

// =============================================================================
// 📖 SCHÉMAS DE BASE POUR LES SAGAS
// =============================================================================

// Regex pour valider le slug (kebab-case)
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Fonction pour générer un slug à partir d'un nom
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôöõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '') // Supprime caractères spéciaux sauf espaces et tirets
    .replace(/\s+/g, '-') // Remplace espaces par tirets
    .replace(/-+/g, '-') // Supprime tirets multiples
    .replace(/^-|-$/g, ''); // Supprime tirets en début/fin
}

// =============================================================================
// 🔧 SCHÉMAS DE VALIDATION POUR CRÉATION/MISE À JOUR
// =============================================================================

// Schéma pour créer une saga
export const CreateSagaSchema = z.object({
  name: z.string({
    message: "Le nom de la saga est obligatoire"
  })
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères")
    .trim(),
    
  slug: z.string()
    .regex(slugRegex, "Format de slug invalide (lettres minuscules, chiffres, tirets uniquement)")
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(200, "Le slug ne peut pas dépasser 200 caractères")
    .optional(),
    
  description: z.string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
    
  status: SagaStatus.default("ONGOING"),
    
}).strict().transform((data) => {
  // Génère automatiquement le slug si non fourni
  if (!data.slug) {
    data.slug = generateSlug(data.name);
  }
  return data;
});

// Schéma pour mettre à jour une saga
export const UpdateSagaSchema = z.object({
  id: z.string().cuid("ID de saga invalide"),
  
  name: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères")
    .optional(),
    
  slug: z.string()
    .regex(slugRegex, "Format de slug invalide (lettres minuscules, chiffres, tirets uniquement)")
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(200, "Le slug ne peut pas dépasser 200 caractères")
    .optional(),
    
  description: z.string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
    
  status: SagaStatus.optional(),
    
}).strict();

// =============================================================================
// 🔗 SCHÉMAS POUR LA GESTION DES LIVRES DANS UNE SAGA
// =============================================================================

// Schéma pour assigner un livre à une saga
export const AssignBookToSagaSchema = z.object({
  sagaId: z.string().cuid("ID de saga invalide"),
  sagaOrder: z.number()
    .int("L'ordre doit être un nombre entier")
    .positive("L'ordre doit être positif"),
}).strict();

// Schéma pour réorganiser les livres d'une saga
export const ReorderSagaSchema = z.object({
  items: z.array(
    z.object({
      bookId: z.string().cuid("ID de livre invalide"),
      sagaOrder: z.number()
        .int("L'ordre doit être un nombre entier")
        .positive("L'ordre doit être positif"),
    })
  )
    .min(1, "Au moins un livre doit être fourni")
    .max(100, "Trop de livres à réorganiser en une fois"),
}).strict().refine((data) => {
  // Vérifier l'unicité des bookId
  const bookIds = data.items.map(item => item.bookId);
  const uniqueBookIds = new Set(bookIds);
  return bookIds.length === uniqueBookIds.size;
}, {
  message: "Chaque livre ne peut apparaître qu'une seule fois",
}).refine((data) => {
  // Vérifier l'unicité des sagaOrder
  const orders = data.items.map(item => item.sagaOrder);
  const uniqueOrders = new Set(orders);
  return orders.length === uniqueOrders.size;
}, {
  message: "Chaque ordre doit être unique",
});

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
    
  pageSize: z.string()
    .optional()
    .default("10")
    .refine(val => /^\d+$/.test(val), "PageSize doit être un nombre")
    .transform(val => parseInt(val))
    .refine(val => val > 0 && val <= 100, "PageSize doit être entre 1 et 100"),
});

// Schéma pour les filtres de recherche de sagas
export const SagaFiltersSchema = z.object({
  // Pagination
  ...PaginationSchema.shape,
  
  // Recherche textuelle
  search: z.string()
    .min(1, "Terme de recherche trop court")
    .max(100, "Terme de recherche trop long")
    .optional(),
    
  // Filtres par statut
  status: SagaStatus.optional(),
    
}).strict();

// Schéma pour filtrer les livres d'une saga
export const SagaBooksFiltersSchema = z.object({
  // Pagination
  ...PaginationSchema.shape,
  
  // Options d'inclusion des relations
  include_categories: z.string()
    .transform(val => val === "true")
    .optional(),
    
  include_tags: z.string()
    .transform(val => val === "true")
    .optional(),
    
}).strict();

// =============================================================================
// 📤 SCHÉMAS POUR LA SÉRIALISATION DES RÉPONSES
// =============================================================================

// Schéma pour sérialiser une saga
export const SagaResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  status: SagaStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
  
  // Métadonnées calculées optionnelles
  bookCount: z.number().optional(),
  firstBook: z.object({
    id: z.string(),
    titre: z.string(),
  }).nullable().optional(),
  lastBook: z.object({
    id: z.string(),
    titre: z.string(),
  }).nullable().optional(),
});

// Schéma pour sérialiser un livre avec informations de saga
export const BookWithSagaResponseSchema = z.object({
  id: z.string(),
  titre: z.string(),
  auteur: z.string(),
  sagaOrder: z.number(),
  
  // Relations saga
  saga: SagaResponseSchema.nullable(),
  
  // Informations de navigation dans la saga
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
export const PaginatedSagaResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SagaResponseSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    pages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  filters: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// 🎯 TYPES TYPESCRIPT INFÉRÉS
// =============================================================================

export type CreateSagaInput = z.infer<typeof CreateSagaSchema>;
export type UpdateSagaInput = z.infer<typeof UpdateSagaSchema>;
export type AssignBookToSagaInput = z.infer<typeof AssignBookToSagaSchema>;
export type ReorderSagaInput = z.infer<typeof ReorderSagaSchema>;
export type SagaFilters = z.infer<typeof SagaFiltersSchema>;
export type SagaBooksFilters = z.infer<typeof SagaBooksFiltersSchema>;
export type SagaResponse = z.infer<typeof SagaResponseSchema>;
export type BookWithSagaResponse = z.infer<typeof BookWithSagaResponseSchema>;

// Types pour les enums
export type SagaStatusType = z.infer<typeof SagaStatus>;