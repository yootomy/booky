import { protectedProcedure, publicProcedure } from "../lib/orpc";
import { SagaService } from "../services/saga.service";
import { 
  CreateSagaSchema,
  UpdateSagaSchema,
  AssignBookToSagaSchema,
  ReorderSagaSchema,
  SagaFiltersSchema,
  SagaBooksFiltersSchema 
} from "../schemas/saga.schemas";
import { z } from "zod";
import { ORPCError } from "@orpc/server";

// Schema pour les paramètres avec ID
const IdParamsSchema = z.object({
  id: z.string().cuid("ID invalide")
});

const SlugParamsSchema = z.object({
  slug: z.string().min(1, "Slug requis")
});

const BookIdParamsSchema = z.object({
  bookId: z.string().cuid("ID de livre invalide")
});

// =============================================================================
// 🔒 MIDDLEWARE D'AUTORISATION ADMIN
// =============================================================================

const requireAdmin = publicProcedure.use(async ({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  if (context.user.role !== 'ADMIN') {
    throw new ORPCError("FORBIDDEN", { message: "Accès administrateur requis" });
  }
  return next({
    context: {
      user: context.user,
    },
  });
});

const adminProcedure = requireAdmin;

// =============================================================================
// 📚 ROUTER SAGA
// =============================================================================

export const sagaRouter = {
  
  // ---------------------------------------------------------------------------
  // 📖 GESTION DES SAGAS (CRUD)
  // ---------------------------------------------------------------------------

  /**
   * GET /sagas - Lister les sagas avec filtres et pagination
   * Public (lecture seule)
   */
  list: publicProcedure
    .input(SagaFiltersSchema)
    .handler(async ({ input }) => {
      try {
        const result = await SagaService.getSagas(input);
        return {
          success: true,
          data: result.data,
          pagination: result.pagination
        };
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la récupération des sagas" 
        });
      }
    }),

  /**
   * GET /sagas/:id - Obtenir une saga par ID
   * Public (lecture seule)
   */
  getById: publicProcedure
    .input(IdParamsSchema)
    .handler(async ({ input }) => {
      try {
        const saga = await SagaService.getSagaById(input.id);
        return {
          success: true,
          data: saga
        };
      } catch (error) {
        if (error instanceof Error && error.message === "Saga non trouvée") {
          throw new ORPCError("NOT_FOUND", { message: "Saga non trouvée" });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la récupération de la saga" 
        });
      }
    }),

  /**
   * GET /sagas/slug/:slug - Obtenir une saga par slug
   * Public (lecture seule)
   */
  getBySlug: publicProcedure
    .input(SlugParamsSchema)
    .handler(async ({ input }) => {
      try {
        const saga = await SagaService.getSagaBySlug(input.slug);
        return {
          success: true,
          data: saga
        };
      } catch (error) {
        if (error instanceof Error && error.message === "Saga non trouvée") {
          throw new ORPCError("NOT_FOUND", { message: "Saga non trouvée" });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la récupération de la saga" 
        });
      }
    }),

  /**
   * POST /sagas - Créer une nouvelle saga
   * Admin uniquement
   */
  create: adminProcedure
    .input(CreateSagaSchema)
    .handler(async ({ input }) => {
      try {
        const saga = await SagaService.createSaga(input);
        return {
          success: true,
          data: saga,
          message: "Saga créée avec succès"
        };
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la création de la saga" 
        });
      }
    }),

  /**
   * PATCH /sagas/:id - Mettre à jour une saga
   * Admin uniquement
   */
  update: adminProcedure
    .input(z.object({
      id: z.string().cuid("ID invalide"),
      data: UpdateSagaSchema.omit({ id: true })
    }))
    .handler(async ({ input }) => {
      try {
        const saga = await SagaService.updateSaga(input.id, input.data);
        return {
          success: true,
          data: saga,
          message: "Saga mise à jour avec succès"
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("non trouvée")) {
          throw new ORPCError("NOT_FOUND", { message: "Saga non trouvée" });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la mise à jour de la saga" 
        });
      }
    }),

  /**
   * DELETE /sagas/:id - Supprimer une saga
   * Admin uniquement
   */
  delete: adminProcedure
    .input(IdParamsSchema)
    .handler(async ({ input }) => {
      try {
        await SagaService.deleteSaga(input.id);
        return {
          success: true,
          message: "Saga supprimée avec succès"
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("non trouvée")) {
          throw new ORPCError("NOT_FOUND", { message: "Saga non trouvée" });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la suppression de la saga" 
        });
      }
    }),

  // ---------------------------------------------------------------------------
  // 📚 GESTION DES LIVRES DANS UNE SAGA
  // ---------------------------------------------------------------------------

  /**
   * GET /sagas/:id/books - Obtenir les livres d'une saga (triés par ordre)
   * Public (lecture seule)
   */
  getBooks: publicProcedure
    .input(z.object({
      id: z.string().cuid("ID de saga invalide"),
      filters: SagaBooksFiltersSchema.optional()
    }))
    .handler(async ({ input }) => {
      try {
        const { filters } = input;
        const books = await SagaService.getSagaBooks(input.id, {
          includeCategories: filters?.include_categories || false,
          includeTags: filters?.include_tags || false
        });
        
        return {
          success: true,
          data: books
        };
      } catch (error) {
        if (error instanceof Error && error.message === "Saga non trouvée") {
          throw new ORPCError("NOT_FOUND", { message: "Saga non trouvée" });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la récupération des livres" 
        });
      }
    }),

  /**
   * PATCH /books/:bookId/saga - Assigner un livre à une saga
   * Admin uniquement
   */
  assignBook: adminProcedure
    .input(z.object({
      bookId: z.string().cuid("ID de livre invalide"),
      data: AssignBookToSagaSchema
    }))
    .handler(async ({ input }) => {
      try {
        const book = await SagaService.assignBookToSaga(input.bookId, input.data);
        return {
          success: true,
          data: book,
          message: "Livre assigné à la saga avec succès"
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("non trouvé")) {
            throw new ORPCError("NOT_FOUND", { message: error.message });
          }
          if (error.message.includes("occupé")) {
            throw new ORPCError("CONFLICT", { message: error.message });
          }
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de l'assignation du livre" 
        });
      }
    }),

  /**
   * DELETE /books/:bookId/saga - Retirer un livre d'une saga
   * Admin uniquement
   */
  removeBook: adminProcedure
    .input(BookIdParamsSchema)
    .handler(async ({ input }) => {
      try {
        const book = await SagaService.removeBookFromSaga(input.bookId);
        return {
          success: true,
          data: book,
          message: "Livre retiré de la saga avec succès"
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("non trouvé")) {
            throw new ORPCError("NOT_FOUND", { message: error.message });
          }
          if (error.message.includes("ne fait pas partie")) {
            throw new ORPCError("BAD_REQUEST", { message: error.message });
          }
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors du retrait du livre" 
        });
      }
    }),

  /**
   * PATCH /sagas/:id/reorder - Réorganiser les livres d'une saga
   * Admin uniquement
   */
  reorderBooks: adminProcedure
    .input(z.object({
      id: z.string().cuid("ID de saga invalide"),
      data: ReorderSagaSchema
    }))
    .handler(async ({ input }) => {
      try {
        const books = await SagaService.reorderSaga(input.id, input.data);
        return {
          success: true,
          data: books,
          message: "Livres réorganisés avec succès"
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("non trouvée")) {
            throw new ORPCError("NOT_FOUND", { message: error.message });
          }
          if (error.message.includes("ne fait pas partie")) {
            throw new ORPCError("BAD_REQUEST", { message: error.message });
          }
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la réorganisation" 
        });
      }
    }),

  // ---------------------------------------------------------------------------
  // 🔍 UTILITAIRES ET MÉTADONNÉES
  // ---------------------------------------------------------------------------

  /**
   * GET /books/:bookId/saga/neighbors - Obtenir les voisins d'un livre dans sa saga
   * Public (lecture seule)
   */
  getBookNeighbors: publicProcedure
    .input(BookIdParamsSchema)
    .handler(async ({ input }) => {
      try {
        const neighbors = await SagaService.getSagaNeighbors(input.bookId);
        return {
          success: true,
          data: neighbors
        };
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la récupération des voisins" 
        });
      }
    }),

  /**
   * GET /sagas/:id/next-order - Obtenir le prochain ordre disponible dans une saga
   * Admin uniquement
   */
  getNextOrder: adminProcedure
    .input(IdParamsSchema)
    .handler(async ({ input }) => {
      try {
        const nextOrder = await SagaService.getNextSagaOrder(input.id);
        return {
          success: true,
          data: { nextOrder }
        };
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors du calcul de l'ordre suivant" 
        });
      }
    }),

  /**
   * GET /sagas/:id/order/:order/available - Vérifier si un ordre est disponible
   * Admin uniquement
   */
  checkOrderAvailable: adminProcedure
    .input(z.object({
      id: z.string().cuid("ID de saga invalide"),
      order: z.number().int().positive("L'ordre doit être positif"),
      excludeBookId: z.string().cuid().optional()
    }))
    .handler(async ({ input }) => {
      try {
        const isAvailable = await SagaService.isOrderAvailable(
          input.id, 
          input.order, 
          input.excludeBookId
        );
        return {
          success: true,
          data: { available: isAvailable }
        };
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { 
          message: error instanceof Error ? error.message : "Erreur lors de la vérification de disponibilité" 
        });
      }
    })
};