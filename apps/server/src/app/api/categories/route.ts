import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  CreateCategorySchema, 
  CategoryFiltersSchema, 
  CategoryErrorMessages 
} from "@/schemas/category.schemas";
import { 
  handleError, 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  serializeCategories,
  serializeCategory,
  calculateCategoryStats,
  createCategorySearchInfo,
  sanitizeCategoryData,
  CategoryWithRelations
} from "@/utils/category-serializers";
import {
  createPaginatedResponse,
  calculatePagination
} from "@/utils/serializers";
import { getTypedSession } from "@/utils/auth-helpers";

// =============================================================================
// 📂 API ROUTE CATEGORIES
// =============================================================================

// GET /api/categories - Liste toutes les catégories avec filtres et pagination
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Transformer les paramètres de requête
  const transformedQuery = {
    ...queryObject,
    page: queryObject.page ? parseInt(queryObject.page) : undefined,
    limit: queryObject.limit ? parseInt(queryObject.limit) : undefined,
    est_actif: queryObject.est_actif === 'true' ? true : 
               queryObject.est_actif === 'false' ? false : undefined,
    include_book_count: queryObject.include_book_count === 'true',
  };
  
  // Valider les paramètres de requête
  const validatedQuery = CategoryFiltersSchema.parse(transformedQuery);
  const { 
    q, est_actif, sort, order, page, limit, include_book_count 
  } = validatedQuery;

  // Construire les filtres de base
  const where: any = {};
  
  // Recherche textuelle dans le nom et la description
  if (q) {
    where.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  
  // Filtrer par statut actif/inactif
  if (est_actif !== undefined) {
    where.est_actif = est_actif;
  }

  // Calculer la pagination
  const skip = (page - 1) * limit;
  
  // Construire l'ordre de tri
  const orderBy: any = {};
  orderBy[sort] = order;

  // Options d'inclusion des relations
  const include: any = {};
  if (include_book_count) {
    include._count = {
      select: { book_category: true }
    };
  }

  // Exécuter les requêtes en parallèle
  const [categories, totalCount] = await Promise.all([
    db.category.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include,
    }),
    db.category.count({ where })
  ]);

  // Sérialiser les catégories
  const serializedCategories = serializeCategories(categories as any, {
    includeBookCount: include_book_count,
  });
  
  // Calculer les informations de pagination
  const pagination = calculatePagination(page, limit, totalCount);
  
  // Créer les informations de recherche
  const appliedFilters = { q, est_actif, sort, order };
  const searchInfo = createCategorySearchInfo(
    totalCount,
    appliedFilters,
    q,
    Date.now() - startTime
  );
  
  const filters = { q, est_actif, sort, order };
  
  return NextResponse.json(
    createPaginatedResponse(serializedCategories, pagination, filters, searchInfo as any)
  );
});

// POST /api/categories - Créer une nouvelle catégorie (protégé)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification
  const user = await getTypedSession(request);
  if (!user?.id) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].UNAUTHORIZED,
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }

  // Parser et valider les données
  const body = await request.json();
  const validatedData = CreateCategorySchema.parse(body);
  
  // Nettoyer les données
  const cleanedData = sanitizeCategoryData(validatedData);
  
  // Vérifier l'unicité du nom
  const existingCategory = await db.category.findFirst({
    where: {
      nom: {
        equals: cleanedData.nom,
        mode: 'insensitive',
      },
    },
  });
  
  if (existingCategory) {
    return NextResponse.json({
      success: false,
      error: CategoryErrorMessages[lang].CATEGORY_NAME_EXISTS,
      code: 'CATEGORY_NAME_EXISTS',
      field: 'nom',
    }, { status: 409 });
  }
  
  // Créer la catégorie
  const category = await db.category.create({
    data: {
      ...cleanedData,
      date_creation: new Date(),
      date_modification: new Date(),
    },
    include: {
      _count: {
        select: { book_category: true }
      }
    }
  });

  // Sérialiser la réponse
  const serializedCategory = serializeCategory(category, {
    includeBookCount: true,
  });

  return NextResponse.json({
    success: true,
    data: serializedCategory,
    message: lang === 'fr' ? 'Catégorie créée avec succès' : 'Category created successfully',
    execution_time_ms: Date.now() - startTime,
  }, { status: 201 });
});