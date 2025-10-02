import { useState, useEffect } from 'react';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounceMs?: number;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 2, debounceMs = 16 } = options; // 16ms = ~60fps pour réactivité maximale
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;

      // Éviter les changements inutiles quand la position est identique
      if (currentScrollY === lastScrollY) return;

      const newDirection = currentScrollY > lastScrollY ? "down" : "up";
      setScrollDirection(newDirection);
      setScrollY(currentScrollY);

      // Logic pour la visibilité du header - ULTRA INSTANTANÉE avec protection
      if (currentScrollY <= 5) {
        // En haut de page (avec marge), FORCER la visibilité
        setIsVisible(true);
      } else if (newDirection === "up") {
        // Scroll vers le haut, montrer IMMÉDIATEMENT le header
        setIsVisible(true);
      } else if (newDirection === 'down' && currentScrollY > 50) {
        // Scroll vers le bas, cacher plus rapidement
        setIsVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    // Utilisation de requestAnimationFrame pour optimisation maximale
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollDirection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return {
    scrollDirection,
    isVisible,
    scrollY
  };
}