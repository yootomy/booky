"use client";

import { useState } from "react";
import { 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  User,
  Hash,
  BookOpen,
  Heart,
  Flame,
  Skull,
  ArrowUpDown,
  ChevronDown,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookCover } from "./book-cover";
import { BookStatus, type BookStatusType } from "./book-status";
import { StarRating, SpicyRating, DarkRating, RomanceRating } from "@/components/ratings";
import type { BookData } from "./book-card";
import { cn } from "@/lib/utils";

// Types pour les colonnes et le tri
export type BookListColumn = 
  | "select"
  | "cover" 
  | "title"
  | "author"
  | "status"
  | "rating"
  | "specialRatings"
  | "categories"
  | "pages"
  | "dateAdded"
  | "dateRead"
  | "actions";

export interface BookListProps {
  books: BookData[];
  columns?: BookListColumn[];
  selectable?: boolean;
  selectedBooks?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  sortable?: boolean;
  defaultSort?: { column: string; direction: "asc" | "desc" };
  onBookView?: (book: BookData) => void;
  onBookEdit?: (book: BookData) => void;
  onBookDelete?: (book: BookData) => void;
  onBookStatusChange?: (book: BookData, status: BookStatusType) => void;
  onBulkAction?: (action: string, bookIds: string[]) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

// Configuration des colonnes par défaut
const DEFAULT_COLUMNS: BookListColumn[] = [
  "cover",
  "title", 
  "author",
  "status",
  "rating",
  "categories",
  "dateAdded",
  "actions"
];

// Configuration des colonnes avec metadata
const COLUMN_CONFIG: Record<BookListColumn, {
  label: string;
  sortKey?: string;
  width?: string;
  align?: "left" | "center" | "right";
  hiddenOnMobile?: boolean;
}> = {
  select: { label: "", width: "w-12", align: "center" },
  cover: { label: "Couverture", width: "w-16", align: "center" },
  title: { label: "Titre", sortKey: "titre", width: "w-64" },
  author: { label: "Auteur", sortKey: "auteur", width: "w-48", hiddenOnMobile: true },
  status: { label: "Statut", sortKey: "statut", width: "w-32", align: "center" },
  rating: { label: "Note", sortKey: "note_generale", width: "w-24", align: "center", hiddenOnMobile: true },
  specialRatings: { label: "Niveaux", width: "w-32", align: "center", hiddenOnMobile: true },
  categories: { label: "Catégories", width: "w-48", hiddenOnMobile: true },
  pages: { label: "Pages", sortKey: "nombre_pages", width: "w-20", align: "right", hiddenOnMobile: true },
  dateAdded: { label: "Ajouté", sortKey: "date_creation", width: "w-28", align: "center", hiddenOnMobile: true },
  dateRead: { label: "Lu le", sortKey: "date_lecture", width: "w-28", align: "center", hiddenOnMobile: true },
  actions: { label: "", width: "w-12", align: "center" }
};

export function BookList({
  books,
  columns = DEFAULT_COLUMNS,
  selectable = false,
  selectedBooks = [],
  onSelectionChange,
  sortable = true,
  defaultSort = { column: "date_creation", direction: "desc" },
  onBookView,
  onBookEdit,
  onBookDelete,
  onBookStatusChange,
  onBulkAction,
  loading = false,
  emptyState,
  className,
  compact = false
}: BookListProps) {
  const [sortConfig, setSortConfig] = useState(defaultSort);

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(books.map(book => book.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectBook = (bookId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedBooks, bookId]);
    } else {
      onSelectionChange?.(selectedBooks.filter(id => id !== bookId));
    }
  };

  // Gestion du tri
  const handleSort = (column: string) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Tri des livres
  const sortedBooks = [...books].sort((a, b) => {
    if (!sortable) return 0;
    
    const { column, direction } = sortConfig;
    let comparison = 0;
    
    switch (column) {
      case "titre":
        comparison = a.titre.localeCompare(b.titre);
        break;
      case "auteur":
        comparison = a.auteur.localeCompare(b.auteur);
        break;
      case "statut":
        comparison = a.statut.localeCompare(b.statut);
        break;
      case "note_generale":
        comparison = (a.note_generale || 0) - (b.note_generale || 0);
        break;
      case "nombre_pages":
        comparison = (a.nombre_pages || 0) - (b.nombre_pages || 0);
        break;
      case "date_creation":
        comparison = a.date_creation.getTime() - b.date_creation.getTime();
        break;
      case "date_lecture":
        const dateA = a.date_lecture?.getTime() || 0;
        const dateB = b.date_lecture?.getTime() || 0;
        comparison = dateA - dateB;
        break;
      default:
        return 0;
    }
    
    return direction === "asc" ? comparison : -comparison;
  });

  // Actions en lot
  const bulkActions = [
    { label: "Marquer comme lu", value: "mark_read" },
    { label: "Marquer comme à lire", value: "mark_to_read" },
    { label: "Supprimer", value: "delete", danger: true },
  ];

