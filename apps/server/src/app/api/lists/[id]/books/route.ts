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
const AddBookToListSchema = z.object({
  bookId: z.string().min(1, "L'ID du livre est requis"),
  ordre: z.number().int().min(0).optional()
});

const ReorderBooksSchema = z.object({
  books: z.array(z.object({
    bookId: z.string(),
    ordre: z.number().int().min(0)
  }))
});

// GET /api/lists/[id]/books - Récupérer les livres d'une liste
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Vérifier que la liste existe
  const list = await db.custom_list.findUnique({
    where: { id: resolvedParams.id },
    select: { id: true, nom: true, est_publique: true }
  });

  if (!list) {
    return NextResponse.json({
      success: false,
      error: "Liste non trouvée"
    }, { status: 404 });
  }

  // Calculer la pagination
  const skip = (page - 1) * limit;

  // Récupérer les livres de la liste
  const [listBooks, totalCount] = await Promise.all([
    db.list_book.findMany({
      where: { listId: resolvedParams.id },
      skip,
      take: limit,
      orderBy: { ordre: 'asc' },
      include: {
        book: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            image_couverture: true,
            note_generale: true,
            niveau_spicy: true,
            niveau_dark: true,
            niveau_romance: true,
            statut: true,
            date_lecture: true,
            resume_personnel: true
          }
        }
      }
    }),
    db.list_book.count({
      where: { listId: resolvedParams.id }
    })
  ]);

  // Calculer les métadonnées de pagination
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return NextResponse.json({
    success: true,
    data: {
      list: {
        id: list.id,
        nom: list.nom,
        est_publique: list.est_publique
      },
      books: listBooks.map(lb => ({
        ...lb.book,
        ordre: lb.ordre,
        date_ajout: lb.date_ajout
      }))
    },
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage
    }
  });
});

// POST /api/lists/[id]/books - Ajouter un livre à la liste (protégé)
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  return withBetterAuth(request, async (req, user) => {
    const body = await req.json();

    // Valider les données d'entrée
    const validatedData = AddBookToListSchema.parse(body);
    const { bookId, ordre } = validatedData;

    // Vérifier que la liste existe et appartient à l'utilisateur
    const list = await db.custom_list.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!list) {
      return NextResponse.json({
        success: false,
        error: "Liste non trouvée"
      }, { status: 404 });
    }

    if (list.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: "Non autorisé à modifier cette liste"
      }, { status: 403 });
    }

    // Vérifier que le livre existe
    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true, titre: true, auteur: true }
    });

    if (!book) {
      return NextResponse.json({
        success: false,
        error: "Livre non trouvé"
      }, { status: 404 });
    }

    // Vérifier que le livre n'est pas déjà dans la liste
    const existingListBook = await db.list_book.findUnique({
      where: {
        listId_bookId: {
          listId: resolvedParams.id,
          bookId: bookId
        }
      }
    });

    if (existingListBook) {
      return NextResponse.json({
        success: false,
        error: "Ce livre est déjà dans la liste"
      }, { status: 409 });
    }

    // Déterminer l'ordre si non fourni
    let finalOrder = ordre;
    if (finalOrder === undefined) {
      const maxOrder = await db.list_book.findFirst({
        where: { listId: resolvedParams.id },
        orderBy: { ordre: 'desc' },
        select: { ordre: true }
      });
      finalOrder = (maxOrder?.ordre || 0) + 1;
    }

    // Ajouter le livre à la liste
    const listBook = await db.list_book.create({
      data: {
        id: randomUUID(),
        listId: resolvedParams.id,
        bookId: bookId,
        ordre: finalOrder
      },
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
      }
    });

    console.log(`📋 Book "${book.titre}" added to list "${list.nom}" by ${user.nom_complet}`);

    return NextResponse.json({
      success: true,
      data: {
        ...listBook.book,
        ordre: listBook.ordre,
        date_ajout: listBook.date_ajout
      },
      message: "Livre ajouté à la liste avec succès"
    }, { status: 201 });
  });
});

// PUT /api/lists/[id]/books - Réorganiser les livres dans la liste (protégé)
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  return withBetterAuth(request, async (req, user) => {
    const body = await req.json();

    // Valider les données d'entrée
    const validatedData = ReorderBooksSchema.parse(body);
    const { books } = validatedData;

    // Vérifier que la liste existe et appartient à l'utilisateur
    const list = await db.custom_list.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!list) {
      return NextResponse.json({
        success: false,
        error: "Liste non trouvée"
      }, { status: 404 });
    }

    if (list.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: "Non autorisé à modifier cette liste"
      }, { status: 403 });
    }

    // Mettre à jour l'ordre des livres en transaction
    await db.$transaction(async (tx) => {
      for (const bookUpdate of books) {
        await tx.list_book.updateMany({
          where: {
            listId: resolvedParams.id,
            bookId: bookUpdate.bookId
          },
          data: {
            ordre: bookUpdate.ordre
          }
        });
      }
    });

    console.log(`📋 Books reordered in list "${list.nom}" by ${user.nom_complet}`);

    return NextResponse.json({
      success: true,
      message: "Ordre des livres mis à jour avec succès"
    });
  });
});