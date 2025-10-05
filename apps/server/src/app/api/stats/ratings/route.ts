import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import {
  detectLanguageFromHeaders,
  withErrorHandler
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

// =============================================================================
// ⭐ API ROUTE RATINGS STATS - /api/stats/ratings
// =============================================================================

// Schéma pour les paramètres de statistiques de notes
const RatingsStatsSchema = z.object({
  include_unrated: z.boolean().default(false),
  group_by: z.enum(['rating', 'range', 'quartile']).default('rating'),
  include_trends: z.boolean().default(true),
  period: z.enum(['month', 'quarter', 'year', 'all']).default('all'),
});

// GET /api/stats/ratings - Statistiques détaillées des notes
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const userId = user.id;

    // Parser les paramètres
    const { searchParams } = new URL(req.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  const transformedQuery = {
    ...queryObject,
    include_unrated: queryObject.include_unrated === 'true',
    include_trends: queryObject.include_trends !== 'false',
  };
  
  const validatedQuery = RatingsStatsSchema.parse(transformedQuery);
  const { include_unrated, group_by, include_trends, period } = validatedQuery;

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
    ratedBooks,
    unratedBooks,
    ratingsOverTime,
    ratingsByGenre,
    ratingsByAuthor,
    detailedRatingsData
  ] = await Promise.all([
    // Livres avec notes
    db.book.findMany({
      where: {
        createdBy: userId,
        note_generale: { gte: 0 },
        ...(period !== 'all' && {
          date_creation: { gte: startDate }
        })
      },
      select: {
        id: true,
        titre: true,
        auteur: true,
        note_generale: true,
        date_lecture: true,
        date_creation: true,
        statut: true,
        book_category: {
          include: { category: { select: { nom: true } } }
        },
        book_tag: {
          where: { tag: { type: 'GENRE' } },
          include: { tag: { select: { nom: true } } }
        }
      },
      orderBy: { note_generale: 'desc' }
    }),

    // Livres sans notes (si inclus)
    include_unrated ? db.book.count({
      where: {
        createdBy: userId,
        note_generale: 0,
        ...(period !== 'all' && {
          date_creation: { gte: startDate }
        })
      }
    }) : 0,

    // Évolution des notes dans le temps
    include_trends ? db.book.findMany({
      where: {
        createdBy: userId,
        note_generale: { gte: 0 },
        date_lecture: { not: null },
        ...(period !== 'all' && {
          date_lecture: { gte: startDate }
        })
      },
      select: {
        note_generale: true,
        date_lecture: true
      },
      orderBy: { date_lecture: 'asc' }
    }) : [],

    // Notes par genre
    db.book.findMany({
      where: {
        createdBy: userId,
        note_generale: { gte: 0 }
      },
      select: {
        note_generale: true,
        book_category: {
          include: { category: { select: { nom: true } } }
        },
        book_tag: {
          where: { tag: { type: 'GENRE' } },
          include: { tag: { select: { nom: true } } }
        }
      }
    }),

    // Notes par auteur
    db.book.groupBy({
      by: ['auteur'],
      where: {
        createdBy: userId,
        note_generale: { gte: 0 }
      },
      _avg: { note_generale: true },
      _count: { note_generale: true },
      _min: { note_generale: true },
      _max: { note_generale: true },
      having: {
        note_generale: { _count: { gte: 2 } } // Au moins 2 livres par auteur
      },
      orderBy: { _avg: { note_generale: 'desc' } },
      take: 10
    }),

    // Données détaillées pour analyses
    db.book.aggregate({
      where: {
        createdBy: userId,
        note_generale: { gte: 0 },
        ...(period !== 'all' && {
          date_creation: { gte: startDate }
        })
      },
      _avg: { note_generale: true },
      _min: { note_generale: true },
      _max: { note_generale: true },
      _count: { note_generale: true }
    })
  ]);

  // Traitement selon le type de groupement
  let distributionData: any = {};

  switch (group_by) {
    case 'rating':
      // Distribution exacte par note (0.0 à 10.0)
      distributionData = ratedBooks.reduce((acc, book) => {
        const rating = book.note_generale!;
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      break;

    case 'range':
      // Distribution par tranches (0-2, 2-4, 4-6, 6-8, 8-10)
      const ranges = {
        '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0
      };
      ratedBooks.forEach(book => {
        const rating = book.note_generale!;
        if (rating <= 2) ranges['0-2']++;
        else if (rating <= 4) ranges['2-4']++;
        else if (rating <= 6) ranges['4-6']++;
        else if (rating <= 8) ranges['6-8']++;
        else ranges['8-10']++;
      });
      distributionData = ranges;
      break;

    case 'quartile':
      // Distribution par quartiles
      const sortedRatings = ratedBooks.map(b => b.note_generale!).sort((a, b) => a - b);
      const q1 = sortedRatings[Math.floor(sortedRatings.length * 0.25)];
      const q2 = sortedRatings[Math.floor(sortedRatings.length * 0.5)];
      const q3 = sortedRatings[Math.floor(sortedRatings.length * 0.75)];
      
      const quartiles = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      ratedBooks.forEach(book => {
        const rating = book.note_generale!;
        if (rating <= q1) quartiles.Q1++;
        else if (rating <= q2) quartiles.Q2++;
        else if (rating <= q3) quartiles.Q3++;
        else quartiles.Q4++;
      });
      distributionData = { ...quartiles, thresholds: { q1, q2, q3 } };
      break;
  }

  // Analyser les tendances temporelles
  const trends: any = {};
  if (include_trends && ratingsOverTime.length > 0) {
    const monthlyAvg: Record<string, { total: number; count: number }> = {};
    
    ratingsOverTime.forEach(book => {
      const month = new Date(book.date_lecture!).toISOString().substring(0, 7);
      if (!monthlyAvg[month]) {
        monthlyAvg[month] = { total: 0, count: 0 };
      }
      monthlyAvg[month].total += book.note_generale!;
      monthlyAvg[month].count++;
    });

    trends.monthly_averages = Object.fromEntries(
      Object.entries(monthlyAvg).map(([month, data]) => [
        month,
        Number((data.total / data.count).toFixed(2))
      ])
    );

    // Calculer la tendance générale
    const months = Object.keys(monthlyAvg).sort();
    if (months.length >= 2) {
      const firstMonth = trends.monthly_averages[months[0]];
      const lastMonth = trends.monthly_averages[months[months.length - 1]];
      trends.trend_direction = lastMonth > firstMonth ? 'increasing' : 'decreasing';
      trends.trend_change = Number((lastMonth - firstMonth).toFixed(2));
    }
  }

  // Analyser les notes par genre
  const genreRatings: Record<string, { total: number; count: number; ratings: number[] }> = {};
  ratingsByGenre.forEach(book => {
    const genres = [
      ...book.book_category.map(c => c.category.nom),
      ...book.book_tag.map(t => t.tag.nom)
    ];

    genres.forEach(genre => {
      if (!genreRatings[genre]) {
        genreRatings[genre] = { total: 0, count: 0, ratings: [] };
      }
      genreRatings[genre].total += book.note_generale!;
      genreRatings[genre].count++;
      genreRatings[genre].ratings.push(book.note_generale!);
    });
  });

  const genreStats = Object.entries(genreRatings)
    .map(([genre, data]) => ({
      genre,
      avg_rating: Number((data.total / data.count).toFixed(2)),
      book_count: data.count,
      std_deviation: Number(Math.sqrt(
        data.ratings.reduce((sum, rating) => sum + Math.pow(rating - (data.total / data.count), 2), 0) / data.count
      ).toFixed(2))
    }))
    .filter(item => item.book_count >= 2) // Au moins 2 livres
    .sort((a, b) => b.avg_rating - a.avg_rating);

  // Identifier les livres exceptionnels
  const avgRating = detailedRatingsData._avg.note_generale || 0;
  const topRated = ratedBooks.filter(book => book.note_generale! >= 9).slice(0, 5);
  const lowRated = ratedBooks.filter(book => book.note_generale! <= 3).slice(0, 5);
  
  // Analyser la sévérité des notes
  const ratingCounts = (Object.values(distributionData) as number[]).reduce((sum: number, count: number) => sum + count, 0);
  const ratingModes = Object.entries(distributionData)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  // Calculer des métriques avancées
  const ratingSpread = (detailedRatingsData._max.note_generale || 0) - (detailedRatingsData._min.note_generale || 10);
  const ratingCoverage = ratedBooks.length + unratedBooks > 0 
    ? Math.round((ratedBooks.length / (ratedBooks.length + unratedBooks)) * 100) 
    : 0;

  const response = {
    success: true,
    data: {
      // Vue d'ensemble
      overview: {
        total_rated_books: ratedBooks.length,
        total_unrated_books: include_unrated ? unratedBooks : null,
        rating_coverage: ratingCoverage,
        average_rating: Number((detailedRatingsData._avg.note_generale || 0).toFixed(2)),
        min_rating: detailedRatingsData._min.note_generale,
        max_rating: detailedRatingsData._max.note_generale,
        rating_spread: ratingSpread,
        period_analyzed: period
      },

      // Distribution des notes
      rating_distribution: {
        method: group_by,
        data: distributionData,
        most_common_ratings: ratingModes.map(([rating, count]) => ({
          rating: group_by === 'rating' ? Number(rating) : rating,
          count,
          percentage: ratingCounts > 0 ? Math.round((count as number / ratingCounts) * 100) : 0
        }))
      },

      // Tendances temporelles
      ...(include_trends && {
        trends: {
          ...trends,
          rating_velocity: ratingsOverTime.length > 1 ? {
            total_periods: Object.keys(trends.monthly_averages || {}).length,
            most_productive_month: Object.entries(trends.monthly_averages || {})
              .reduce<[string, number]>(([maxMonth, maxAvg], [month, avg]) => 
                (avg as number) > maxAvg ? [month, avg as number] : [maxMonth, maxAvg], ['', 0])[0] || null
          } : null
        }
      }),

      // Analyses par genre
      genre_analysis: {
        top_rated_genres: genreStats.slice(0, 10),
        genre_consistency: genreStats.map(item => ({
          genre: item.genre,
          consistency_score: Math.max(0, 100 - (item.std_deviation * 10)) // Score de consistance
        })).sort((a, b) => b.consistency_score - a.consistency_score).slice(0, 5)
      },

      // Analyses par auteur
      author_analysis: ratingsByAuthor.map(author => ({
        author: author.auteur,
        avg_rating: Number((author._avg.note_generale || 0).toFixed(2)),
        book_count: author._count.note_generale,
        rating_range: {
          min: author._min.note_generale,
          max: author._max.note_generale,
          spread: (author._max.note_generale || 0) - (author._min.note_generale || 10)
        }
      })),

      // Livres remarquables
      notable_books: {
        highest_rated: topRated.map(book => ({
          titre: book.titre,
          auteur: book.auteur,
          note: book.note_generale,
          date_lecture: book.date_lecture
        })),
        lowest_rated: lowRated.map(book => ({
          titre: book.titre,
          auteur: book.auteur,
          note: book.note_generale,
          date_lecture: book.date_lecture
        }))
      },

      // Métriques de qualité
      quality_metrics: {
        satisfaction_rate: ratedBooks.length > 0 
          ? Math.round((ratedBooks.filter(b => b.note_generale! >= 7).length / ratedBooks.length) * 100)
          : 0,
        critical_rate: ratedBooks.length > 0 
          ? Math.round((ratedBooks.filter(b => b.note_generale! <= 4).length / ratedBooks.length) * 100)
          : 0,
        rating_strictness: avgRating < 5 ? 'strict' : avgRating > 7 ? 'generous' : 'balanced',
        rating_diversity: Object.keys(distributionData).length, // Nombre de notes différentes utilisées
        perfectionist_score: ratedBooks.length > 0 
          ? Math.round((ratedBooks.filter(b => b.note_generale! === 10).length / ratedBooks.length) * 100)
          : 0
      }
    },
    metadata: {
      user_id: userId,
      filters: {
        include_unrated,
        group_by,
        include_trends,
        period
      },
      generated_at: new Date().toISOString(),
      analysis_period: `${period} (from ${startDate.toISOString().split('T')[0]})`,
      total_books_analyzed: ratedBooks.length + (include_unrated ? unratedBooks : 0)
    },
    message: lang === 'fr' 
      ? `Analyse de ${ratedBooks.length} note(s) sur la période: ${period}` 
      : `Analysis of ${ratedBooks.length} rating(s) for period: ${period}`,
    execution_time_ms: Date.now() - startTime,
  };

    return NextResponse.json(response);
  });
}