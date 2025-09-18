// =============================================================================
// 📂 SÉRIALISEURS POUR LES CATÉGORIES
// =============================================================================
// Utilitaires de sérialisation et formatting pour les réponses API des catégories

// Types directs pour éviter les problèmes d'import
type Category = {
  id: string;
  nom: string;
  couleur: string;
  icone: string | null;
  description: string | null;
  ordre_affichage: number;
  est_actif: boolean;
  date_creation: Date;
  date_modification: Date;
};

type Book = {
  id: string;
  titre: string;
  auteur: string;
  niveau_spicy?: number;
  niveau_dark?: number;
  niveau_romance?: number;
  date_creation: Date;
  image_couverture?: string | null;
  statut?: string;
  note_generale?: number;
};
import { CategoryResponse } from "@/schemas/category.schemas";

// =============================================================================
// 🎯 TYPES ÉTENDUS POUR LES CATÉGORIES
// =============================================================================

// Catégorie avec relations et compteurs
export interface CategoryWithRelations {
  id: string;
  nom: string;
  couleur: string;
  icone: string | null;
  description: string | null;
  ordre_affichage: number;
  est_actif: boolean;
  date_creation: Date;
  date_modification: Date;
  books?: Array<{
    book: Book;
  }>;
  _count?: {
    book_category: number;
  };
}

// =============================================================================
// 📤 SÉRIALISATION PRINCIPALE
// =============================================================================

/**
 * Sérialise une catégorie pour la réponse API
 */
export function serializeCategory(
  category: CategoryWithRelations,
  options: {
    includeBookCount?: boolean;
    includeBooks?: boolean;
  } = {}
): CategoryResponse & { books?: any[] } {
  const serialized: CategoryResponse & { books?: any[] } = {
    id: category.id,
    nom: category.nom,
    couleur: category.couleur,
    icone: category.icone || "",
    description: category.description,
    ordre_affichage: category.ordre_affichage,
    est_actif: category.est_actif,
    date_creation: category.date_creation.toISOString(),
    date_modification: category.date_modification.toISOString(),
  };

  // Ajouter le nombre de livres si demandé
  if (options.includeBookCount) {
    serialized.book_count = category._count?.book_category || category.books?.length || 0;
  }

  // Ajouter les livres si demandé (pour les détails de catégorie)
  if (options.includeBooks && category.books) {
    serialized.books = category.books.map(relation => ({
      id: relation.book.id,
      titre: relation.book.titre,
      auteur: relation.book.auteur,
      image_couverture: relation.book.image_couverture,
      statut: relation.book.statut,
      note_generale: relation.book.note_generale,
    }));
  }

  return serialized;
}

/**
 * Sérialise une liste de catégories
 */
export function serializeCategories(
  categories: CategoryWithRelations[],
  options: {
    includeBookCount?: boolean;
  } = {}
): CategoryResponse[] {
  return categories.map(category => serializeCategory(category, options));
}

// =============================================================================
// 📊 STATISTIQUES DES CATÉGORIES
// =============================================================================

export interface CategoryStats {
  total_categories: number;
  active_categories: number;
  inactive_categories: number;
  most_used_categories: Array<{
    id: string;
    nom: string;
    couleur: string;
    icone: string;
    book_count: number;
  }>;
  least_used_categories: Array<{
    id: string;
    nom: string;
    couleur: string;
    icone: string;
    book_count: number;
  }>;
  categories_without_books: number;
}

/**
 * Calcule les statistiques des catégories
 */
export function calculateCategoryStats(
  categories: CategoryWithRelations[]
): CategoryStats {
  const activeCategories = categories.filter(cat => cat.est_actif);
  const inactiveCategories = categories.filter(cat => !cat.est_actif);
  
  // Trier par usage (nombre de livres)
  const categoriesWithCount = categories
    .map(cat => ({
      id: cat.id,
      nom: cat.nom,
      couleur: cat.couleur,
      icone: cat.icone || "",
      book_count: cat._count?.book_category || cat.books?.length || 0,
    }))
    .sort((a, b) => b.book_count - a.book_count);
    
  const categoriesWithoutBooks = categoriesWithCount.filter(cat => cat.book_count === 0).length;

  return {
    total_categories: categories.length,
    active_categories: activeCategories.length,
    inactive_categories: inactiveCategories.length,
    most_used_categories: categoriesWithCount.slice(0, 5),
    least_used_categories: categoriesWithCount.slice(-5).reverse(),
    categories_without_books: categoriesWithoutBooks,
  };
}

// =============================================================================
// 🎨 FORMATAGE D'AFFICHAGE
// =============================================================================

/**
 * Formate une catégorie pour l'affichage compact (listes, select, etc.)
 */
export function formatCategoryForDisplay(category: Category): {
  id: string;
  label: string;
  color: string;
  icon: string;
  active: boolean;
} {
  return {
    id: category.id,
    label: category.nom,
    color: category.couleur,
    icon: category.icone || "",
    active: category.est_actif,
  };
}

/**
 * Formate plusieurs catégories pour l'affichage
 */
export function formatCategoriesForDisplay(categories: Category[]): Array<{
  id: string;
  label: string;
  color: string;
  icon: string;
  active: boolean;
}> {
  return categories
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage)
    .map(formatCategoryForDisplay);
}

