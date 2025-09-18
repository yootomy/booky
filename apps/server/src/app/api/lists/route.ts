import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { randomUUID } from "crypto";
import {
  handleError,
  detectLanguageFromHeaders,
  withErrorHandler,
  ValidationError
} from "@/utils/error-handler";
import { z } from "zod";

// Schémas de validation
const CreateListSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z.string().optional(),
  couleur: z.string().regex(/^#[0-9A-F]{6}$/i, "Format de couleur invalide").default("#DC143C"),
  icone: z.string().optional(),
  ordre_affichage: z.number().int().min(0).default(0),
  est_publique: z.boolean().default(true),
  books: z.array(z.string()).optional() // IDs des livres à ajouter
});

const UpdateListSchema = CreateListSchema.partial();

const ListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['nom', 'date_creation', 'date_modification', 'ordre_affichage']).default('ordre_affichage'),
  order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  est_publique: z.coerce.boolean().optional(),
  include_books: z.coerce.boolean().default(false)
});

// GET /api/lists - Lister toutes les listes
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());

  const validatedQuery = ListFiltersSchema.parse(queryObject);
  const { page, limit, sort, order, search, est_publique, include_books } = validatedQuery;

  // Construire les filtres
  const where: any = {};

  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  if (est_publique !== undefined) {
    where.est_publique = est_publique;
  }

  // Calculer la pagination
  const skip = (page - 1) * limit;

  // Construire l'ordre de tri
  const orderBy: any = {};
  orderBy[sort] = order;

  // Construire l'include
  const include: any = {
    user: {
      select: { id: true, nom_complet: true, avatar: true }
    },
    _count: {
      select: { list_books: true }
    }
  };

  if (include_books) {
    include.list_books = {
      include: {
        book: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            image_couverture: true,
            note_generale: true,
            niveau_spicy: true,
            niveau_dark: true
          }
        }
      },
      orderBy: { ordre: 'asc' }
    };
  }

  // Exécuter les requêtes
  const [lists, totalCount] = await Promise.all([
    db.custom_list.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include
    }),
    db.custom_list.count({ where })
  ]);

  // Calculer les métadonnées de pagination
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return NextResponse.json({
    success: true,
    data: lists,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage
    },
    filters: {
      search,
      sort,
      order,
      est_publique,
      include_books
    }
  });
});

// POST /api/lists - Créer une nouvelle liste (protégé)
export const POST = withErrorHandler(async (request: NextRequest) => {
  return withBetterAuth(request, async (req, user) => {
    const body = await req.json();

    // Valider les données d'entrée
    const validatedData = CreateListSchema.parse(body);
    const { books, ...listData } = validatedData;

    // Créer la liste avec les relations dans une transaction
    const result = await db.$transaction(async (tx) => {
      // Créer la liste
      const list = await tx.custom_list.create({
        data: {
          id: randomUUID(),
          ...listData,
          createdBy: user.id
        }
      });

      // Si des livres sont fournis, les associer à la liste
      if (books && books.length > 0) {
        // Vérifier que tous les livres existent
        const existingBooks = await tx.book.findMany({
          where: { id: { in: books } },
          select: { id: true }
        });

        const existingBookIds = existingBooks.map(b => b.id);
        const invalidBookIds = books.filter(id => !existingBookIds.includes(id));

        if (invalidBookIds.length > 0) {
          throw new ValidationError(`Livres non trouvés: ${invalidBookIds.join(', ')}`);
        }

        // Créer les associations
        const listBookConnections = books.map((bookId, index) => ({
          id: randomUUID(),
          listId: list.id,
          bookId: bookId,
          ordre: index + 1
        }));

        await tx.list_book.createMany({
          data: listBookConnections
        });
      }

      // Retourner la liste complète avec les relations
      return tx.custom_list.findUnique({
        where: { id: list.id },
        include: {
          user: {
            select: { id: true, nom_complet: true, avatar: true }
          },
          _count: {
            select: { list_books: true }
          },
          list_books: {
            include: {
              book: {
                select: {
                  id: true,
                  titre: true,
                  auteur: true,
                  image_couverture: true,
                  note_generale: true
                }
              }
            },
            orderBy: { ordre: 'asc' }
          }
        }
      });
    });

    console.log(`📋 New list created: "${result?.nom}" with ${books?.length || 0} books by ${user.nom_complet}`);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Liste créée avec succès"
    }, { status: 201 });
  });
});