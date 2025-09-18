'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CustomCarouselProps {
  children: React.ReactNode;
  className?: string;
  itemWidth?: number;
  gap?: number;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function CustomCarousel({
  children,
  className,
  itemWidth = 200,
  gap = 16,
  showArrows = true,
  showDots = false,
  autoPlay = false,
  autoPlayInterval = 5000,
}: CustomCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Calculate current index based on scroll position
  const updateCurrentIndex = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft } = scrollRef.current;
    const itemWidthWithGap = itemWidth + gap;
    const newIndex = Math.round(scrollLeft / itemWidthWithGap);
    setCurrentIndex(newIndex);
  };

  // Scroll functions
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    
    const itemWidthWithGap = itemWidth + gap;
    scrollRef.current.scrollBy({
      left: -itemWidthWithGap * 2, // Scroll by 2 items
      behavior: 'smooth',
    });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    
    const itemWidthWithGap = itemWidth + gap;
    scrollRef.current.scrollBy({
      left: itemWidthWithGap * 2, // Scroll by 2 items
      behavior: 'smooth',
    });
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    
    const itemWidthWithGap = itemWidth + gap;
    scrollRef.current.scrollTo({
      left: index * itemWidthWithGap,
      behavior: 'smooth',
    });
  };

  // Auto play
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      if (!canScrollRight) {
        // Reset to beginning
        scrollToIndex(0);
      } else {
        scrollRight();
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, canScrollRight]);

  // Event handlers
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      checkScrollPosition();
      updateCurrentIndex();
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    checkScrollPosition();
    updateCurrentIndex();

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [itemWidth, gap]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('relative group', className)}>
      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md border border-gray-200 hover:bg-white hover:shadow-lg hover:scale-110 transition-all duration-200 p-0 flex items-center justify-center',
              !canScrollLeft ? 'opacity-0 cursor-not-allowed' : 'opacity-80 hover:opacity-100 group-hover:opacity-100'
            )}
            aria-label="Précédent"
          >
            <ChevronLeft size={16} className="text-gray-700" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md border border-gray-200 hover:bg-white hover:shadow-lg hover:scale-110 transition-all duration-200 p-0 flex items-center justify-center',
              !canScrollRight ? 'opacity-0 cursor-not-allowed' : 'opacity-80 hover:opacity-100 group-hover:opacity-100'
            )}
            aria-label="Suivant"
          >
            <ChevronRight size={16} className="text-gray-700" />
          </Button>
        </>
      )}

      {/* Gradient overlays */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-ink-900 via-ink-900/90 to-transparent z-10 pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-ink-900 via-ink-900/90 to-transparent z-10 pointer-events-none" />
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{
          gap: `${gap}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0 snap-start"
            style={{ width: `${itemWidth}px` }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      {showDots && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: Math.ceil(totalItems / 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index * 2)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                Math.floor(currentIndex / 2) === index
                  ? 'bg-violet-500 scale-125'
                  : 'bg-ash-400 hover:bg-ash-300'
              )}
              aria-label={`Aller à la page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Specialized carousel for books
export function BookCarousel({
  children,
  title,
  subtitle,
  viewAllHref,
  className,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ash-100">{title}</h2>
          {subtitle && (
            <p className="text-sm text-ash-400 mt-1">{subtitle}</p>
          )}
        </div>
        {viewAllHref && (
          <Button
            variant="ghost"
            size="sm"
            className="text-violet-400 hover:text-violet-300"
            asChild
          >
            <a href={viewAllHref}>Voir tout</a>
          </Button>
        )}
      </div>

      {/* Carousel */}
      <CustomCarousel
        itemWidth={200}
        gap={16}
        showArrows={true}
      >
        {children}
      </CustomCarousel>
    </div>
  );
}