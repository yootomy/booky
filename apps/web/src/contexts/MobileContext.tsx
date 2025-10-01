'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useMobile } from '@/hooks/use-mobile';

interface MobileContextType {
  isMobile: boolean;
  isDesktop: boolean;
  isLoaded: boolean;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

interface MobileProviderProps {
  children: ReactNode;
}

export function MobileProvider({ children }: MobileProviderProps) {
  const { isMobile, isLoaded, isDesktop } = useMobile();

  return (
    <MobileContext.Provider
      value={{
        isMobile,
        isDesktop,
        isLoaded
      }}
    >
      {children}
    </MobileContext.Provider>
  );
}

export function useMobileContext() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobileContext must be used within a MobileProvider');
  }
  return context;
}