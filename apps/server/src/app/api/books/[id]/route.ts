import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";
import { randomUUID } from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schéma de validation pour modifier un livre
const updateBookSchema = z.object({
  titre: z.string().min(1, "Title is required").optional(),
  auteur: z.string().min(1, "Author is required").optional(),
  isbn: z.string().optional(),
  image_couverture: z.string().url().optional(),
  google_books_id: z.string().optional(),
  open_library_id: z.string().optional(),
  resume_officiel: z.string().optional(),
  editeur: z.string().optional(),
  date_publication: z.string().optional().transform(val => val ? new Date(val) : undefined),
  nombre_pages: z.number().int().positive().optional().nullable(),
  langue: z.string().optional(),
  date_lecture: z.string().optional().transform(val => val ? new Date(val) : undefined),
  statut: z.enum(["LU", "EN_COURS", "A_LIRE"]).optional(),
  note_generale: z.number().int().min(0).max(10).optional(),
  niveau_spicy: z.number().int().min(0).max(10).optional(),
  niveau_dark: z.number().int().min(0).max(10).optional(),
  niveau_romance: z.number().int().min(0).max(10).optional(),
  intensite_emotionnelle: z.number().int().min(0).max(10).optional(),
  danger: z.number().int().min(0).max(10).optional(),
  violence: z.number().int().min(0).max(10).optional(),
  originalite: z.number().int().min(0).max(10).optional(),
  rythme: z.enum(["SLOW_BURN", "MEDIUM_BURN", "FAST_PACE", "INSTA_LOVE"]).optional(),
  resume_personnel: z.string().optional(),
  critique_detaillee: z.string().optional(),
  citations_favorites: z.string().optional(),
  pourquoi_aimer: z.string().optional(),
  questions_sur_le_livre: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  // Saga fields
  sagaId: z.string().cuid().optional().nullable(),
  sagaOrder: z.number().int().positive().optional().nullable(),
});

