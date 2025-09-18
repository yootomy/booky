/**
 * Cache simple en mémoire pour améliorer les performances
 * Réduit les requêtes répétitives vers la base de données
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupérer une valeur du cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Vérifier si le cache a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Stocker une valeur dans le cache
   */
  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance globale du cache
export const memoryCache = new MemoryCache();

// Nettoyer le cache toutes les 10 minutes
setInterval(() => {
  memoryCache.cleanup();
}, 10 * 60 * 1000);

/**
 * Helper pour créer des clés de cache consistantes
 */
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * TTL par type de données (en millisecondes)
 */
export const CACHE_TTL = {
  BOOKS_LIST: 2 * 60 * 1000,      // 2 minutes pour la liste des livres
  BOOK_DETAIL: 5 * 60 * 1000,     // 5 minutes pour le détail d'un livre
  CATEGORIES: 10 * 60 * 1000,     // 10 minutes pour les catégories
  TAGS: 10 * 60 * 1000,           // 10 minutes pour les tags
  FAVORITES: 1 * 60 * 1000,       // 1 minute pour les favoris
  STATS: 5 * 60 * 1000,           // 5 minutes pour les statistiques
  SEARCH: 3 * 60 * 1000           // 3 minutes pour les recherches
} as const;