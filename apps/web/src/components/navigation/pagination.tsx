/**
 * Pagination - Composant de pagination avec infinite scroll
 * Support pagination classique, infinite scroll et load more
 */

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Loader2,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  // Pagination classique
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  
  // Infinite scroll
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onLoadMore?: () => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
  
  // Options d'affichage
  variant?: 'default' | 'compact' | 'infinite' | 'loadmore';
  showInfo?: boolean;
  showItemsPerPage?: boolean;
  showRefresh?: boolean;
  maxVisiblePages?: number;
  
  // États
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Infinite scroll
  threshold?: number; // Distance en px du bas pour déclencher le chargement
  rootMargin?: string;
}

// Hook pour l'infinite scroll
function useInfiniteScroll({
  onLoadMore,
  threshold = 200,
  rootMargin = '0px',
  loading = false,
  hasNextPage = true
}: {
  onLoadMore?: () => Promise<void> | void;
  threshold?: number;
  rootMargin?: string;
  loading?: boolean;
  hasNextPage?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(async (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && hasNextPage && !loading && !isLoading && onLoadMore) {
      setIsLoading(true);
      try {
        await onLoadMore();
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [hasNextPage, loading, isLoading, onLoadMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin,
      threshold: 0.1
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersect, rootMargin]);

  return { observerRef, isLoading };
}

// Pagination classique
function ClassicPagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxVisiblePages = 5,
  disabled = false
}: {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  maxVisiblePages: number;
  disabled: boolean;
}) {
  // Calculer les pages visibles
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(currentPage - halfVisible, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const visiblePages = getVisiblePages();
  const showFirstPage = visiblePages[0] > 1;
  const showLastPage = visiblePages[visiblePages.length - 1] < totalPages;
  const showStartEllipsis = visiblePages[0] > 2;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <div className="flex items-center gap-1">
      {/* Première page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange?.(1)}
        disabled={currentPage === 1 || disabled}
        title="Première page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Page précédente */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange?.(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        title="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Première page si non visible */}
      {showFirstPage && (
        <Button
          variant="outline"
          onClick={() => onPageChange?.(1)}
          disabled={disabled}
          className="w-10"
        >
          1
        </Button>
      )}

      {/* Ellipsis de début */}
      {showStartEllipsis && (
        <div className="px-2">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Pages visibles */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          onClick={() => onPageChange?.(page)}
          disabled={disabled}
          className="w-10"
        >
          {page}
        </Button>
      ))}

      {/* Ellipsis de fin */}
      {showEndEllipsis && (
        <div className="px-2">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Dernière page si non visible */}
      {showLastPage && (
        <Button
          variant="outline"
          onClick={() => onPageChange?.(totalPages)}
          disabled={disabled}
          className="w-10"
        >
          {totalPages}
        </Button>
      )}

      {/* Page suivante */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange?.(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        title="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Dernière page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange?.(totalPages)}
        disabled={currentPage === totalPages || disabled}
        title="Dernière page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Composant d'information sur la pagination
function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  variant
}: {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage: number;
  variant: string;
}) {
  if (!totalItems) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (variant === 'compact') {
    return (
      <div className="text-xs text-muted-foreground">
        {startItem}-{endItem} / {totalItems}
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      Affichage de {startItem} à {endItem} sur {totalItems} éléments
      {totalPages > 1 && (
        <span className="ml-2">
          (Page {currentPage} sur {totalPages})
        </span>
      )}
    </div>
  );
}

// Sélecteur d'items par page
function ItemsPerPageSelector({
  itemsPerPage,
  onItemsPerPageChange,
  disabled,
  options = [10, 20, 50, 100]
}: {
  itemsPerPage: number;
  onItemsPerPageChange?: (value: number) => void;
  disabled: boolean;
  options?: number[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Afficher:</span>
      <Select
        value={itemsPerPage.toString()}
        onValueChange={(value) => onItemsPerPageChange?.(parseInt(value))}
        disabled={disabled}
      >
        <SelectTrigger className="w-20 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Composant principal
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  onItemsPerPageChange,
  hasNextPage = false,
  hasPreviousPage = false,
  onLoadMore,
  onRefresh,
  variant = 'default',
  showInfo = true,
  showItemsPerPage = true,
  showRefresh = false,
  maxVisiblePages = 5,
  loading = false,
  disabled = false,
  className,
  threshold = 200,
  rootMargin = '0px'
}: PaginationProps) {
  const { observerRef, isLoading } = useInfiniteScroll({
    onLoadMore,
    threshold,
    rootMargin,
    loading,
    hasNextPage
  });

  // Pagination infinite scroll
  if (variant === 'infinite') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Trigger pour infinite scroll */}
        <div ref={observerRef} className="h-px" />
        
        {/* Indicateur de chargement */}
        {(loading || isLoading) && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">
              Chargement...
            </span>
          </div>
        )}

        {/* Message fin de liste */}
        {!hasNextPage && !loading && !isLoading && totalItems && totalItems > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Tous les éléments ont été chargés
            </p>
            {showInfo && totalItems && (
              <p className="text-xs text-muted-foreground mt-1">
                {totalItems} élément{totalItems > 1 ? 's' : ''} au total
              </p>
            )}
          </div>
        )}

        {/* Bouton refresh */}
        {showRefresh && onRefresh && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Pagination load more
  if (variant === 'loadmore') {
    return (
      <div className={cn('space-y-4', className)}>
        {showInfo && totalItems && (
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            variant={variant}
          />
        )}

        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              onClick={onLoadMore}
              disabled={loading || disabled}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Charger plus
            </Button>
          </div>
        )}

        {!hasNextPage && totalItems && totalItems > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Tous les éléments ont été chargés
            </p>
          </div>
        )}
      </div>
    );
  }

  // Pagination compacte
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Badge variant="outline" className="px-2">
            {currentPage} / {totalPages}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {showInfo && totalItems && (
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            variant={variant}
          />
        )}
      </div>
    );
  }

  // Pagination par défaut
  return (
    <div className={cn('space-y-4', className)}>
      {/* Informations et contrôles */}
      <div className="flex items-center justify-between">
        {showInfo && totalItems ? (
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            variant={variant}
          />
        ) : (
          <div />
        )}

        <div className="flex items-center gap-4">
          {showRefresh && onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              title="Actualiser"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          )}

          {showItemsPerPage && onItemsPerPageChange && (
            <ItemsPerPageSelector
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={onItemsPerPageChange}
              disabled={disabled}
            />
          )}
        </div>
      </div>

      {/* Contrôles de pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <ClassicPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            maxVisiblePages={maxVisiblePages}
            disabled={disabled}
          />
        </div>
      )}

      {/* Indicateur de chargement */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      )}
    </div>
  );
}

// Composant skeleton pour le loading
export function PaginationSkeleton({
  variant = 'default',
  className
}: {
  variant?: 'default' | 'compact';
  className?: string;
}) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between', className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
    </div>
  );
}