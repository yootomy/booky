import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  calculateCategoryMetrics,
  CategoryWithRelations
} from "@/utils/category-serializers";
import { getTypedSession } from "@/utils/auth-helpers";

// =============================================================================
// 📊 API ROUTE SPECIFIC CATEGORY STATISTICS - /api/categories/[id]/stats
// =============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/categories/[id]/stats - Statistiques d'une catégorie spécifique
export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  const { id: categoryId } = await params;
  
  // Vérifier l'authentification pour les stats personnalisées
  const user = await getTypedSession(request);
  const userId = user?.id;
  
  // Paramètres optionnels
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'global'; // 'global' ou 'user'
  
  const whereClause: any = { id: categoryId };
  
  // Vérifier si la catégorie existe
  const categoryExists = await db.category.findFirst({
    where: { id: categoryId },
    select: { id: true, nom: true }
  });
  
  if (!categoryExists) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Catégorie non trouvée' : 'Category not found',
      code: 'CATEGORY_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Récupérer la catégorie avec ses relations
  const category = await db.category.findFirst({
    where: whereClause,
    include: {
      _count: {
        select: { 
          book_category: scope === 'user' && userId ? {
            where: {
              book: {
                user: { id: userId }
              }
            }
          } : true
        }
      },
      book_category: {
        include: {
          book: {
            include: {
              user: {
                select: { id: true, nom_complet: true }
              }
            }
          }
        },
        ...(scope === 'user' && userId ? {
          where: {
            book: {
              user: { id: userId }
            }
          }
        } : {})
      }
    }
  });
  
  if (!category) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Catégorie non trouvée' : 'Category not found',
      code: 'CATEGORY_NOT_FOUND',
    }, { status: 404 });
  }
  
  // Calculer les métriques détaillées
  const metrics = calculateCategoryMetrics(category as any);
  
  // Statistiques spécifiques à cette catégorie
  const books = category.book_category.map(rel => rel.book);
  const categoryStats = {
    category_info: {
      id: category.id,
      nom: category.nom,
      couleur: category.couleur,
      icone: category.icone,
      description: category.description,
      est_actif: category.est_actif,
      ordre_affichage: category.ordre_affichage,
      date_creation: category.date_creation.toISOString(),
      date_modification: category.date_modification.toISOString(),
    },
    
    books_stats: {
      total_books: category._count.book_category,
      by_status: {
        LU: books.filter(book => book.statut === 'LU').length,
        EN_COURS: books.filter(book => book.statut === 'EN_COURS').length,
        A_LIRE: books.filter(book => book.statut === 'A_LIRE').length,
      },
      average_ratings: {
        note_generale: books.length > 0 ? Math.round((books.reduce((sum, book) => sum + book.note_generale, 0) / books.length) * 10) / 10 : 0,
        niveau_spicy: books.length > 0 ? Math.round((books.reduce((sum, book) => sum + book.niveau_spicy, 0) / books.length) * 10) / 10 : 0,
        niveau_dark: books.length > 0 ? Math.round((books.reduce((sum, book) => sum + book.niveau_dark, 0) / books.length) * 10) / 10 : 0,
        niveau_romance: books.length > 0 ? Math.round((books.reduce((sum, book) => sum + book.niveau_romance, 0) / books.length) * 10) / 10 : 0,
      },
    },
    
    recent_activity: {
      books_added_last_30_days: books.filter(book => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return book.date_creation >= thirtyDaysAgo;
      }).length,
      
      last_book_added: books.length > 0 
        ? books.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())[0]
        : null,
    },
    
    top_contributors: scope === 'global' ? 
      Object.entries(
        books.reduce((acc: { [userId: string]: { user: any, count: number } }, book) => {
          const userId = book.user.id;
          if (!acc[userId]) {
            acc[userId] = { user: book.user, count: 0 };
          }
          acc[userId].count++;
          return acc;
        }, {})
      )
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([, data]) => data)
      : null,
  };
  
  // Réponse selon le scope
  const response: any = {
    success: true,
    scope,
    data: categoryStats,
    execution_time_ms: Date.now() - startTime,
  };
  
  if (metrics) {
    response.detailed_metrics = metrics;
  }
  
  if (scope === 'user') {
    response.user_id = userId;
    if (!userId) {
      response.note = "Statistiques globales affichées (utilisateur non connecté)";
    }
  }
  
  return NextResponse.json(response);
});