// =============================================================================
// 🔍 INFORMATIONS DE RECHERCHE ET FILTRAGE
// =============================================================================

export interface CategorySearchInfo {
  total_found: number;
  filters_applied: Array<{
    field: string;
    value: any;
    label: string;
  }>;
  search_query?: string;
  execution_time_ms: number;
}

/**
 * Crée les informations de recherche pour les catégories
 */
export function createCategorySearchInfo(
  totalFound: number,
  appliedFilters: Record<string, any>,
  searchQuery?: string,
  executionTime?: number
): CategorySearchInfo {
  const filters = [];
  
  if (appliedFilters.est_actif !== undefined) {
    filters.push({
      field: 'est_actif',
      value: appliedFilters.est_actif,
      label: appliedFilters.est_actif ? 'Catégories actives' : 'Catégories inactives',
    });
  }
  
  if (appliedFilters.sort && appliedFilters.order) {
    filters.push({
      field: 'sort',
      value: `${appliedFilters.sort}_${appliedFilters.order}`,
      label: `Trié par ${appliedFilters.sort} (${appliedFilters.order === 'asc' ? 'croissant' : 'décroissant'})`,
    });
  }

  return {
    total_found: totalFound,
    filters_applied: filters,
    search_query: searchQuery,
    execution_time_ms: executionTime || 0,
  };
}

// =============================================================================
// 📋 VALIDATION ET NETTOYAGE
// =============================================================================

/**
 * Nettoie et valide les données de catégorie avant sauvegarde
 */
export function sanitizeCategoryData(data: any): any {
  const cleaned = { ...data };
  
  // Nettoyer le nom
  if (cleaned.nom) {
    cleaned.nom = cleaned.nom
      .trim()
      .replace(/\s+/g, ' ') // Espaces multiples -> un seul
      .substring(0, 100);
  }
  
  // Nettoyer la description
  if (cleaned.description) {
    cleaned.description = cleaned.description
      .trim()
      .substring(0, 500);
    
    if (cleaned.description === '') {
      cleaned.description = null;
    }
  }
  
  // Valider la couleur
  if (cleaned.couleur && !/^#[0-9A-Fa-f]{6}$/.test(cleaned.couleur)) {
    cleaned.couleur = '#3B82F6'; // Couleur par défaut
  }
  
  // Nettoyer l'icône
  if (cleaned.icone) {
    cleaned.icone = cleaned.icone.trim().substring(0, 100);
  }
  
  // Valider l'ordre d'affichage
  if (cleaned.ordre_affichage !== undefined && cleaned.ordre_affichage < 0) {
    cleaned.ordre_affichage = 0;
  }
  
  return cleaned;
}

// =============================================================================
// 📈 MÉTRIQUES ET ANALYTIQUES
// =============================================================================

export interface CategoryMetrics {
  category_id: string;
  category_name: string;
  books_count: number;
  average_rating: number;
  most_common_status: string;
  spicy_level_distribution: { [level: number]: number };
  dark_level_distribution: { [level: number]: number };
  recent_additions: number; // Livres ajoutés dans les 30 derniers jours
}

/**
 * Calcule les métriques d'une catégorie
 */
export function calculateCategoryMetrics(
  category: CategoryWithRelations
): CategoryMetrics | null {
  if (!category.books || category.books.length === 0) {
    return null;
  }

  const books = category.books.map(relation => relation.book);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Calculs de base
  const totalBooks = books.length;
  const ratingsSum = books
    .filter(book => book.note_generale !== null)
    .reduce((sum, book) => sum + (book.note_generale || 0), 0);
  const booksWithRatings = books.filter(book => book.note_generale !== null).length;
  const averageRating = booksWithRatings > 0 ? ratingsSum / booksWithRatings : 0;
  
  // Statut le plus commun
  const statusCount: { [key: string]: number } = {};
  books.forEach(book => {
    if (book.statut) {
      statusCount[book.statut] = (statusCount[book.statut] || 0) + 1;
    }
  });
  const mostCommonStatus = Object.keys(statusCount).length > 0 
    ? Object.keys(statusCount).reduce((a, b) => statusCount[a] > statusCount[b] ? a : b)
    : "";
  
  // Distribution des niveaux spicy/dark
  const spicyDistribution: { [level: number]: number } = {};
  const darkDistribution: { [level: number]: number } = {};
  
  books.forEach(book => {
    if (book.niveau_spicy !== null && book.niveau_spicy !== undefined) {
      spicyDistribution[book.niveau_spicy] = (spicyDistribution[book.niveau_spicy] || 0) + 1;
    }
    if (book.niveau_dark !== null && book.niveau_dark !== undefined) {
      darkDistribution[book.niveau_dark] = (darkDistribution[book.niveau_dark] || 0) + 1;
    }
  });
  
  // Ajouts récents
  const recentAdditions = books.filter(book => 
    book.date_creation >= thirtyDaysAgo
  ).length;

  return {
    category_id: category.id,
    category_name: category.nom,
    books_count: totalBooks,
    average_rating: Math.round(averageRating * 10) / 10,
    most_common_status: mostCommonStatus,
    spicy_level_distribution: spicyDistribution,
    dark_level_distribution: darkDistribution,
    recent_additions: recentAdditions,
  };
}