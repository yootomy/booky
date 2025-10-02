'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Hook pour les statistiques générales
export function useHomeStats() {
  return useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/stats/general');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch stats');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook pour le livre spotlight (livre sélectionné par l'admin ou le mieux noté)
export function useSpotlightBook() {
  return useQuery({
    queryKey: ['spotlight-book'],
    queryFn: async () => {
      const response = await apiClient.get('/api/featured-book');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch featured book');
      }
      return response.data?.data || response.data || null;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook pour les lectures récentes (timeline)
export function useRecentReads() {
  return useQuery({
    queryKey: ['recent-reads'],
    queryFn: async () => {
      // date_lecture non null, orderBy date_lecture desc, max 10
      const response = await apiClient.get('/api/books', {
        limit: 10,
        sortBy: 'date_lecture',
        sortOrder: 'desc',
        hasDateLecture: 'true'
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch recent reads');
      }
      return response.data?.data || response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook pour les découvertes (carousels)
export function useDiscoveryCarousels() {
  return useQuery({
    queryKey: ['discovery-carousels'],
    queryFn: async () => {
      console.log("[NEW API] Loading discovery carousels...");

      // Récupérer plusieurs listes en parallèle
      const [nouveautesRes, meilleuresNotesRes, darkSpicyRes] = await Promise.all([
        apiClient.get('/api/books', { limit: 12, sortBy: 'date_creation', sortOrder: 'desc' }),
        apiClient.get('/api/books', { limit: 12, sortBy: 'note_generale', sortOrder: 'desc' }),
        // Dark & Spicy: niveau_dark >= 7 OU niveau_spicy >= 7, triés par note
        apiClient.get('/api/books', {
          limit: 12,
          minDark: 7,
          minSpicy: 7,
          sortBy: 'note_generale',
          sortOrder: 'desc'
        }).catch(() => ({ success: false, data: [] }))
      ]);

      return {
        nouveautes: nouveautesRes.success ? (nouveautesRes.data?.data || nouveautesRes.data || []) : [],
        meilleuresNotes: meilleuresNotesRes.success ? (meilleuresNotesRes.data?.data || meilleuresNotesRes.data || []) : [],
        sagasEnCours: [], // TODO: implémenter quand l'API saga sera disponible
        darkSpicy: darkSpicyRes.success ? (darkSpicyRes.data?.data || darkSpicyRes.data || []) : []
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook pour les catégories populaires
export function usePopularCategories() {
  return useQuery({
    queryKey: ['popular-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/api/categories', { page: 1, pageSize: 10 });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch categories');
      }
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

// Hook pour les citations favorites
export function useFeaturedQuote() {
  return useQuery({
    queryKey: ['featured-quote'],
    queryFn: async () => {
      const response = await apiClient.get('/api/books', {
        limit: 5,
        sortBy: 'note_generale',
        sortOrder: 'desc'
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch books for quotes');
      }

      const books = response.data?.data || response.data || [];

      // Trouver le premier livre avec une citation
      const bookWithQuote = books.find((book: any) => book.citations_favorites);

      if (bookWithQuote) {
        return {
          text: bookWithQuote.citations_favorites?.split('\n')[0] || '',
          bookTitle: bookWithQuote.titre,
          bookId: bookWithQuote.id,
          author: bookWithQuote.auteur
        };
      }

      return null;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

// Hook pour les questions récentes
export function useRecentQuestions() {
  return useQuery({
    queryKey: ['recent-questions'],
    queryFn: async () => {
      // Note: L'API questions n'est pas encore implementée dans le proxy
      // mais elle existe dans le backend (/api/questions)
      const response = await apiClient.get('/api/questions');
      if (!response.success) {
        console.warn("[NEW API] Questions API not available yet: ", response.error);
        return [];
      }
      return response.data?.data || response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Less retries since this API might not be ready
  });
}

// Hook pour les livres personnalisés (recommandations)
export function usePersonalizedBooks() {
  return useQuery({
    queryKey: ["personalized-books"],
    queryFn: async () => {
      // Pour l'instant, retourner les mieux notés
      const response = await apiClient.get('/api/books', {
        limit: 10,
        sortBy: 'note_generale',
        sortOrder: 'desc'
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch personalized books');
      }
      return response.data?.data || response.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Less retries for personalized content
  });
}