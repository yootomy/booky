'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { BookFilter, HomeBook, UseBookFiltersReturn } from '@/lib/types/home';
type BookRhythm = 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';

const INITIAL_FILTERS: BookFilter = {
  genres: [],
  tropes: [],
  triggers: [],
  rhythms: [],
  minSpicy: undefined,
  maxSpicy: undefined,
  minDark: undefined,
  maxDark: undefined,
  minRomance: undefined,
  maxRomance: undefined,
};

export function useBookFilters(): UseBookFiltersReturn {
  const [filters, setFilters] = useState<BookFilter>(INITIAL_FILTERS);
  
  // Debounce filters to avoid too many API calls
  const debouncedFilters = useDebounce(filters, 300);

  // Fetch filtered books
  const { data: filteredBooks = [], isLoading } = useQuery({
    queryKey: ['filtered-books', debouncedFilters],
    queryFn: async () => {
      // Only query if we have active filters
      const hasFilters = Object.values(debouncedFilters).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== undefined
      );
      
      if (!hasFilters) {
        return [];
      }

      const response = await fetch('/api/books/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(debouncedFilters),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch filtered books');
      }

      return response.json();
    },
    enabled: Object.values(debouncedFilters).some(value => 
      Array.isArray(value) ? value.length > 0 : value !== undefined
    ),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const updateFilters = (newFilters: Partial<BookFilter>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return {
    filters,
    filteredBooks,
    isLoading,
    updateFilters,
    clearFilters,
  };
}

// Hook for search with suggestions
export function useBookSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['book-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      return response.json();
    },
    enabled: Boolean(debouncedQuery && debouncedQuery.length >= 2),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
  };
}

// Hook for mood presets
export function useMoodFilters() {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  const applyMoodPreset = (presetId: string, presetFilters: Partial<BookFilter>) => {
    setActivePreset(presetId);
    return presetFilters;
  };

  const clearMoodPreset = () => {
    setActivePreset(null);
  };

  return {
    activePreset,
    applyMoodPreset,
    clearMoodPreset,
  };
}