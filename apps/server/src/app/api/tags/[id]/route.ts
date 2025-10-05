import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  UpdateTagSchema, 
  TagErrorMessages 
} from "@/schemas/tag.schemas";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  serializeTag,
  sanitizeTagData
} from "@/utils/tag-serializers";
import { withBetterAuth } from "@/middlewares/auth-improved";

// =============================================================================
// 🏷️ API ROUTE TAG INDIVIDUAL - /api/tags/[id]
// =============================================================================

// GET /api/tags/[id] - Récupère les détails d'un tag
export const GET = withErrorHandler(async (
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { id: tagId } = await params;
  
  // Vérifier les paramètres optionnels
  const { searchParams } = new URL(request.url);
  const includeBooks = searchParams.get('include_books') === 'true';
  const includeBookCount = searchParams.get('include_book_count') === 'true';
  
  // Construire les options d'inclusion
  const include: any = {};
  
  if (includeBookCount || includeBooks) {
    include._count = {
      select: { book_tag: true }
    };
  }
  
  if (includeBooks) {
    include.books = {
      select: {
        book: {
          select: {
            id: true,
            titre: true,
            auteur: true,
            image_couverture: true,
            statut: true,
            note_generale: true,
            date_creation: true,
            date_modification: true,
          }
        }
      },
      orderBy: {
        book: {
          date_creation: 'desc'
        }
      },
      take: 20, // Limiter à 20 livres pour éviter des réponses trop lourdes
    };
  }
  
  // Récupérer le tag
  const tag = await db.tag.findUnique({
    where: { id: tagId },
    include,
  });
  
  if (!tag) {
    return NextResponse.json({
      success: false,
      error: TagErrorMessages[lang].TAG_NOT_FOUND,
      code: 'TAG_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Sérialiser la réponse
  const serializedTag = serializeTag(tag, {
    includeBookCount: includeBookCount || includeBooks,
    includeBooks,
  });
  
  return NextResponse.json({
    success: true,
    data: serializedTag,
    execution_time_ms: Date.now() - startTime,
  });
});

// PUT /api/tags/[id] - Modifier un tag (protégé)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const { id: tagId } = await params;

    // Vérifier que le tag existe
    const existingTag = await db.tag.findUnique({
      where: { id: tagId },
    });
    
    if (!existingTag) {
      return NextResponse.json({
        success: false,
        error: TagErrorMessages[lang].TAG_NOT_FOUND,
        code: 'TAG_NOT_FOUND',
      }, { status: 404 });
    }
    
    // Parser et valider les données
    const body = await request.json();
    const validatedData = UpdateTagSchema.parse(body);
    
    // Nettoyer les données
    const cleanedData = sanitizeTagData(validatedData);
    
    // Vérifier l'unicité du nom si il est modifié
    if (cleanedData.nom && cleanedData.nom !== existingTag.nom) {
      const tagWithSameName = await db.tag.findFirst({
        where: {
          nom: {
            equals: cleanedData.nom,
            mode: 'insensitive',
          },
          id: {
            not: tagId,
          },
        },
      });
      
      if (tagWithSameName) {
        return NextResponse.json({
          success: false,
          error: TagErrorMessages[lang].TAG_NAME_EXISTS,
          code: 'TAG_NAME_EXISTS',
          field: 'nom',
        }, { status: 409 });
      }
    }
    
    // Mettre à jour le tag
    const updatedTag = await db.tag.update({
      where: { id: tagId },
      data: {
        ...cleanedData,
        date_modification: new Date(),
      },
      include: {
        _count: {
          select: { book_tag: true }
        }
      }
    });
    
    // Sérialiser la réponse
    const serializedTag = serializeTag(updatedTag, {
      includeBookCount: true,
    });
    
    return NextResponse.json({
      success: true,
      data: serializedTag,
      message: lang === 'fr' ? 'Tag mis à jour avec succès' : 'Tag updated successfully',
      execution_time_ms: Date.now() - startTime,
    });
  });
}

// DELETE /api/tags/[id] - Supprimer un tag (protégé)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const { id: tagId } = await params;
    
    // Vérifier que le tag existe et récupérer le nombre de livres
    const existingTag = await db.tag.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: { book_tag: true }
        }
      }
    });
    
    if (!existingTag) {
      return NextResponse.json({
        success: false,
        error: TagErrorMessages[lang].TAG_NOT_FOUND,
        code: 'TAG_NOT_FOUND',
      }, { status: 404 });
    }
    
    // Vérifier si le tag est utilisé par des livres
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    
    if (existingTag._count.book_tag > 0 && !force) {
      return NextResponse.json({
        success: false,
        error: TagErrorMessages[lang].TAG_IN_USE,
        code: 'TAG_IN_USE',
        metadata: {
          book_count: existingTag._count.book_tag,
          can_force_delete: true,
        },
      }, { status: 409 });
    }
    
    // Si force=true, dissocier d'abord tous les livres
    if (existingTag._count.book_tag > 0 && force) {
      await db.book_tag.deleteMany({
        where: {
          tagId: tagId,
        },
      });
    }
    
    // Supprimer le tag
    const deletedTag = await db.tag.delete({
      where: { id: tagId },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: deletedTag.id,
        nom: deletedTag.nom,
      },
      message: lang === 'fr' ? 'Tag supprimé avec succès' : 'Tag deleted successfully',
      metadata: {
        forced_deletion: force,
        books_dissociated: existingTag._count.book_tag,
      },
      execution_time_ms: Date.now() - startTime,
    });
  });
}
