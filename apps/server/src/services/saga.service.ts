import { db } from "@/utils/db";
import { 
  CreateSagaInput, 
  UpdateSagaInput, 
  AssignBookToSagaInput, 
  ReorderSagaInput,
  SagaFilters,
  generateSlug 
} from "../schemas/saga.schemas";
import { SagaNeighbors } from "../types/api";

// =============================================================================
// 📚 SERVICE SAGA - LOGIQUE MÉTIER
// =============================================================================

export class SagaService {
  
  // ---------------------------------------------------------------------------
  // 📖 GESTION DES SAGAS
  // ---------------------------------------------------------------------------

  /**
   * Créer une nouvelle saga
   */
  static async createSaga(data: CreateSagaInput) {
    // Générer le slug si non fourni
    const sagaData = { ...data };
    if (!sagaData.slug) {
      sagaData.slug = generateSlug(sagaData.name);
    }

    // Vérifier l'unicité du slug
    const existingSaga = await db.saga.findUnique({
      where: { slug: sagaData.slug }
    });

    if (existingSaga) {
      // Ajouter un suffixe numérique si le slug existe
      let counter = 1;
      let newSlug = `${sagaData.slug}-${counter}`;
      
      while (await db.saga.findUnique({ where: { slug: newSlug } })) {
        counter++;
        newSlug = `${sagaData.slug}-${counter}`;
      }
      
      sagaData.slug = newSlug;
    }

    return await db.saga.create({
      data: sagaData as any,
      include: {
        books: {
          select: {
            id: true,
            titre: true,
            sagaOrder: true,
          },
          orderBy: {
            sagaOrder: 'asc'
          }
        }
      }
    });
  }

  /**
   * Mettre à jour une saga
   */
  static async updateSaga(id: string, data: Partial<UpdateSagaInput>) {
    // Si le nom est modifié et pas de nouveau slug fourni, régénérer le slug
    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
      
      // Vérifier l'unicité du nouveau slug
      const existingSaga = await db.saga.findFirst({
        where: { 
          slug: data.slug,
          NOT: { id }
        }
      });

      if (existingSaga) {
        let counter = 1;
        let newSlug = `${data.slug}-${counter}`;
        
        while (await db.saga.findFirst({ 
          where: { 
            slug: newSlug,
            NOT: { id }
          }
        })) {
          counter++;
          newSlug = `${data.slug}-${counter}`;
        }
        
        data.slug = newSlug;
      }
    }

