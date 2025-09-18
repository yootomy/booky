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
// 🔥 API ROUTE POPULAR TAGS - /api/tags/popular
// =============================================================================

// Schéma pour les paramètres de tags populaires
const PopularTagsSchema = z.object({
  limit: z.coerce.number()
    .int("La limite doit être un entier")
    .min(1, "La limite doit être d'au moins 1")
    .max(100, "La limite ne peut pas dépasser 100")
    .default(10),
  
  type: z.enum(["GENRE", "TROPE", "TRIGGER", "PERSONNALISE"]).optional(),
  
  min_usage: z.coerce.number()
    .int("L'usage minimum doit être un entier")
    .min(1, "L'usage minimum doit être d'au moins 1")
    .optional(),

  include_book_count: z.boolean().default(true),
});

// GET /api/tags/popular - Récupère les tags les plus utilisés
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
    min_usage: queryObject.min_usage ? parseInt(queryObject.min_usage) : undefined,
    include_book_count: queryObject.include_book_count !== 'false', // true par défaut
  };
  
  // Valider les paramètres
  const validatedQuery = PopularTagsSchema.parse(transformedQuery);
  const { limit, type, min_usage, include_book_count } = validatedQuery;

  // Construire les conditions WHERE
  const where: any = {};
  
  // Filtrer par type si spécifié
  if (type) {
    where.type = type;
  }
  
  // Filtrer par usage minimum si spécifié
  if (min_usage) {
    where.utilisation_count = {
      gte: min_usage
    };
  }

  // Récupérer les tags les plus populaires
  const popularTags = await db.tag.findMany({
    where,
    take: limit,
    orderBy: [
      { utilisation_count: 'desc' },
      { nom: 'asc' } // Tri secondaire par nom pour la cohérence
    ],
    include: include_book_count ? {
      _count: {
        select: { book_tag: true }
      }
    } : undefined,
  });

  // Sérialiser les données
  const serializedTags = serializeTags(popularTags);

  // Ajouter les statistiques contextuelles
  const totalTagsCount = await db.tag.count({ where });
  const maxUsage = popularTags.length > 0 ? popularTags[0].utilisation_count : 0;
  const avgUsage = popularTags.length > 0 
    ? Math.round(popularTags.reduce((sum, tag) => sum + tag.utilisation_count, 0) / popularTags.length)
    : 0;

  // Grouper par type pour analyse
  const tagsByType = serializedTags.reduce((acc, tag) => {
    if (!acc[tag.type]) {
      acc[tag.type] = [];
    }
    acc[tag.type].push(tag);
    return acc;
  }, {} as Record<string, any[]>);

  const response = {
    success: true,
    data: serializedTags,
    metadata: {
      query_limit: limit,
      returned_count: serializedTags.length,
      total_matching_tags: totalTagsCount,
      filters: {
        type: type || null,
        min_usage: min_usage || null,
      },
      statistics: {
        max_usage: maxUsage,
        avg_usage: avgUsage,
        types_distribution: Object.keys(tagsByType).map(type => ({
          type,
          count: tagsByType[type].length,
          avg_usage: Math.round(tagsByType[type].reduce((sum, tag) => sum + tag.utilisation_count, 0) / tagsByType[type].length)
        }))
      },
      tags_by_type: tagsByType,
    },
    message: lang === 'fr' 
      ? `${serializedTags.length} tag(s) populaire(s) trouvé(s)` 
      : `${serializedTags.length} popular tag(s) found`,
    execution_time_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
});