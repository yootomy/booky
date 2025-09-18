import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getTypedSession } from "@/utils/auth-helpers";
import { z } from "zod";

// =============================================================================
// 🌶️🌑 API ROUTE SPICY/DARK LEVELS STATS - /api/stats/spicy-dark-levels
// =============================================================================

// Schéma pour les paramètres de statistiques des niveaux
const SpicyDarkStatsSchema = z.object({
  include_unrated: z.boolean().default(false),
  group_by: z.enum(['level', 'range', 'category']).default('level'),
  include_correlations: z.boolean().default(true),
  period: z.enum(['month', 'quarter', 'year', 'all']).default('all'),
  include_genre_breakdown: z.boolean().default(true),
});

// GET /api/stats/spicy-dark-levels - Statistiques des niveaux spicy et dark
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification
  const user = await getTypedSession(request);
  if (!user?.id) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Authentification requise' : 'Authentication required',
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }

  const userId = user?.id;

  // Parser les paramètres
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  const transformedQuery = {
    ...queryObject,
    include_unrated: queryObject.include_unrated === 'true',
    include_correlations: queryObject.include_correlations !== 'false',
    include_genre_breakdown: queryObject.include_genre_breakdown !== 'false',
  };
  
  const validatedQuery = SpicyDarkStatsSchema.parse(transformedQuery);
  const { include_unrated, group_by, include_correlations, period, include_genre_breakdown } = validatedQuery;

  // Calculer la date de début selon la période
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }

  // Requêtes parallèles
  const [
    spicyLevelsData,
    darkLevelsData,
    combinedLevelsData,
    correlationData,
    genreBreakdownData,
    temporalTrendsData,
    unratedCounts
  ] = await Promise.all([
    // Distribution des niveaux spicy
    db.book.groupBy({
      by: ['niveau_spicy'],
      where: {
        createdBy: userId,
        niveau_spicy: { gte: 0 },
        ...(period !== 'all' && {
          date_creation: { gte: startDate }
        })
      },
      _count: { niveau_spicy: true }
    }),

    // Distribution des niveaux dark
    db.book.groupBy({
      by: ['niveau_dark'],
      where: {
        createdBy: userId,
        niveau_dark: { gte: 0 },
        ...(period !== 'all' && {
          date_creation: { gte: startDate }
        })
      },
      _count: { niveau_dark: true }
    }),

    // Données combinées pour analyses croisées
    db.book.findMany({
      where: {
        createdBy: userId,
        OR: [
          { niveau_spicy: { gte: 0 } },
          { niveau_dark: { gte: 0 } }
        ],
        ...(period !== 'all' && {
          date_creation: { gte: startDate }
        })
      },
      select: {
        id: true,
        titre: true,
        auteur: true,
        niveau_spicy: true,
        niveau_dark: true,
        note_generale: true,
        statut: true,
        date_lecture: true,
        book_category: {
          include: { category: { select: { nom: true } } }
        },
        book_tag: {
          where: { tag: { type: 'GENRE' } },
          include: { tag: { select: { nom: true } } }
        }
      }
    }),

    // Données pour corrélations (si incluses)
    include_correlations ? db.book.findMany({
      where: {
        createdBy: userId,
        niveau_spicy: { gte: 0 },
        niveau_dark: { gte: 0 },
        note_generale: { gte: 0 }
      },
      select: {
        niveau_spicy: true,
        niveau_dark: true,
        note_generale: true
      }
    }) : [],

    // Breakdown par genre (si inclus)
    include_genre_breakdown ? db.book.findMany({
      where: {
        createdBy: userId,
        OR: [
          { niveau_spicy: { gte: 0 } },
          { niveau_dark: { gte: 0 } }
        ]
      },
      select: {
        niveau_spicy: true,
        niveau_dark: true,
        book_category: {
          include: { category: { select: { nom: true } } }
        },
        book_tag: {
          where: { tag: { type: 'GENRE' } },
          include: { tag: { select: { nom: true } } }
        }
      }
    }) : [],

    // Tendances temporelles
    db.book.findMany({
      where: {
        createdBy: userId,
        OR: [
          { niveau_spicy: { gte: 0 } },
          { niveau_dark: { gte: 0 } }
        ],
        date_lecture: { not: null }
      },
      select: {
        niveau_spicy: true,
        niveau_dark: true,
        date_lecture: true
      },
      orderBy: { date_lecture: 'asc' }
    }),

    // Comptage des non-notés (si inclus) - utilise 0 comme valeur par défaut
    include_unrated ? Promise.all([
      db.book.count({
        where: {
          createdBy: userId,
          niveau_spicy: 0,
          ...(period !== 'all' && { date_creation: { gte: startDate } })
        }
      }),
      db.book.count({
        where: {
          createdBy: userId,
          niveau_dark: 0,
          ...(period !== 'all' && { date_creation: { gte: startDate } })
        }
      })
    ]) : [0, 0]
  ]);

  // Traitement des distributions selon le groupement
  const processDistribution = (data: any[], type: 'spicy' | 'dark') => {
    let distribution: any = {};

    switch (group_by) {
      case 'level':
        // Distribution exacte par niveau (0-10)
        distribution = data.reduce((acc, item) => {
          const level = type === 'spicy' ? item.niveau_spicy : item.niveau_dark;
          acc[level] = item._count[type === 'spicy' ? 'niveau_spicy' : 'niveau_dark'];
          return acc;
        }, {});
        break;

      case 'range':
        // Distribution par tranches (Doux: 0-3, Modéré: 4-6, Intense: 7-8, Extrême: 9-10)
        const ranges = { 'Doux (0-3)': 0, 'Modéré (4-6)': 0, 'Intense (7-8)': 0, 'Extrême (9-10)': 0 };
        data.forEach(item => {
          const level = type === 'spicy' ? item.niveau_spicy : item.niveau_dark;
          const count = item._count[type === 'spicy' ? 'niveau_spicy' : 'niveau_dark'];
          
          if (level <= 3) ranges['Doux (0-3)'] += count;
          else if (level <= 6) ranges['Modéré (4-6)'] += count;
          else if (level <= 8) ranges['Intense (7-8)'] += count;
          else ranges['Extrême (9-10)'] += count;
        });
        distribution = ranges;
        break;

      case 'category':
        // Distribution par catégories de contenu
        const categories = { 'Tout public': 0, 'Mature': 0, 'Adulte': 0 };
        data.forEach(item => {
          const level = type === 'spicy' ? item.niveau_spicy : item.niveau_dark;
          const count = item._count[type === 'spicy' ? 'niveau_spicy' : 'niveau_dark'];
          
          if (level <= 4) categories['Tout public'] += count;
          else if (level <= 7) categories['Mature'] += count;
          else categories['Adulte'] += count;
        });
        distribution = categories;
        break;
    }

    return distribution;
  };

  const spicyDistribution = processDistribution(spicyLevelsData, 'spicy');
  const darkDistribution = processDistribution(darkLevelsData, 'dark');

  // Calculs statistiques de base
  const spicyStats = combinedLevelsData
    .filter(book => book.niveau_spicy !== null)
    .reduce((acc, book) => {
      acc.sum += book.niveau_spicy!;
      acc.count++;
      acc.values.push(book.niveau_spicy!);
      return acc;
    }, { sum: 0, count: 0, values: [] as number[] });

  const darkStats = combinedLevelsData
    .filter(book => book.niveau_dark !== null)
    .reduce((acc, book) => {
      acc.sum += book.niveau_dark!;
      acc.count++;
      acc.values.push(book.niveau_dark!);
      return acc;
    }, { sum: 0, count: 0, values: [] as number[] });

  // Calculs de corrélations (si incluses)
  let correlations: any = {};
  if (include_correlations && correlationData.length > 2) {
    const n = correlationData.length;
    
    // Corrélation spicy-dark
    const spicyMean = correlationData.reduce((sum, book) => sum + book.niveau_spicy!, 0) / n;
    const darkMean = correlationData.reduce((sum, book) => sum + book.niveau_dark!, 0) / n;
    
    const spicyDarkCovariance = correlationData.reduce((sum, book) => {
      return sum + ((book.niveau_spicy! - spicyMean) * (book.niveau_dark! - darkMean));
    }, 0) / (n - 1);
    
    const spicyStdDev = Math.sqrt(correlationData.reduce((sum, book) => {
      return sum + Math.pow(book.niveau_spicy! - spicyMean, 2);
    }, 0) / (n - 1));
    
    const darkStdDev = Math.sqrt(correlationData.reduce((sum, book) => {
      return sum + Math.pow(book.niveau_dark! - darkMean, 2);
    }, 0) / (n - 1));
    
    const spicyDarkCorrelation = spicyDarkCovariance / (spicyStdDev * darkStdDev);

    // Corrélation avec les notes
    const ratingMean = correlationData.reduce((sum, book) => sum + book.note_generale!, 0) / n;
    
    const spicyRatingCorr = correlationData.reduce((sum, book) => {
      return sum + ((book.niveau_spicy! - spicyMean) * (book.note_generale! - ratingMean));
    }, 0) / (n - 1) / (spicyStdDev * Math.sqrt(correlationData.reduce((sum, book) => {
      return sum + Math.pow(book.note_generale! - ratingMean, 2);
    }, 0) / (n - 1)));

    const darkRatingCorr = correlationData.reduce((sum, book) => {
      return sum + ((book.niveau_dark! - darkMean) * (book.note_generale! - ratingMean));
    }, 0) / (n - 1) / (darkStdDev * Math.sqrt(correlationData.reduce((sum, book) => {
      return sum + Math.pow(book.note_generale! - ratingMean, 2);
    }, 0) / (n - 1)));

    correlations = {
      spicy_dark_correlation: Number(spicyDarkCorrelation.toFixed(3)),
      spicy_rating_correlation: Number(spicyRatingCorr.toFixed(3)),
      dark_rating_correlation: Number(darkRatingCorr.toFixed(3)),
      interpretation: {
        spicy_dark: Math.abs(spicyDarkCorrelation) > 0.7 ? 'forte' : Math.abs(spicyDarkCorrelation) > 0.3 ? 'modérée' : 'faible',
        spicy_rating: Math.abs(spicyRatingCorr) > 0.5 ? 'significative' : 'non significative',
        dark_rating: Math.abs(darkRatingCorr) > 0.5 ? 'significative' : 'non significative'
      }
    };
  }

  // Analyse par genre (si incluse)
  let genreBreakdown: any = {};
  if (include_genre_breakdown) {
    const genreData: Record<string, { spicy: number[], dark: number[] }> = {};
    
    genreBreakdownData.forEach(book => {
      const genres = [
        ...book.book_category.map(c => c.category.nom),
        ...book.book_tag.map(t => t.tag.nom)
      ];

      genres.forEach(genre => {
        if (!genreData[genre]) {
          genreData[genre] = { spicy: [], dark: [] };
        }
        if (book.niveau_spicy !== null) genreData[genre].spicy.push(book.niveau_spicy);
        if (book.niveau_dark !== null) genreData[genre].dark.push(book.niveau_dark);
      });
    });

    genreBreakdown = Object.entries(genreData)
      .filter(([, data]) => data.spicy.length + data.dark.length >= 3) // Au moins 3 livres
      .map(([genre, data]) => ({
        genre,
        spicy_avg: data.spicy.length > 0 ? Number((data.spicy.reduce((a, b) => a + b, 0) / data.spicy.length).toFixed(2)) : null,
        dark_avg: data.dark.length > 0 ? Number((data.dark.reduce((a, b) => a + b, 0) / data.dark.length).toFixed(2)) : null,
        spicy_max: data.spicy.length > 0 ? Math.max(...data.spicy) : null,
        dark_max: data.dark.length > 0 ? Math.max(...data.dark) : null,
        book_count: data.spicy.length + data.dark.length,
        intensity_score: ((data.spicy.reduce((a, b) => a + b, 0) + data.dark.reduce((a, b) => a + b, 0)) / (data.spicy.length + data.dark.length)) || 0
      }))
      .sort((a, b) => b.intensity_score - a.intensity_score);
  }

  // Tendances temporelles
  const monthlyTrends: Record<string, { spicy: number[], dark: number[] }> = {};
  temporalTrendsData.forEach(book => {
    const month = new Date(book.date_lecture!).toISOString().substring(0, 7);
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = { spicy: [], dark: [] };
    }
    if (book.niveau_spicy !== null) monthlyTrends[month].spicy.push(book.niveau_spicy);
    if (book.niveau_dark !== null) monthlyTrends[month].dark.push(book.niveau_dark);
  });

  const trendsAnalysis = Object.entries(monthlyTrends)
    .map(([month, data]) => ({
      month,
      spicy_avg: data.spicy.length > 0 ? Number((data.spicy.reduce((a, b) => a + b, 0) / data.spicy.length).toFixed(2)) : null,
      dark_avg: data.dark.length > 0 ? Number((data.dark.reduce((a, b) => a + b, 0) / data.dark.length).toFixed(2)) : null,
      book_count: data.spicy.length + data.dark.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Livres extrêmes
  const extremeBooks = {
    highest_spicy: combinedLevelsData
      .filter(book => book.niveau_spicy !== null)
      .sort((a, b) => b.niveau_spicy! - a.niveau_spicy!)
      .slice(0, 3)
      .map(book => ({
        titre: book.titre,
        auteur: book.auteur,
        niveau_spicy: book.niveau_spicy,
        note: book.note_generale
      })),
    highest_dark: combinedLevelsData
      .filter(book => book.niveau_dark !== null)
      .sort((a, b) => b.niveau_dark! - a.niveau_dark!)
      .slice(0, 3)
      .map(book => ({
        titre: book.titre,
        auteur: book.auteur,
        niveau_dark: book.niveau_dark,
        note: book.note_generale
      }))
  };

  const response = {
    success: true,
    data: {
      // Vue d'ensemble
      overview: {
        total_books_with_spicy: spicyStats.count,
        total_books_with_dark: darkStats.count,
        total_unrated_spicy: include_unrated ? unratedCounts[0] : null,
        total_unrated_dark: include_unrated ? unratedCounts[1] : null,
        period_analyzed: period
      },

      // Statistiques descriptives
      descriptive_stats: {
        spicy: spicyStats.count > 0 ? {
          average: Number((spicyStats.sum / spicyStats.count).toFixed(2)),
          min: Math.min(...spicyStats.values),
          max: Math.max(...spicyStats.values),
          median: spicyStats.values.sort((a, b) => a - b)[Math.floor(spicyStats.values.length / 2)] || 0,
          mode: spicyStats.values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {} as Record<number, number>)
        } : null,
        dark: darkStats.count > 0 ? {
          average: Number((darkStats.sum / darkStats.count).toFixed(2)),
          min: Math.min(...darkStats.values),
          max: Math.max(...darkStats.values),
          median: darkStats.values.sort((a, b) => a - b)[Math.floor(darkStats.values.length / 2)] || 0,
          mode: darkStats.values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {} as Record<number, number>)
        } : null
      },

      // Distributions
      distributions: {
        spicy: {
          method: group_by,
          data: spicyDistribution,
          most_common: Object.entries(spicyDistribution)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0] || null
        },
        dark: {
          method: group_by,
          data: darkDistribution,
          most_common: Object.entries(darkDistribution)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0] || null
        }
      },

      // Corrélations (si incluses)
      ...(include_correlations && Object.keys(correlations).length > 0 && {
        correlations
      }),

      // Analyse par genre (si incluse)
      ...(include_genre_breakdown && {
        genre_breakdown: genreBreakdown.slice(0, 10)
      }),

      // Tendances temporelles
      temporal_trends: trendsAnalysis,

      // Livres remarquables
      extreme_books: extremeBooks,

      // Métriques de tolérance
      tolerance_metrics: {
        spicy_tolerance: spicyStats.count > 0 ? {
          comfort_zone: spicyStats.values.filter(v => v <= 5).length / spicyStats.count * 100,
          adventurous_rate: spicyStats.values.filter(v => v >= 8).length / spicyStats.count * 100,
          average_comfort: Number((spicyStats.sum / spicyStats.count).toFixed(1))
        } : null,
        dark_tolerance: darkStats.count > 0 ? {
          comfort_zone: darkStats.values.filter(v => v <= 5).length / darkStats.count * 100,
          adventurous_rate: darkStats.values.filter(v => v >= 8).length / darkStats.count * 100,
          average_comfort: Number((darkStats.sum / darkStats.count).toFixed(1))
        } : null,
        combined_profile: spicyStats.count > 0 && darkStats.count > 0 ? {
          content_adventurer: (spicyStats.values.filter(v => v >= 7).length + darkStats.values.filter(v => v >= 7).length) / (spicyStats.count + darkStats.count) * 100,
          content_moderate: (spicyStats.values.filter(v => v >= 4 && v <= 7).length + darkStats.values.filter(v => v >= 4 && v <= 7).length) / (spicyStats.count + darkStats.count) * 100,
          content_conservative: (spicyStats.values.filter(v => v <= 4).length + darkStats.values.filter(v => v <= 4).length) / (spicyStats.count + darkStats.count) * 100
        } : null
      }
    },
    metadata: {
      user_id: userId,
      filters: {
        include_unrated,
        group_by,
        include_correlations,
        period,
        include_genre_breakdown
      },
      generated_at: new Date().toISOString(),
      analysis_period: `${period} (from ${startDate.toISOString().split('T')[0]})`,
      total_books_analyzed: combinedLevelsData.length
    },
    message: lang === 'fr' 
      ? `Analyse des niveaux de contenu pour ${combinedLevelsData.length} livre(s)` 
      : `Content levels analysis for ${combinedLevelsData.length} book(s)`,
    execution_time_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
});