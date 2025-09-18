/**
 * BooksGrid - Grille animée de livres avec effet de stagger
 * Gère l'affichage et les animations des collections de livres
 */

"use client";

import { ReactNode } from 'react';
import { StaggeredAnimation, AnimatedElement } from '@/components/ui/animations';
import { SkeletonAnimation } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { BookCard, type BookData } from './book-card';

// =============================================================================
// 🎯 TYPES ET INTERFACES
// =============================================================================

export interface BooksGridProps {
  books: BookData[];
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  showActions?: boolean;
  showRatings?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
  showDescription?: boolean;
  maxDescriptionLength?: number;
  className?: string;
  onView?: (book: BookData) => void;
  onEdit?: (book: BookData) => void;
  onDelete?: (book: BookData) => void;
  onFavoriteToggle?: (book: BookData) => void;
  onStatusChange?: (book: BookData, status: any) => void;
}

// =============================================================================
// 🎨 COMPOSANT SKELETON POUR LE LOADING
// =============================================================================

function BookCardSkeleton({ variant = 'default', className }: { 
  variant?: 'default' | 'compact' | 'minimal'; 
  className?: string;
}) {
  if (variant === 'minimal') {
    return (
      <div className={cn("flex gap-3", className)}>
        <SkeletonAnimation className="w-12 h-16 shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonAnimation className="h-4 w-full" />
          <SkeletonAnimation className="h-3 w-2/3" />
          <SkeletonAnimation className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("p-4 border rounded-lg", className)}>
        <div className="flex gap-3">
          <SkeletonAnimation className="w-16 h-24 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <SkeletonAnimation className="h-4 w-full" />
              <SkeletonAnimation className="h-3 w-2/3" />
            </div>
            <SkeletonAnimation className="h-6 w-20" />
            <SkeletonAnimation className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Skeleton pour la version par défaut
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="p-4 pb-2">
        <SkeletonAnimation className="w-32 h-48 mx-auto mb-4" />
      </div>
      <div className="p-4 pt-2 space-y-3">
        <div className="space-y-2">
          <SkeletonAnimation className="h-5 w-full" />
          <SkeletonAnimation className="h-4 w-2/3" />
        </div>
        <SkeletonAnimation className="h-6 w-24" />
        <div className="flex gap-2">
          <SkeletonAnimation className="h-4 w-16" />
          <SkeletonAnimation className="h-4 w-20" />
        </div>
        <SkeletonAnimation className="h-12 w-full" />
        <div className="flex gap-1">
          <SkeletonAnimation className="h-6 w-16" />
          <SkeletonAnimation className="h-6 w-20" />
          <SkeletonAnimation className="h-6 w-18" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// 🌊 COMPOSANT PRINCIPAL BOOKS GRID
// =============================================================================

export function BooksGrid({
  books,
  isLoading = false,
  variant = 'default',
  size = 'md',
  columns = 4,
  showActions = true,
  showRatings = true,
  showCategories = true,
  showTags = false,
  showDescription = true,
  maxDescriptionLength = 100,
  className,
  onView,
  onEdit,
  onDelete,
  onFavoriteToggle,
  onStatusChange,
}: BooksGridProps) {

  // Classes pour la grille responsive
  const getGridClasses = () => {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
    };

    const gaps = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6'
    };

    return cn(
      'grid',
      gridCols[columns],
      gaps[size],
      variant === 'minimal' && 'space-y-3 grid-cols-1',
      className
    );
  };

  // Afficher les skeletons pendant le chargement
  if (isLoading) {
    const skeletonCount = variant === 'minimal' ? 8 : columns * 3;
    
    return (
      <div className={getGridClasses()}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <AnimatedElement
            key={`skeleton-${index}`}
            animation="fadeInUp"
            trigger="onMount"
            delay={index * 50}
          >
            <BookCardSkeleton variant={variant === 'detailed' ? 'default' : variant} />
          </AnimatedElement>
        ))}
      </div>
    );
  }

  // Afficher un message si pas de livres
  if (books.length === 0) {
    return (
      <AnimatedElement
        animation="fadeIn"
        trigger="onMount"
        className="text-center py-12"
      >
        <div className="space-y-4">
          <div className="text-6xl">📚</div>
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">Aucun livre trouvé</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Essayez d'ajuster vos filtres ou ajoutez votre premier livre.
            </p>
          </div>
        </div>
      </AnimatedElement>
    );
  }

  // Affichage en liste pour variant minimal
  if (variant === 'minimal') {
    return (
      <div className={cn('space-y-3', className)}>
        <StaggeredAnimation
          staggerDelay={80}
          animation="slideInLeft"
        >
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              variant="minimal"
              showActions={showActions}
              showRatings={showRatings}
              showCategories={showCategories}
              showTags={showTags}
              showDescription={showDescription}
              maxDescriptionLength={maxDescriptionLength}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onFavoriteToggle={onFavoriteToggle ? (bookId: string) => {
                const book = books.find(b => b.id === bookId);
                if (book) onFavoriteToggle(book);
              } : undefined}
              onStatusChange={onStatusChange}
            />
          ))}
        </StaggeredAnimation>
      </div>
    );
  }

  // Affichage en grille pour autres variants
  return (
    <div className={getGridClasses()}>
      <StaggeredAnimation
        staggerDelay={120}
        animation="fadeInUp"
      >
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            variant={variant}
            size={size}
            showActions={showActions}
            showRatings={showRatings}
            showCategories={showCategories}
            showTags={showTags}
            showDescription={showDescription}
            maxDescriptionLength={maxDescriptionLength}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onFavoriteToggle={onFavoriteToggle ? (bookId: string) => {
              const book = books.find(b => b.id === bookId);
              if (book) onFavoriteToggle(book);
            } : undefined}
            onStatusChange={onStatusChange}
          />
        ))}
      </StaggeredAnimation>
    </div>
  );
}

// =============================================================================
// 📱 COMPOSANT RESPONSIVE BOOKS GRID
// =============================================================================

export function ResponsiveBooksGrid(props: BooksGridProps) {
  return (
    <div className="w-full">
      {/* Version mobile - liste minimale */}
      <div className="block sm:hidden">
        <BooksGrid
          {...props}
          variant="minimal"
          columns={1}
        />
      </div>
      
      {/* Version tablet - grille compacte */}
      <div className="hidden sm:block lg:hidden">
        <BooksGrid
          {...props}
          variant="compact"
          columns={2}
        />
      </div>
      
      {/* Version desktop - grille complète */}
      <div className="hidden lg:block">
        <BooksGrid
          {...props}
          variant={props.variant || 'default'}
          columns={props.columns || 4}
        />
      </div>
    </div>
  );
}

// =============================================================================
// 🎪 HOOKS POUR L'ANIMATION DE GRILLE
// =============================================================================

export function useGridAnimations(itemCount: number) {
  const staggerDelay = Math.min(120, 800 / itemCount); // Plus d'items = délai plus court
  
  return {
    staggerDelay,
    animationDuration: Math.min(600, itemCount * 50),
    shouldAnimate: itemCount <= 20, // Ne pas animer si trop d'items pour les performances
  };
}

export default BooksGrid;