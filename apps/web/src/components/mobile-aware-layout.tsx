'use client';

import { useEffect, ReactNode } from 'react';
import { useMobileContext } from '@/contexts/MobileContext';

interface MobileAwareLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MobileAwareLayout({ children, className = '' }: MobileAwareLayoutProps) {
  const { isLoaded } = useMobileContext();

  // Scroll automatique en haut de page au chargement/changement de page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Afficher un état de chargement pendant que la détection mobile se charge
  if (!isLoaded) {
    return (
      <div className="w-full min-h-screen h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={'w-full min-h-screen h-full bg-background ${className}'}>
      {children}
    </div>
  );
}