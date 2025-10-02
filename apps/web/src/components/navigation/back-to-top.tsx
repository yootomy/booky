/**
 * BackToTop - Bouton retour en haut de page
 * Bouton animé qui apparaît lors du scroll
 */

"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BackToTopProps {
  // Comportement
  threshold?: number; // Pixels de scroll avant d'afficher le bouton
  smooth?: boolean; // Scroll fluide
  duration?: number; // Durée de l'animation en ms
  
  // Apparence
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  icon?: 'arrow' | 'chevron';
  showLabel?: boolean;
  label?: string;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  
  // Callbacks
  onClick?: () => void;
  onShow?: () => void;
  onHide?: () => void;
}

// Hook pour détecter le scroll
function useScrollPosition(threshold: number) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY > threshold;
      setIsVisible(scrolled);
    };

    // Écouter le scroll
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    // Vérifier la position initiale
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [threshold]);

  return isVisible;
}

// Animation de scroll fluide
function smoothScrollToTop(duration: number = 500) {
  const startPosition = window.scrollY;
  const startTime = performance.now();

  function scrollStep(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Fonction d'easing (ease-out)
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    window.scrollTo(0, startPosition * (1 - easeOutQuart));

    if (progress < 1) {
      requestAnimationFrame(scrollStep);
    }
  }

  requestAnimationFrame(scrollStep);
}

export function BackToTop({
  threshold = 300,
  smooth = true,
  duration = 500,
  variant = 'default',
  size = 'md',
  position = 'bottom-right',
  icon = 'arrow',
  showLabel = false,
  label = 'Haut de page',
  className,
  style,
  onClick,
  onShow,
  onHide
}: BackToTopProps) {
  const isVisible = useScrollPosition(threshold);
  const [isAnimating, setIsAnimating] = useState(false);

  // Callbacks pour show/hide
  useEffect(() => {
    if (isVisible) {
      onShow?.();
    } else {
      onHide?.();
    }
  }, [isVisible, onShow, onHide]);

  const handleClick = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    onClick?.();

    if (smooth) {
      smoothScrollToTop(duration);
      setTimeout(() => setIsAnimating(false), duration);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsAnimating(false);
    }
  };

  // Classes de position
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6', 
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2'
  };

  // Classes de taille
  const sizeClasses = {
    sm: showLabel ? 'h-10 px-3' : 'h-10 w-10',
    md: showLabel ? 'h-12 px-4' : 'h-12 w-12',
    lg: showLabel ? 'h-14 px-5' : 'h-14 w-14'
  };

  // Taille d'icône
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const IconComponent = icon === 'chevron' ? ChevronUp : ArrowUp;

  if (!isVisible) return null;

  return (
    <Button
      variant={variant}
      className={cn(
        positionClasses[position],
        sizeClasses[size],
        'z-50 shadow-lg hover:shadow-xl transition-all duration-300 border',
        'animate-in fade-in slide-in-from-bottom-2',
        showLabel ? "rounded-full" : "rounded-full",
        isAnimating && "scale-95",
        className
      )}
      style={style}
      onClick={handleClick}
      disabled={isAnimating}
      title={!showLabel ? label : undefined}
    >
      <IconComponent 
        size={iconSizes[size]} 
        className={cn(
          isAnimating && 'animate-pulse',
          showLabel && 'mr-2'
        )}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {label}
        </span>
      )}
    </Button>
  );
}

// Variante progress - affiche la progression du scroll
export function BackToTopWithProgress({
  threshold = 300,
  className,
  ...props
}: BackToTopProps & { strokeWidth?: number }) {
  const isVisible = useScrollPosition(threshold);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = Math.min((scrolled / scrollHeight) * 100, 100);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener("scroll', updateScrollProgress);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <div className="relative">
        {/* Cercle de progression */}
        <svg
          className="transform -rotate-90 w-12 h-12"
          viewBox="0 0 36 36"
        >
          {/* Fond du cercle */}
          <path
            className="text-muted/30"
            d="M18,2.0845
              a 15.9155,15.9155 0 0,1 0,31.831
              a 15.9155,15.9155 0 0,1 0,-31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Progression */}
          <path
            className="text-primary transition-all duration-300"
            d="M18,2.0845
              a 15.9155,15.9155 0 0,1 0,31.831
              a 15.9155,15.9155 0 0,1 0,-31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={'${scrollProgress},'100'}
          />
        </svg>
        
        {/* Bouton au centre */}
        <Button
          variant="ghost"
          className="absolute inset-0 w-12 h-12 rounded-full hover:bg-background/80"
          onClick={() => {
            if (props.smooth) {
              smoothScrollToTop(props.duration);
            } else {
              window.scrollTo({ top: 0, behavior: "instant" });
            }
          }}
        >
          <ArrowUp size={16} />
        </Button>
      </div>
    </div>
  );
}

// Variante compacte pour mobile
export function CompactBackToTop({
  threshold = 200,
  className,
  ...props
}: BackToTopProps) {
  return (
    <BackToTop
      {...props}
      threshold={threshold}
      size="sm"
      variant="secondary"
      position="bottom-right"
      className={cn("sm:hidden", className)}
      showLabel={false}
    />
  );
}

// Variante avec animation personnalisée
export function AnimatedBackToTop({
  threshold = 300,
  className,
  ...props
}: BackToTopProps) {
  const isVisible = useScrollPosition(threshold);
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <Button
      variant={props.variant || 'default'}
      className={cn(
        'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg',
        'transition-all duration-300 hover:shadow-xl',
        'hover:scale-110 active:scale-95',
        isHovered && 'animate-bounce',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (props.smooth) {
          smoothScrollToTop(props.duration);
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        props.onClick?.();
      }}
    >
      <ArrowUp 
        size={20} 
        className={cn(
          'transition-transform duration-300',
          isHovered && 'scale-110'
        )}
      />
    </Button>
  );
}

// Hook personnalisé pour utiliser le back to top
export function useBackToTop(threshold: number = 300) {
  const isVisible = useScrollPosition(threshold);
  
  const scrollToTop = (smooth: boolean = true, duration: number = 500) => {
    if (smooth) {
      smoothScrollToTop(duration);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return {
    isVisible,
    scrollToTop
  };
}