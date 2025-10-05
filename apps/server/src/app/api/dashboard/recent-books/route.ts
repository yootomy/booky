import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

// =============================================================================
// 📚 DASHBOARD API - RECENT BOOKS
// =============================================================================

// Schéma pour les paramètres de livres récents
const RecentBooksSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  days: z.coerce.number().int().min(1).max(365).default(30),
  include_metadata: z.boolean().default(true),
  status_filter: z.enum(['LU', 'EN_COURS', 'A_LIRE']).optional(),
});

// GET /api/dashboard/recent-books - Derniers livres ajoutés
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
      include_metadata: queryObject.include_metadata !== 'false',
    };

    const validatedQuery = RecentBooksSchema.parse(transformedQuery);
    const { limit, days, include_metadata, status_filter } = validatedQuery;

    // Calculer la date de début
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Requêtes parallèles
    const [recentBooks, totalCount, periodStats] = await Promise.all([
      // Livres récents avec toutes les données
      db.book.findMany({
        where: {
          createdBy: userId,
          date_creation: { gte: startDate },
          ...(status_filter && { statut: status_filter })
        },
        select: {
          id: true,
          titre: true,
          auteur: true,
          isbn: true,
          image_couverture: true,
          statut: true,
          note_generale: true,
          date_creation: true,
          date_lecture: true,
          date_modification: true,
          resume_personnel: true,
          ajout_manuel: true,
          google_books_id: true,
          open_library_id: true,
          ...(include_metadata && {
            resume_officiel: true,
            editeur: true,
            date_publication: true,
            nombre_pages: true,
            langue: true,
            niveau_spicy: true,
            niveau_dark: true,
            niveau_romance: true,
            book_category: {
              select: {
                id: true,
                category: {
                  select: {
                    id: true,
                    nom: true,
                    couleur: true,
                    icone: true
                  }
                }
              }
            },
            book_tag: {
              select: {
                id: true,
                tag: {
                  select: {
                    id: true,
                    nom: true,
                    couleur: true,
                    type: true
                  }
                }
              }
            }
          })
        },
        orderBy: { date_creation: 'desc' },
        take: limit
      }),

      // Nombre total de livres dans la période
      db.book.count({
        where: {
          createdBy: userId,
          date_creation: { gte: startDate },
          ...(status_filter && { statut: status_filter })
        }
      }),

      // Statistiques de la période
      include_metadata ? Promise.all([
        // Répartition par statut
        db.book.groupBy({
          by: ['statut'],
          where: {
            createdBy: userId,
            date_creation: { gte: startDate }
          },
          _count: { statut: true }
        }),

        // Répartition par source d'ajout
        db.book.aggregate({
          where: {
            createdBy: userId,
            date_creation: { gte: startDate }
          },
          _count: {
            ajout_manuel: true
          }
        }),

        // Moyenne des notes récentes
        db.book.aggregate({
          where: {
            createdBy: userId,
            date_creation: { gte: startDate }
          },
          _avg: { note_generale: true },
          _count: { note_generale: true }
        })
      ]) : null
    ]);

    // Traitement des données
    const processedBooks = recentBooks.map(book => {
      const bookData: any = {
        id: book.id,
        titre: book.titre,
        auteur: book.auteur,
        isbn: book.isbn,
        image_couverture: book.image_couverture,
        statut: book.statut,
        note_generale: book.note_generale,
        date_creation: book.date_creation,
        date_lecture: book.date_lecture,
        date_modification: book.date_modification,
        resume_personnel: book.resume_personnel,
        ajout_manuel: book.ajout_manuel,
        source: book.google_books_id ? 'Google Books' :
                book.open_library_id ? 'Open Library' :
                book.ajout_manuel ? 'Manuel' : 'Inconnu',
        days_ago: Math.ceil((Date.now() - new Date(book.date_creation).getTime()) / (1000 * 60 * 60 * 24))
      };

      if (include_metadata) {
        bookData.metadata = {
          resume_officiel: book.resume_officiel,
          editeur: book.editeur,
          date_publication: book.date_publication,
          nombre_pages: book.nombre_pages,
          langue: book.langue,
          content_levels: {
            spicy: book.niveau_spicy,
            dark: book.niveau_dark,
            romance: book.niveau_romance
          },
          categories: book.book_category?.map((c: any) => c.category) || [],
          tags: book.book_tag?.map((t: any) => t.tag) || []
        };
      }

      return bookData;
    });

    // Analyser les statistiques de période
    let stats: any = {};
    if (include_metadata && periodStats) {
      const [statusStats, sourceStats, ratingsStats] = periodStats;

      // Distribution par statut
      const statusDistribution = statusStats.reduce((acc, stat) => {
        acc[stat.statut] = stat._count.statut;
        return acc;
      }, {} as Record<string, number>);

      // Calculer les pourcentages
      const statusPercentages = Object.entries(statusDistribution).map(([status, count]) => ({
        status,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      }));

      // Analyser la tendance d'ajout
      const booksPerDay = recentBooks.reduce((acc, book) => {
        const day = new Date(book.date_creation).toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const additionVelocity = Object.values(booksPerDay).length > 0
        ? (recentBooks.length / Object.values(booksPerDay).length).toFixed(2)
        : '0';

      stats = {
        period_summary: {
          total_books_in_period: totalCount,
          displayed_books: recentBooks.length,
          period_days: days,
          addition_velocity: `${additionVelocity} livres/jour`
        },
        status_distribution: {
          breakdown: statusDistribution,
          percentages: statusPercentages,
          most_common_status: statusPercentages.reduce((max, current) =>
            current.count > max.count ? current : max, statusPercentages[0])?.status || null
        },
        source_analysis: {
          manual_additions: sourceStats._count.ajout_manuel || 0,
          api_additions: totalCount - (sourceStats._count.ajout_manuel || 0),
          manual_percentage: totalCount > 0 ? Math.round(((sourceStats._count.ajout_manuel || 0) / totalCount) * 100) : 0
        },
        rating_summary: ratingsStats._count.note_generale > 0 ? {
          rated_books: ratingsStats._count.note_generale,
          average_rating: Number((ratingsStats._avg.note_generale || 0).toFixed(2)),
          rating_coverage: Math.round((ratingsStats._count.note_generale / totalCount) * 100)
        } : null,
        activity_timeline: Object.entries(booksPerDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, books_added: count }))
      };
    }

    const response = {
      success: true,
      data: {
        books: processedBooks,
        ...(include_metadata && { statistics: stats })
      },
      metadata: {
        user_id: userId,
        filters: {
          limit,
          days_back: days,
          status_filter: status_filter || 'all',
          include_metadata
        },
        period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          total_days: days
        },
        pagination: {
          displayed: recentBooks.length,
          total_in_period: totalCount,
          has_more: totalCount > limit
        },
        generated_at: new Date().toISOString()
      },
      message: lang === 'fr'
        ? `${recentBooks.length} livre(s) récent(s) sur les ${days} derniers jours`
        : `${recentBooks.length} recent book(s) from the last ${days} days`,
      execution_time_ms: Date.now() - startTime,
    };

    return NextResponse.json(response);
  });
}