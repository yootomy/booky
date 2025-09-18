'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UseFavoritesReturn {
  favorites: Set<string>;
  isLoading: boolean;
  error: string | null;
  hasInitialLoad: boolean;
  addToFavorites: (bookId: string) => Promise<void>;
  removeFromFavorites: (bookId: string) => Promise<void>;
  toggleFavorite: (bookId: string) => Promise<void>;
  isFavorite: (bookId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  forceSync: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Fonction pour charger les favoris depuis l'API
  const loadFavorites = useCallback(async () => {
    console.log('loadFavorites called', { isAuthenticated, userId: user?.id });
    
    if (!isAuthenticated || !user) {
      console.log('loadFavorites: Not authenticated, clearing favorites');
      setFavorites(new Set());
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading favorites...');
      const response = await fetch('/api/proxy/favorites', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Favorites response:', data);
      
      if (data.success && data.data) {
        // Server returns full book objects, we need to extract IDs
        const favoritesArray = Array.isArray(data.data) 
          ? data.data.map((book: any) => book.id) 
          : [];
        setFavorites(new Set(favoritesArray));
        setHasInitialLoad(true);
        console.log('Favorites loaded and set:', favoritesArray);
      } else {
        console.warn('Favorites API returned no data or failed:', data);
        setFavorites(new Set());
        setHasInitialLoad(true);
      }
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      if (error.statusCode === 401) {
        // Utilisateur non authentifié
        setFavorites(new Set());
        setHasInitialLoad(true);
        return;
      }
      setError('Impossible de charger les favoris');
      setHasInitialLoad(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Charger les favoris au montage et quand l'auth change
  useEffect(() => {
    console.log('useFavorites: useEffect triggered', { isAuthenticated, user: user?.id });
    if (isAuthenticated && user) {
      console.log('useFavorites: Loading favorites for authenticated user:', user.id);
      loadFavorites();
    } else {
      console.log('useFavorites: Not authenticated, clearing favorites');
      setFavorites(new Set());
    }
  }, [isAuthenticated, user?.id, loadFavorites]);

  // Fonction pour ajouter aux favoris
  const addToFavorites = useCallback(async (bookId: string) => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter des favoris');
      // TODO: Ouvrir le modal de connexion
      return;
    }

    try {
      // Mise à jour optimiste
      setFavorites(prev => new Set([...prev, bookId]));
      
      console.log('Adding to favorites:', bookId);
      const response = await fetch('/api/proxy/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ bookId })
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({
          error: `Server error: ${response.status}`
        }));

        // Handle "already in favorites" case gracefully
        if (response.status === 400 && data.error?.includes('already in favorites')) {
          // Ensure local state is synced - book should be in favorites
          setFavorites(prev => new Set([...prev, bookId]));
          toast.info('Ce livre est déjà dans vos favoris');
          return;
        }

        throw new Error(data.error || 'Failed to add favorite');
      }

      const data = await response.json();
      console.log('Add favorite response:', data);

      toast.success('Livre ajouté aux favoris');
      
    } catch (error: any) {
      console.error('Error adding to favorites:', error);
      
      // Rollback en cas d'erreur
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
      
      if (error.message?.includes('401')) {
        toast.error('Veuillez vous reconnecter', {
          action: {
            label: 'Se connecter',
            onClick: () => {
              window.location.href = '/auth/login';
            }
          }
        });
      } else {
        toast.error(`Impossible d'ajouter aux favoris. Erreur: ${error.message || 'Inconnue'}`);
      }
    }
  }, [isAuthenticated]);

  // Fonction pour retirer des favoris
  const removeFromFavorites = useCallback(async (bookId: string) => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour gérer vos favoris');
      return;
    }

    try {
      // Mise à jour optimiste
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
      
      const response = await fetch(`/api/proxy/favorites/${bookId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({
          error: `Server error: ${response.status}`
        }));
        throw new Error(data.error || 'Failed to remove favorite');
      }
      
      toast.success('Livre retiré des favoris');
      
    } catch (error: any) {
      console.error('Error removing from favorites:', error);
      
      // Rollback en cas d'erreur
      setFavorites(prev => new Set([...prev, bookId]));
      
      if (error.message?.includes('401')) {
        toast.error('Veuillez vous reconnecter');
      } else {
        toast.error('Impossible de retirer des favoris. Réessayez.');
      }
    }
  }, [isAuthenticated]);

  // Fonction pour basculer l'état favori
  const toggleFavorite = useCallback(async (bookId: string) => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour gérer vos favoris', {
        action: {
          label: 'Se connecter',
          onClick: () => {
            window.location.href = '/auth/login';
          }
        }
      });
      return;
    }

    const isFav = favorites.has(bookId);
    if (isFav) {
      await removeFromFavorites(bookId);
    } else {
      await addToFavorites(bookId);
    }
  }, [favorites, isAuthenticated, addToFavorites, removeFromFavorites]);

  // Fonction pour vérifier si un livre est favori (avec conversion de type tolérante)
  const isFavorite = useCallback((bookId: string): boolean => {
    // Vérification exacte d'abord
    if (favorites.has(bookId)) {
      return true;
    }
    
    // Vérifications tolérantes pour gérer les différences de type
    const bookIdStr = String(bookId);
    const bookIdNum = bookId.toString();
    
    for (const favoriteId of favorites) {
      const favoriteIdStr = String(favoriteId);
      
      // Comparaisons possibles
      if (
        favoriteIdStr === bookIdStr ||
        favoriteId === bookId ||
        favoriteId.toString() === bookIdStr ||
        favoriteIdStr === bookIdNum
      ) {
        console.log(`[isFavorite] Found match with type conversion: book="${bookId}" (${typeof bookId}) matched favorite="${favoriteId}" (${typeof favoriteId})`);
        return true;
      }
    }
    
    return false;
  }, [favorites]);

  // Fonction pour rafraîchir les favoris
  const refreshFavorites = useCallback(async () => {
    console.log('Force refreshing favorites...');
    await loadFavorites();
  }, [loadFavorites]);

  // Fonction pour forcer la synchronisation (utile en cas d'incohérence)
  const forceSync = useCallback(async () => {
    if (!isAuthenticated) return;
    
    console.log('Force syncing favorites state...');
    setFavorites(new Set()); // Reset local state
    await loadFavorites(); // Reload from server
    toast.info('État des favoris synchronisé');
  }, [isAuthenticated, loadFavorites]);

  return {
    favorites,
    isLoading,
    error,
    hasInitialLoad,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    forceSync
  };
}