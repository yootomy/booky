'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Search,
  Plus,
  Star,
  User,
  Flame,
  Skull,
  Calendar,
  Loader2
} from 'lucide-react';
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
}

interface AddBooksToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  listName: string;
  onBookAdded: () => void;
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

export function AddBooksToListDialog({
  open,
  onOpenChange,
  listId,
  listName,
  onBookAdded
}: AddBooksToListDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (open) {
      setSelectedBooks(new Set());
      setPage(1);
      setBooks([]);
      fetchBooks(true);
    }
  }, [open, searchQuery]);

  const fetchBooks = async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('page', reset ? '1' : page.toString());
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get('/api/books?${params.toString()}');
      const data = await response.json();

      if (data.success) {
        const newBooks = data.data || [];
        if (reset) {
          setBooks(newBooks);
          setPage(1);
        } else {
          setBooks(prev => [...prev, ...newBooks]);
        }
        setHasMore(data.pagination?.hasNextPage || false);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les livres",
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

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchBooks(false);
    }
  };

  const toggleBookSelection = (bookId: string) => {
    setSelectedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const handleAddBooks = async () => {
    if (selectedBooks.size === 0) return;

    try {
      setAdding(true);
      const promises = Array.from(selectedBooks).map(bookId =>
        apiClient.get('/api/lists/${listId}/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookId }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: "Succès",
          description: `${successCount} livre${successCount > 1 ? 's ajoutés' :  ajouté`} à la liste,
        });
        onBookAdded();
      }

      if (errorCount > 0) {
        toast({
          title: "Attention",
          description: "Certains livres n'ont pas pu être ajoutés (déjà dans la liste ou erreur)",
          variant: "destructive"
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout des livres",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
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
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Ajouter des livres à "{listName}"</DialogTitle>
          <DialogDescription>
            Sélectionnez les livres que vous souhaitez ajouter à cette liste
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des livres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sélection actuelle */}
          {selectedBooks.size > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg">
              <Badge variant="secondary">
                {selectedBooks.size} livre{selectedBooks.size > 1 ? 's' : ''} sélectionné{selectedBooks.size > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooks(new Set())}
              >
                Tout désélectionner
              </Button>
            </div>
          )}

          {/* Liste des livres */}
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-3">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedBooks.has(book.id)
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => toggleBookSelection(book.id)}
                >
                  <Checkbox
                    checked={selectedBooks.has(book.id)}
                    onChange={() => toggleBookSelection(book.id)}
                    className="mt-1"
                  />

                  {/* Image de couverture */}
                  <div className="flex-shrink-0">
                    {book.image_couverture ? (
                      <img
                        src={book.image_couverture}
                        alt={'Couverture de ${book.titre}'}
                        className="w-12 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-muted rounded border flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Informations du livre */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="font-medium text-sm leading-tight truncate">
                        {book.titre}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {book.auteur}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center flex-wrap gap-1">
                      <Badge className={cn("text-xs", STATUS_COLORS[book.statut])}>
                        {STATUS_LABELS[book.statut]}
                      </Badge>

                      {book.date_lecture && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(book.date_lecture).toLocaleDateString('fr-FR')}
                        </Badge>
                      )}
                    </div>

                    {/* Niveaux */}
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        {renderRatingStars(book.note_generale)}
                        <span className="text-muted-foreground">({book.note_generale}/10)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Flame className="h-3 w-3 text-red-500" />
                        <span className="text-muted-foreground">{book.niveau_spicy}/10</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Skull className="h-3 w-3 text-gray-700" />
                        <span className="text-muted-foreground">{book.niveau_dark}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Skeleton de chargement */}
              {loading && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-16 w-12" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton charger plus */}
              {!loading && hasMore && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadMore}>
                    Charger plus de livres
                  </Button>
                </div>
              )}

              {/* Message si aucun livre */}
              {!loading && books.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Aucun livre trouvé pour cette recherche"
                      : "Aucun livre disponible"}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adding}>
            Annuler
          </Button>
          <Button
            onClick={handleAddBooks}
            disabled={selectedBooks.size === 0 || adding}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ajouter ({selectedBooks.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddBooksToListDialog;


