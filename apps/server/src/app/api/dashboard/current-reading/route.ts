import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getTypedSession } from "@/utils/auth-helpers";
import { z } from "zod";

// =============================================================================
// 📖 DASHBOARD API - CURRENT READING BOOKS
// =============================================================================

// Schéma pour les paramètres de livres en cours de lecture
const CurrentReadingSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  include_metadata: z.boolean().default(true),
  include_progress: z.boolean().default(true),
  sort_by: z.enum(['started_date', 'title', 'author', 'priority']).default('started_date'),
  priority_filter: z.enum(['high', 'medium', 'low']).optional(),
});

// GET /api/dashboard/current-reading - Livres en cours de lecture
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
    include_progress: queryObject.include_progress !== 'false',
  };
  
  const validatedQuery = CurrentReadingSchema.parse(transformedQuery);
  const { limit, include_metadata, include_progress, sort_by, priority_filter } = validatedQuery;

  // Requêtes parallèles
  const [currentReadingBooks, readingStats, recentActivity] = await Promise.all([
    // Livres en cours de lecture
    db.book.findMany({
      where: {
        createdBy: userId,
        statut: 'EN_COURS'
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
        critique_detaillee: true,
        pourquoi_aimer: true,
        questions_sur_le_livre: true,
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
      orderBy: sort_by === 'started_date' ? { date_modification: 'desc' } :
              sort_by === 'title' ? { titre: 'asc' } :
              sort_by === 'author' ? { auteur: 'asc' } :
              { date_creation: 'desc' }, // priority par défaut
      take: limit
    }),

    // Statistiques de lecture
    include_progress ? Promise.all([
      // Nombre total de livres en cours
      db.book.count({
        where: {
          createdBy: userId,
          statut: 'EN_COURS'
        }
      }),

      // Durée moyenne en cours de lecture
      db.book.findMany({
        where: {
          createdBy: userId,
          statut: 'EN_COURS'
        },
        select: {
          date_creation: true,
          date_modification: true
        }
      }),

      // Livres terminés récemment pour comparaison
      db.book.findMany({
        where: {
          createdBy: userId,
          statut: 'LU',
          date_lecture: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        },
        select: {
          date_creation: true,
          date_lecture: true,
          nombre_pages: true
        },
        take: 10
      })
    ]) : null,

    // Activité récente (modifications récentes)
    include_progress ? db.book.findMany({
      where: {
        createdBy: userId,
        statut: 'EN_COURS',
        date_modification: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
        }
      },
      select: {
        id: true,
        titre: true,
        date_modification: true
      },
      orderBy: { date_modification: 'desc' },
      take: 5
    }) : []
  ]);

  // Traitement des données
  const processedBooks = currentReadingBooks.map((book, index) => {
    // Calculer le temps écoulé depuis le début
    const startDate = book.date_creation;
    const lastUpdate = book.date_modification;
    const daysStarted = Math.ceil((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceUpdate = Math.ceil((Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
    
    // Déterminer la priorité basée sur différents facteurs
    let priorityScore = 0;
    if (daysSinceUpdate <= 3) priorityScore += 3; // Activité récente
    if (daysStarted >= 30) priorityScore += 2; // Livre ancien à finir
    if (book.note_generale && book.note_generale >= 8) priorityScore += 2; // Livre apprécié
    if (book.questions_sur_le_livre) priorityScore += 1; // Questions en attente
    
    const priority = priorityScore >= 5 ? 'high' : priorityScore >= 3 ? 'medium' : 'low';
    
    const bookData: any = {
      id: book.id,
      titre: book.titre,
      auteur: book.auteur,
      isbn: book.isbn,
      image_couverture: book.image_couverture,
      statut: book.statut,
      note_generale: book.note_generale,
      date_creation: book.date_creation,
      date_modification: book.date_modification,
      resume_personnel: book.resume_personnel,
      critique_detaillee: book.critique_detaillee,
      pourquoi_aimer: book.pourquoi_aimer,
      questions_sur_le_livre: book.questions_sur_le_livre,
      reading_progress: {
        days_started: daysStarted,
        days_since_update: daysSinceUpdate,
        priority,
        priority_score: priorityScore,
        status_indicator: daysSinceUpdate <= 1 ? 'active' : 
                         daysSinceUpdate <= 7 ? 'recent' : 
                         daysSinceUpdate <= 14 ? 'stale' : 'abandoned'
      }
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
        reading_experience: {
          intensite_emotionnelle: book.intensite_emotionnelle,
          rythme: book.rythme
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
    filteredBooks = processedBooks.filter(book => book.reading_progress.priority === priority_filter);
  }

  // Analyser les statistiques de lecture
  let progressAnalysis: any = {};
  if (include_progress && readingStats) {
    const [totalCurrentBooks, durationData, recentlyFinished] = readingStats;
    
    // Calculer la durée moyenne de lecture en cours
    const readingDurations = durationData.map(book => {
      const startDate = new Date(book.date_creation);
      const lastUpdate = new Date(book.date_modification);
      return Math.ceil((lastUpdate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    });

    const avgCurrentDuration = readingDurations.length > 0 
      ? Math.round(readingDurations.reduce((sum, duration) => sum + duration, 0) / readingDurations.length)
      : 0;

    // Calculer la durée moyenne de lecture pour les livres terminés récemment
    const finishedDurations = recentlyFinished.map(book => {
      if (book.date_lecture && book.date_creation) {
        const startDate = new Date(book.date_creation);
        const finishDate = new Date(book.date_lecture);
        return Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      return 0;
    }).filter(d => d > 0);

    const avgFinishedDuration = finishedDurations.length > 0 
      ? Math.round(finishedDurations.reduce((sum, duration) => sum + duration, 0) / finishedDurations.length)
      : 0;

    // Analyser les patterns de priorité
    const priorityDistribution = processedBooks.reduce((acc, book) => {
      const priority = book.reading_progress.priority;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Analyser l'activité récente
    const activityAnalysis = {
      recently_active: processedBooks.filter(b => b.reading_progress.days_since_update <= 3).length,
      stale_books: processedBooks.filter(b => b.reading_progress.days_since_update > 14).length,
      average_days_since_update: processedBooks.length > 0 
        ? Math.round(processedBooks.reduce((sum, book) => sum + book.reading_progress.days_since_update, 0) / processedBooks.length)
        : 0
    };

    progressAnalysis = {
      reading_load: {
        total_current_books: totalCurrentBooks,
        displayed_books: filteredBooks.length,
        manageable_load: totalCurrentBooks <= 5 ? 'light' : totalCurrentBooks <= 10 ? 'moderate' : 'heavy'
      },
      duration_insights: {
        avg_current_duration_days: avgCurrentDuration,
        avg_finished_duration_days: avgFinishedDuration,
        reading_velocity: avgFinishedDuration > 0 ? 
          (avgCurrentDuration < avgFinishedDuration ? 'faster_than_usual' : 'normal_pace') : 'no_reference'
      },
      priority_breakdown: {
        distribution: priorityDistribution,
        high_priority_count: priorityDistribution.high || 0,
        recommendations: priorityDistribution.high > 3 ? 'focus_on_priorities' : 
                        priorityDistribution.high === 0 ? 'all_low_priority' : 'balanced_reading'
      },
      activity_patterns: {
        ...activityAnalysis,
        engagement_score: Math.max(0, 100 - (activityAnalysis.average_days_since_update * 5))
      },
      recent_activity_timeline: recentActivity.map(book => ({
        book_id: book.id,
        titre: book.titre,
        last_update: book.date_modification,
        days_ago: Math.ceil((Date.now() - new Date(book.date_modification).getTime()) / (1000 * 60 * 60 * 24))
      }))
    };
  }

  const response = {
    success: true,
    data: {
      books: filteredBooks,
      ...(include_progress && { progress_analysis: progressAnalysis })
    },
    metadata: {
      user_id: userId,
      filters: {
        limit,
        include_metadata,
        include_progress,
        sort_by,
        priority_filter: priority_filter || 'all'
      },
      result_info: {
        total_current_reading: currentReadingBooks.length,
        displayed_after_filter: filteredBooks.length,
        priority_distribution: processedBooks.reduce((acc, book) => {
          const priority = book.reading_progress?.priority || 'unknown';
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      generated_at: new Date().toISOString()
    },
    message: lang === 'fr' 
      ? `${filteredBooks.length} livre(s) en cours de lecture` 
      : `${filteredBooks.length} book(s) currently reading`,
    execution_time_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
});