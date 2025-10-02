// =============================================================================
// 🔍 HOOKS REACT QUERY POUR LA RECHERCHE EXTERNE
// =============================================================================
// Hooks personnalisés pour utiliser les API externes avec TanStack Query
// Gestion optimisée du cache, des erreurs et des états de chargement

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  googleBooksApi, 
  openLibraryApi, 
  externalSearchApi,
  type ExternalSearchOptions,
  type ExternalSearchResult,
  type BookImportOptions,
  validateISBN
} from '../utils/external-api';
import type { ExternalBookResult, ImportResult } from '../types/api';

// =============================================================================
// 🔧 QUERY KEYS
// =============================================================================

export const externalQueryKeys = {
  all: ['external'] as const,
  
  // Google Books
  googleBooks: () => [...externalQueryKeys.all, 'google-books'] as const,
  googleBooksSearch: (options: ExternalSearchOptions) => 
    [...externalQueryKeys.googleBooks(), 'search', options] as const,
  googleBooksBook: (id: string) => 
    [...externalQueryKeys.googleBooks(), 'book', id] as const,
  
  // Open Library
  openLibrary: () => [...externalQueryKeys.all, 'open-library'] as const,
  openLibrarySearch: (options: ExternalSearchOptions) => 
    [...externalQueryKeys.openLibrary(), 'search', options] as const,
  openLibraryBook: (id: string) => 
    [...externalQueryKeys.openLibrary(), 'book', id] as const,
  
  // Recherche combinée
  combinedSearch: (options: ExternalSearchOptions) => 
    [...externalQueryKeys.all, 'combined-search', options] as const,
} as const;

// =============================================================================
// 🔍 HOOKS DE RECHERCHE GOOGLE BOOKS
// =============================================================================

export function useGoogleBooksSearch(options: ExternalSearchOptions, enabled = true) {
  return useQuery({
    queryKey: externalQueryKeys.googleBooksSearch(options),
    queryFn: () => googleBooksApi.search(options),
    enabled: enabled && !!options.query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Retry seulement pour les erreurs réseau
      if (error instanceof Error && error.message.includes('Network')) {
        return failureCount < 2;
      }
      return false;
    },
  });
}

export function useGoogleBooksSearchByTitle(title: string, options?: { maxResults?: number; enabled?: boolean }) {
  return useGoogleBooksSearch(
    {
      query: title,
      searchType: 'title',
      maxResults: options?.maxResults || 10,
    },
    options?.enabled !== false && !!title.trim()
  );
}

export function useGoogleBooksSearchByAuthor(author: string, options?: { maxResults?: number; enabled?: boolean }) {
  return useGoogleBooksSearch(
    {
      query: author,
      searchType: 'author',
      maxResults: options?.maxResults || 10,
    },
    options?.enabled !== false && !!author.trim()
  );
}

export function useGoogleBooksSearchByISBN(isbn: string, options?: { enabled?: boolean }) {
  const isValidISBN = validateISBN(isbn).valid;
  
  return useGoogleBooksSearch(
    {
      query: isbn.replace(/[-\s]/g, ''),
      searchType: 'isbn',
      maxResults: 1,
    },
    options?.enabled !== false && !!isbn.trim() && isValidISBN
  );
}

export function useGoogleBookDetails(googleBooksId: string, enabled = true) {
  return useQuery({
    queryKey: externalQueryKeys.googleBooksBook(googleBooksId),
    queryFn: () => googleBooksApi.getBookDetails(googleBooksId),
    enabled: enabled && !!googleBooksId,
    staleTime: 60 * 60 * 1000, // 1 heure
    gcTime: 24 * 60 * 60 * 1000, // 24 heures
  });
}

// =============================================================================
// 📖 HOOKS DE RECHERCHE OPEN LIBRARY
// =============================================================================

export function useOpenLibrarySearch(options: ExternalSearchOptions, enabled = true) {
  return useQuery({
    queryKey: externalQueryKeys.openLibrarySearch(options),
    queryFn: () => openLibraryApi.search(options),
    enabled: enabled && !!options.query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Network')) {
        return failureCount < 2;
      }
      return false;
    },
  });
}

export function useOpenLibrarySearchByTitle(title: string, options?: { maxResults?: number; enabled?: boolean }) {
  return useOpenLibrarySearch(
    {
      query: 'title:${title}',
      maxResults: options?.maxResults || 10,
    },
    options?.enabled !== false && !!title.trim()
  );
}

export function useOpenLibrarySearchByAuthor(author: string, options?: { maxResults?: number; enabled?: boolean }) {
  return useOpenLibrarySearch(
    {
      query: 'author:${author}',
      maxResults: options?.maxResults || 10,
    },
    options?.enabled !== false && !!author.trim()
  );
}

export function useOpenLibraryBookDetails(openLibraryKey: string, enabled = true) {
  return useQuery({
    queryKey: externalQueryKeys.openLibraryBook(openLibraryKey),
    queryFn: () => openLibraryApi.getBookDetails(openLibraryKey),
    enabled: enabled && !!openLibraryKey,
    staleTime: 60 * 60 * 1000, // 1 heure
    gcTime: 24 * 60 * 60 * 1000, // 24 heures
  });
}

