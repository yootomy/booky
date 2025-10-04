"use client";

import { useState, useMemo } from "react";
import { 
  Grid, 
  List, 
  SortAsc, 
  Filter,
  Search,
  BookOpen,
  LayoutGrid,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard, type BookData } from "./book-card";
import { BookStatus, type BookStatusType } from "./book-status";
import { cn } from "@/lib/utils";

// Types pour les options d'affichage
export interface BookGridProps {
  books: BookData[];
  variant?: "default" | "compact" | "detailed";
  columns?: "auto" | 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  showSort?: boolean;
  loading?: boolean;
  emptyState?: React.ReactNode;
  onBookView?: (book: BookData) => void;
  onBookEdit?: (book: BookData) => void;
  onBookDelete?: (book: BookData) => void;
  onBookFavorite?: (book: BookData) => void;
  onBookStatusChange?: (book: BookData, status: BookStatusType) => void;
  className?: string;
  // Pagination
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
}

// Types pour les filtres et tri
type SortOption = "title" | "author" | "date" | "rating" | "status";
type SortDirection = "asc" | "desc";

export function BookGrid({
  books,
  variant="default",
  columns="auto",
  gap="md",
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  showSort = true,
  loading = false,
  emptyState,
  onBookView,
  onBookEdit,
  onBookDelete,
  onBookFavorite,
  onBookStatusChange,
  className,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 20
}: BookGridProps) {
  // États locaux pour les filtres et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookStatusType | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtrer et trier les livres
  const processedBooks = useMemo(() => {
    let filtered = books;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.titre.toLowerCase().includes(query) ||
        book.auteur.toLowerCase().includes(query) ||
        book.resume_personnel?.toLowerCase().includes(query) ||
        book.resume_officiel?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(book => book.statut === statusFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "title":
          comparison = a.titre.localeCompare(b.titre);
          break;
        case 'author':
          comparison = a.auteur.localeCompare(b.auteur);
          break;
        case 'date':
          comparison = a.date_creation.getTime() - b.date_creation.getTime();
          break;
        case 'rating':
          comparison = (a.note_generale || 0) - (b.note_generale || 0);
          break;
        case 'status':
          comparison = a.statut.localeCompare(b.statut);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [books, searchQuery, statusFilter, sortBy, sortDirection]);

  // Classes CSS pour la grille
  const getGridClasses = () => {
    const baseClass="grid";
    
    let columnsClass="";
    if (columns === "auto") {
      columnsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
    } else {
      const colsMap = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6",
      };
      columnsClass = colsMap[columns];
    }
    
    const gapClass = {
      sm: "gap-3",
      md: "gap-4",
      lg: 'gap-6'
    }[gap];

    return `${baseClass} ${columnsClass} ${gapClass}`;
  };

  // Gestion de la pagination côté client si pas de pagination serveur
  const paginatedBooks = useMemo(() => {
    if (showPagination && !onPageChange) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return processedBooks.slice(startIndex, startIndex + itemsPerPage);
    }
    return processedBooks;
  }, [processedBooks, currentPage, itemsPerPage, showPagination, onPageChange]);

  const totalPagesCalculated = Math.ceil(processedBooks.length / itemsPerPage);

  // État de chargement
  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            <div className="h-9 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        {/* Grid skeleton */}
        <div className={getGridClasses()}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec filtres et contrôles */}
      <div className="flex flex-col gap-4">
        {/* Ligne principale */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {processedBooks.length} livre{processedBooks.length !== 1 ? 's' : ''}
              {searchQuery && ` • ${searchQuery}`}
            </h2>

            {statusFilter !== "ALL" && (
              <BookStatus status={statusFilter} size="sm" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showViewToggle && (
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {showSort && (
              <select
                value={'${sortBy}-${sortDirection}'}
                onChange={(e) => {
                  const [sort, direction] = e.target.value.split('-') as [SortOption, SortDirection];
                  setSortBy(sort);
                  setSortDirection(direction);
                }}
                className="px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="date-desc">Plus récent</option>
                <option value="date-asc">Plus ancien</option>
                <option value="title-asc">Titre A-Z</option>
                <option value="title-desc">Titre Z-A</option>
                <option value="author-asc">Auteur A-Z</option>
                <option value="author-desc">Auteur Z-A</option>
                <option value="rating-desc">Mieux noté</option>
                <option value="rating-asc">Moins bien noté</option>
              </select>
            )}
          </div>
        </div>
        
        {/* Ligne des filtres */}
        {(showSearch || showFilters) && (
          <div className="flex items-center gap-4 flex-wrap">
            {showSearch && (
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre, auteur ou description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Statut:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BookStatusType | "ALL")}
                  className="px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="ALL">Tous</option>
                  <option value="A_LIRE">À lire</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="LU">Lu</option>
                  <option value="ABANDONNE">Abandonné</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      {paginatedBooks.length === 0 ? (
        <div className="text-center py-12">
          {emptyState || (
            <div className="space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-medium mb-2">Aucun livre trouvé</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "ALL"
                    ? "Essayez de modifier vos critères de recherche."
                    : "Commencez par ajouter quelques livres à votre bibliothèque."}
                </p>
              </div>
              {(searchQuery || statusFilter !== "ALL") && (
                <div className="flex justify-center gap-2">
                  {searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      Effacer la recherche
                    </Button>
                  )}
                  {statusFilter !== "ALL" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusFilter("ALL")}
                    >
                      Afficher tous les statuts
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === "grid" ? getGridClasses() : "space-y-2"
        )}>
          {paginatedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              variant={viewMode === "list" ? "compact" : variant}
              showActions
              showRatings={variant !== "compact"}
              showCategories={variant !== "compact"}
              showTags={variant === "detailed"}
              showDescription={variant === "detailed"}
              onView={onBookView}
              onEdit={onBookEdit}
              onDelete={onBookDelete}
              onFavoriteToggle={onBookFavorite ? (bookId: string) => {
                const book = books.find(b => b.id === bookId);
                if (book) onBookFavorite(book);
              } : undefined}
              onStatusChange={onBookStatusChange}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {showPagination && (totalPages > 1 || totalPagesCalculated > 1) && (
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1) || (currentPage > 1 && setSearchQuery(""))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages || totalPagesCalculated) }).map((_, i) => {
                const pageNumber = i + 1;
                const isActive = pageNumber === currentPage;
                
                return (
                  <Button
                    key={pageNumber}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= (totalPages || totalPagesCalculated)}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages || totalPagesCalculated}
          </div>
        </div>
      )}
    </div>
  );
}

// Version simplifiée pour affichage rapide
interface SimpleBookGridProps {
  books: BookData[];
  columns?: number;
  onBookClick?: (book: BookData) => void;
  className?: string;
}

export function SimpleBookGrid({ 
  books, 
  columns = 4, 
  onBookClick, 
  className 
}: SimpleBookGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 4 && "grid-cols-2 md:grid-cols-4",
      columns === 5 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
      columns === 6 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
      className
    )}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          variant="minimal"
          onView={onBookClick}
        />
      ))}
    </div>
  );
}