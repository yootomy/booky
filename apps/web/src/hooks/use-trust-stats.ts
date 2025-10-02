import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface TrustStats {
  total_books: number;
  unique_authors: number;
  total_genres: number;
  excellent_books_percentage: number;
  total_favorites: number;
  active_readers: number;
}

export function useTrustStats() {
  const [data, setData] = useState<TrustStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les statistiques générales
        const response = await apiClient.get('/api/stats/general');
        if (!response.ok) throw new Error("Failed to fetch stats");
        
        const stats = await response.json();
        
        // Si l'API stats ne contient pas tout, calculer depuis l'API books
        const booksResponse = await apiClient.get('/api/books');
        const allBooks = booksResponse.ok ? await booksResponse.json() : [];
        
        const total_books = allBooks.length || stats.total_books || 0;
        const unique_authors = new Set(allBooks.map((book: any) => book.auteur).filter(Boolean)).size || stats.unique_authors || 0;
        const excellent_books = allBooks.filter((book: any) => (book.note_generale || 0) >= 8).length;
        const excellent_books_percentage = total_books > 0 ? Math.round((excellent_books / total_books) * 100) : 0;
        
        // Calculer total des favoris
        const total_favorites = allBooks.reduce((sum: number, book: any) => 
          sum + (book._count?.favorites || book.favorites?.length || 0), 0
        ) || stats.total_favorites || 0;

        const processedStats: TrustStats = {
          total_books: total_books,
          unique_authors: unique_authors,
          total_genres: stats.total_genres || stats.total_categories || 12, // Fallback approximatif
          excellent_books_percentage: excellent_books_percentage,
          total_favorites: total_favorites,
          active_readers: stats.active_readers || stats.monthly_active_users || 24 // Fallback approximatif
        };

        setData(processedStats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { data, isLoading, error };
}