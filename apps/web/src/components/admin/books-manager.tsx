'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/utils/orpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  BookOpen, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Star,
  Heart,
  Zap,
  Skull,
  Calendar,
  User,
  Tag as TagIcon,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Book } from '@/types/book';

interface BooksManagerProps {
  searchQuery: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'lu': return 'bg-green-100 text-green-800 border-green-200';
    case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'a_lire': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'abandonne': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'lu': return 'Lu';
    case 'en_cours': return 'En cours';
    case 'a_lire': return 'À lire';
    case 'abandonne': return 'Abandonné';
    default: return status;
  }
};

const RatingDisplay = ({ book }: { book: Book }) => {
  return (
    <div className="flex items-center space-x-3 text-sm">
      {book.note_generale && (
        <div className="flex items-center space-x-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{book.note_generale}/10</span>
        </div>
      )}
      {book.niveau_romance && (
        <div className="flex items-center space-x-1">
          <Heart className="h-3 w-3 fill-pink-400 text-pink-400" />
          <span>{book.niveau_romance}/10</span>
        </div>
      )}
      {book.niveau_spicy && (
        <div className="flex items-center space-x-1">
          <Zap className="h-3 w-3 fill-orange-400 text-orange-400" />
          <span>{book.niveau_spicy}/10</span>
        </div>
      )}
      {book.niveau_dark && (
        <div className="flex items-center space-x-1">
          <Skull className="h-3 w-3 fill-gray-600 text-gray-600" />
          <span>{book.niveau_dark}/10</span>
        </div>
      )}
    </div>
  );
};

export function BooksManager({ searchQuery }: BooksManagerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

  const {
    data: booksResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-books', 'all'], // Clé plus spécifique
    queryFn: async () => {
      const response = await booksApi.getAll({
        page: 1,
        limit: 100
      });
      return response;
    },
    refetchInterval: 10000, // Refetch toutes les 10 secondes (plus fréquent)
    refetchOnWindowFocus: true, // Refetch quand on revient sur l'onglet
    refetchOnMount: true, // Refetch au montage du composant
    staleTime: 0, // AUCUN cache - données toujours obsolètes
    gcTime: 0, // Pas de cache du tout (remplace cacheTime)
    refetchIntervalInBackground: true // Continue le refetch même en arrière-plan
  });

  const books = booksResponse?.data || [];

  const filteredBooks = useMemo(() => {
    if (!books || !searchQuery) return books || [];
    
    const query = searchQuery.toLowerCase();
    return books.filter(book => 
      book.titre.toLowerCase().includes(query) ||
      book.auteur.toLowerCase().includes(query) ||
      book.isbn?.toLowerCase().includes(query) ||
      book.editeur?.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  const handleEdit = async (bookId: string) => {
    try {
      // Préfetcher les données du livre avant de naviguer
      await queryClient.prefetchQuery({
        queryKey: ['book', bookId],
        queryFn: () => booksApi.getById(bookId),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
      
      // Naviguer vers la page d'édition
      router.push(`/admin/books/${bookId}/edit`);
    } catch (error) {
      console.error('Erreur lors du préfetch:', error);
      // Naviguer quand même, la page d'édition gèrera l'erreur
      router.push(`/admin/books/${bookId}/edit`);
    }
  };

  const handleView = (bookId: string) => {
    router.push(`/books/${bookId}`);
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) return;

    try {
      // 1. Supprimer immédiatement le livre du cache local (mise à jour optimiste)
      queryClient.setQueryData(['admin-books', 'all'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((book: any) => book.id !== bookId)
        };
      });

      // 2. Faire l'appel API APRÈS la mise à jour optimiste
      await booksApi.delete(bookId);

      // 3. Nettoyer les caches liés (sans refetch immédiat)
      queryClient.removeQueries({ queryKey: ['book', bookId] });

      // 4. Invalider doucement les autres caches (ils se mettront à jour naturellement)
      queryClient.invalidateQueries({ queryKey: ['books'], exact: false });

      toast({
        title: "Livre supprimé",
        description: "Le livre a été supprimé avec succès",
      });
    } catch (error) {
      // En cas d'erreur, restaurer le livre dans le cache
      await refetch();

      toast({
        title: "Erreur",
        description: "Impossible de supprimer le livre",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="h-20 w-16 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Erreur lors du chargement des livres</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {books?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total livres</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {books?.filter(book => book.statut === 'LU').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Lus</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {books?.filter(book => book.statut === 'EN_COURS').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">En cours</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {books?.filter(book => book.statut === 'A_LIRE').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">À lire</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books List */}
      <div className="space-y-3">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                {/* Book Cover */}
                <div className="flex-shrink-0">
                  <Avatar className="h-20 w-16 rounded-lg">
                    <AvatarImage 
                      src={book.image_couverture || ''} 
                      alt={`Couverture de ${book.titre}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg bg-muted">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg leading-tight mb-1">
                        {book.titre}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <User className="h-3 w-3" />
                        <span>{book.auteur}</span>
                        {book.date_publication && (
                          <>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(book.date_publication).getFullYear()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(book.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(book.id)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/books/${book.id}`, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ouvrir dans un nouvel onglet
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(book.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status & Ratings */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(book.statut)} variant="outline">
                        {getStatusLabel(book.statut)}
                      </Badge>
                      {book.date_lecture && (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(book.date_lecture), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                    <RatingDisplay book={book} />
                  </div>

                  {/* Tags */}
                  {(book.tags && book.tags.length > 0) && (
                    <div className="flex items-center space-x-2 mt-2">
                      <TagIcon className="h-3 w-3 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {book.tags.slice(0, 3).map((bookTag) => (
                          <Badge 
                            key={bookTag.tag.id} 
                            variant="secondary" 
                            className="text-xs"
                          >
                            {bookTag.tag.nom}
                          </Badge>
                        ))}
                        {book.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{book.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredBooks.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun livre trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `Aucun livre ne correspond à votre recherche "${searchQuery}"`
                  : "Commencez par ajouter votre premier livre"
                }
              </p>
              <Button onClick={() => router.push('/admin/books/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un livre
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground text-center">
          {filteredBooks.length} livre{filteredBooks.length > 1 ? 's' : ''} trouvé{filteredBooks.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}