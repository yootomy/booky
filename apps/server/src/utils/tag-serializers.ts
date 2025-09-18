// Types directs pour éviter les problèmes d'import
type Tag = {
  id: string;
  nom: string;
  couleur: string;
  type: 'GENRE' | 'TROPE' | 'TRIGGER' | 'PERSONNALISE';
  utilisation_count: number;
  est_favori: boolean;
  date_creation: Date;
  date_modification: Date;
};

type Book = {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  statut: string;
  note_generale?: number;
  date_creation: Date;
  date_modification: Date;
};

type BookTag = {
  bookId: string;
  tagId: string;
  dateAssociation?: Date;
};

// =============================================================================
// 🏷️ UTILITAIRES DE SÉRIALISATION POUR LES TAGS
// =============================================================================

// =============================================================================
// Types pour les relations
// =============================================================================

export interface TagWithRelations {
  id: string;
  nom: string;
  couleur: string;
  type: "GENRE" | "TROPE" | "TRIGGER" | "PERSONNALISE";
  utilisation_count: number;
  est_favori: boolean;
  date_creation: Date;
  date_modification: Date;
  _count?: {
    book_tag: number;
  };
  books?: (BookTag & {
    book: Book;
  })[];
}

export interface TagResponse {
  id: string;
  nom: string;
  couleur: string;
  type: "GENRE" | "TROPE" | "TRIGGER" | "PERSONNALISE";
  utilisation_count: number;
  est_favori: boolean;
  date_creation: string;
  date_modification: string;
  book_count?: number;
}

export interface TagStatsResponse {
  total_tags: number;
  active_tags: number;
  tags_by_type: {
    GENRE: number;
    TROPE: number;
    TRIGGER: number;
    PERSONNALISE: number;
  };
  most_used_tags: Array<{
    id: string;
    nom: string;
    couleur: string;
    type: string;
    utilisation_count: number;
  }>;
  favorite_tags_count: number;
  recent_tags_count: number;
  avg_tags_per_book: number;
}

export interface TagMetrics {
  id: string;
  nom: string;
  type: string;
  couleur: string;
  utilisation_count: number;
  est_favori: boolean;
  books_count: number;
  avg_rating: number | null;
  most_common_genres?: string[];
  most_active_period?: string;
  growth_trend?: "increasing" | "decreasing" | "stable";
}

// =============================================================================
// Fonctions de sérialisation
// =============================================================================

/**
 * Sérialise un tag avec ses options d'inclusion
 */
export function serializeTag(
  tag: TagWithRelations,
  options: { includeBookCount?: boolean; includeBooks?: boolean } = {}
): TagResponse & { books?: any[] } {
  const serialized: TagResponse = {
    id: tag.id,
    nom: tag.nom,
    couleur: tag.couleur,
    type: tag.type,
    utilisation_count: tag.utilisation_count,
    est_favori: tag.est_favori,
    date_creation: tag.date_creation.toISOString(),
    date_modification: tag.date_modification.toISOString(),
  };

  // Ajouter le nombre de livres si demandé
  if (options.includeBookCount) {
    serialized.book_count = tag._count?.book_tag ?? 0;
  }

  // Ajouter les livres si demandé
  if (options.includeBooks && tag.books) {
    return {
      ...serialized,
      books: tag.books.map(book_tag => ({
        id: book_tag.book.id,
        titre: book_tag.book.titre,
        auteur: book_tag.book.auteur,
        image_couverture: book_tag.book.image_couverture || null,
        statut: book_tag.book.statut,
        note_generale: book_tag.book.note_generale,
        date_creation: book_tag.book.date_creation.toISOString(),
        date_modification: book_tag.book.date_modification.toISOString(),
      })),
    };
  }

  return serialized;
}

/**
 * Sérialise une liste de tags
 */
