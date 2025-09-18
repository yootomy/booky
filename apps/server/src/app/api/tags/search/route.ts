import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  serializeTags
} from "@/utils/tag-serializers";
import { z } from "zod";

// =============================================================================
// 🔍 API ROUTE TAG SEARCH - /api/tags/search
// =============================================================================

// Schéma pour les paramètres de recherche de tags
const TagSearchSchema = z.object({
  q: z.string({
    message: "Le terme de recherche est obligatoire"
  })
    .min(1, "Le terme de recherche doit contenir au moins 1 caractère")
    .max(100, "Le terme de recherche ne peut pas dépasser 100 caractères")
    .trim(),
  
  limit: z.coerce.number()
    .int("La limite doit être un entier")
    .min(1, "La limite doit être d'au moins 1")
    .max(50, "La limite ne peut pas dépasser 50")
    .default(20),
  
  type: z.enum(["GENRE", "TROPE", "TRIGGER", "PERSONNALISE"]).optional(),
  
  exact: z.boolean().default(false), // Recherche exacte vs partielle
  
  only_used: z.boolean().default(false), // Seulement les tags utilisés
  
  include_book_count: z.boolean().default(true),

  sort: z.enum(["nom", "utilisation_count", "type", "date_creation"])
    .default("nom"),

  order: z.enum(["asc", "desc"]).default("asc"),
});

// GET /api/tags/search - Recherche avancée dans les tags
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Récupérer et parser les paramètres de requête
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  // Transformer les paramètres avec les bonnes types
  const transformedQuery = {
    ...queryObject,
    limit: queryObject.limit ? parseInt(queryObject.limit) : undefined,
    exact: queryObject.exact === 'true',
    only_used: queryObject.only_used === 'true',
    include_book_count: queryObject.include_book_count !== 'false', // true par défaut
  };
  
  // Valider les paramètres
  const validatedQuery = TagSearchSchema.parse(transformedQuery);
  const { 
    q, limit, type, exact, only_used, include_book_count, 
    sort, order 
  } = validatedQuery;

  // Construire les conditions WHERE
  const where: any = {};
  
  // Recherche textuelle dans le nom
  if (exact) {
    // Recherche exacte (insensible à la casse)
    where.nom = {
      equals: q.toLowerCase(),
      mode: 'insensitive',
    };
  } else {
    // Recherche partielle
    where.nom = {
      contains: q.toLowerCase(),
      mode: 'insensitive',
    };
  }
  
  // Filtrer par type si spécifié
  if (type) {
    where.type = type;
  }
  
  // Filtrer seulement les tags utilisés
  if (only_used) {
    where.utilisation_count = {
      gt: 0
    };
  }

  // Construire l'ordre de tri
  const orderBy: any = {};
  if (sort === 'utilisation_count') {
    orderBy.utilisation_count = order;
  } else if (sort === 'type') {
    orderBy.type = order;
  } else if (sort === 'date_creation') {
    orderBy.date_creation = order;
  } else {
    orderBy.nom = order;
  }

  // Rechercher les tags
  const [searchResults, totalCount] = await Promise.all([
    db.tag.findMany({
      where,
      take: limit,
      orderBy,
      include: include_book_count ? {
        _count: {
          select: { book_tag: true }
        }
      } : undefined,
    }),
    db.tag.count({ where })
  ]);

  // Sérialiser les données
  const serializedTags = serializeTags(searchResults);

  // Analyser les résultats
  const typeDistribution = serializedTags.reduce((acc, tag) => {
    acc[tag.type] = (acc[tag.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const usageStats = searchResults.length > 0 ? {
    min_usage: Math.min(...searchResults.map(t => t.utilisation_count)),
    max_usage: Math.max(...searchResults.map(t => t.utilisation_count)),
    avg_usage: Math.round(searchResults.reduce((sum, t) => sum + t.utilisation_count, 0) / searchResults.length),
    total_usage: searchResults.reduce((sum, t) => sum + t.utilisation_count, 0)
  } : null;

  // Suggestions basées sur la recherche
  let suggestions: string[] = [];
  if (searchResults.length === 0 && !exact) {
    // Si aucun résultat, suggérer des tags similaires
    const similarTags = await db.tag.findMany({
      where: {
        nom: {
          contains: q.substring(0, Math.max(2, q.length - 1)), // Recherche plus permissive
          mode: 'insensitive',
        },
        ...(type && { type })
      },
      take: 5,
      select: { nom: true },
      orderBy: { utilisation_count: 'desc' }
    });
    suggestions = similarTags.map(t => t.nom);
  }

  const response = {
    success: true,
    data: serializedTags,
    search_info: {
      query: q,
      search_type: exact ? 'exact' : 'partial',
      returned_count: serializedTags.length,
      total_matching: totalCount,
      has_more: totalCount > limit,
      filters: {
        type: type || null,
        only_used,
        sort,
        order,
      },
    },
    analytics: {
      type_distribution: typeDistribution,
      usage_statistics: usageStats,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    },
    message: lang === 'fr' 
      ? `${serializedTags.length} tag(s) trouvé(s) pour "${q}"` 
      : `${serializedTags.length} tag(s) found for "${q}"`,
    execution_time_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
});