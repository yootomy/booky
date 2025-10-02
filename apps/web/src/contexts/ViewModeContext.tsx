'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMobileContext } from '@/contexts/MobileContext';

type ViewMode = 'grid' | 'list';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMobile: boolean;
  isLoaded: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

interface ViewModeProviderProps {
  children: ReactNode;
}

export function ViewModeProvider({ children }: ViewModeProviderProps) {
  const { isMobile, isLoaded } = useMobileContext();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Mettre en mode liste automatiquement sur mobile
  useEffect(() => {
    if (isLoaded) {
      if (isMobile) {
        setViewMode('list');
      } else {
        // Restaurer depuis localStorage ou défaut grille pour desktop
        const savedMode = localStorage.getItem('viewMode') as ViewMode;
        if (savedMode && (savedMode === 'grid' || savedMode === 'list')) {
          setViewMode(savedMode);
        } else {
          setViewMode('grid');
        }
      }
    }
  }, [isMobile, isLoaded]);

  // Sauvegarder le mode choisi par l'utilisateur (uniquement sur desktop)
  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (!isMobile) {
      localStorage.setItem('viewMode', mode);
    }
  };

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode: handleSetViewMode,
        isMobile,
        isLoaded
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}