// GET /api/books/[id] - Détails d'un livre
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid book ID" },
        { status: 400 }
      );
    }

    const book = await db.book.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nom_complet: true, avatar: true }
        },
        book_category: {
          include: { category: true }
        },
        book_tag: {
          include: { tag: true }
        },
        saga: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // Récupérer les livres voisins dans la saga si le livre fait partie d'une saga
    let sagaNeighbors = null;
    if (book.sagaId && book.sagaOrder) {
      // Optimisation: utiliser une seule requête avec OR au lieu de deux requêtes séparées
      const neighborBooks = await db.book.findMany({
        where: {
          sagaId: book.sagaId,
          sagaOrder: {
            in: [book.sagaOrder - 1, book.sagaOrder + 1]
          }
        },
        select: {
          id: true,
          titre: true,
          sagaOrder: true,
          image_couverture: true
        },
        orderBy: {
          sagaOrder: 'asc'
        }
      });

      // Vérifier que sagaOrder n'est pas null avant de faire les calculs
      if (book.sagaOrder !== null) {
        sagaNeighbors = {
          previous: neighborBooks.find(b => b.sagaOrder === book.sagaOrder! - 1) || null,
          next: neighborBooks.find(b => b.sagaOrder === book.sagaOrder! + 1) || null
        };
      } else {
        sagaNeighbors = {
          previous: null,
          next: null
        };
      }
    }


    // Mapper la structure pour le frontend
    const mappedBook = {
      ...book,
      categories: book.book_category || [],
      tags: book.book_tag || [],
      sagaNeighbors
    };

    return NextResponse.json({
      success: true,
      data: mappedBook
    });

  } catch (error) {
    console.error("Get book by ID error:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

// PUT /api/books/[id] - Modifier un livre (protégé)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id } = await params;

      if (!id || typeof id !== "string") {
        return NextResponse.json(
          { error: "Invalid book ID" },
          { status: 400 }
        );
      }

      // Vérifier que le livre existe
      const existingBook = await db.book.findUnique({
        where: { id },
        include: {
          user: { select: { id: true } }
        }
      });

      if (!existingBook) {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }

      // Vérifier que l'utilisateur est le créateur du livre ou admin
      if (existingBook.createdBy !== user.id && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "You don't have permission to update this book" },
          { status: 403 }
        );
      }

      const body = await req.json();
      
      console.log('🔍 Update book - Saga data:', {
        sagaId: body.sagaId,
        sagaOrder: body.sagaOrder,
        hasSagaId: body.sagaId !== undefined,
        hasSagaOrder: body.sagaOrder !== undefined
      });
      
      // Valider les données d'entrée
      const validatedData = updateBookSchema.parse(body);
      const { categories, tags, sagaId, sagaOrder, ...bookData } = validatedData;

      // Mettre à jour le livre avec les relations
      const updatedBook = await db.$transaction(async (tx) => {
        // Mettre à jour les données du livre
        const updateData: any = {
          ...bookData,
          date_modification: new Date(),
        };

        // Gérer la saga
        if (sagaId !== undefined) {
          if (sagaId === null || sagaId === '' || sagaId === undefined) {
            // Déconnecter de la saga
            updateData.sagaId = null;
            updateData.sagaOrder = null;
          } else {
            // Connecter à une saga
            updateData.sagaId = sagaId;
            updateData.sagaOrder = sagaOrder || null;
          }
        } else if (sagaOrder !== undefined) {
          // Mettre à jour seulement l'ordre si fourni
          updateData.sagaOrder = sagaOrder;
        }

        const book = await tx.book.update({
          where: { id },
          data: updateData,
          include: {
            user: {
              select: { id: true, nom_complet: true, avatar: true }
            }
          }
        });

        // Gérer les catégories si fournies
        if (categories !== undefined) {
          // Supprimer les anciennes associations
          await tx.book_category.deleteMany({
            where: { bookId: id }
          });

          // Créer les nouvelles associations
          if (categories.length > 0) {
            const categoryConnections = categories.map(categoryId => ({
              id: randomUUID(),
              bookId: id,
              categoryId: categoryId
            }));
            
            await tx.book_category.createMany({
              data: categoryConnections
            });
          }
        }

        // Gérer les tags si fournis
        if (tags !== undefined) {
          // Supprimer les anciennes associations
          await tx.book_tag.deleteMany({
            where: { bookId: id }
          });

          // Créer les nouvelles associations
          if (tags.length > 0) {
            const tagConnections = tags.map(tagId => ({
              id: randomUUID(),
              bookId: id,
              tagId: tagId
            }));
            
            await tx.book_tag.createMany({
              data: tagConnections
            });
          }
        }

        // Retourner le livre avec toutes les relations
        const updatedBookWithRelations = await tx.book.findUnique({
          where: { id },
          include: {
            user: {
              select: { id: true, nom_complet: true, avatar: true }
            },
            book_category: {
              include: { category: true }
            },
            book_tag: {
              include: { tag: true }
            },
            saga: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                status: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        });

        console.log('📚 Updated book saga info:', {
          bookId: updatedBookWithRelations?.id,
          sagaId: updatedBookWithRelations?.sagaId,
          sagaOrder: updatedBookWithRelations?.sagaOrder,
          sagaName: updatedBookWithRelations?.saga?.name || 'No saga'
        });

        // Mapper pour le frontend
        return {
          ...updatedBookWithRelations,
          categories: updatedBookWithRelations?.book_category || [],
          tags: updatedBookWithRelations?.book_tag || []
        };
      });

      console.log(`📚 Book updated: "${updatedBook?.titre}" by ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        data: updatedBook,
        message: "Book updated successfully"
      });

    } catch (error) {
      console.error("Update book error:", error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Validation error",
            details: error.issues 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update book" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/books/[id] - Supprimer un livre (protégé)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { id } = await params;

      if (!id || typeof id !== "string") {
        return NextResponse.json(
          { error: "Invalid book ID" },
          { status: 400 }
        );
      }

      // Vérifier que le livre existe
      const existingBook = await db.book.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, nom_complet: true } }
        }
      });

      if (!existingBook) {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }

      // Vérifier que l'utilisateur est le créateur du livre ou admin
      if (existingBook.createdBy !== user.id && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "You don't have permission to delete this book" },
          { status: 403 }
        );
      }

      // Supprimer le livre (les relations seront supprimées automatiquement grâce aux contraintes CASCADE)
      await db.book.delete({
        where: { id }
      });

      console.log(`🗑️  Book deleted: "${existingBook.titre}" by ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        message: "Book deleted successfully",
        data: {
          id: existingBook.id,
          titre: existingBook.titre,
          auteur: existingBook.auteur,
          deletedBy: user.nom_complet
        }
      });

    } catch (error) {
      console.error("Delete book error:", error);
      return NextResponse.json(
        { error: "Failed to delete book" },
        { status: 500 }
      );
    }
  });
}
