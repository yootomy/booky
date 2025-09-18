import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import {
  calculateTagStats,
  calculateTagMetrics,
  calculateAvgTagsPerBook,
  groupTagsByType,
  TagWithRelations
} from "@/utils/tag-serializers";
import { getTypedSession } from "@/utils/auth-helpers";

// =============================================================================
// 📊 API ROUTE TAG STATISTICS - /api/tags/stats
// =============================================================================

// GET /api/tags/stats - Statistiques et métriques des tags
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
  const groupByType = searchParams.get('group_by_type') === 'true';
  
  let whereClause: any = {};
  
  // Si scope=user, filtrer par utilisateur connecté
  if (scope === 'user' && userId) {
    // Pour les stats utilisateur, on regarde les tags utilisés par ses livres
    whereClause = {
      book_tag: {
        some: {
          book: {
            createdBy: userId
          }
        }
      }
    };
  }
  
  // Récupérer tous les tags avec leurs relations
  const tags = await db.tag.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { 
          book_tag: scope === 'user' && userId ? {
            where: {
              book: {
                createdBy: userId
              }
            }
          } : true
        }
      },
      ...(includeMetrics ? {
        book_tag: {
          include: {
            book: true
          },
          ...(scope === 'user' && userId ? {
            where: {
              book: {
                createdBy: userId
              }
            }
          } : {})
        }
      } : {})
    },
    orderBy: {
      utilisation_count: 'desc'
    }
  });
  
  // Calculer les statistiques de base
  const basicStats = calculateTagStats(tags as any);
  
  // Calculer les métriques détaillées si demandé
  let detailedMetrics = null;
  if (includeMetrics) {
    detailedMetrics = tags
      .map(tag => calculateTagMetrics(tag as any))
      .filter(metric => metric !== null)
      .sort((a, b) => b!.utilisation_count - a!.utilisation_count);
  }
  
  // Statistiques additionnelles
  const additionalStats = {
    // Distribution par couleur
    color_distribution: tags.reduce((acc: { [color: string]: number }, tag) => {
      acc[tag.couleur] = (acc[tag.couleur] || 0) + 1;
      return acc;
    }, {}),
    
    // Top 10 tags les plus utilisés
    top_tags: tags
      .map(tag => ({
        id: tag.id,
        nom: tag.nom,
        couleur: tag.couleur,
        type: tag.type,
        utilisation_count: tag.utilisation_count,
        est_favori: tag.est_favori,
        book_count: tag._count.book_tag,
      }))
      .slice(0, 10),
    
    // Tags récemment créés (30 derniers jours)
    recent_tags: tags.filter(tag => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return tag.date_creation >= thirtyDaysAgo;
    }).length,
    
    // Tags favoris
    favorite_tags: tags.filter(tag => tag.est_favori),
    
    // Tags non utilisés
    unused_tags: tags.filter(tag => tag.utilisation_count === 0).length,
    
    // Tags les plus populaires par type
    most_popular_by_type: {
      GENRE: tags.filter(t => t.type === 'GENRE').slice(0, 3).map(t => ({ id: t.id, nom: t.nom, utilisation_count: t.utilisation_count })),
      TROPE: tags.filter(t => t.type === 'TROPE').slice(0, 3).map(t => ({ id: t.id, nom: t.nom, utilisation_count: t.utilisation_count })),
      TRIGGER: tags.filter(t => t.type === 'TRIGGER').slice(0, 3).map(t => ({ id: t.id, nom: t.nom, utilisation_count: t.utilisation_count })),
      PERSONNALISE: tags.filter(t => t.type === 'PERSONNALISE').slice(0, 3).map(t => ({ id: t.id, nom: t.nom, utilisation_count: t.utilisation_count })),
    },
  };
  
  // Calcul de la moyenne de tags par livre
  const avgTagsPerBook = calculateAvgTagsPerBook(tags as any);
  
  // Groupement par type si demandé
  let tagsByType = null;
  if (groupByType) {
    tagsByType = groupTagsByType(tags as any);
  }
  
  // Réponse selon le scope
  const response: any = {
    success: true,
    scope,
    stats: {
      ...basicStats,
      avg_tags_per_book: avgTagsPerBook,
    },
    additional_stats: additionalStats,
    execution_time_ms: Date.now() - startTime,
  };
  
  if (includeMetrics) {
    response.detailed_metrics = detailedMetrics;
  }
  
  if (groupByType) {
    response.book_tag_by_type = tagsByType;
  }
  
  if (scope === 'user') {
    response.user_id = userId;
    if (!userId) {
      response.note = "Statistiques globales affichées (utilisateur non connecté)";
    }
  }
  
  return NextResponse.json(response);
});

