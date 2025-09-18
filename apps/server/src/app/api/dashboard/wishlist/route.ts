import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getTypedSession } from "@/utils/auth-helpers";
import { z } from "zod";

// =============================================================================
// 📚 DASHBOARD API - WISHLIST BOOKS (À LIRE)
// =============================================================================

// Schéma pour les paramètres de la wishlist
const WishlistSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  include_metadata: z.boolean().default(true),
  sort_by: z.enum(['added_date', 'title', 'author', 'priority', 'anticipated_rating']).default('added_date'),
  priority_filter: z.enum(['high', 'medium', 'low']).optional(),
  genre_filter: z.string().optional(),
  include_recommendations: z.boolean().default(true),
});

// GET /api/dashboard/wishlist - Liste des livres à lire (wishlist)
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
    include_metadata: queryObject.include_metadata !== 'false',
    include_recommendations: queryObject.include_recommendations !== 'false',
  };
  
  const validatedQuery = WishlistSchema.parse(transformedQuery);
  const { limit, include_metadata, sort_by, priority_filter, genre_filter, include_recommendations } = validatedQuery;

  // Construire les conditions de filtrage
  const whereConditions: any = {
    createdBy: userId,
    statut: 'A_LIRE'
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
  const [wishlistBooks, wishlistStats, similarBooksData] = await Promise.all([
    // Livres de la wishlist
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
        date_modification: true,
        resume_personnel: true,
        resume_officiel: true,
        pourquoi_aimer: true,
        questions_sur_le_livre: true,
        ...(include_metadata && {
          editeur: true,
          date_publication: true,
          nombre_pages: true,
          langue: true,
          niveau_spicy: true,
          niveau_dark: true,
          niveau_romance: true,
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
      orderBy: sort_by === 'added_date' ? { date_creation: 'desc' } :
              sort_by === 'title' ? { titre: 'asc' } :
              sort_by === 'author' ? { auteur: 'asc' } :
              { date_creation: 'desc' } // priority et anticipated_rating par défaut
    }),

    // Statistiques de la wishlist
    Promise.all([
      // Nombre total de livres à lire
      db.book.count({
        where: { createdBy: userId, statut: 'A_LIRE' }
      }),
      
      // Répartition par période d'ajout
      db.book.groupBy({
        by: ['date_creation'],
        where: {
          createdBy: userId,
          statut: 'A_LIRE',
          date_creation: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Dernière année
          }
        },
        _count: { id: true }
      }),

      // Analyse des genres dans la wishlist
      db.book.findMany({
        where: { createdBy: userId, statut: 'A_LIRE' },
        select: {
          book_category: {
            include: { category: { select: { nom: true } } }
          },
          book_tag: {
            where: { tag: { type: 'GENRE' } },
            include: { tag: { select: { nom: true } } }
          }
        }
      })
    ]),

    // Données pour recommandations (livres similaires déjà lus)
    include_recommendations ? db.book.findMany({
      where: {
        createdBy: userId,
        statut: 'LU',
        note_generale: { gte: 7 } // Livres bien notés
      },
      select: {
        titre: true,
        auteur: true,
        note_generale: true,
        book_category: {
          include: { category: { select: { nom: true } } }
        },
        book_tag: {
          where: { tag: { type: 'GENRE' } },
          include: { tag: { select: { nom: true } } }
        }
      },
      take: 50 // Échantillon pour comparaison
    }) : []
  ]);

  // Traitement des données de la wishlist
  const processedBooks = wishlistBooks.map((book, index) => {
    // Calculer l'ancienneté dans la wishlist
    const daysInWishlist = Math.ceil((Date.now() - new Date(book.date_creation).getTime()) / (1000 * 60 * 60 * 24));
    
    // Déterminer la priorité basée sur différents facteurs
    let priorityScore = 0;
    if (book.pourquoi_aimer) priorityScore += 2; // Raison d'intérêt notée
    if (book.questions_sur_le_livre) priorityScore += 2; // Questions spécifiques
    if (daysInWishlist >= 90) priorityScore += 1; // Longue attente
    if (book.resume_personnel) priorityScore += 1; // Notes personnelles
    if (book.nombre_pages && book.nombre_pages < 300) priorityScore += 1; // Livre plus court
    
    const priority = priorityScore >= 4 ? 'high' : priorityScore >= 2 ? 'medium' : 'low';
    
    // Estimer la note anticipée basée sur les genres et l'historique
    let anticipatedRating = 7; // Note de base
    if (include_recommendations && similarBooksData.length > 0) {
      const bookGenres = [
        ...(book.book_category?.map((c: any) => c.category.nom) || []),
        ...(book.book_tag?.map((t: any) => t.tag.nom) || [])
      ];
      
      const similarReadBooks = similarBooksData.filter(readBook => {
        const readGenres = [
          ...readBook.book_category.map((c: any) => c.category.nom),
          ...readBook.book_tag.map((t: any) => t.tag.nom)
        ];
        return bookGenres.some(genre => readGenres.includes(genre));
      });
      
      if (similarReadBooks.length > 0) {
        const avgSimilarRating = similarReadBooks.reduce((sum, b) => sum + (b.note_generale || 7), 0) / similarReadBooks.length;
        anticipatedRating = Math.round(avgSimilarRating * 10) / 10;
      }
    }
    
    const bookData: any = {
      id: book.id,
      titre: book.titre,
      auteur: book.auteur,
      isbn: book.isbn,
      image_couverture: book.image_couverture,
      statut: book.statut,
      date_creation: book.date_creation,
      date_modification: book.date_modification,
      resume_personnel: book.resume_personnel,
      resume_officiel: book.resume_officiel,
      pourquoi_aimer: book.pourquoi_aimer,
      questions_sur_le_livre: book.questions_sur_le_livre,
      wishlist_info: {
        days_in_wishlist: daysInWishlist,
        priority,
        priority_score: priorityScore,
        anticipated_rating: anticipatedRating,
        urgency_level: daysInWishlist >= 180 ? 'overdue' : 
                      daysInWishlist >= 90 ? 'due' : 
                      daysInWishlist >= 30 ? 'recent' : 'fresh',
        reading_motivation: book.pourquoi_aimer ? 'high' : 
                           book.questions_sur_le_livre ? 'medium' : 'low'
      }
    };

    if (include_metadata) {
      bookData.metadata = {
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

  // Filtrer par priorité si demandé
  let filteredBooks = processedBooks;
  if (priority_filter) {
    filteredBooks = processedBooks.filter(book => book.wishlist_info.priority === priority_filter);
  }

  // Analyser les statistiques de la wishlist
  const [totalWishlistBooks, additionHistory, genreData] = wishlistStats;
  
  // Analyse des genres les plus présents dans la wishlist
  const genreCount: Record<string, number> = {};
  genreData.forEach(book => {
    const genres = [
      ...book.book_category.map((c: any) => c.category.nom),
      ...book.book_tag.map((t: any) => t.tag.nom)
    ];
    genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });

  const topWishlistGenres = Object.entries(genreCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / totalWishlistBooks) * 100)
    }));

  // Analyser les patterns d'ajout dans le temps
  const monthlyAdditions: Record<string, number> = {};
  additionHistory.forEach(entry => {
    const month = new Date(entry.date_creation).toISOString().substring(0, 7);
    monthlyAdditions[month] = (monthlyAdditions[month] || 0) + entry._count.id;
  });

  // Priorités et recommandations
  const priorityDistribution = processedBooks.reduce((acc, book) => {
    const priority = book.wishlist_info.priority;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const urgencyAnalysis = processedBooks.reduce((acc, book) => {
    const urgency = book.wishlist_info.urgency_level;
    acc[urgency] = (acc[urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recommandations de lecture intelligentes
  const readingRecommendations = [];
  if (priorityDistribution.high > 0) {
    readingRecommendations.push({
      type: 'high_priority',
      message: lang === 'fr' 
        ? `${priorityDistribution.high} livre(s) haute priorité à considérer en premier`
        : `${priorityDistribution.high} high-priority book(s) to consider first`,
      books: filteredBooks.filter(b => b.wishlist_info.priority === 'high').slice(0, 3)
    });
  }

  if (urgencyAnalysis.overdue && urgencyAnalysis.overdue > 0) {
    readingRecommendations.push({
      type: 'overdue_books',
      message: lang === 'fr' 
        ? `${urgencyAnalysis.overdue} livre(s) en attente depuis plus de 6 mois`
        : `${urgencyAnalysis.overdue} book(s) waiting for more than 6 months`,
      books: filteredBooks.filter(b => b.wishlist_info.urgency_level === 'overdue').slice(0, 3)
    });
  }

  const response = {
    success: true,
    data: {
      books: filteredBooks.slice(0, limit),
      ...(include_recommendations && {
        recommendations: readingRecommendations,
        analysis: {
          wishlist_overview: {
            total_books: totalWishlistBooks,
            displayed_books: Math.min(limit, filteredBooks.length),
            average_days_waiting: processedBooks.length > 0 
              ? Math.round(processedBooks.reduce((sum, book) => sum + book.wishlist_info.days_in_wishlist, 0) / processedBooks.length)
              : 0,
            completion_rate_estimate: totalWishlistBooks > 0 ? `${Math.round(52 / totalWishlistBooks * 100)}% par an` : '0%'
          },
          priority_breakdown: {
            distribution: priorityDistribution,
            high_priority_percentage: Math.round(((priorityDistribution.high || 0) / totalWishlistBooks) * 100)
          },
          urgency_analysis: {
            distribution: urgencyAnalysis,
            needs_attention: (urgencyAnalysis.overdue || 0) + (urgencyAnalysis.due || 0),
            freshness_score: Math.max(0, 100 - ((urgencyAnalysis.overdue || 0) * 30) - ((urgencyAnalysis.due || 0) * 15))
          },
          genre_preferences: {
            top_genres: topWishlistGenres,
            diversity_score: Object.keys(genreCount).length,
            most_anticipated_genre: topWishlistGenres[0]?.genre || null
          },
          reading_insights: {
            anticipated_avg_rating: processedBooks.length > 0 
              ? Number((processedBooks.reduce((sum, book) => sum + book.wishlist_info.anticipated_rating, 0) / processedBooks.length).toFixed(2))
              : 0,
            high_motivation_books: processedBooks.filter(b => b.wishlist_info.reading_motivation === 'high').length,
            addition_velocity: Object.keys(monthlyAdditions).length > 0 
              ? `${(Object.values(monthlyAdditions).reduce((sum, count) => sum + count, 0) / Object.keys(monthlyAdditions).length).toFixed(1)} livres/mois`
              : '0 livres/mois'
          }
        }
      })
    },
    metadata: {
      user_id: userId,
      filters: {
        limit,
        include_metadata,
        sort_by,
        priority_filter: priority_filter || 'all',
        genre_filter: genre_filter || 'all',
        include_recommendations
      },
      result_info: {
        total_wishlist_books: totalWishlistBooks,
        displayed_after_filters: Math.min(limit, filteredBooks.length),
        priority_distribution: priorityDistribution,
        urgency_distribution: urgencyAnalysis
      },
      generated_at: new Date().toISOString()
    },
    message: lang === 'fr' 
      ? `${Math.min(limit, filteredBooks.length)} livre(s) dans la wishlist` 
      : `${Math.min(limit, filteredBooks.length)} book(s) in wishlist`,
    execution_time_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
});