// =============================================================================
// 🔄 HOOK DE RECHERCHE COMBINÉE
// =============================================================================

export function useCombinedExternalSearch(options: ExternalSearchOptions, enabled = true) {
  return useQuery({
    queryKey: externalQueryKeys.combinedSearch(options),
    queryFn: () => externalSearchApi.searchBoth(options),
    enabled: enabled && !!options.query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("Network")) {
        return failureCount < 2;
      }
      return false;
    },
  });
}

// =============================================================================
// 🔍 HOOK DE RECHERCHE INTELLIGENTE AVEC DEBOUNCE
// =============================================================================

export function useSmartExternalSearch(
  initialQuery = '',
  options?: {
    debounceMs?: number;
    preferredSource?: 'google_books' | 'open_library' | 'combined';
    maxResults?: number;
    searchType?: 'title' | 'author' | 'isbn' | 'general';
  }
) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  // Debounce pour éviter trop de requêtes
  const debounceMs = options?.debounceMs || 500;
  
  const debounce = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setDebouncedQuery(value), debounceMs);
      };
    })(),
    [debounceMs]
  );
  
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    debounce(newQuery);
  }, [debounce]);
  
  // Déterminer le type de recherche automatiquement
  const searchOptions: ExternalSearchOptions = {
    query: debouncedQuery,
    searchType: options?.searchType || 'general',
    maxResults: options?.maxResults || 20,
  };
  
  // Sélectionner la source de recherche
  const preferredSource = options?.preferredSource || 'combined';
  
  // Hooks conditionnels selon la source préférée
  const googleBooksQuery = useGoogleBooksSearch(
    searchOptions,
    preferredSource === 'google_books' && !!debouncedQuery.trim()
  );
  
  const openLibraryQuery = useOpenLibrarySearch(
    searchOptions,
    preferredSource === 'open_library' && !!debouncedQuery.trim()
  );
  
  const combinedQuery = useCombinedExternalSearch(
    searchOptions,
    preferredSource === 'combined' && !!debouncedQuery.trim()
  );
  
  // Retourner les résultats selon la source
  if (preferredSource === 'google_books') {
    return {
      query,
      debouncedQuery,
      updateQuery,
      searchResults: googleBooksQuery.data,
      isLoading: googleBooksQuery.isLoading,
      isError: googleBooksQuery.isError,
      error: googleBooksQuery.error,
      refetch: googleBooksQuery.refetch,
      source: 'google_books' as const,
    };
  }
  
  if (preferredSource === 'open_library') {
    return {
      query,
      debouncedQuery,
      updateQuery,
      searchResults: openLibraryQuery.data,
      isLoading: openLibraryQuery.isLoading,
      isError: openLibraryQuery.isError,
      error: openLibraryQuery.error,
      refetch: openLibraryQuery.refetch,
      source: 'open_library' as const,
    };
  }
  
  // Source combinée
  return {
    query,
    debouncedQuery,
    updateQuery,
    searchResults: combinedQuery.data,
    isLoading: combinedQuery.isLoading,
    isError: combinedQuery.isError,
    error: combinedQuery.error,
    refetch: combinedQuery.refetch,
    source: 'combined' as const,
  };
}

// =============================================================================
// 📥 HOOKS D'IMPORT DE LIVRES
// =============================================================================

export function useImportFromGoogleBooks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ googleBooksId, options }: { googleBooksId: string; options?: BookImportOptions }) =>
      googleBooksApi.importBook(googleBooksId, options),
    onSuccess: (data: ImportResult) => {
      // Invalider les caches de livres pour refléter le nouveau livre
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success("Livre importé depuis Google Books", {
        description: `${data.result.livre_cree?.titre || 'Livre'} a été ajouté à votre bibliothèque`,
      });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'import", {
        description: error.message || "Impossible d'importer le livre depuis Google Books",
      });
    },
  });
}

export function useImportFromOpenLibrary() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ openLibraryKey, options }: { openLibraryKey: string; options?: BookImportOptions }) =>
      openLibraryApi.importBook(openLibraryKey, options),
    onSuccess: (data: ImportResult) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast.success('Livre importé depuis Open Library', {
        description: `${data.result.livre_cree?.titre || 'Livre'} a été ajouté à votre bibliothèque`,
      });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'import", {
        description: error.message || "Impossible d'importer le livre depuis Open Library",
      });
    },
  });
}

// =============================================================================
// 🧹 HOOK POUR NETTOYER LE CACHE
// =============================================================================

export function useExternalSearchCache() {
  const queryClient = useQueryClient();
  
  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: externalQueryKeys.all });
    toast.success("Cache des recherches externes vidé");
  }, [queryClient]);
  
  const clearGoogleBooksCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: externalQueryKeys.googleBooks() });
    toast.success("Cache Google Books vidé");
  }, [queryClient]);
  
  const clearOpenLibraryCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: externalQueryKeys.openLibrary() });
    toast.success("Cache Open Library vidé");
  }, [queryClient]);
  
  return {
    clearCache,
    clearGoogleBooksCache,
    clearOpenLibraryCache,
  };
}