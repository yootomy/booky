import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface PersonalizedBook {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  statut?: 'LU' | 'EN_COURS' | 'A_LIRE';
  progress?: number;
  date_modification?: string;
}

interface PersonalizedData {
  suggestions: PersonalizedBook[];
  currentReading: PersonalizedBook[];
  toReadNext: PersonalizedBook[];
}

export function usePersonalizedSection() {
  const [data, setData] = useState<PersonalizedData>({
    suggestions: [],
    currentReading: [],
    toReadNext: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchPersonalizedData = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const sessionResponse = await apiClient.get('/api/auth/session');
        if (!sessionResponse.ok) {
          setIsAuthenticated(false);
          setData({ suggestions: [], currentReading: [], toReadNext: [] });
          return;
        }

        const session = await sessionResponse.json();
        if (!session.user) {
          setIsAuthenticated(false);
          setData({ suggestions: [], currentReading: [], toReadNext: [] });
          return;
        }

        setIsAuthenticated(true);

        // Récupérer les favoris de l'utilisateur
        const favoritesResponse = await apiClient.get('/api/favorites');
        const favorites = favoritesResponse.ok ? await favoritesResponse.json() : [];

        // Récupérer tous les livres pour les suggestions
        const booksResponse = await apiClient.get('/api/books');
        const allBooks = booksResponse.ok ? await booksResponse.json() : [];

        // Générer des suggestions basées sur les favoris
        const suggestions = generateSuggestions(favorites, allBooks);
        
        // Récupérer les lectures en cours (simulation - à adapter selon l'API réelle)
        const currentReading = allBooks
          .filter((book: any) => book.statut === 'EN_COURS' || book.user_status === 'EN_COURS')
          .slice(0, 5)
          .map((book: any) => ({
            id: book.id,
            titre: book.titre,
            auteur: book.auteur,
            image_couverture: book.image_couverture,
            note_generale: book.note_generale || 0,
            statut: 'EN_COURS' as const,
            date_modification: book.date_modification
          }));

        // Récupérer la liste à lire (simulation)
        const toReadNext = allBooks
          .filter((book: any) => book.statut === 'A_LIRE' || book.user_status === 'A_LIRE')
          .slice(0, 5)
          .map((book: any) => ({
            id: book.id,
            titre: book.titre,
            auteur: book.auteur,
            image_couverture: book.image_couverture,
            note_generale: book.note_generale || 0,
            statut: 'A_LIRE' as const,
            date_modification: book.date_creation
          }));

        setData({
          suggestions: suggestions.slice(0, 6),
          currentReading,
          toReadNext
        });
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData({ suggestions: [], currentReading: [], toReadNext: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonalizedData();
  }, []);

  return { data, isLoading, error, isAuthenticated };
}

// Fonction pour générer des suggestions basées sur les favoris
function generateSuggestions(favorites: any[], allBooks: any[]): PersonalizedBook[] {
  if (favorites.length === 0) {
    // Si pas de favoris, suggérer les livres les mieux notés
    return allBooks
      .filter((book: any) => (book.note_generale || 0) >= 8)
      .sort((a: any, b: any) => (b.note_generale || 0) - (a.note_generale || 0))
      .slice(0, 6)
      .map((book: any) => ({
        id: book.id,
        titre: book.titre,
        auteur: book.auteur,
        image_couverture: book.image_couverture,
        note_generale: book.note_generale || 0
      }));
  }

  // Analyser les tags des favoris
  const favoriteTags = new Set<string>();
  const favoriteAuthors = new Set<string>();
  
  favorites.forEach((fav: any) => {
    if (fav.book?.auteur) favoriteAuthors.add(fav.book.auteur);
    if (fav.book?.tags) {
      fav.book.tags.forEach((tag: any) => favoriteTags.add(tag.nom));
    }
  });

  // Scorer les livres basé sur la similarité
  const scoredBooks = allBooks
    .filter((book: any) => !favorites.some((fav: any) => fav.book?.id === book.id))
    .map((book: any) => {
      let score = 0;
      
      // Bonus pour même auteur
      if (favoriteAuthors.has(book.auteur)) score += 3;
      
      // Bonus pour tags communs
      if (book.tags) {
        book.tags.forEach((tag: any) => {
          if (favoriteTags.has(tag.nom)) score += 1;
        });
      }
      
      // Bonus pour bonne note
      score += (book.note_generale || 0) * 0.1;
      
      return { ...book, suggestionScore: score };
    })
    .filter((book: any) => book.suggestionScore > 0)
    .sort((a: any, b: any) => b.suggestionScore - a.suggestionScore);

  return scoredBooks.slice(0, 6).map((book: any) => ({
    id: book.id,
    titre: book.titre,
    auteur: book.auteur,
    image_couverture: book.image_couverture,
    note_generale: book.note_generale || 0
  }));
}