  if (loading) {
    return (
      <div className={cn("border rounded-lg", className)}>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-6 w-20 bg-muted rounded" />
                <div className="h-6 w-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderCell = (book: BookData, column: BookListColumn) => {
    switch (column) {
      case "select":
        return (
          <Checkbox
            checked={selectedBooks.includes(book.id)}
            onCheckedChange={(checked) => handleSelectBook(book.id, checked as boolean)}
          />
        );

      case 'cover':
        return (
          <BookCover
            src={book.image_couverture}
            alt={'Couverture de ${book.titre}'}
            title={book.titre}
            author={book.auteur}
            size="xs"
            onClick={() => onBookView?.(book)}
            className="mx-auto"
          />
        );

      case "title":
        return (
          <div className="min-w-0">
            <div 
              className="font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => onBookView?.(book)}
            >
              {book.titre}
            </div>
            {!compact && book.resume_personnel && (
              <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                {book.resume_personnel.substring(0, 80)}...
              </div>
            )}
          </div>
        );

      case "author":
        return (
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate">{book.auteur}</span>
          </div>
        );

      case "status":
        return (
          <BookStatus
            status={book.statut}
            size="xs"
            variant="minimal"
            onClick={onBookStatusChange ? () => {
              // Logique pour changer le statut (popup/dropdown)
            } : undefined}
          />
        );

      case "rating":
        return book.note_generale ? (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-sm">{book.note_generale}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );

      case "specialRatings":
        return (
          <div className="flex items-center gap-1">
            {book.niveau_spicy && book.niveau_spicy > 0 && (
              <div className="flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-xs">{book.niveau_spicy}</span>
              </div>
            )}
            {book.niveau_dark && book.niveau_dark > 0 && (
              <div className="flex items-center gap-0.5">
                <Skull className="w-3 h-3 text-gray-700" />
                <span className="text-xs">{book.niveau_dark}</span>
              </div>
            )}
            {book.niveau_romance && book.niveau_romance > 0 && (
              <div className="flex items-center gap-0.5">
                <Heart className="w-3 h-3 text-pink-500" />
                <span className="text-xs">{book.niveau_romance}</span>
              </div>
            )}
          </div>
        );

      case "categories":
        return (
          <div className="flex flex-wrap gap-1">
            {book.categories?.slice(0, 2).map((cat) => (
              <Badge
                key={cat.category.id}
                variant="secondary"
                className="text-xs px-1.5 py-0.5"
                style={{
                  backgroundColor: `${cat.category.couleur}20`,
                  color: cat.category.couleur
                }}
              >
                {cat.category.nom}
              </Badge>
            ))}
            {(book.categories?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{(book.categories?.length || 0) - 2}
              </Badge>
            )}
          </div>
        );

      case "pages":
        return book.nombre_pages ? (
          <div className="flex items-center gap-1 text-sm">
            <Hash className="w-3 h-3" />
            {book.nombre_pages}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );

      case "dateAdded":
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {book.date_creation.toLocaleDateString("fr-FR")}
          </div>
        );

      case "dateRead":
        return book.date_lecture ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="w-3 h-3" />
            {book.date_lecture.toLocaleDateString("fr-FR")}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );

      case "actions":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onBookView && (
                <DropdownMenuItem onClick={() => onBookView(book)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir détails
                </DropdownMenuItem>
              )}
              {onBookEdit && (
                <DropdownMenuItem onClick={() => onBookEdit(book)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onBookDelete && (
                <DropdownMenuItem 
                  onClick={() => onBookDelete(book)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );

      default:
        return null;
    }
  };

  // Tous les columns sont visibles - la responsivité est gérée via CSS
  const visibleColumns = columns;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Actions en lot */}
      {selectable && selectedBooks.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedBooks.length} livre{selectedBooks.length > 1 ? "s" : ""} sélectionné{selectedBooks.length > 1 ? "s" : ""}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.value}
                variant={action.danger ? "destructive" : "outline"}
                size="sm"
                onClick={() => onBulkAction?.(action.value, selectedBooks)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedBooks.length === books.length && books.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              
              {visibleColumns.map((column) => {
                const config = COLUMN_CONFIG[column];
                const canSort = sortable && config.sortKey;
                const isActive = sortConfig.column === config.sortKey;
                
                return (
                  <TableHead
                    key={column}
                    className={cn(
                      config.width,
                      config.align === "center" && "text-center",
                      config.align === "right" && "text-right",
                      config.hiddenOnMobile && "hidden md:table-cell",
                      canSort && "cursor-pointer hover:bg-muted/50 transition-colors"
                    )}
                    onClick={canSort ? () => handleSort(config.sortKey!) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {config.label}
                      {canSort && (
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {sortedBooks.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="text-center py-8"
                >
                  {emptyState || (
                    <div className="space-y-4">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
                      <div>
                        <h3 className="font-medium mb-1">Aucun livre trouvé</h3>
                        <p className="text-sm text-muted-foreground">
                          Votre bibliothèque est vide pour le moment.
                        </p>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              sortedBooks.map((book) => (
                <TableRow key={book.id} className="hover:bg-muted/50">
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedBooks.includes(book.id)}
                        onCheckedChange={(checked) => handleSelectBook(book.id, checked as boolean)}
                      />
                    </TableCell>
                  )}
                  
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column}
                      className={cn(
                        COLUMN_CONFIG[column].align === "center" && "text-center",
                        COLUMN_CONFIG[column].align === "right" && "text-right",
                        COLUMN_CONFIG[column].hiddenOnMobile && "hidden md:table-cell",
                        compact ? "py-2" : "py-3"
                      )}
                    >
                      {renderCell(book, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}