import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface MoodTag {
  id: string;
  nom: string;
  couleur?: string;
  icon?: string;
  books_count: number;
}

export function useMoodExplorer() {
  const [data, setData] = useState<MoodTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        
        const response = await apiClient.get('/api/categories'); // Utiliser categories comme tags
        if (!response.success) throw new Error(response.error || "Failed to fetch tags");
        
        const tags = response.data;
        
        const processedTags = tags.map((tag: any) => ({
          id: tag.id,
          nom: tag.nom,
          couleur: tag.couleur,
          icon: tag.icon,
          books_count: tag._count?.books || tag.books_count || 0
        }));

        setData(processedTags);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { data, isLoading, error };
}