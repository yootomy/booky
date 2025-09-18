import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { TagErrorMessages } from "@/schemas/tag.schemas";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getTypedSession } from "@/utils/auth-helpers";

// =============================================================================
// 🔗 API ROUTE BOOK TAG SPECIFIC - /api/books/[id]/tags/[tagId]
// =============================================================================

// DELETE /api/books/[id]/tags/[tagId] - Dissocier un tag spécifique d'un livre (protégé)
export const DELETE = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; tagId: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification
  const user = await getTypedSession(request);
  if (!user?.id) {
    return NextResponse.json({
      success: false,
      error: TagErrorMessages[lang].UNAUTHORIZED,
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }
  
  const { id: bookId, tagId } = await params;
  
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
  
  // Vérifier que le tag existe
  const existingTag = await db.tag.findUnique({
    where: { id: tagId },
    select: { 
      id: true, 
      nom: true, 
      couleur: true, 
      type: true 
    },
  });
  
  if (!existingTag) {
    return NextResponse.json({
      success: false,
      error: TagErrorMessages[lang].TAG_NOT_FOUND,
      code: 'TAG_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Vérifier que l'association existe
  const existingAssociation = await db.book_tag.findFirst({
    where: {
      bookId,
      tagId,
    },
  });
  
  if (!existingAssociation) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Ce tag n\'est pas associé à ce livre' : 'This tag is not associated with this book',
      code: 'ASSOCIATION_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Utiliser une transaction pour supprimer l'association et mettre à jour le compteur
  const result = await db.$transaction(async (tx) => {
    // Supprimer l'association spécifique
    await tx.book_tag.delete({
      where: {
        id: existingAssociation.id,
      },
    });
    
    // Mettre à jour le compteur d'utilisation du tag
    const newCount = await tx.book_tag.count({
      where: { tagId },
    });
    
    await tx.tag.update({
      where: { id: tagId },
      data: {
        utilisation_count: newCount,
        date_modification: new Date(),
      },
    });
    
    return { success: true };
  });
  
  // Récupérer les tags restants du livre avec groupement par type
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
  
  // Grouper les tags restants par type
  const tagsByType = {
    GENRE: remainingTagsData.filter(tag => tag.type === 'GENRE'),
    TROPE: remainingTagsData.filter(tag => tag.type === 'TROPE'),
    TRIGGER: remainingTagsData.filter(tag => tag.type === 'TRIGGER'),
    PERSONNALISE: remainingTagsData.filter(tag => tag.type === 'PERSONNALISE'),
  };
  
  return NextResponse.json({
    success: true,
    data: {
      book: existingBook,
      dissociated_tag: existingTag,
      remaining_tags: remainingTagsData,
      tags_by_type: tagsByType,
      total_remaining_tags: remainingTagsData.length,
      tags_count_by_type: {
        GENRE: tagsByType.GENRE.length,
        TROPE: tagsByType.TROPE.length,
        TRIGGER: tagsByType.TRIGGER.length,
        PERSONNALISE: tagsByType.PERSONNALISE.length,
      },
    },
    message: lang === 'fr' 
      ? `Tag "${existingTag.nom}" dissocié du livre "${existingBook.titre}"` 
      : `Tag "${existingTag.nom}" dissociated from book "${existingBook.titre}"`,
    execution_time_ms: Date.now() - startTime,
  });
});