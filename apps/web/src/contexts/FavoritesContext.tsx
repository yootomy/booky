'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFavorites, UseFavoritesReturn } from '@/hooks/useFavorites';

interface FavoritesContextType extends UseFavoritesReturn {}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const favoritesData = useFavorites();

  return (
    <FavoritesContext.Provider value={favoritesData}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavoritesContext must be used within a FavoritesProvider");
  }
  return context;
}

// Export du hook useFavorites pour utilisation directe si nécessaire
export { useFavorites } from '@/hooks/useFavorites';