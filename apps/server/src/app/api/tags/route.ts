import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  CreateTagSchema, 
  TagFiltersSchema, 
  TagErrorMessages 
} from "@/schemas/tag.schemas";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  serializeTags,
  sanitizeTagData,
  createTagsPaginatedResponse
} from "@/utils/tag-serializers";
import {
  createPaginatedResponse,
  calculatePagination,
  createSearchInfo,
  getAppliedFilters
} from "@/utils/serializers";
import { withBetterAuth } from "@/middlewares/auth-improved";

// =============================================================================
// 🏷️ API ROUTE TAGS PRINCIPALE - /api/tags
// =============================================================================

// GET /api/tags - Liste tous les tags avec filtres et pagination
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Récupérer et parser les paramètres de requête
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Transformer les paramètres de requête avec les bonnes types
  const transformedQuery = {
    ...queryObject,
    page: queryObject.page ? parseInt(queryObject.page) : undefined,
    limit: queryObject.limit ? parseInt(queryObject.limit) : undefined,
    min_utilisation: queryObject.min_utilisation ? parseInt(queryObject.min_utilisation) : undefined,
    max_utilisation: queryObject.max_utilisation ? parseInt(queryObject.max_utilisation) : undefined,
    est_favori: queryObject.est_favori === 'true' ? true : 
                queryObject.est_favori === 'false' ? false : undefined,
    include_book_count: queryObject.include_book_count === 'true',
  };
  
  // Valider les paramètres
  const validatedQuery = TagFiltersSchema.parse(transformedQuery);
  const { 
    q, type, est_favori, min_utilisation, max_utilisation,
    sort, order, page, limit, include_book_count 
  } = validatedQuery;

  // Construire les conditions WHERE pour la recherche
  const where: any = {};
  
  // Recherche textuelle dans le nom
  if (q && q.length >= 2) {
    where.nom = {
      contains: q.toLowerCase(),
      mode: 'insensitive',
    };
  }
  
  // Filtrage par type
  if (type) {
    where.type = type;
  }
  
  // Filtrage par statut favori
  if (est_favori !== undefined) {
    where.est_favori = est_favori;
  }
  
  // Filtrage par utilisation
  if (min_utilisation !== undefined || max_utilisation !== undefined) {
    where.utilisation_count = {};
    if (min_utilisation !== undefined) {
      where.utilisation_count.gte = min_utilisation;
    }
    if (max_utilisation !== undefined) {
      where.utilisation_count.lte = max_utilisation;
    }
  }

  // Calculer la pagination
  const skip = (page - 1) * limit;
  
  // Construire l'ordre de tri
  const orderBy: any = {};
  orderBy[sort] = order;

  // Options d'inclusion pour les relations
  const include: any = {};
  if (include_book_count) {
    include._count = {
      select: { book_tag: true }
    };
  }

  // Exécuter les requêtes en parallèle
  const [tags, totalCount] = await Promise.all([
    db.tag.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include,
    }),
    db.tag.count({ where })
  ]);

  // Sérialiser les tags
  const serializedTags = serializeTags(tags, { includeBookCount: include_book_count });
  
  // Calculer les informations de pagination
  const pagination = calculatePagination(page, limit, totalCount);
  
  // Créer les informations de recherche
  const appliedFilters = getAppliedFilters({
    q, type, est_favori, min_utilisation, max_utilisation, sort, order
  });
  
  const searchInfo = createSearchInfo(
    totalCount,
    appliedFilters,
    q, // terme de recherche
    Date.now() - startTime
  );
  
  const filters = {
    q, type, est_favori, min_utilisation, max_utilisation, sort, order
  };
  
  return NextResponse.json(
    createPaginatedResponse(serializedTags, pagination, filters, searchInfo)
  );
});

// POST /api/tags - Créer un nouveau tag (protégé)
export async function POST(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);

    // Parser et valider les données
    const body = await req.json();
    const validatedData = CreateTagSchema.parse(body);
    
    // Nettoyer les données
    const cleanedData = sanitizeTagData(validatedData);
    
    // Vérifier l'unicité du nom
    const existingTag = await db.tag.findFirst({
      where: {
        nom: {
          equals: cleanedData.nom,
          mode: 'insensitive',
        },
      },
    });
    
    if (existingTag) {
      return NextResponse.json({
        success: false,
        error: TagErrorMessages[lang].TAG_NAME_EXISTS,
        code: 'TAG_NAME_EXISTS',
        field: 'nom',
      }, { status: 409 });
    }
    
    // Créer le tag
    const newTag = await db.tag.create({
      data: {
        ...cleanedData,
        utilisation_count: 0, // Initialiser à 0
      },
      include: {
        _count: {
          select: { book_tag: true }
        }
      }
    });
    
    // Sérialiser la réponse
    const serializedTag = serializeTags([newTag], { includeBookCount: true })[0];
    
    return NextResponse.json({
      success: true,
      data: serializedTag,
      message: lang === 'fr' ? 'Tag créé avec succès' : 'Tag created successfully',
      execution_time_ms: Date.now() - startTime,
    }, { status: 201 });
  });
}

// DELETE /api/tags - Suppression en masse des tags (protégé)
export async function DELETE(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);

    // Récupérer les paramètres
    const { searchParams } = new URL(req.url);
    const tagIds = searchParams.get('tag_ids')?.split(',');
    const force = searchParams.get('force') === 'true';
    
    if (!tagIds || tagIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Une liste d'IDs de tags est requise",
        code: 'INVALID_TAG_IDS',
      }, { status: 400 });
    }
    
    // Vérifier que tous les tags existent
    const existingTags = await db.tag.findMany({
      where: {
        id: { in: tagIds },
      },
      include: {
        _count: {
          select: { book_tag: true }
        }
      }
    });
    
    if (existingTags.length !== tagIds.length) {
      const foundIds = existingTags.map(tag => tag.id);
      const missingIds = tagIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json({
        success: false,
        error: "Certains tags n'ont pas été trouvés",
        code: 'TAGS_NOT_FOUND',
        missing_tag_ids: missingIds,
      }, { status: 404 });
    }
    
    // Vérifier si des tags sont utilisés
    const tagsInUse = existingTags.filter(tag => tag._count.book_tag > 0);
    
    if (tagsInUse.length > 0 && !force) {
      return NextResponse.json({
        success: false,
        error: TagErrorMessages[lang].TAG_IN_USE,
        code: 'TAGS_IN_USE',
        metadata: {
          tags_in_use: tagsInUse.map(tag => ({
            id: tag.id,
            nom: tag.nom,
            book_count: tag._count.book_tag,
          })),
          can_force_delete: true,
        },
      }, { status: 409 });
    }
    
    // Si force=true, dissocier d'abord tous les livres
    if (force && tagsInUse.length > 0) {
      await db.book_tag.deleteMany({
        where: {
          tagId: { in: tagsInUse.map(tag => tag.id) },
        },
      });
    }
    
    // Supprimer les tags
    const deletedCount = await db.tag.deleteMany({
      where: {
        id: { in: tagIds },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        deleted_count: deletedCount.count,
        deleted_tags: existingTags.map(tag => ({
          id: tag.id,
          nom: tag.nom,
        })),
      },
      message: lang === 'fr' 
        ? `${deletedCount.count} tag(s) supprimé(s) avec succès` 
        : `${deletedCount.count} tag(s) deleted successfully`,
      metadata: {
        forced_deletion: force,
        books_dissociated: force ? tagsInUse.reduce((sum, tag) => sum + tag._count.book_tag, 0) : 0,
      },
      execution_time_ms: Date.now() - startTime,
    });
  });
}
