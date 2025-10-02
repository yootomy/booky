'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from './use-debounce';

export interface SuggestionItem {
  type: 'book' | 'author' | 'tag' | 'category';
  id: string;
  title?: string;
  author?: string;
  cover?: string;
  name?: string;
  label?: string;
}

interface UseSearchSuggestionsOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  enabled?: boolean;
}

interface UseSearchSuggestionsReturn {
  suggestions: SuggestionItem[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSuggestions: () => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

// Cache simple en mémoire pour éviter les requêtes répétées
const cache = new Map<string, { data: SuggestionItem[]; timestamp: number }>();
const CACHE_TTL = 60000; // 60 secondes

export function useSearchSuggestions(
  options: UseSearchSuggestionsOptions = {}
): UseSearchSuggestionsReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxSuggestions = 8,
    enabled = true
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fonction pour récupérer les suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!enabled || query.length < minQueryLength) {
      setSuggestions([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    // Vérifier le cache
    const cacheKey = 'suggestions_${query.toLowerCase()}';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setSuggestions(cached.data);
      setIsLoading(false);
      setError(null);
      setSelectedIndex(-1);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/search/suggest?q=${encodeURIComponent(query)}&limit=${maxSuggestions}', {
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      const suggestionItems = data.items || [];

      // Mettre en cache
      cache.set(cacheKey, {
        data: suggestionItems,
        timestamp: Date.now()
      });

      // Nettoyer le cache des entrées expirées (simple GC)
      if (cache.size > 100) {
        const now = Date.now();
        for (const [key, value] of cache.entries()) {
          if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
          }
        }
      }

      setSuggestions(suggestionItems);
      setSelectedIndex(-1);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching suggestions: ", error);
        setError("Erreur lors du chargement des suggestions");
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, minQueryLength, maxSuggestions]);

  // Effet pour déclencher la recherche
  useEffect(() => {
    fetchSuggestions(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchSuggestions]);

  // Nettoyer l'abort controller au démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    clearSuggestions,
    selectedIndex,
    setSelectedIndex: setSelectedIndex as React.Dispatch<React.SetStateAction<number>>,
  };
}