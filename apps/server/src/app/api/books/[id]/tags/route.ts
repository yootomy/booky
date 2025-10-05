import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  BookTagsSchema, 
  TagErrorMessages 
} from "@/schemas/tag.schemas";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { randomUUID } from "crypto";
import { formatTagsForDisplay } from "@/utils/tag-serializers";
import { withBetterAuth } from "@/middlewares/auth-improved";

// =============================================================================
// 🔗 API ROUTE BOOK TAGS - /api/books/[id]/tags
// =============================================================================

// GET /api/books/[id]/tags - Récupère les tags d'un livre
export const GET = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { id: bookId } = await params;
  
  // Vérifier que le livre existe
  const existingBook = await db.book.findUnique({
    where: { id: bookId },
    select: { 
      id: true, 
      titre: true, 
      auteur: true,
      createdBy: true,
    },
  });
  
  if (!existingBook) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Livre non trouvé' : 'Book not found',
      code: 'BOOK_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Récupérer les tags associés au livre
  const book_tags = await db.book_tag.findMany({
    where: { bookId },
    include: {
      tag: true,
    },
    orderBy: [
      {
        tag: {
          type: 'asc',
        },
      },
      {
        tag: {
          nom: 'asc',
        },
      },
    ],
  });
  
  // Extraire et formater les tags
  const tags = book_tags.map(bt => bt.tag);
  const formattedTags = formatTagsForDisplay(tags);
  
  // Grouper par type pour une présentation organisée
  const tagsByType = {
    GENRE: formattedTags.filter(tag => tag.type === 'GENRE'),
    TROPE: formattedTags.filter(tag => tag.type === 'TROPE'),
    TRIGGER: formattedTags.filter(tag => tag.type === 'TRIGGER'),
    PERSONNALISE: formattedTags.filter(tag => tag.type === 'PERSONNALISE'),
  };
  
  // Informations du livre
  const bookInfo = {
    id: existingBook.id,
    titre: existingBook.titre,
    auteur: existingBook.auteur,
  };
  
  return NextResponse.json({
    success: true,
    data: {
      book: bookInfo,
      tags: formattedTags,
      tags_by_type: tagsByType,
      total_tags: tags.length,
      tags_count_by_type: {
        GENRE: tagsByType.GENRE.length,
        TROPE: tagsByType.TROPE.length,
        TRIGGER: tagsByType.TRIGGER.length,
        PERSONNALISE: tagsByType.PERSONNALISE.length,
      },
    },
    execution_time_ms: Date.now() - startTime,
  });
});