export function serializeTags(
  tags: TagWithRelations[],
  options: { includeBookCount?: boolean; includeBooks?: boolean } = {}
): TagResponse[] {
  return tags.map(tag => serializeTag(tag, options));
}

/**
 * Formate les tags pour l'affichage simple
 */
export function formatTagsForDisplay(tags: Tag[]): Array<{
  id: string;
  nom: string;
  couleur: string;
  type: string;
}> {
  return tags.map(tag => ({
    id: tag.id,
    nom: tag.nom,
    couleur: tag.couleur,
    type: tag.type,
  }));
}

/**
 * Nettoie et valide les données d'un tag
 */
export function sanitizeTagData(data: any): any {
  const cleaned: any = {};
  
  if (data.nom !== undefined) {
    cleaned.nom = String(data.nom).trim().toLowerCase();
  }
  
  if (data.couleur !== undefined) {
    cleaned.couleur = String(data.couleur).trim();
    // Validation du format hexadécimal
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(cleaned.couleur)) {
      cleaned.couleur = "#6B7280"; // Couleur par défaut
    }
  }
  
  if (data.type !== undefined) {
    const validTypes = ["GENRE", "TROPE", "TRIGGER", "PERSONNALISE"];
    cleaned.type = validTypes.includes(String(data.type)) ? data.type : "PERSONNALISE";
  }
  
  if (data.est_favori !== undefined) {
    cleaned.est_favori = Boolean(data.est_favori);
  }
  
  return cleaned;
}

// =============================================================================
// Fonctions de statistiques
// =============================================================================

/**
 * Calcule les statistiques de base des tags
 */
