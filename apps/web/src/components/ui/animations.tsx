/**
 * Animations - Composants et hooks pour les animations avancées
 * Système d'animations réutilisables pour une UX fluide
 */

"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from '@/lib/utils';

// =============================================================================
// 🎭 TYPES ET INTERFACES
// =============================================================================

export type AnimationType = 
  | 'fadeIn' 
  | 'fadeInUp' 
  | 'fadeInDown' 
  | 'slideInLeft' 
  | 'slideInRight'
  | 'scaleIn'
  | 'bounceIn'
  | 'rotateIn';

export type AnimationTrigger = 'onMount' | 'onHover' | 'onScroll' | 'onClick';

export interface AnimationProps {
  children: ReactNode;
  animation?: AnimationType;
  trigger?: AnimationTrigger;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number; // Pour les animations onScroll
}

// =============================================================================
// 🎨 DÉFINITIONS DES ANIMATIONS CSS
// =============================================================================

const animationStyles = {
  fadeIn: {
    initial: 'opacity-0',
    animate: 'opacity-100',
    duration: 'duration-500'
  },
  fadeInUp: {
    initial: 'opacity-0 translate-y-6',
    animate: 'opacity-100 translate-y-0',
    duration: 'duration-700'
  },
  fadeInDown: {
    initial: 'opacity-0 -translate-y-6',
    animate: 'opacity-100 translate-y-0',
    duration: 'duration-700'
  },
  slideInLeft: {
    initial: 'opacity-0 -translate-x-full',
    animate: 'opacity-100 translate-x-0',
    duration: 'duration-600'
  },
  slideInRight: {
    initial: 'opacity-0 translate-x-full',
    animate: 'opacity-100 translate-x-0',
    duration: 'duration-600'
  },
  scaleIn: {
    initial: 'opacity-0 scale-90',
    animate: 'opacity-100 scale-100',
    duration: 'duration-300'
  },
  bounceIn: {
    initial: 'opacity-0 scale-90',
    animate: 'opacity-100 scale-100',
    duration: 'duration-500'
  },
  rotateIn: {
    initial: 'opacity-0 -rotate-180',
    animate: 'opacity-100 rotate-0',
    duration: 'duration-800'
  }
};

// =============================================================================
// 🎬 COMPOSANT D'ANIMATION PRINCIPAL
// =============================================================================

export function AnimatedElement({
  children,
  animation = 'fadeIn',
  trigger = 'onMount',
  delay = 0,
  duration = 500,
  className,
  threshold = 0.1
}: AnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const style = animationStyles[animation];

  // Hook pour l'intersection observer (scroll animations)
  useEffect(() => {
    if (trigger === 'onScroll' && elementRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        { threshold }
      );

      observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
  }, [trigger, threshold]);

  // Hook pour les animations onMount
  useEffect(() => {
    if (trigger === 'onMount') {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay]);

  // Déterminer les classes CSS à appliquer
  const getAnimationClasses = () => {
    const baseClasses = [
      'transition-all',
      'ease-out',
      style.duration
    ];

    // Ajouter le délai si spécifié
    if (delay > 0) {
      baseClasses.push('delay-[${delay}ms]`);
    }

    // État initial ou animé selon le trigger
    switch (trigger) {
      case `onMount':
        return cn(
          baseClasses,
          isVisible ? style.animate : style.initial,
          className
        );
      
      case 'onHover':
        return cn(
          baseClasses,
          isHovered ? style.animate : style.initial,
          className
        );
      
      case 'onScroll':
        return cn(
          baseClasses,
          isVisible ? style.animate : style.initial,
          className
        );
      
      default:
        return cn(baseClasses, style.animate, className);
    }
  };

  // Props pour les événements hover
  const hoverProps = trigger === 'onHover' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false)
  } : {};

  return (
    <div
      ref={elementRef}
      className={getAnimationClasses()}
      {...hoverProps}
    >
      {children}
    </div>
  );
}

// =============================================================================
// 🌊 ANIMATIONS SÉQUENTIELLES
// =============================================================================

export interface StaggeredAnimationProps {
  children: ReactNode[];
  animation?: AnimationType;
  staggerDelay?: number;
  className?: string;
}

export function StaggeredAnimation({
  children,
  animation = 'fadeInUp',
  staggerDelay = 100,
  className
}: StaggeredAnimationProps) {
  return (
    <>
      {children.map((child, index) => (
        <AnimatedElement
          key={index}
          animation={animation}
          trigger="onScroll"
          delay={index * staggerDelay}
          className={className}
        >
          {child}
        </AnimatedElement>
      ))}
    </>
  );
}

// =============================================================================
// 📱 ANIMATIONS RESPONSIVES
// =============================================================================

export interface ResponsiveAnimationProps {
  children: ReactNode;
  mobileAnimation?: AnimationType;
  desktopAnimation?: AnimationType;
  className?: string;
}

export function ResponsiveAnimation({
  children,
  mobileAnimation="fadeIn",
  desktopAnimation = 'fadeInUp',
  className
}: ResponsiveAnimationProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <AnimatedElement
      animation={isMobile ? mobileAnimation : desktopAnimation}
      trigger="onScroll"
      className={className}
    >
      {children}
    </AnimatedElement>
  );
}

// =============================================================================
// 🎯 ANIMATIONS SPÉCIALISÉES
// =============================================================================

// Animation de loading avec skeleton
export function SkeletonAnimation({ className, ...props }: { className?: string; [key: string]: any }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
        'rounded-md',
        className
      )}
      {...props}
    />
  );
}

// Animation de notification/toast
export function SlideInNotification({ 
  children, 
  isVisible, 
  position = 'top-right',
  className 
}: {
  children: ReactNode;
  isVisible: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300 ease-out',
        positionClasses[position],
        isVisible 
          ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full',
        className
      )}
    >
      {children}
    </div>
  );
}

// Animation de modal avec backdrop
export function ModalAnimation({ 
  children, 
  isOpen, 
  onClose,
  className 
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        'animate-in fade-in duration-200'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-background border rounded-lg shadow-xl',
          'animate-in zoom-in-95 duration-200',
          'max-w-md w-full mx-4',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// 🎪 HOOKS PERSONNALISÉS POUR LES ANIMATIONS
// =============================================================================

export function useScrollAnimation(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [elementRef, isVisible] as const;
}

export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false)
  };

  return [isHovered, hoverProps] as const;
}

export function useStaggeredMount(itemCount: number, delay = 100) {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleItems(prev => {
        if (prev >= itemCount) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(timer);
  }, [itemCount, delay]);

  return visibleItems;
}

// =============================================================================
// 🎨 UTILITAIRES POUR LES ANIMATIONS
// =============================================================================

export const animationPresets = {
  // Entrées de page
  pageEnter: 'fadeInUp',
  pageExit: 'fadeInDown',
  
  // Cards et éléments
  cardHover: 'scaleIn',
  cardEnter: 'fadeInUp',
  
  // Listes et grilles
  listItem: 'slideInLeft',
  gridItem: 'scaleIn',
  
  // Modales et overlays
  modal: 'scaleIn',
  overlay: 'fadeIn',
  
  // Éléments interactifs
  button: 'scaleIn',
  input: 'slideInLeft'
} as const;

export type AnimationPreset = keyof typeof animationPresets;

// Fonction helper pour obtenir une animation par preset
export function getAnimationByPreset(preset: AnimationPreset): AnimationType {
  return animationPresets[preset];
}