// PUT /api/books/[id]/tags - Remplacer tous les tags d'un livre (protégé)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const { id: bookId } = await params;
    
    // Vérifier que le livre existe et appartient à l'utilisateur
    const existingBook = await db.book.findUnique({
      where: { 
        id: bookId,
        createdBy: user?.id,
      },
      select: { 
        id: true, 
        titre: true, 
        auteur: true,
      },
    });
    
    if (!existingBook) {
      return NextResponse.json({
        success: false,
        error: lang === 'fr' ? 'Livre non trouvé ou non autorisé' : 'Book not found or not authorized',
        code: 'BOOK_NOT_FOUND_OR_UNAUTHORIZED',
      }, { status: 404 });
    }
    
    // Parser et valider les données
    const body = await request.json();
    const validatedData = BookTagsSchema.parse(body);
    const { tag_ids } = validatedData;
    
    // Vérifier que tous les tags existent
    const existingTags = await db.tag.findMany({
      where: {
        id: { in: tag_ids },
      },
      select: { id: true, nom: true, couleur: true, type: true },
    });
    
    if (existingTags.length !== tag_ids.length) {
      const foundIds = existingTags.map(tag => tag.id);
      const missingIds = tag_ids.filter(id => !foundIds.includes(id));
      
      return NextResponse.json({
        success: false,
        error: "Certains tags n'ont pas été trouvés",
        code: 'TAGS_NOT_FOUND',
        missing_tag_ids: missingIds,
      }, { status: 404 });
    }
    
    // Utiliser une transaction pour remplacer tous les tags
    const result = await db.$transaction(async (tx) => {
      // Récupérer les anciens tags pour ajuster les compteurs
      const oldBookTags = await tx.book_tag.findMany({
        where: { bookId },
        include: { tag: { select: { id: true } } }
      });
      const oldTagIds = oldBookTags.map(bt => bt.tag.id);
      
      // Supprimer toutes les associations existantes
      await tx.book_tag.deleteMany({
        where: { bookId },
      });
      
      // Créer les nouvelles associations
      const newAssociations = tag_ids.map(tagId => ({
        id: randomUUID(),
        bookId,
        tagId,
      }));
      
      await tx.book_tag.createMany({
        data: newAssociations,
      });
      
      // Mettre à jour les compteurs d'utilisation des anciens tags (décrémenter)
      for (const tagId of oldTagIds) {
        await tx.tag.update({
          where: { id: tagId },
          data: {
            utilisation_count: Math.max(0, await tx.book_tag.count({ where: { tagId } })),
          },
        });
      }
      
      // Mettre à jour les compteurs d'utilisation des nouveaux tags (incrémenter)
      for (const tagId of tag_ids) {
        await tx.tag.update({
          where: { id: tagId },
          data: {
            utilisation_count: await tx.book_tag.count({ where: { tagId } }),
            date_modification: new Date(),
          },
        });
      }
      
      return { updated: true };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        book: existingBook,
        tags: existingTags,
        total_tags: existingTags.length,
      },
      message: lang === 'fr' 
        ? `Tags du livre "${existingBook.titre}" mis à jour` 
        : `Tags for book "${existingBook.titre}" updated`,
      execution_time_ms: Date.now() - startTime,
    });
  });
}

// POST /api/books/[id]/tags - Ajouter des tags à un livre (protégé)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const { id: bookId } = await params;
    
    // Vérifier que le livre existe et appartient à l'utilisateur
    const existingBook = await db.book.findUnique({
      where: { 
        id: bookId,
        createdBy: user?.id,
      },
      select: { 
        id: true, 
        titre: true, 
        auteur: true,
      },
    });
    
    if (!existingBook) {
      return NextResponse.json({
        success: false,
        error: lang === 'fr' ? 'Livre non trouvé ou non autorisé' : 'Book not found or not authorized',
        code: 'BOOK_NOT_FOUND_OR_UNAUTHORIZED',
      }, { status: 404 });
    }
    
    // Parser et valider les données
    const body = await request.json();
    const validatedData = BookTagsSchema.parse(body);
    const { tag_ids } = validatedData;
    
    // Vérifier que tous les tags existent
    const existingTags = await db.tag.findMany({
      where: {
        id: { in: tag_ids },
      },
      select: { id: true, nom: true, couleur: true, type: true },
    });
    
    if (existingTags.length !== tag_ids.length) {
      const foundIds = existingTags.map(tag => tag.id);
      const missingIds = tag_ids.filter(id => !foundIds.includes(id));
      
      return NextResponse.json({
        success: false,
        error: "Certains tags n'ont pas été trouvés",
        code: 'TAGS_NOT_FOUND',
        missing_tag_ids: missingIds,
      }, { status: 404 });
    }
    
    // Vérifier le nombre total de tags après ajout
    const currentTagsCount = await db.book_tag.count({
      where: { bookId },
    });
    
    if (currentTagsCount + tag_ids.length > 20) {
      return NextResponse.json({
        success: false,
        error: TagErrorMessages[lang].TAGS_LIMIT_EXCEEDED,
        code: 'TAGS_LIMIT_EXCEEDED',
        metadata: {
          current_tags: currentTagsCount,
          adding_tags: tag_ids.length,
          max_allowed: 20,
        },
      }, { status: 400 });
    }
    
    // Créer les nouvelles associations (ignorer les doublons)
    const newAssociations = tag_ids.map(tagId => ({
      id: randomUUID(),
      bookId,
      tagId,
    }));
    
    try {
      const result = await db.book_tag.createMany({
        data: newAssociations,
        skipDuplicates: true,
      });
      
      // Mettre à jour les compteurs d'utilisation des tags
      for (const tagId of tag_ids) {
        await db.tag.update({
          where: { id: tagId },
          data: {
            utilisation_count: await db.book_tag.count({ where: { tagId } }),
            date_modification: new Date(),
          },
        });
      }
      
      // Récupérer tous les tags du livre après ajout
      const allBookTags = await db.book_tag.findMany({
        where: { bookId },
        include: {
          tag: {
            select: { id: true, nom: true, couleur: true, type: true }
          }
        },
        orderBy: [
          {
            tag: {
              type: 'asc',
            },
          },
          {
            tag: {
              nom: 'asc',
            },
          },
        ],
      });
      
      const allTags = allBookTags.map(bt => bt.tag);
      
      return NextResponse.json({
        success: true,
        data: {
          book: existingBook,
          tags_added: existingTags,
          all_tags: allTags,
          associations_created: result.count,
          total_tags: allTags.length,
        },
        message: lang === 'fr' 
          ? `${result.count} tag(s) ajouté(s) au livre "${existingBook.titre}"` 
          : `${result.count} tag(s) added to book "${existingBook.titre}"`,
        execution_time_ms: Date.now() - startTime,
      });
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: "Erreur lors de l'ajout des tags",
        code: 'ASSOCIATION_ERROR',
      }, { status: 500 });
    }
  });
}

