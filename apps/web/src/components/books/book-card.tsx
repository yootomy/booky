"use client";

import { useState } from "react";
import { 
  Star, 
  Heart, 
  MoreVertical, 
  Edit, 
  Trash2, 
  BookOpen,
  Calendar,
  User,
  Hash,
  Flame,
  Skull,
  Eye,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookCover } from "./book-cover";
import { BookStatus, BookStatusDisplay, type BookStatusType } from "./book-status";
import { StarRating, SpicyRating, DarkRating, RomanceRating } from "@/components/ratings";
import { AnimatedElement, useHoverAnimation } from "@/components/ui/animations";
import { cn } from "@/lib/utils";

// Types pour les données de livre
export interface BookData {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string | null;
  statut: BookStatusType;
  note_generale?: number;
  niveau_spicy?: number;
  niveau_dark?: number;
  niveau_romance?: number;
  resume_personnel?: string | null;
  resume_officiel?: string | null;
  date_creation: Date;
  date_lecture?: Date | null;
  nombre_pages?: number;
  categories?: Array<{
    category: {
      id: string;
      nom: string;
      couleur: string;
    };
  }>;
  tags?: Array<{
    tag: {
      id: string;
      nom: string;
      couleur: string;
      type: string;
    };
  }>;
  // Stats pour "En cours"
  current_page?: number;
  is_favorite?: boolean;
}

interface BookCardProps {
  book: BookData;
  variant?: "default" | "compact" | "detailed" | "minimal";
  size?: "sm" | "md" | "lg";
  showActions?: boolean;
  showRatings?: boolean;
  showCategories?: boolean;
  showTags?: boolean;
  showDescription?: boolean;
  maxDescriptionLength?: number;
  onView?: (book: BookData) => void;
  onEdit?: (book: BookData) => void;
  onDelete?: (book: BookData) => void;
  onFavoriteToggle?: (bookId: string) => void; // Modifié pour passer seulement l'ID
  onStatusChange?: (book: BookData, status: BookStatusType) => void;
  className?: string;
  priority?: boolean;
  isFavorite?: boolean; // Nouvel prop pour l'état externe des favoris
}