export function calculateTagStats(tags: TagWithRelations[]): TagStatsResponse["tags_by_type"] & {
  total_tags: number;
  active_tags: number;
  favorite_tags_count: number;
  recent_tags_count: number;
} {
  const stats = {
    total_tags: tags.length,
    active_tags: tags.length, // Tous les tags sont considérés actifs
    favorite_tags_count: 0,
    recent_tags_count: 0,
    GENRE: 0,
    TROPE: 0,
    TRIGGER: 0,
    PERSONNALISE: 0,
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  tags.forEach(tag => {
    // Compter par type
    stats[tag.type]++;
    
    // Compter les favoris
    if (tag.est_favori) {
      stats.favorite_tags_count++;
    }
    
    // Compter les récents
    if (tag.date_creation >= thirtyDaysAgo) {
      stats.recent_tags_count++;
    }
  });

  return stats;
}

/**
 * Calcule les métriques détaillées pour un tag
 */
export function calculateTagMetrics(tag: TagWithRelations): TagMetrics | null {
  if (!tag.books || tag.books.length === 0) {
    return {
      id: tag.id,
      nom: tag.nom,
      type: tag.type,
      couleur: tag.couleur,
      utilisation_count: tag.utilisation_count,
      est_favori: tag.est_favori,
      books_count: 0,
      avg_rating: null,
      growth_trend: "stable",
    };
  }

  const books = tag.books.map(bt => bt.book);
  const ratings = books.map(book => book.note_generale).filter((rating): rating is number => rating !== undefined && rating !== null && rating > 0);
  
  // Calcul de la moyenne des notes
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
    : null;

  // Analyse des tendances (basée sur les dates de création des livres)
  const sortedBooks = books.sort((a, b) => 
    new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime()
  );
  
  let growthTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (sortedBooks.length >= 3) {
    const recentBooks = sortedBooks.slice(-Math.ceil(sortedBooks.length / 3));
    const olderBooks = sortedBooks.slice(0, Math.floor(sortedBooks.length / 3));
    
    if (recentBooks.length > olderBooks.length * 1.5) {
      growthTrend = "increasing";
    } else if (recentBooks.length < olderBooks.length * 0.5) {
      growthTrend = "decreasing";
    }
  }

  // Genres les plus courants parmi les livres de ce tag
  const genreStats: { [key: string]: number } = {};
  books.forEach(book => {
    // Note: Cette logique devrait être adaptée selon la structure des genres dans votre DB
    // Pour l'instant, on utilise une logique simplifiée
    if (book.auteur) {
      genreStats[book.auteur] = (genreStats[book.auteur] || 0) + 1;
    }
  });
  
  const mostCommonGenres = Object.entries(genreStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre);

  // Période la plus active (mois avec le plus de livres ajoutés)
  const monthStats: { [key: string]: number } = {};
  books.forEach(book => {
    const month = new Date(book.date_creation).toISOString().slice(0, 7); // YYYY-MM
    monthStats[month] = (monthStats[month] || 0) + 1;
  });
  
  const mostActiveMonth = Object.entries(monthStats)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  return {
    id: tag.id,
    nom: tag.nom,
    type: tag.type,
    couleur: tag.couleur,
    utilisation_count: tag.utilisation_count,
    est_favori: tag.est_favori,
    books_count: books.length,
    avg_rating: avgRating,
    most_common_genres: mostCommonGenres.length > 0 ? mostCommonGenres : undefined,
    most_active_period: mostActiveMonth || undefined,
    growth_trend: growthTrend,
  };
}

/**
 * Calcule la moyenne de tags par livre
 */
export function calculateAvgTagsPerBook(tags: TagWithRelations[]): number {
  const totalBookTagAssociations = tags.reduce((sum, tag) => sum + tag.utilisation_count, 0);
  const uniqueBooks = new Set();
  
  tags.forEach(tag => {
    if (tag.books) {
      tag.books.forEach(bt => uniqueBooks.add(bt.book.id));
    }
  });

  return uniqueBooks.size > 0 
    ? Math.round((totalBookTagAssociations / uniqueBooks.size) * 10) / 10
    : 0;
}

/**
 * Groupe les tags par type avec compteurs
 */
export function groupTagsByType(tags: TagWithRelations[]): {
  [type: string]: {
    count: number;
    tags: TagResponse[];
    total_usage: number;
  }
} {
  const grouped: { [type: string]: { count: number; tags: TagResponse[]; total_usage: number } } = {
    GENRE: { count: 0, tags: [], total_usage: 0 },
    TROPE: { count: 0, tags: [], total_usage: 0 },
    TRIGGER: { count: 0, tags: [], total_usage: 0 },
    PERSONNALISE: { count: 0, tags: [], total_usage: 0 },
  };

  tags.forEach(tag => {
    const type = tag.type;
    grouped[type].count++;
    grouped[type].total_usage += tag.utilisation_count;
    grouped[type].tags.push(serializeTag(tag));
  });

  return grouped;
}

/**
 * Obtient les suggestions de couleurs basées sur le type de tag
 */
export function getSuggestedColorsForTagType(type: "GENRE" | "TROPE" | "TRIGGER" | "PERSONNALISE"): string[] {
  const colorSuggestions = {
    GENRE: ["#EC4899", "#8B5CF6", "#EF4444", "#6366F1", "#06B6D4", "#D97706"],
    TROPE: ["#F59E0B", "#10B981", "#F97316", "#84CC16", "#E11D48", "#8B5CF6"],
    TRIGGER: ["#B91C1C", "#991B1B", "#7C2D12", "#92400E", "#DC2626", "#EF4444"],
    PERSONNALISE: ["#6B7280", "#374151", "#111827", "#1F2937", "#4B5563", "#9CA3AF"],
  };

  return colorSuggestions[type] || colorSuggestions.PERSONNALISE;
}

// =============================================================================
// Utilitaires pour les réponses API
// =============================================================================

/**
 * Crée une réponse paginée pour les tags
 */
export function createTagsPaginatedResponse(
  tags: TagResponse[],
  pagination: any,
  filters: any,
  searchInfo: any
) {
  return {
    success: true,
    data: tags,
    pagination,
    filters,
    search_info: searchInfo,
  };
}