// DELETE /api/books/[id]/tags - Supprimer des tags d'un livre (protégé)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const { id: bookId } = await params;
    
    // Vérifier que le livre existe et appartient à l'utilisateur
    const existingBook = await db.book.findUnique({
      where: { 
        id: bookId,
        createdBy: user?.id,
      },
      select: { 
        id: true, 
        titre: true, 
        auteur: true,
      },
    });
    
    if (!existingBook) {
      return NextResponse.json({
        success: false,
        error: lang === 'fr' ? 'Livre non trouvé ou non autorisé' : 'Book not found or not authorized',
        code: 'BOOK_NOT_FOUND_OR_UNAUTHORIZED',
      }, { status: 404 });
    }
    
    // Récupérer les tags à supprimer depuis les paramètres de requête
    const { searchParams } = new URL(request.url);
    const tagIds = searchParams.get('tag_ids')?.split(',');
    
    const deleteWhere: any = { bookId };
    let affectedTagIds: string[] = [];
    
    if (tagIds && tagIds.length > 0) {
      // Supprimer des tags spécifiques
      deleteWhere.tagId = { in: tagIds };
      affectedTagIds = tagIds;
    } else {
      // Récupérer tous les tags du livre pour mettre à jour leurs compteurs
      const allBookTags = await db.book_tag.findMany({
        where: { bookId },
        select: { tagId: true },
      });
      affectedTagIds = allBookTags.map(bt => bt.tagId);
    }
    
    // Supprimer les associations
    const deletedCount = await db.book_tag.deleteMany({
      where: deleteWhere,
    });
    
    // Mettre à jour les compteurs d'utilisation des tags affectés
    for (const tagId of affectedTagIds) {
      await db.tag.update({
        where: { id: tagId },
        data: {
          utilisation_count: Math.max(0, await db.book_tag.count({ where: { tagId } })),
          date_modification: new Date(),
        },
      });
    }
    
    // Récupérer les tags restants
    const remainingTags = await db.book_tag.findMany({
      where: { bookId },
      include: {
        tag: {
          select: { id: true, nom: true, couleur: true, type: true }
        }
      },
      orderBy: [
        {
          tag: {
            type: 'asc',
          },
        },
        {
          tag: {
            nom: 'asc',
          },
        },
      ],
    });
    
    const remainingTagsData = remainingTags.map(bt => bt.tag);
    
    return NextResponse.json({
      success: true,
      data: {
        book: existingBook,
        remaining_tags: remainingTagsData,
        dissociations_count: deletedCount.count,
        total_remaining_tags: remainingTagsData.length,
      },
      message: lang === 'fr'
        ? `${deletedCount.count} tag(s) supprimé(s) du livre "${existingBook.titre}"`
        : `${deletedCount.count} tag(s) removed from book "${existingBook.titre}"`,
      execution_time_ms: Date.now() - startTime,
    });
  });
}
