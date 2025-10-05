import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

// =============================================================================
// ⭐ DASHBOARD API - TOP RATED BOOKS
// =============================================================================

// Schéma pour les paramètres de livres les mieux notés
const TopRatedBooksSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  min_rating: z.coerce.number().min(0).max(10).default(7),
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('all'),
  include_ties: z.boolean().default(true),
  include_metadata: z.boolean().default(true),
  sort_by: z.enum(['rating', 'date', 'title']).default('rating'),
  genre_filter: z.string().optional(),
});

// GET /api/dashboard/top-rated - Livres les mieux notés
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
      include_ties: queryObject.include_ties !== 'false',
      include_metadata: queryObject.include_metadata !== 'false',
    };

    const validatedQuery = TopRatedBooksSchema.parse(transformedQuery);
    const { limit, min_rating, period, include_ties, include_metadata, sort_by, genre_filter } = validatedQuery;

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
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

    // Construire les conditions de filtrage
    const whereConditions: any = {
      createdBy: userId,
      note_generale: {
        gte: min_rating,
        not: null
      },
      ...(period !== 'all' && {
        OR: [
          { date_lecture: { gte: startDate } },
          { date_creation: { gte: startDate } }
        ]
      })
    };

    // Filtrage par genre si spécifié
    if (genre_filter) {
      whereConditions.OR = [
        {
          book_category: {
            some: {
              category: {
                nom: {
                  contains: genre_filter,
                  mode: 'insensitive'
                }
              }
            }
          }
        },
        {
          book_tag: {
            some: {
              tag: {
                nom: {
                  contains: genre_filter,
                  mode: 'insensitive'
                },
                type: 'GENRE'
              }
            }
          }
        }
      ];
    }

    // Requêtes parallèles
    const [topRatedBooks, ratingStats, genreBreakdown] = await Promise.all([
      // Livres les mieux notés
      db.book.findMany({
        where: whereConditions,
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
          critique_detaillee: true,
          pourquoi_aimer: true,
          citations_favorites: true,
          ...(include_metadata && {
            resume_officiel: true,
            editeur: true,
            date_publication: true,
            nombre_pages: true,
            langue: true,
            niveau_spicy: true,
            niveau_dark: true,
            niveau_romance: true,
            intensite_emotionnelle: true,
            originalite: true,
            rythme: true,
            book_category: {
              include: {
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
              include: {
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
        orderBy: sort_by === 'rating' ? { note_generale: 'desc' } :
                sort_by === 'date' ? { date_lecture: 'desc' } :
                { titre: 'asc' },
        take: include_ties ? undefined : limit
      }),

      // Statistiques des notes dans cette gamme
      db.book.aggregate({
        where: whereConditions,
        _avg: { note_generale: true },
        _min: { note_generale: true },
        _max: { note_generale: true },
        _count: { note_generale: true }
      }),

      // Répartition par genre des livres bien notés
      include_metadata ? db.book.findMany({
        where: whereConditions,
        select: {
          note_generale: true,
          book_category: {
            include: {
              category: { select: { nom: true } }
            }
          },
          book_tag: {
            where: { tag: { type: 'GENRE' } },
            include: {
              tag: { select: { nom: true } }
            }
          }
        }
      }) : []
    ]);

    // Traitement spécial pour les égalités si demandé
    let finalBooks = topRatedBooks;
    if (include_ties && topRatedBooks.length > limit) {
      // Trouver le score minimum dans la limite
      const limitBook = topRatedBooks[limit - 1];
      const minScoreInLimit = limitBook.note_generale;

      // Inclure tous les livres avec le même score que le dernier de la limite
      finalBooks = topRatedBooks.filter(book =>
        book.note_generale! >= minScoreInLimit
      );
    }

    // Traitement des données
    const processedBooks = finalBooks.map((book, index) => {
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
        critique_detaillee: book.critique_detaillee,
        pourquoi_aimer: book.pourquoi_aimer,
        citations_favorites: book.citations_favorites,
        rank: index + 1,
        excellence_score: book.note_generale! >= 9 ? 'exceptional' :
                         book.note_generale! >= 8 ? 'excellent' :
                         book.note_generale! >= 7 ? 'very_good' : 'good'
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
          quality_metrics: {
            intensite_emotionnelle: book.intensite_emotionnelle,
            originalite: book.originalite,
            rythme: book.rythme
          },
          categories: book.book_category?.map((c: any) => c.category) || [],
          tags: book.book_tag?.map((t: any) => t.tag) || []
        };
      }

      return bookData;
    });

    // Analyser les genres des livres bien notés
    let genreAnalysis: any = {};
    if (include_metadata && genreBreakdown.length > 0) {
      const genreRatings: Record<string, { total: number; count: number; ratings: number[] }> = {};

      genreBreakdown.forEach(book => {
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

      genreAnalysis = Object.entries(genreRatings)
        .map(([genre, data]) => ({
          genre,
          avg_rating: Number((data.total / data.count).toFixed(2)),
          book_count: data.count,
          excellence_rate: Math.round((data.ratings.filter(r => r >= 9).length / data.count) * 100)
        }))
        .filter(item => item.book_count >= 2)
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 10);
    }

    // Identifier les patterns des livres exceptionnels
    const exceptionalBooks = processedBooks.filter(book => book.note_generale >= 9);
    const excellentBooks = processedBooks.filter(book => book.note_generale >= 8 && book.note_generale < 9);

    // Analyser la distribution des notes élevées
    const ratingDistribution = processedBooks.reduce((acc, book) => {
      const rating = Math.floor(book.note_generale);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const response = {
      success: true,
      data: {
        books: processedBooks.slice(0, Math.min(limit, processedBooks.length)),
        ...(include_metadata && {
          analysis: {
            rating_overview: {
              total_top_rated: ratingStats._count.note_generale,
              average_of_top_rated: Number((ratingStats._avg.note_generale || 0).toFixed(2)),
              highest_rating: ratingStats._max.note_generale,
              rating_threshold: min_rating,
              distribution: ratingDistribution
            },
            excellence_breakdown: {
              exceptional_books: exceptionalBooks.length,
              excellent_books: excellentBooks.length,
              very_good_books: processedBooks.filter(b => b.note_generale >= 7 && b.note_generale < 8).length,
              excellence_rate: processedBooks.length > 0 ?
                Math.round((exceptionalBooks.length / processedBooks.length) * 100) : 0
            },
            genre_performance: genreAnalysis,
            quality_insights: {
              most_consistent_excellence: genreAnalysis[0]?.genre || null,
              reading_satisfaction_rate: Math.round((processedBooks.length / (ratingStats._count.note_generale || 1)) * 100),
              top_rating_frequency: Object.entries(ratingDistribution)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 3)
                .map(([rating, count]) => ({
                  rating: Number(rating),
                  count: count as number,
                  percentage: Math.round(((count as number) / processedBooks.length) * 100)
                }))
            }
          }
        })
      },
      metadata: {
        user_id: userId,
        filters: {
          min_rating,
          period,
          limit,
          include_ties,
          include_metadata,
          sort_by,
          genre_filter: genre_filter || 'all'
        },
        period_info: {
          analyzed_period: period,
          start_date: period !== 'all' ? startDate.toISOString().split('T')[0] : null,
          end_date: new Date().toISOString().split('T')[0]
        },
        result_info: {
          requested_limit: limit,
          actual_returned: Math.min(limit, processedBooks.length),
          total_matching: processedBooks.length,
          ties_included: include_ties && processedBooks.length > limit
        },
        generated_at: new Date().toISOString()
      },
      message: lang === 'fr'
        ? `${processedBooks.slice(0, limit).length} livre(s) les mieux noté(s) (≥${min_rating}/10)`
        : `${processedBooks.slice(0, limit).length} top-rated book(s) (≥${min_rating}/10)`,
      execution_time_ms: Date.now() - startTime,
    };

    return NextResponse.json(response);
  });
}