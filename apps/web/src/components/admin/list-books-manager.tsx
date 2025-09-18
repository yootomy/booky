'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  MoreHorizontal,
  Trash2,
  Eye,
  Star,
  Calendar,
  User,
  Flame,
  Skull,
  Heart,
  GripVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  statut: 'LU' | 'EN_COURS' | 'A_LIRE';
  date_lecture?: string;
  resume_personnel?: string;
  ordre: number;
  date_ajout: string;
}

interface ListBooksManagerProps {
  listId: string;
  searchQuery: string;
  refreshTrigger: number;
  onBookRemoved: () => void;
}

const STATUS_LABELS = {
  LU: 'Lu',
  EN_COURS: 'En cours',
  A_LIRE: 'À lire'
};

const STATUS_COLORS = {
  LU: 'bg-green-500/10 text-green-700 border-green-500/20',
  EN_COURS: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  A_LIRE: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
};

export function ListBooksManager({ listId, searchQuery, refreshTrigger, onBookRemoved }: ListBooksManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [bookToRemove, setBookToRemove] = useState<Book | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [listId, searchQuery, refreshTrigger]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '50');

      const response = await fetch(`/api/proxy/lists/${listId}/books?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBooks(data.data.books || []);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les livres de la liste",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des livres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBook = async () => {
    if (!bookToRemove) return;

    try {
      setRemoving(true);
      const response = await fetch(`/api/proxy/lists/${listId}/books/${bookToRemove.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "Livre retiré de la liste avec succès",
        });
        setBooks(prev => prev.filter(book => book.id !== bookToRemove.id));
        onBookRemoved();
      } else {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setRemoving(false);
      setRemoveDialogOpen(false);
      setBookToRemove(null);
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating}/10)</span>
      </div>
    );
  };

  const renderSpicyLevel = (level: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Flame
            key={i}
            className={cn(
              "h-3 w-3",
              i < Math.ceil(level / 2) ? "fill-red-500 text-red-500" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({level}/10)</span>
      </div>
    );
  };

  const renderDarkLevel = (level: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Skull
            key={i}
            className={cn(
              "h-3 w-3",
              i < Math.ceil(level / 2) ? "fill-gray-800 text-gray-800" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({level}/10)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <Skeleton className="h-20 w-16" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Aucun livre dans cette liste</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Aucun livre ne correspond à votre recherche dans cette liste."
                  : "Cette liste ne contient pas encore de livres. Ajoutez votre premier livre !"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {books.map((book, index) => (
          <Card key={book.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                {/* Poignée de glisser-déposer */}
                <div className="flex items-center">
                  <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-grab" />
                </div>

                {/* Image de couverture */}
                <div className="flex-shrink-0">
                  {book.image_couverture ? (
                    <img
                      src={book.image_couverture}
                      alt={`Couverture de ${book.titre}`}
                      className="w-16 h-20 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded border flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Informations du livre */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg leading-tight">{book.titre}</h3>
                      <p className="text-muted-foreground flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {book.auteur}
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/books/${book.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir le livre
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setBookToRemove(book);
                            setRemoveDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Retirer de la liste
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Résumé personnel (si disponible) */}
                  {book.resume_personnel && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {book.resume_personnel}
                    </p>
                  )}

                  {/* Badges et informations */}
                  <div className="flex items-center flex-wrap gap-2">
                    <Badge className={cn("text-xs", STATUS_COLORS[book.statut])}>
                      {STATUS_LABELS[book.statut]}
                    </Badge>

                    {book.date_lecture && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(book.date_lecture).toLocaleDateString('fr-FR')}
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground">
                      Ajouté le {new Date(book.date_ajout).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Niveaux et notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Note générale</p>
                      {renderRatingStars(book.note_generale)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Niveau Spicy</p>
                      {renderSpicyLevel(book.niveau_spicy)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Niveau Dark</p>
                      {renderDarkLevel(book.niveau_dark)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le livre de la liste</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer "{bookToRemove?.titre}" de cette liste ?
              Le livre ne sera pas supprimé de votre bibliothèque, seulement retiré de cette liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveBook}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Suppression..." : "Retirer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}