// POST /api/tags/stats/refresh - Recalculer et actualiser les statistiques (protégé)
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
    // Recalculer les compteurs d'utilisation pour tous les tags
    const tags = await db.tag.findMany({
      select: { id: true, nom: true }
    });
    
    let updatedCount = 0;
    const tagUpdates = [];
    
    for (const tag of tags) {
      // Compter le nombre réel d'utilisations
      const realCount = await db.book_tag.count({
        where: { tagId: tag.id }
      });
      
      // Mettre à jour seulement si différent
      const currentTag = await db.tag.findUnique({
        where: { id: tag.id },
        select: { utilisation_count: true }
      });
      
      if (currentTag && currentTag.utilisation_count !== realCount) {
        tagUpdates.push(
          db.tag.update({
            where: { id: tag.id },
            data: { 
              utilisation_count: realCount,
              date_modification: new Date(),
            }
          })
        );
        updatedCount++;
      }
    }
    
    // Exécuter toutes les mises à jour
    if (tagUpdates.length > 0) {
      await Promise.all(tagUpdates);
    }
    
    // Nettoyer les tags orphelins (non utilisés depuis plus de 90 jours et non favoris)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const orphanedTags = await db.tag.findMany({
      where: {
        utilisation_count: 0,
        est_favori: false,
        book_tag: {
          none: {}
        },
        date_creation: {
          lt: ninetyDaysAgo
        }
      },
      select: { id: true, nom: true }
    });
    
    // Marquer les tags orphelins pour suppression potentielle (on ne les supprime pas automatiquement)
    let orphanedCount = 0;
    if (orphanedTags.length > 0) {
      // On pourrait ajouter un champ "marked_for_deletion" ou similaire
      // Pour l'instant, on les compte simplement
      orphanedCount = orphanedTags.length;
    }
    
    // Recalculer les statistiques de répartition des couleurs
    const colorStats = await db.tag.groupBy({
      by: ['couleur'],
      _count: {
        id: true
      }
    });
    
    const typeStats = await db.tag.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        tags_updated: updatedCount,
        total_tags: tags.length,
        orphaned_tags_found: orphanedCount,
        orphaned_tags: orphanedTags.map(tag => ({
          id: tag.id,
          nom: tag.nom,
        })),
        color_distribution: colorStats.reduce((acc, stat) => {
          acc[stat.couleur] = stat._count.id;
          return acc;
        }, {} as { [color: string]: number }),
        type_distribution: typeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.id;
          return acc;
        }, {} as { [type: string]: number }),
      },
      message: lang === 'fr' ? 
        'Statistiques des tags actualisées avec succès' : 
        'Tag statistics refreshed successfully',
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

// DELETE /api/tags/stats/cleanup - Nettoyer les tags non utilisés (protégé)
export const DELETE = withErrorHandler(async (request: NextRequest) => {
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
  
  const { searchParams } = new URL(request.url);
  const daysOld = parseInt(searchParams.get('days_old') || '90');
  const includeFavorites = searchParams.get('include_favorites') === 'true';
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Trouver les tags à nettoyer
    const whereCondition: any = {
      utilisation_count: 0,
      book_tag: {
        none: {}
      },
      date_creation: {
        lt: cutoffDate
      }
    };
    
    // Exclure les favoris sauf si explicitement demandé
    if (!includeFavorites) {
      whereCondition.est_favori = false;
    }
    
    const tagsToCleanup = await db.tag.findMany({
      where: whereCondition,
      select: { id: true, nom: true, type: true, est_favori: true }
    });
    
    if (tagsToCleanup.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          deleted_count: 0,
          deleted_tags: [],
        },
        message: lang === 'fr' ? 
          'Aucun tag à nettoyer trouvé' : 
          'No tags found for cleanup',
        execution_time_ms: Date.now() - startTime,
      });
    }
    
    // Supprimer les tags
    const deletedResult = await db.tag.deleteMany({
      where: {
        id: { in: tagsToCleanup.map(t => t.id) }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        deleted_count: deletedResult.count,
        deleted_tags: tagsToCleanup.map(tag => ({
          id: tag.id,
          nom: tag.nom,
          type: tag.type,
          was_favorite: tag.est_favori,
        })),
      },
      message: lang === 'fr' ? 
        `${deletedResult.count} tag(s) nettoyé(s) avec succès` : 
        `${deletedResult.count} tag(s) cleaned up successfully`,
      metadata: {
        cleanup_criteria: {
          days_old: daysOld,
          include_favorites: includeFavorites,
          cutoff_date: cutoffDate.toISOString(),
        }
      },
      execution_time_ms: Date.now() - startTime,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 
        'Erreur lors du nettoyage des tags' : 
        'Error during tag cleanup',
      code: 'CLEANUP_ERROR',
    }, { status: 500 });
  }
});