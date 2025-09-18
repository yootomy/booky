'use client';

import { useQuery } from '@tanstack/react-query';

// Hook pour les statistiques générales
export function useHomeStats() {
  return useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const response = await fetch('/api/proxy/stats/general');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
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
      const response = await fetch('/api/proxy/featured-book');
      if (!response.ok) {
        throw new Error('Failed to fetch featured book');
      }
      const data = await response.json();
      return data.data || null;
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
      const response = await fetch('/api/proxy/books?limit=10&sortBy=date_lecture&sortOrder=desc&hasDateLecture=true');
      if (!response.ok) {
        throw new Error('Failed to fetch recent reads');
      }
      const data = await response.json();
      return data.data || [];
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
      // Récupérer plusieurs listes en parallèle
      const [nouveautes, meilleuresNotes, darkSpicy] = await Promise.all([
        fetch('/api/proxy/books?limit=12&sortBy=date_creation&sortOrder=desc').then(r => r.json()),
        fetch('/api/proxy/books?limit=12&sortBy=note_generale&sortOrder=desc').then(r => r.json()),
        // Dark & Spicy: niveau_dark >= 7 OU niveau_spicy >= 7, triés par note
        fetch('/api/proxy/books?limit=12&minDark=7&minSpicy=7&sortBy=note_generale&sortOrder=desc').then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      return {
        nouveautes: nouveautes.data || [],
        meilleuresNotes: meilleuresNotes.data || [],
        sagasEnCours: [], // TODO: implémenter quand l'API saga sera disponible
        darkSpicy: darkSpicy.data || []
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
      const response = await fetch('/api/proxy/categories?page=1&pageSize=10');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
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
      const response = await fetch('/api/proxy/books?limit=5&sortBy=note_generale&sortOrder=desc');
      if (!response.ok) {
        throw new Error('Failed to fetch books for quotes');
      }
      const data = await response.json();
      
      // Trouver le premier livre avec une citation
      const bookWithQuote = data.data?.find((book: any) => book.citations_favorites);
      
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
      // TODO: implémenter l'API des questions
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook pour les livres personnalisés (recommandations)
export function usePersonalizedBooks() {
  return useQuery({
    queryKey: ['personalized-books'],
    queryFn: async () => {
      // Pour l'instant, retourner les mieux notés
      const response = await fetch('/api/proxy/books?limit=10&sortBy=note_generale&sortOrder=desc');
      if (!response.ok) {
        throw new Error('Failed to fetch personalized books');
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Less retries for personalized content
  });
}