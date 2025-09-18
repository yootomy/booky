import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getTypedSession } from "@/utils/auth-helpers";
import { z } from "zod";

// =============================================================================
// 🎭 API ROUTE GENRES STATS - /api/stats/genres
// =============================================================================

// Schéma pour les paramètres de statistiques de genres
const GenresStatsSchema = z.object({
  include_tags: z.boolean().default(true),
  include_categories: z.boolean().default(true),
  min_books: z.coerce.number().min(1).default(1),
  sort_by: z.enum(['count', 'name', 'rating', 'recent'])
    .default('count'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// GET /api/stats/genres - Statistiques de répartition par genres et catégories
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
    include_tags: queryObject.include_tags !== 'false',
    include_categories: queryObject.include_categories !== 'false',
    min_books: queryObject.min_books ? parseInt(queryObject.min_books) : undefined,
    limit: queryObject.limit ? parseInt(queryObject.limit) : undefined,
  };
  
  const validatedQuery = GenresStatsSchema.parse(transformedQuery);
  const { include_tags, include_categories, min_books, sort_by, order, limit } = validatedQuery;

  // Requêtes parallèles pour optimiser les performances
  const [
    categoriesData,
    tagsGenreData,
    combinedGenreAnalysis,
    temporalGenreData,
    ratingsByGenre
  ] = await Promise.all([
    // Données des catégories (si incluses)
    include_categories ? db.book_category.groupBy({
      by: ['categoryId'],
      where: {
        book: { createdBy: userId }
      },
      _count: { categoryId: true }
    }).then(async (results) => {
      const categoryIds = results.map(r => r.categoryId);
      const categories = await db.category.findMany({
        where: { id: { in: categoryIds } },
        select: {
          id: true,
          nom: true,
          couleur: true,
          icone: true,
          description: true
        }
      });
      
      return results.map(result => ({
        ...result,
        category: categories.find(c => c.id === result.categoryId)
      })).filter(item => item._count.categoryId >= min_books);
    }) : [],

    // Données des tags de type GENRE (si incluses)
    include_tags ? db.book_tag.groupBy({
      by: ['tagId'],
      where: {
        book: { createdBy: userId },
        tag: { type: 'GENRE' }
      },
      _count: { tagId: true }
    }).then(async (results) => {
      const tagIds = results.map(r => r.tagId);
      const tags = await db.tag.findMany({
        where: { id: { in: tagIds } },
        select: {
          id: true,
          nom: true,
          couleur: true,
          type: true
        }
      });
      
      return results.map(result => ({
        ...result,
        tag: tags.find(t => t.id === result.tagId)
      })).filter(item => item._count.tagId >= min_books);
    }) : [],

    // Analyse combinée (livres avec leurs genres/catégories)
    db.book.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        titre: true,
        auteur: true,
        statut: true,
        note_generale: true,
        date_lecture: true,
        date_creation: true,
        book_category: {
          include: { category: true }
        },
        book_tag: {
          where: { tag: { type: 'GENRE' } },
          include: { tag: true }
        }
      }
    }),

    // Données temporelles par genre (évolution dans le temps)
    db.book.findMany({
      where: {
        createdBy: userId,
        date_lecture: { not: null }
      },
      select: {
        date_lecture: true,
        book_category: {
          include: { category: { select: { nom: true } } }
        },
        book_tag: {
          where: { tag: { type: 'GENRE' } },
          include: { tag: { select: { nom: true } } }
        }
      },
      orderBy: { date_lecture: 'asc' }
    }),

    // Notes moyennes par genre
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
    })
  ]);

  // Traitement des données combinées
  const genreAnalysis: Record<string, {
    name: string;
    type: 'category' | 'tag';
    count: number;
    books: any[];
    color?: string;
    icon?: string;
    avg_rating?: number;
    completion_rate: number;
    recent_activity: number; // Livres lus dans les 3 derniers mois
  }> = {};

  // Ajouter les catégories
  categoriesData.forEach(item => {
    if (item.category) {
      genreAnalysis[item.category.nom] = {
        name: item.category.nom,
        type: 'category',
        count: item._count.categoryId,
        books: [],
        color: item.category.couleur,
        icon: item.category.icone || undefined,
        completion_rate: 0,
        recent_activity: 0
      };
    }
  });

  // Ajouter les tags GENRE
  tagsGenreData.forEach(item => {
    if (item.tag) {
      genreAnalysis[item.tag.nom] = {
        name: item.tag.nom,
        type: 'tag',
        count: item._count.tagId,
        books: [],
        color: item.tag.couleur,
        completion_rate: 0,
        recent_activity: 0
      };
    }
  });

  // Analyser les livres pour enrichir les données
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  combinedGenreAnalysis.forEach(book => {
    const allGenres = [
      ...book.book_category.map(c => c.category.nom),
      ...book.book_tag.map(t => t.tag.nom)
    ];

    allGenres.forEach(genreName => {
      if (genreAnalysis[genreName]) {
        genreAnalysis[genreName].books.push({
          id: book.id,
          titre: book.titre,
          auteur: book.auteur,
          statut: book.statut,
          note: book.note_generale,
          date_lecture: book.date_lecture
        });

        // Calculer le taux d'achèvement
        if (book.statut === 'LU') {
          genreAnalysis[genreName].completion_rate++;
        }

        // Calculer l'activité récente
        if (book.date_lecture && new Date(book.date_lecture) >= threeMonthsAgo) {
          genreAnalysis[genreName].recent_activity++;
        }
      }
    });
  });

  // Finaliser les calculs
  Object.keys(genreAnalysis).forEach(genre => {
    const data = genreAnalysis[genre];
    data.completion_rate = Math.round((data.completion_rate / data.count) * 100);
    
    // Calculer la note moyenne
    const ratingsBooks = data.books.filter(b => b.note !== null);
    if (ratingsBooks.length > 0) {
      data.avg_rating = Number((ratingsBooks.reduce((sum, b) => sum + b.note, 0) / ratingsBooks.length).toFixed(2));
    }
  });

  // Trier les données selon les critères
  const sortedGenres = Object.entries(genreAnalysis);
  
  switch (sort_by) {
    case 'count':
      sortedGenres.sort(([,a], [,b]) => order === 'desc' ? b.count - a.count : a.count - b.count);
      break;
    case 'name':
      sortedGenres.sort(([,a], [,b]) => order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));
      break;
    case 'rating':
      sortedGenres.sort(([,a], [,b]) => {
        const ratingA = a.avg_rating || 0;
        const ratingB = b.avg_rating || 0;
        return order === 'desc' ? ratingB - ratingA : ratingA - ratingB;
      });
      break;
    case 'recent':
      sortedGenres.sort(([,a], [,b]) => order === 'desc' ? b.recent_activity - a.recent_activity : a.recent_activity - b.recent_activity);
      break;
  }

  // Limiter les résultats
  const limitedGenres = sortedGenres.slice(0, limit);

  // Analyser les tendances temporelles
  const temporalTrends: Record<string, Record<string, number>> = {};
  temporalGenreData.forEach(book => {
    if (book.date_lecture) {
      const month = new Date(book.date_lecture).toISOString().substring(0, 7); // YYYY-MM
      const allGenres = [
        ...book.book_category.map(c => c.category.nom),
        ...book.book_tag.map(t => t.tag.nom)
      ];

      allGenres.forEach(genre => {
        if (!temporalTrends[genre]) {
          temporalTrends[genre] = {};
        }
        temporalTrends[genre][month] = (temporalTrends[genre][month] || 0) + 1;
      });
    }
  });

  // Analyser la diversité des genres
  const totalBooks = combinedGenreAnalysis.length;
  const totalGenres = limitedGenres.length;
  const diversityIndex = totalBooks > 0 ? Math.round((totalGenres / totalBooks) * 100) : 0;

  // Top genres par différents critères
  const topGenresByCount = limitedGenres.slice(0, 5);
  const topGenresByRating = [...limitedGenres]
    .sort(([,a], [,b]) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 5);

  const response = {
    success: true,
    data: {
      // Vue d'ensemble
      overview: {
        total_genres: totalGenres,
        total_books: totalBooks,
        diversity_index: diversityIndex,
        categories_count: categoriesData.length,
        genre_tags_count: tagsGenreData.length,
        most_read_genre: limitedGenres[0]?.[1]?.name || null,
        highest_rated_genre: topGenresByRating[0]?.[1]?.name || null
      },

      // Données détaillées par genre
      genres: limitedGenres.map(([name, data]) => ({
        name,
        type: data.type,
        count: data.count,
        percentage: totalBooks > 0 ? Math.round((data.count / totalBooks) * 100) : 0,
        avg_rating: data.avg_rating,
        completion_rate: data.completion_rate,
        recent_activity: data.recent_activity,
        color: data.color,
        icon: data.icon,
        sample_books: data.books.slice(0, 3) // 3 exemples de livres
      })),

      // Analyses comparative
      top_performers: {
        most_read: topGenresByCount.map(([name, data]) => ({
          name,
          count: data.count,
          type: data.type
        })),
        highest_rated: topGenresByRating.map(([name, data]) => ({
          name,
          avg_rating: data.avg_rating,
          count: data.count,
          type: data.type
        })),
        most_recent: [...limitedGenres]
          .sort(([,a], [,b]) => b.recent_activity - a.recent_activity)
          .slice(0, 5)
          .map(([name, data]) => ({
            name,
            recent_books: data.recent_activity,
            type: data.type
          }))
      },

      // Tendances temporelles (pour les top 5 genres)
      temporal_trends: Object.fromEntries(
        topGenresByCount.slice(0, 5).map(([name]) => [
          name,
          temporalTrends[name] || {}
        ])
      ),

      // Distribution par type
      distribution_by_type: {
        categories: limitedGenres.filter(([,data]) => data.type === 'category').length,
        tags: limitedGenres.filter(([,data]) => data.type === 'tag').length,
        category_books: limitedGenres
          .filter(([,data]) => data.type === 'category')
          .reduce((sum, [,data]) => sum + data.count, 0),
        tag_books: limitedGenres
          .filter(([,data]) => data.type === 'tag')
          .reduce((sum, [,data]) => sum + data.count, 0)
      },

      // Métriques de diversité
      diversity_metrics: {
        genre_spread: Math.round(((totalGenres / Math.max(totalBooks, 1)) * 100) * 10) / 10,
        concentration_index: limitedGenres.length > 0 ? Math.round(((limitedGenres[0][1].count / totalBooks) * 100) * 10) / 10 : 0,
        balance_score: limitedGenres.length > 1 ? 
          Math.round((1 - (limitedGenres[0][1].count / (limitedGenres[0][1].count + limitedGenres[1][1].count))) * 100) : 0
      }
    },
    metadata: {
      user_id: userId,
      filters: {
        include_tags,
        include_categories,
        min_books,
        sort_by,
        order,
        limit
      },
      generated_at: new Date().toISOString(),
      total_analyzed: totalBooks
    },
    message: lang === 'fr' 
      ? `Analyse de ${totalGenres} genre(s) sur ${totalBooks} livre(s)` 
      : `Analysis of ${totalGenres} genre(s) across ${totalBooks} book(s)`,
    execution_time_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
});