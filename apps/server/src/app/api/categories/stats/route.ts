import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  calculateCategoryStats,
  calculateCategoryMetrics,
  CategoryWithRelations
} from "@/utils/category-serializers";
import { getTypedSession } from "@/utils/auth-helpers";

// =============================================================================
// 📊 API ROUTE CATEGORY STATISTICS - /api/categories/stats
// =============================================================================

// GET /api/categories/stats - Statistiques et métriques des catégories
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification pour les stats personnalisées
  const user = await getTypedSession(request);
  const userId = user?.id;
  
  // Paramètres optionnels
  const { searchParams } = new URL(request.url);
  const includeMetrics = searchParams.get('include_metrics') === 'true';
  const scope = searchParams.get('scope') || 'global'; // 'global' ou 'user'
  
  let whereClause: any = {};
  
  // Si scope=user, filtrer par utilisateur connecté
  if (scope === 'user' && userId) {
    // Pour les stats utilisateur, on regarde les catégories utilisées par ses livres
    whereClause = {
      book_category: {
        some: {
          book: {
            user: { id: userId }
          }
        }
      }
    };
  }
  
  // Récupérer toutes les catégories avec leurs relations
  const categories = await db.category.findMany({
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
      ...(includeMetrics ? {
        book_category: {
          include: {
            book: true
          },
          ...(scope === 'user' && userId ? {
            where: {
              book: {
                user: { id: userId }
              }
            }
          } : {})
        }
      } : {})
    },
    orderBy: {
      ordre_affichage: 'asc'
    }
  });
  
  // Calculer les statistiques de base
  const basicStats = calculateCategoryStats(categories as any);
  
  // Calculer les métriques détaillées si demandé
  let detailedMetrics = null;
  if (includeMetrics) {
    detailedMetrics = categories
      .map(category => calculateCategoryMetrics(category as any))
      .filter(metric => metric !== null)
      .sort((a, b) => b!.books_count - a!.books_count);
  }
  
  // Statistiques additionnelles
  const additionalStats = {
    // Distribution par couleur
    color_distribution: categories.reduce((acc: { [color: string]: number }, cat) => {
      acc[cat.couleur] = (acc[cat.couleur] || 0) + 1;
      return acc;
    }, {}),
    
    // Top 10 catégories les plus utilisées
    top_categories: categories
      .map(cat => ({
        id: cat.id,
        nom: cat.nom,
        couleur: cat.couleur,
        icone: cat.icone,
        book_count: cat._count.book_category,
      }))
      .sort((a, b) => b.book_count - a.book_count)
      .slice(0, 10),
    
    // Catégories récemment créées (30 derniers jours)
    recent_categories: categories.filter(cat => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return cat.date_creation >= thirtyDaysAgo;
    }).length,
    
    // Catégories inactives avec des livres
    inactive_with_book_category: categories.filter(cat => 
      !cat.est_actif && cat._count.book_category > 0
    ).length,
  };
  
  // Réponse selon le scope
  const response: any = {
    success: true,
    scope,
    stats: basicStats,
    additional_stats: additionalStats,
    execution_time_ms: Date.now() - startTime,
  };
  
  if (includeMetrics) {
    response.detailed_metrics = detailedMetrics;
  }
  
  if (scope === 'user') {
    response.user_id = userId;
    if (!userId) {
      response.note = "Statistiques globales affichées (utilisateur non connecté)";
    }
  }
  
  return NextResponse.json(response);
});

// POST /api/categories/stats/refresh - Recalculer et actualiser les statistiques (protégé)
export const POST = withErrorHandler(async (request: NextRequest) => {
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
  
  try {
    // Recalculer les ordres d'affichage basés sur l'usage
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { book_category: true }
        }
      }
    });
    
    // Trier par usage décroissant puis par nom
    const sortedCategories = categories.sort((a, b) => {
      if (b._count.book_category !== a._count.book_category) {
        return b._count.book_category - a._count.book_category;
      }
      return a.nom.localeCompare(b.nom);
    });
    
    // Mettre à jour les ordres d'affichage
    const updates = sortedCategories.map((cat, index) => 
      db.category.update({
        where: { id: cat.id },
        data: { 
          ordre_affichage: index,
          date_modification: new Date(),
        }
      })
    );
    
    await Promise.all(updates);
    
    // Nettoyer les catégories orphelines (sans livres depuis plus de 90 jours)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const orphanedCategories = await db.category.findMany({
      where: {
        est_actif: true,
        book_category: {
          none: {}
        },
        date_creation: {
          lt: ninetyDaysAgo
        }
      },
      select: { id: true, nom: true }
    });
    
    // Marquer les catégories orphelines comme inactives (ne pas les supprimer)
    if (orphanedCategories.length > 0) {
      await db.category.updateMany({
        where: {
          id: { in: orphanedCategories.map(cat => cat.id) }
        },
        data: {
          est_actif: false,
          date_modification: new Date(),
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        categories_reordered: sortedCategories.length,
        orphaned_categories_deactivated: orphanedCategories.length,
        orphaned_categories: orphanedCategories.map(cat => ({
          id: cat.id,
          nom: cat.nom,
        })),
      },
      message: lang === 'fr' ? 
        'Statistiques des catégories actualisées avec succès' : 
        'Category statistics refreshed successfully',
      execution_time_ms: Date.now() - startTime,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 
        'Erreur lors de l\'actualisation des statistiques' : 
        'Error refreshing statistics',
      code: 'REFRESH_ERROR',
    }, { status: 500 });
  }
});