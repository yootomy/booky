import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

// =============================================================================
// 📈 API ROUTE READING STATS - /api/stats/reading
// =============================================================================

// Schéma pour les paramètres de statistiques de lecture
const ReadingStatsSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year', 'all'])
    .default('year'),
  
  group_by: z.enum(['day', 'week', 'month', 'year'])
    .default('month'),
    
  include_predictions: z.boolean().default(true),
  
  timezone: z.string().optional().default('UTC'),
});

// GET /api/stats/reading - Statistiques détaillées de lecture
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
      include_predictions: queryObject.include_predictions !== 'false',
    };
    
    const validatedQuery = ReadingStatsSchema.parse(transformedQuery);
    const { period, group_by, include_predictions } = validatedQuery;
  
    // Calculer les dates de début selon la période
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
        startDate = new Date(0); // Tout depuis le début
    }
  
    // Requêtes en parallèle pour optimiser les performances
    const [
      readingProgressData,
      monthlyTrends,
      weeklyPatterns,
      readingStreaks,
      pagesReadData,
      readingGoalsData,
      genreProgressData
    ] = await Promise.all([
      // Progression de lecture par période
      db.book.findMany({
        where: {
          createdBy: userId,
          date_lecture: {
            gte: startDate,
            lte: now
          }
        },
        select: {
          date_lecture: true,
          statut: true,
          nombre_pages: true,
          titre: true,
          auteur: true,
          note_generale: true
        },
        orderBy: { date_lecture: 'asc' }
      }),
  
      // Tendances mensuelles (12 derniers mois)
      db.book.groupBy({
        by: ['date_lecture'],
        where: {
          createdBy: userId,
          date_lecture: {
            gte: new Date(now.getFullYear() - 1, now.getMonth(), 1),
            not: null
          }
        },
        _count: { date_lecture: true },
        _sum: { nombre_pages: true }
      }),
  
      // Patterns hebdomadaires (jour de la semaine préféré)
      db.book.findMany({
        where: {
          createdBy: userId,
          date_lecture: {
            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 3 derniers mois
            not: null
          }
        },
        select: { date_lecture: true }
      }),
  
      // Calcul des séries de lecture
      db.book.findMany({
        where: {
          createdBy: userId,
          statut: 'LU',
          date_lecture: { not: null }
        },
        select: { date_lecture: true },
        orderBy: { date_lecture: 'asc' }
      }),
  
      // Données sur les pages lues
      db.book.aggregate({
        where: {
          createdBy: userId,
          statut: 'LU',
          nombre_pages: { not: null },
          date_lecture: {
            gte: startDate,
            lte: now
          }
        },
        _sum: { nombre_pages: true },
        _avg: { nombre_pages: true },
        _count: { nombre_pages: true }
      }),
  
      // Simulation d'objectifs de lecture (à personnaliser selon vos besoins)
      db.book.count({
        where: {
          createdBy: userId,
          statut: 'LU',
          date_lecture: {
            gte: new Date(now.getFullYear(), 0, 1), // Cette année
          }
        }
      }),
  
      // Progression par genre/catégorie
      db.book_category.groupBy({
        by: ['categoryId'],
        where: {
          book: {
            createdBy: userId,
            statut: 'LU',
            date_lecture: {
              gte: startDate,
              lte: now
            }
          }
        },
        _count: { categoryId: true }
      })
    ]);
  
    // Traitement des données de progression
    const processReadingData = (data: any[]) => {
      const groupedData: Record<string, { count: number; pages: number; books: any[] }> = {};
      
      data.forEach(book => {
        if (!book.date_lecture) return;
        
        const date = new Date(book.date_lecture);
        let key: string;
        
        switch (group_by) {
          case 'day':
            key = date.toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = date.toISOString().substring(0, 7); // YYYY-MM
            break;
          case 'year':
            key = date.getFullYear().toString();
            break;
          default:
            key = date.toISOString().split('T')[0];
        }
        
        if (!groupedData[key]) {
          groupedData[key] = { count: 0, pages: 0, books: [] };
        }
        
        groupedData[key].count++;
        groupedData[key].pages += book.nombre_pages || 0;
        groupedData[key].books.push({
          titre: book.titre,
          auteur: book.auteur,
          note: book.note_generale,
          pages: book.nombre_pages
        });
      });
      
      return groupedData;
    };
  
    const readingTimeline = processReadingData(readingProgressData);
  
    // Calcul des patterns hebdomadaires
    const weekdayPatterns = weeklyPatterns.reduce((acc, book) => {
      if (book.date_lecture) {
        const weekday = new Date(book.date_lecture).getDay(); // 0 = dimanche
        const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const dayName = days[weekday];
        acc[dayName] = (acc[dayName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  
    // Calcul des séries de lecture (streaks)
    const calculateReadingStreaks = (books: any[]) => {
      if (books.length === 0) return { current: 0, longest: 0, streaks: [] };
      
      const sortedDates = books
        .map(b => new Date(b.date_lecture).toDateString())
        .sort();
      
      let currentStreak = 1;
      let longestStreak = 1;
      const streaks = [];
      let currentStreakStart = sortedDates[0];
      
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i - 1]);
        const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 7) { // Considérer comme une série si moins d'une semaine d'écart
          currentStreak++;
        } else {
          if (currentStreak > 1) {
            streaks.push({
              start: currentStreakStart,
              end: sortedDates[i - 1],
              length: currentStreak
            });
          }
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
          currentStreakStart = sortedDates[i];
        }
      }
      
      // Vérifier la série actuelle
      const lastDate = new Date(sortedDates[sortedDates.length - 1]);
      const daysSinceLastRead = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      const currentActiveStreak = daysSinceLastRead <= 7 ? currentStreak : 0;
      
      return {
        current: currentActiveStreak,
        longest: Math.max(longestStreak, currentStreak),
        streaks: streaks.slice(-5) // Garder les 5 dernières séries
      };
    };
  
    const streakInfo = calculateReadingStreaks(readingStreaks);
  
    // Tendances et prédictions
    const monthlyReadingCounts = Object.values(readingTimeline).map(d => d.count);
    const averageMonthlyReading = monthlyReadingCounts.length > 0 
      ? monthlyReadingCounts.reduce((a, b) => a + b, 0) / monthlyReadingCounts.length 
      : 0;
  
    // Prédiction simple basée sur la tendance
    let prediction = null;
    if (include_predictions && monthlyReadingCounts.length >= 3) {
      const recentAverage = monthlyReadingCounts.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const trend = recentAverage > averageMonthlyReading ? 'increasing' : 'decreasing';
      const projectedNext = Math.round(recentAverage * (trend === 'increasing' ? 1.1 : 0.9));
      
      prediction = {
        trend,
        projected_next_period: Math.max(0, projectedNext),
        confidence: monthlyReadingCounts.length >= 6 ? 'high' : 'medium'
      };
    }
  
    // Objectifs de lecture (exemple: 52 livres par an)
    const yearlyGoal = 52;
    const currentYearProgress = readingGoalsData;
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.floor((dayOfYear / 365) * yearlyGoal);
  
    const response = {
      success: true,
      data: {
        // Vue d'ensemble de la période
        period_overview: {
          period,
          start_date: startDate.toISOString(),
          end_date: now.toISOString(),
          total_books_read: readingProgressData.length,
          total_pages_read: pagesReadData._sum.nombre_pages || 0,
          average_pages_per_book: Math.round(pagesReadData._avg.nombre_pages || 0),
          reading_days: Object.keys(readingTimeline).length,
        },
  
        // Timeline de lecture groupée
        reading_timeline: readingTimeline,
  
        // Patterns et habitudes
        reading_patterns: {
          weekday_preferences: weekdayPatterns,
          most_productive_day: Object.entries(weekdayPatterns).sort(([,a], [,b]) => b - a)[0]?.[0] || null,
          average_monthly_reading: Math.round(averageMonthlyReading * 10) / 10,
          reading_consistency: monthlyReadingCounts.length > 0 
            ? Math.round((monthlyReadingCounts.filter(c => c > 0).length / monthlyReadingCounts.length) * 100) 
            : 0
        },
  
        // Séries et momentum
        reading_streaks: {
          current_streak: streakInfo.current,
          longest_streak: streakInfo.longest,
          recent_streaks: streakInfo.streaks,
          momentum_score: Math.min(100, (streakInfo.current * 20) + (streakInfo.longest * 5))
        },
  
        // Progression vers les objectifs
        reading_goals: {
          yearly_goal: yearlyGoal,
          current_progress: currentYearProgress,
          expected_progress: expectedProgress,
          progress_percentage: Math.round((currentYearProgress / yearlyGoal) * 100),
          on_track: currentYearProgress >= expectedProgress,
          books_behind_schedule: Math.max(0, expectedProgress - currentYearProgress),
          projected_year_end: Math.round((currentYearProgress / dayOfYear) * 365)
        },
  
        // Métriques de vitesse
        reading_velocity: {
          books_per_month: Math.round(averageMonthlyReading * 10) / 10,
          pages_per_day: pagesReadData._count.nombre_pages > 0 
            ? Math.round((pagesReadData._sum.nombre_pages || 0) / Math.max(1, Object.keys(readingTimeline).length))
            : 0,
          estimated_reading_speed: pagesReadData._avg.nombre_pages 
            ? `${Math.round(pagesReadData._avg.nombre_pages / 7)} pages/jour en moyenne`
            : null
        },
  
        // Prédictions (si activées)
        predictions: prediction,
  
        // Analyse comparative
        comparative_analysis: {
          vs_last_period: monthlyReadingCounts.length >= 2 ? {
            change: monthlyReadingCounts[monthlyReadingCounts.length - 1] - monthlyReadingCounts[monthlyReadingCounts.length - 2],
            percentage_change: monthlyReadingCounts[monthlyReadingCounts.length - 2] > 0 
              ? Math.round(((monthlyReadingCounts[monthlyReadingCounts.length - 1] - monthlyReadingCounts[monthlyReadingCounts.length - 2]) / monthlyReadingCounts[monthlyReadingCounts.length - 2]) * 100)
              : null
          } : null,
          personal_best: Math.max(...monthlyReadingCounts, 0),
          consistency_rating: monthlyReadingCounts.length > 0 
            ? Math.round(100 - (Math.sqrt(monthlyReadingCounts.reduce((acc, val) => acc + Math.pow(val - averageMonthlyReading, 2), 0) / monthlyReadingCounts.length) / averageMonthlyReading * 100))
            : 0
        }
      },
      metadata: {
        user_id: userId,
        analysis_period: `${period} (${group_by} grouping)`,
        generated_at: new Date().toISOString(),
        data_points: Object.keys(readingTimeline).length,
        total_books_analyzed: readingProgressData.length
      },
      message: lang === 'fr' 
        ? `Analyse de lecture générée pour la période: ${period}` 
        : `Reading analysis generated for period: ${period}`,
      execution_time_ms: Date.now() - startTime,
    };
  
    return NextResponse.json(response);
  });
}
