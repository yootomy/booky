import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getTypedSession } from "@/utils/auth-helpers";

// =============================================================================
// 📊 API ROUTE GENERAL STATS - /api/stats/general
// =============================================================================

// GET /api/stats/general - Statistiques générales de l'utilisateur
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

  // Récupérer toutes les statistiques en parallèle pour optimiser les performances
  const [
    totalBooks,
    booksByStatus,
    ratingsStats,
    spicyDarkStats,
    categoriesCount,
    tagsCount,
    monthlyReadingStats,
    topRatedBooks,
    recentBooks,
    oldestBook,
    newestBook,
    averageReadingTime
  ] = await Promise.all([
    // Nombre total de livres
    db.book.count({
      where: { createdBy: userId }
    }),

    // Répartition par statut
    db.book.groupBy({
      by: ['statut'],
      where: { createdBy: userId },
      _count: { statut: true }
    }),

    // Statistiques des notes
    db.book.aggregate({
      where: { 
        createdBy: userId,
        note_generale: { gte: 0 }
      },
      _avg: { note_generale: true },
      _min: { note_generale: true },
      _max: { note_generale: true },
      _count: { note_generale: true }
    }),

    // Statistiques niveaux spicy/dark
    Promise.all([
      db.book.aggregate({
        where: { 
          createdBy: userId,
          niveau_spicy: { gte: 0 }
        },
        _avg: { niveau_spicy: true },
        _max: { niveau_spicy: true }
      }),
      db.book.aggregate({
        where: { 
          createdBy: userId,
          niveau_dark: { gte: 0 }
        },
        _avg: { niveau_dark: true },
        _max: { niveau_dark: true }
      })
    ]),

    // Nombre de catégories utilisées
    db.book_category.groupBy({
      by: ['categoryId'],
      where: {
        book: { createdBy: userId }
      },
      _count: { categoryId: true }
    }).then(result => result.length),

    // Nombre de tags utilisés
    db.book_tag.groupBy({
      by: ['tagId'],
      where: {
        book: { createdBy: userId }
      },
      _count: { tagId: true }
    }).then(result => result.length),

    // Statistiques de lecture mensuelle (6 derniers mois)
    db.book.groupBy({
      by: ['date_lecture'],
      where: {
        createdBy: userId,
        date_lecture: {
          not: null,
          gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // 6 mois
        }
      },
      _count: { date_lecture: true }
    }),

    // Top 3 des livres les mieux notés
    db.book.findMany({
      where: {
        createdBy: userId,
        note_generale: { gte: 0 }
      },
      select: {
        id: true,
        titre: true,
        auteur: true,
        note_generale: true,
        image_couverture: true
      },
      orderBy: [
        { note_generale: 'desc' },
        { date_lecture: 'desc' }
      ],
      take: 3
    }),

    // 3 derniers livres ajoutés
    db.book.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        titre: true,
        auteur: true,
        statut: true,
        date_creation: true,
        image_couverture: true
      },
      orderBy: { date_creation: 'desc' },
      take: 3
    }),

    // Livre le plus ancien
    db.book.findFirst({
      where: { createdBy: userId },
      select: {
        titre: true,
        auteur: true,
        date_creation: true
      },
      orderBy: { date_creation: 'asc' }
    }),

    // Livre le plus récent
    db.book.findFirst({
      where: { createdBy: userId },
      select: {
        titre: true,
        auteur: true,
        date_creation: true
      },
      orderBy: { date_creation: 'desc' }
    }),

    // Temps de lecture moyen (basé sur les dates d'ajout vs lecture)
    db.book.findMany({
      where: {
        createdBy: userId,
        date_lecture: { not: null },
        statut: 'LU'
      },
      select: {
        date_creation: true,
        date_lecture: true
      }
    }).then(books => {
      if (books.length === 0) return null;
      const totalDays = books.reduce((sum, book) => {
        const creationDate = new Date(book.date_creation);
        const readingDate = new Date(book.date_lecture!);
        const diffTime = readingDate.getTime() - creationDate.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        return sum + diffDays;
      }, 0);
      return Math.round(totalDays / books.length);
    })
  ]);

  // Calculer des métriques avancées
  const statusDistribution = booksByStatus.reduce((acc, item) => {
    acc[item.statut] = item._count.statut;
    return acc;
  }, {} as Record<string, number>);

  // Pourcentages par statut
  const statusPercentages = Object.entries(statusDistribution).reduce((acc, [status, count]) => {
    acc[status] = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
    return acc;
  }, {} as Record<string, number>);

  // Analyser la progression de lecture
  const readingProgress = {
    books_read: statusDistribution.LU || 0,
    books_in_progress: statusDistribution.EN_COURS || 0,
    books_to_read: statusDistribution.A_LIRE || 0,
    books_abandoned: statusDistribution.ABANDONNE || 0,
    completion_rate: totalBooks > 0 ? Math.round(((statusDistribution.LU || 0) / totalBooks) * 100) : 0
  };

  // Créer les données de lecture mensuelle
  const monthlyData = monthlyReadingStats.reduce((acc, item) => {
    if (item.date_lecture) {
      const month = new Date(item.date_lecture).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + item._count.date_lecture;
    }
    return acc;
  }, {} as Record<string, number>);

  const response = {
    success: true,
    data: {
      // Statistiques de base
      overview: {
        total_books: totalBooks,
        books_with_ratings: ratingsStats._count.note_generale || 0,
        categories_used: categoriesCount,
        tags_used: tagsCount,
        library_age_days: oldestBook ? Math.ceil((Date.now() - new Date(oldestBook.date_creation).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        average_reading_time_days: averageReadingTime
      },

      // Progression de lecture
      reading_progress: readingProgress,

      // Distribution par statut
      status_distribution: {
        counts: statusDistribution,
        percentages: statusPercentages
      },

      // Statistiques des notes
      ratings_summary: ratingsStats._count.note_generale > 0 ? {
        average_rating: Number((ratingsStats._avg.note_generale || 0).toFixed(2)),
        min_rating: ratingsStats._min.note_generale,
        max_rating: ratingsStats._max.note_generale,
        total_rated_books: ratingsStats._count.note_generale,
        rating_coverage: totalBooks > 0 ? Math.round((ratingsStats._count.note_generale / totalBooks) * 100) : 0
      } : null,

      // Niveaux de contenu
      content_levels: {
        spicy: spicyDarkStats[0]._avg.niveau_spicy ? {
          average: Number(spicyDarkStats[0]._avg.niveau_spicy.toFixed(1)),
          max: spicyDarkStats[0]._max.niveau_spicy
        } : null,
        dark: spicyDarkStats[1]._avg.niveau_dark ? {
          average: Number(spicyDarkStats[1]._avg.niveau_dark.toFixed(1)),
          max: spicyDarkStats[1]._max.niveau_dark
        } : null
      },

      // Activité de lecture récente
      recent_activity: {
        monthly_reading: monthlyData,
        top_rated_books: topRatedBooks,
        recent_additions: recentBooks
      },

      // Informations sur la bibliothèque
      library_info: {
        oldest_book: oldestBook ? {
          title: oldestBook.titre,
          author: oldestBook.auteur,
          added_date: oldestBook.date_creation
        } : null,
        newest_book: newestBook ? {
          title: newestBook.titre,
          author: newestBook.auteur,
          added_date: newestBook.date_creation
        } : null
      },

      // Métriques de tendances
      trends: {
        reading_velocity: averageReadingTime ? `${averageReadingTime} jours en moyenne` : null,
        productivity_score: Math.min(100, Math.max(0, Math.round(
          (readingProgress.completion_rate * 0.4) + 
          (Math.min(100, (ratingsStats._count.note_generale || 0) * 5) * 0.3) +
          (Math.min(100, categoriesCount * 10) * 0.3)
        ))),
        diversity_index: Math.round(((categoriesCount * 2) + tagsCount) / Math.max(1, totalBooks) * 100)
      }
    },
    metadata: {
      user_id: userId,
      generated_at: new Date().toISOString(),
      data_freshness: 'real-time',
      period_analyzed: 'all-time'
    },
    message: lang === 'fr' 
      ? `Statistiques générales générées pour ${totalBooks} livre(s)` 
      : `General statistics generated for ${totalBooks} book(s)`,
    execution_time_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
});