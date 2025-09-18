import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import {
  handleError,
  detectLanguageFromHeaders,
  withErrorHandler,
  ValidationError
} from "@/utils/error-handler";
import { z } from "zod";

// Schémas de validation
const UpdateListSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères").optional(),
  description: z.string().optional(),
  couleur: z.string().regex(/^#[0-9A-F]{6}$/i, "Format de couleur invalide").optional(),
  icone: z.string().optional(),
  ordre_affichage: z.number().int().min(0).optional(),
  est_publique: z.boolean().optional(),
  books: z.array(z.string()).optional() // Ajout du support des livres
});

// GET /api/lists/[id] - Récupérer une liste spécifique
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  const { searchParams } = new URL(request.url);
  const include_books = searchParams.get('include_books') === 'true';

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
            niveau_dark: true,
            niveau_romance: true,
            statut: true,
            date_lecture: true
          }
        }
      },
      orderBy: { ordre: 'asc' }
    };
  }

  const list = await db.custom_list.findUnique({
    where: { id: resolvedParams.id },
    include
  });

  if (!list) {
    return NextResponse.json({
      success: false,
      error: "Liste non trouvée"
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: list
  });
});

// PUT /api/lists/[id] - Modifier une liste (protégé)
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  return withBetterAuth(request, async (req, user) => {
    const body = await req.json();

    // Valider les données d'entrée
    const validatedData = UpdateListSchema.parse(body);
    const { books, ...listData } = validatedData;

    console.log('📋 Données reçues pour mise à jour liste:', { listData, books });

    // Vérifier que la liste existe et appartient à l'utilisateur
    const existingList = await db.custom_list.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!existingList) {
      return NextResponse.json({
        success: false,
        error: "Liste non trouvée"
      }, { status: 404 });
    }

    if (existingList.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: "Non autorisé à modifier cette liste"
      }, { status: 403 });
    }

    // Utiliser une transaction pour mettre à jour la liste et les livres
    const updatedList = await db.$transaction(async (tx) => {
      // Mettre à jour les métadonnées de la liste
      const list = await tx.custom_list.update({
        where: { id: resolvedParams.id },
        data: listData
      });

      // Si des livres sont fournis, mettre à jour les associations
      if (books !== undefined) {
        console.log('📚 Mise à jour des livres de la liste:', books);

        // Supprimer toutes les associations existantes
        await tx.list_book.deleteMany({
          where: { listId: resolvedParams.id }
        });

        // Ajouter les nouvelles associations
        if (books.length > 0) {
          await tx.list_book.createMany({
            data: books.map((bookId, index) => ({
              listId: resolvedParams.id,
              bookId: bookId,
              ordre: index + 1
            }))
          });
        }
      }

      // Retourner la liste mise à jour avec les relations
      return await tx.custom_list.findUnique({
        where: { id: resolvedParams.id },
        include: {
          user: {
            select: { id: true, nom_complet: true, avatar: true }
          },
          _count: {
            select: { list_books: true }
          }
        }
      });
    });

    console.log(`📋 List updated: "${updatedList?.nom}" by ${user.nom_complet}`);

    return NextResponse.json({
      success: true,
      data: updatedList,
      message: "Liste mise à jour avec succès"
    });
  });
});

// DELETE /api/lists/[id] - Supprimer une liste (protégé)
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const resolvedParams = await params;
  return withBetterAuth(request, async (req, user) => {
    // Vérifier que la liste existe et appartient à l'utilisateur
    const existingList = await db.custom_list.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: { list_books: true }
        }
      }
    });

    if (!existingList) {
      return NextResponse.json({
        success: false,
        error: "Liste non trouvée"
      }, { status: 404 });
    }

    if (existingList.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: "Non autorisé à supprimer cette liste"
      }, { status: 403 });
    }

    // Supprimer la liste (les list_books seront supprimés automatiquement grâce à onDelete: Cascade)
    await db.custom_list.delete({
      where: { id: resolvedParams.id }
    });

    console.log(`📋 List deleted: "${existingList.nom}" (${existingList._count.list_books} books) by ${user.nom_complet}`);

    return NextResponse.json({
      success: true,
      message: "Liste supprimée avec succès"
    });
  });
});