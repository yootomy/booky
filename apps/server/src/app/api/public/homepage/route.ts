import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";

// =============================================================================
// 🏠 PUBLIC HOMEPAGE API - ROUTE CONSOLIDÉE
// =============================================================================

// GET /api/public/homepage - Toutes les données pour la page d'accueil
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  try {
    // Trouver un utilisateur qui a des livres pour l'affichage public
    const userWithBooks = await db.book.findFirst({
      select: {
        createdBy: true
      }
    });
    
    const MAIN_USER_ID = userWithBooks?.createdBy;
    
    if (!MAIN_USER_ID) {
      return NextResponse.json({
        success: true,
        data: {
          stats: {
            total_livres: 0,
            livres_lus: 0,
            note_moyenne: 0,
            livres_en_cours: 0,
            livres_a_lire: 0,
            pourcentage_lus: 0
          },
          recent_books: [],
          featured_book: null,
          quotes: [],
          categories: []
        },
        message: lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'
      });
    }

    // Exécuter toutes les requêtes en parallèle pour optimiser les performances
    const [
      // 1. Statistiques générales
      totalBooks,
      readBooksCount,
      averageRating,
      currentlyReading,
      toReadBooks,
      
      // 2. Livres récents (30 derniers jours)
      recentBooks,
      
      // 3. Livres lus pour la galerie circulaire
      readBooksForGallery,
      
      // 4. Livre le mieux noté (featured)
      topRatedBook,
      
      // 5. Citations favorites
      booksWithQuotes,
      
      // 6. Catégories populaires
      topCategories
    ] = await Promise.all([
      // === STATISTIQUES ===
      db.book.count({
        where: { createdBy: MAIN_USER_ID }
      }),
      db.book.count({
        where: { 
          createdBy: MAIN_USER_ID,
          statut: 'LU' 
        }
      }),
      db.book.aggregate({
        where: { createdBy: MAIN_USER_ID },
        _avg: { note_generale: true }
      }),
      db.book.count({
        where: { 
          createdBy: MAIN_USER_ID,
          statut: 'EN_COURS' 
        }
      }),
      db.book.count({
        where: { 
          createdBy: MAIN_USER_ID,
          statut: 'A_LIRE' 
        }
      }),
      
      // === LIVRES RÉCENTS ===
      db.book.findMany({
        where: {
          createdBy: MAIN_USER_ID,
          date_creation: { 
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
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
          resume_personnel: true,
          niveau_spicy: true,
          niveau_dark: true,
          niveau_romance: true,
          rythme: true,
          book_category: {
            select: {
              category: {
                select: {
                  id: true,
                  nom: true,
                  couleur: true,
                  icone: true
                }
              }
            }
          }
        },
        orderBy: { date_creation: 'desc' },
        take: 6
      }),
      
      // === LIVRES LUS (pour la galerie circulaire) ===
      db.book.findMany({
        where: {
          createdBy: MAIN_USER_ID,
          statut: 'LU'
        },
        select: {
          id: true,
          titre: true,
          auteur: true,
          image_couverture: true,
          note_generale: true,
          date_lecture: true,
          resume_personnel: true
        },
        orderBy: { date_lecture: 'desc' },
        take: 15
      }),
      
      // === LIVRE FEATURED ===
      db.book.findFirst({
        where: {
          createdBy: MAIN_USER_ID,
          note_generale: { gte: 7 }
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
          resume_personnel: true,
          critique_detaillee: true,
          pourquoi_aimer: true,
          citations_favorites: true,
          niveau_spicy: true,
          niveau_dark: true,
          niveau_romance: true,
          intensite_emotionnelle: true,
          originalite: true,
          rythme: true,
          book_category: {
            select: {
              category: {
                select: {
                  id: true,
                  nom: true,
                  couleur: true,
                  icone: true
                }
              }
            }
          }
        },
        orderBy: { note_generale: 'desc' }
      }),
      
      // === CITATIONS ===
      db.book.findMany({
        where: {
          createdBy: MAIN_USER_ID,
          citations_favorites: {
            not: null
          },
          AND: {
            citations_favorites: {
              not: ''
            }
          }
        },
        select: {
          id: true,
          titre: true,
          auteur: true,
          citations_favorites: true,
          note_generale: true,
          image_couverture: true
        },
        orderBy: [
          { note_generale: 'desc' },
          { date_creation: 'desc' }
        ],
        take: 3
      }),
      
      // === CATÉGORIES ===
      db.category.findMany({
        where: { est_actif: true },
        select: {
          id: true,
          nom: true,
          couleur: true,
          icone: true,
          description: true,
          ordre_affichage: true,
          _count: {
            select: {
              book_category: true
            }
          }
        },
        orderBy: { ordre_affichage: 'asc' },
        take: 6
      })
    ]);

    // Traitement des données
    const stats = {
      total_livres: totalBooks,
      livres_lus: readBooksCount,
      note_moyenne: averageRating._avg.note_generale || 0,
      livres_en_cours: currentlyReading,
      livres_a_lire: toReadBooks,
      pourcentage_lus: totalBooks > 0 ? Math.round((readBooksCount / totalBooks) * 100) : 0
    };

    const processedRecentBooks = recentBooks.map(book => ({
      ...book,
      categories: book.book_category.map(c => c.category)
    }));

    const processedFeaturedBook = topRatedBook ? {
      ...topRatedBook,
      categories: topRatedBook.book_category.map(c => c.category)
    } : null;

    const processedQuotes = booksWithQuotes.map(book => ({
      id: book.id,
      titre: book.titre,
      auteur: book.auteur,
      citations_favorites: book.citations_favorites,
      note_generale: book.note_generale,
      image_couverture: book.image_couverture
    }));

    // Réponse consolidée
    const response = {
      success: true,
      data: {
        stats,
        recent_books: processedRecentBooks,
        read_books: readBooksForGallery,
        featured_book: processedFeaturedBook,
        quotes: processedQuotes,
        categories: topCategories
      },
      metadata: {
        type: 'public_homepage_consolidated',
        user_id: MAIN_USER_ID,
        counts: {
          recent_books: processedRecentBooks.length,
          read_books: readBooksForGallery.length,
          quotes: processedQuotes.length,
          categories: topCategories.length
        },
        generated_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTime
      },
      message: lang === 'fr' 
        ? 'Données de la page d\'accueil récupérées avec succès' 
        : 'Homepage data retrieved successfully'
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Erreur lors de la récupération des données de la page d\'accueil' : 'Error fetching homepage data',
      code: 'HOMEPAGE_ERROR',
      execution_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
});