    return await db.saga.update({
      where: { id },
      data,
      include: {
        books: {
          select: {
            id: true,
            titre: true,
            sagaOrder: true,
          },
          orderBy: {
            sagaOrder: 'asc'
          }
        }
      }
    });
  }

  /**
   * Supprimer une saga
   */
  static async deleteSaga(id: string) {
    // La suppression va mettre sagaId à null pour tous les livres (onDelete: SetNull)
    return await db.saga.delete({
      where: { id }
    });
  }

  /**
   * Obtenir une saga par ID
   */
  static async getSagaById(id: string) {
    const saga = await db.saga.findUnique({
      where: { id },
      include: {
        books: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            sagaOrder: true,
            image_couverture: true,
          },
          orderBy: {
            sagaOrder: 'asc'
          }
        }
      }
    });

    if (!saga) {
      throw new Error("Saga non trouvée");
    }

    return {
      ...saga,
      bookCount: saga.books.length,
      firstBook: saga.books[0] || null,
      lastBook: saga.books[saga.books.length - 1] || null,
    };
  }

  /**
   * Obtenir une saga par slug
   */
  static async getSagaBySlug(slug: string) {
    const saga = await db.saga.findUnique({
      where: { slug },
      include: {
        books: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            sagaOrder: true,
            image_couverture: true,
          },
          orderBy: {
            sagaOrder: 'asc'
          }
        }
      }
    });

    if (!saga) {
      throw new Error("Saga non trouvée");
    }

    return {
      ...saga,
      bookCount: saga.books.length,
      firstBook: saga.books[0] || null,
      lastBook: saga.books[saga.books.length - 1] || null,
    };
  }

  /**
   * Lister les sagas avec filtres et pagination
   */
  static async getSagas(filters: SagaFilters) {
    const { page = 1, pageSize = 10, search, status } = filters;
    const skip = (page - 1) * pageSize;

    // Construction des conditions WHERE
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Exécuter les requêtes en parallèle
    const [sagas, total] = await Promise.all([
      db.saga.findMany({
        where,
        include: {
          books: {
            select: {
              id: true,
              titre: true,
            },
            orderBy: {
              sagaOrder: 'asc'
            }
          }
        },
        orderBy: [
          { name: 'asc' }
        ],
        skip,
        take: pageSize,
      }),
      db.saga.count({ where })
    ]);

    // Enrichir avec des métadonnées
    const enrichedSagas = sagas.map(saga => ({
      ...saga,
      bookCount: saga.books.length,
      firstBook: saga.books[0] || null,
      lastBook: saga.books[saga.books.length - 1] || null,
    }));

    const pages = Math.ceil(total / pageSize);

    return {
      data: enrichedSagas,
      pagination: {
        page,
        pageSize,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      }
    };
  }

  // ---------------------------------------------------------------------------
  // 📚 GESTION DES LIVRES DANS UNE SAGA
  // ---------------------------------------------------------------------------

  /**
   * Assigner un livre à une saga
   */
  static async assignBookToSaga(bookId: string, input: AssignBookToSagaInput) {
    const { sagaId, sagaOrder } = input;

    // Vérifier que la saga existe
    const saga = await db.saga.findUnique({
      where: { id: sagaId }
    });

    if (!saga) {
      throw new Error("Saga non trouvée");
    }

    // Vérifier que le livre existe
    const book = await db.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      throw new Error("Livre non trouvé");
    }

    // Vérifier que l'ordre n'est pas déjà pris
    const existingBook = await db.book.findFirst({
      where: {
        sagaId,
        sagaOrder,
        NOT: { id: bookId }
      }
    });

    if (existingBook) {
      throw new Error(`L'ordre ${sagaOrder} est déjà occupé dans cette saga par le livre "${existingBook.titre}"`);
    }

    // Assigner le livre à la saga
    return await db.book.update({
      where: { id: bookId },
      data: {
        sagaId,
        sagaOrder
      },
      include: {
        saga: true
      }
    });
  }

  /**
   * Retirer un livre d'une saga
   */
  static async removeBookFromSaga(bookId: string) {
    // Vérifier que le livre existe et fait partie d'une saga
    const book = await db.book.findUnique({
      where: { id: bookId },
      include: { saga: true }
    });

    if (!book) {
      throw new Error("Livre non trouvé");
    }

    if (!book.sagaId) {
      throw new Error("Ce livre ne fait pas partie d'une saga");
    }

    // Retirer le livre de la saga
    return await db.book.update({
      where: { id: bookId },
      data: {
        sagaId: null,
        sagaOrder: null
      }
    });
  }

  /**
   * Réorganiser les livres d'une saga
   */
  static async reorderSaga(sagaId: string, input: ReorderSagaInput) {
    const { items } = input;

    // Vérifier que la saga existe
    const saga = await db.saga.findUnique({
      where: { id: sagaId },
      include: {
        books: {
          select: { id: true }
        }
      }
    });

    if (!saga) {
      throw new Error("Saga non trouvée");
    }

    // Vérifier que tous les livres appartiennent à cette saga
    const sagaBookIds = saga.books.map(book => book.id);
    const inputBookIds = items.map(item => item.bookId);

    for (const bookId of inputBookIds) {
      if (!sagaBookIds.includes(bookId)) {
        throw new Error(`Le livre ${bookId} ne fait pas partie de cette saga`);
      }
    }

    // Utiliser une transaction pour la réorganisation
    return await db.$transaction(async (tx) => {
      // Étape 1: Mettre tous les ordres à des valeurs temporaires négatives
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await tx.book.update({
          where: { id: item.bookId },
          data: { sagaOrder: -(i + 1) }
        });
      }

      // Étape 2: Mettre les vrais ordres
      const updatedBooks = [];
      for (const item of items) {
        const updatedBook = await tx.book.update({
          where: { id: item.bookId },
          data: { sagaOrder: item.sagaOrder },
          include: {
            saga: true
          }
        });
        updatedBooks.push(updatedBook);
      }

      return updatedBooks.sort((a, b) => a.sagaOrder! - b.sagaOrder!);
    });
  }

  /**
   * Obtenir les livres d'une saga (triés par ordre)
   */
  static async getSagaBooks(sagaId: string, options: { includeCategories?: boolean, includeTags?: boolean } = {}) {
    const { includeCategories = false, includeTags = false } = options;

    const saga = await db.saga.findUnique({
      where: { id: sagaId }
    });

    if (!saga) {
      throw new Error("Saga non trouvée");
    }

    return await db.book.findMany({
      where: { sagaId },
      include: {
        book_category: includeCategories ? {
          include: {
            category: true
          }
        } : false,
        book_tag: includeTags ? {
          include: {
            tag: true
          }
        } : false,
        saga: true
      },
      orderBy: {
        sagaOrder: 'asc'
      }
    });
  }

  /**
   * Obtenir les voisins d'un livre dans sa saga (précédent/suivant)
   */
  static async getSagaNeighbors(bookId: string): Promise<SagaNeighbors> {
    const book = await db.book.findUnique({
      where: { id: bookId },
      select: {
        sagaId: true,
        sagaOrder: true
      }
    });

    if (!book || !book.sagaId || !book.sagaOrder) {
      return { previous: undefined, next: undefined };
    }

    const [previous, next] = await Promise.all([
      // Livre précédent
      db.book.findFirst({
        where: {
          sagaId: book.sagaId,
          sagaOrder: { lt: book.sagaOrder }
        },
        select: {
          id: true,
          titre: true,
          sagaOrder: true
        },
        orderBy: {
          sagaOrder: 'desc'
        }
      }),
      // Livre suivant  
      db.book.findFirst({
        where: {
          sagaId: book.sagaId,
          sagaOrder: { gt: book.sagaOrder }
        },
        select: {
          id: true,
          titre: true,
          sagaOrder: true
        },
        orderBy: {
          sagaOrder: 'asc'
        }
      })
    ]);

    return {
      previous: previous ? {
        id: previous.id,
        titre: previous.titre,
        sagaOrder: previous.sagaOrder!
      } : undefined,
      next: next ? {
        id: next.id,
        titre: next.titre,
        sagaOrder: next.sagaOrder!
      } : undefined
    };
  }

  /**
   * Obtenir le prochain ordre disponible dans une saga
   */
  static async getNextSagaOrder(sagaId: string): Promise<number> {
    const lastBook = await db.book.findFirst({
      where: { sagaId },
      select: { sagaOrder: true },
      orderBy: { sagaOrder: 'desc' }
    });

    return (lastBook?.sagaOrder || 0) + 1;
  }

  /**
   * Vérifier si un ordre est disponible dans une saga
   */
  static async isOrderAvailable(sagaId: string, sagaOrder: number, excludeBookId?: string): Promise<boolean> {
    const existingBook = await db.book.findFirst({
      where: {
        sagaId,
        sagaOrder,
        ...(excludeBookId && { NOT: { id: excludeBookId } })
      }
    });

    return !existingBook;
  }
}