export function BookCard({
  book,
  variant="default",
  size="md",
  showActions = true,
  showRatings = true,
  showCategories = true,
  showTags = false,
  showDescription = true,
  maxDescriptionLength = 100,
  onView,
  onEdit,
  onDelete,
  onFavoriteToggle,
  onStatusChange,
  className,
  priority = false,
  isFavorite = false // Nouvelle prop avec valeur par défaut
}: BookCardProps) {
  const [isHovered, hoverProps] = useHoverAnimation();

  // Tronquer la description
  const getDescription = () => {
    const desc = book.resume_personnel || book.resume_officiel;
    if (!desc || !showDescription) return null;
    
    if (desc.length <= maxDescriptionLength) return desc;
    return desc.substring(0, maxDescriptionLength) + "...";
  };

  // Dimensions selon la variante
  const coverSize = variant === "compact" ? "sm" : 
                   variant === "detailed" ? "lg" : "md";

  const cardClasses = cn(
    "group transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
    "hover:scale-105 transform-gpu",
    variant === "minimal" && "border-0 shadow-none hover:shadow-md hover:scale-100 hover:translate-y-0",
    className
  );

  if (variant === "minimal") {
    return (
      <AnimatedElement
        animation="fadeInUp"
        trigger="onScroll"
        className={cardClasses}
        {...hoverProps}
      >
        <div className="flex gap-3">
          <BookCover
            src={book.image_couverture}
            alt={'Couverture de ${book.titre}'}
            title={book.titre}
            author={book.auteur}
            size="xs"
            onClick={() => onView?.(book)}
            priority={priority}
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1 mb-1">
              {book.titre}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {book.auteur}
            </p>
            
            <div className="flex items-center gap-2">
              <BookStatus status={book.statut} size="xs" />
              {book.note_generale && book.note_generale > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs">{book.note_generale}/10</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedElement>
    );
  }

  if (variant === "compact") {
    return (
      <AnimatedElement
        animation="fadeInUp"
        trigger="onScroll"
        className="w-full"
      >
        <Card
          className={cardClasses}
          {...hoverProps}
        >
        <CardContent className="p-3">
          <div className="flex gap-3">
            <BookCover
              src={book.image_couverture}
              alt={`Couverture de ${book.titre}`}
              title={book.titre}
              author={book.auteur}
              size="sm"
              onClick={() => onView?.(book)}
              priority={priority}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                    {book.titre}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.auteur}
                  </p>
                </div>
                
                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(book)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(book)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(book)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <BookStatus status={book.statut} size="xs" className="mb-2" />
              
              {showRatings && book.note_generale && book.note_generale > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating 
                    value={book.note_generale} 
                    size="sm" 
                    readonly 
                  />
                  <span className="text-xs text-muted-foreground">
                    {book.note_generale}/10
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </AnimatedElement>
    );
  }

  // Variant par défaut et détaillé
  return (
    <AnimatedElement
      animation="fadeInUp"
      trigger="onScroll"
      className="w-full"
    >
      <Card
        className={cardClasses}
        {...hoverProps}
      >
      <CardContent className="p-0">
        {/* Image et actions */}
        <div className="relative">
          <div className="flex justify-center p-4 pb-2">
            <BookCover
              src={book.image_couverture}
              alt={`Couverture de ${book.titre}`}
              title={book.titre}
              author={book.auteur}
              size={coverSize}
              onClick={() => onView?.(book)}
              priority={priority}
              placeholderVariant="gradient"
            />
          </div>
          
          {/* Actions en overlay */}
          <div className={cn(
            "absolute top-2 right-2 transition-all duration-200",
            "opacity-0 translate-y-2",
            isHovered && "opacity-100 translate-y-0"
          )}>
            <div className="flex gap-1">
              {onFavoriteToggle && (
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 bg-white/90 hover:bg-white",
                    isFavorite && "text-red-500"
                  )}
                  onClick={() => onFavoriteToggle(book.id)}
                  title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart 
                    className={cn(
                      "h-4 w-4",
                      isFavorite && "fill-current"
                    )} 
                  />
                </Button>
              )}
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(book)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(book)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(book)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-4 pt-2">
          {/* Titre et auteur */}
          <div className="mb-3">
            <h3 className="font-semibold text-base line-clamp-2 mb-1">
              {book.titre}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              {book.auteur}
            </p>
          </div>

          {/* Statut */}
          <div className="mb-3">
            <BookStatusDisplay
              status={book.statut}
              currentPage={book.current_page}
              totalPages={book.nombre_pages}
              dateStarted={book.date_creation}
              dateFinished={book.date_lecture || undefined}
              rating={book.note_generale}
              onStatusChange={onStatusChange ? (status) => onStatusChange(book, status) : undefined}
              variant={variant === "detailed" ? "full" : "compact"}
            />
          </div>

          {/* Ratings spéciaux */}
          {showRatings && variant === "detailed" && (
            <div className="mb-3 space-y-2">
              {book.note_generale && book.note_generale > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Note générale:</span>
                  <StarRating value={book.note_generale} size="sm" readonly />
                </div>
              )}
              
              {book.niveau_spicy && book.niveau_spicy > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Spicy:
                  </span>
                  <SpicyRating value={book.niveau_spicy} size="sm" readonly />
                </div>
              )}
              
              {book.niveau_dark && book.niveau_dark > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Skull className="w-3 h-3" /> Dark:
                  </span>
                  <DarkRating value={book.niveau_dark} size="sm" readonly />
                </div>
              )}
              
              {book.niveau_romance && book.niveau_romance > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Romance:
                  </span>
                  <RomanceRating value={book.niveau_romance} size="sm" readonly />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {showDescription && getDescription() && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground line-clamp-3">
                {getDescription()}
              </p>
            </div>
          )}

          {/* Catégories */}
          {showCategories && book.categories && book.categories.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {book.categories.slice(0, 3).map((cat) => (
                  <Badge
                    key={cat.category.id}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                    style={{
                      backgroundColor: `${cat.category.couleur}20`,
                      color: cat.category.couleur,
                      borderColor: cat.category.couleur
                    }}
                  >
                    {cat.category.nom}
                  </Badge>
                ))}
                {book.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{book.categories.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {showTags && book.tags && book.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {book.tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag.tag.id}
                    variant="outline"
                    className="text-xs px-1.5 py-0.5"
                    style={{
                      borderColor: tag.tag.couleur,
                      color: tag.tag.couleur
                    }}
                  >
                    {tag.tag.nom}
                  </Badge>
                ))}
                {book.tags.length > 4 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{book.tags.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Métadonnées */}
          {variant === "detailed" && (
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
              <div className="flex items-center gap-3">
                {book.nombre_pages && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {book.nombre_pages}p
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {book.date_creation.toLocaleDateString("fr-FR")}
                </span>
              </div>
              
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onView(book)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Voir plus
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </AnimatedElement>
  );
}