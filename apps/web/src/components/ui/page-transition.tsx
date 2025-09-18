/**
 * PageTransition - Composant pour les transitions entre pages
 * Gère les animations d'entrée et sortie des pages
 */

"use client";

import { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  transition?: 'fade' | 'slide' | 'scale' | 'blur';
}

export function PageTransition({ 
  children, 
  className,
  transition = 'fade'
}: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  // Effet pour gérer les changements de route
  useEffect(() => {
    setIsVisible(false);
    
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  // Classes CSS selon le type de transition
  const getTransitionClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    switch (transition) {
      case 'fade':
        return cn(
          baseClasses,
          isVisible ? 'opacity-100' : 'opacity-0',
          className
        );
      
      case 'slide':
        return cn(
          baseClasses,
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 translate-x-4',
          className
        );
      
      case 'scale':
        return cn(
          baseClasses,
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95',
          className
        );
      
      case 'blur':
        return cn(
          baseClasses,
          isVisible 
            ? 'opacity-100 blur-0' 
            : 'opacity-0 blur-sm',
          className
        );
      
      default:
        return cn(baseClasses, className);
    }
  };

  return (
    <div className={getTransitionClasses()}>
      {displayChildren}
    </div>
  );
}

// Composant pour les transitions de layout
export function LayoutTransition({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div 
      className={cn(
        'min-h-screen transition-all duration-500 ease-out',
        className
      )}
    >
      <PageTransition transition="fade">
        {children}
      </PageTransition>
    </div>
  );
}

// Hook pour les transitions personnalisées
export function usePageTransition(duration = 300) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [pathname, duration]);

  return { isTransitioning, pathname };
}