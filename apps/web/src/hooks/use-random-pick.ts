'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HomeBook } from '@/lib/types/home';
import { apiClient } from '@/lib/api-client';

export function useRandomPick() {
  const [isPickingRandom, setIsPickingRandom] = useState(false);
  const queryClient = useQueryClient();

  const { data: randomBook, isLoading, error } = useQuery({
    queryKey: ['random-book', isPickingRandom],
    queryFn: async (): Promise<HomeBook> => {
      const response = await apiClient.get('/api/books/random');

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch random book");
      }

      return response.data;
    },
    enabled: isPickingRandom,
    staleTime: 0, // Always fetch fresh for random picks
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const pickRandom = () => {
    setIsPickingRandom(true);
    // Invalidate the query to force a new random pick
    queryClient.invalidateQueries({ queryKey: ['random-book'] });
  };

  const resetPick = () => {
    setIsPickingRandom(false);
  };

  return {
    randomBook: isPickingRandom ? randomBook : null,
    isLoading: isPickingRandom && isLoading,
    error,
    pickRandom,
    resetPick,
  };
}