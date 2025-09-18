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
  List,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  BookOpen,
  Plus,
  Users,
  Globe,
  Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
}

interface CustomList {
  id: string;
  nom: string;
  description?: string;
  couleur: string;
  icone?: string;
  ordre_affichage: number;
  est_publique: boolean;
  date_creation: string;
  date_modification: string;
  user: {
    id: string;
    nom_complet: string;
    avatar?: string;
  };
  _count: {
    list_books: number;
  };
  list_books?: {
    ordre: number;
    book: Book;
  }[];
}

interface ListsManagerProps {
  searchQuery: string;
}

export function ListsManager({ searchQuery }: ListsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<CustomList | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLists();
  }, [searchQuery]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('include_books', 'true');
      params.append('limit', '50');

      const response = await fetch(`/api/proxy/lists?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLists(data.data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les listes",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des listes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!listToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/proxy/lists/${listToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Succès",
          description: "Liste supprimée avec succès",
        });
        setLists(prev => prev.filter(list => list.id !== listToDelete.id));
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
      setDeleting(false);
      setDeleteDialogOpen(false);
      setListToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <List className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Aucune liste trouvée</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Aucune liste ne correspond à votre recherche."
                  : "Commencez par créer votre première liste personnalisée."}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={() => router.push('/admin/lists/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première liste
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lists.map((list, index) => (
          <div key={list.id} className="relative">
            <div
              className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 21, 56, 0.1)',
                boxShadow: '0 8px 32px rgba(139, 21, 56, 0.08)'
              }}
            >
              {/* Admin actions dropdown - moved to bottom right */}
              <div className="absolute bottom-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg bg-white/90 hover:bg-white shadow-md border border-black/5 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(`/books?collection=${list.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir la liste
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/lists/${list.id}/manage`)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Gérer les livres
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/lists/${list.id}/edit`)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setListToDelete(list);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Decorative background element */}
              <div
                className="absolute top-0 right-0 w-16 h-16 opacity-5"
                style={{
                  background: `radial-gradient(circle, ${list.couleur} 0%, transparent 70%)`,
                  transform: 'translate(50%, -50%)'
                }}
              />

              {/* Color bar */}
              <div
                className="absolute left-0 top-0 w-1 h-full"
                style={{ backgroundColor: list.couleur }}
              />

              <div className="relative pl-4">
                {/* Header */}
                <div className="relative mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className="text-xl font-bold"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        color: '#2C1810'
                      }}
                    >
                      {list.nom}
                    </h3>
                    <Badge variant={list.est_publique ? "default" : "secondary"} className="text-xs">
                      {list.est_publique ? (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Privé
                        </>
                      )}
                    </Badge>
                  </div>
                  {list.description && (
                    <p
                      className="text-sm opacity-75 leading-relaxed line-clamp-2"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#2C1810'
                      }}
                    >
                      {list.description}
                    </p>
                  )}
                </div>

                {/* Books Grid */}
                {list.list_books && list.list_books.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {list.list_books
                      .sort((a, b) => a.ordre - b.ordre)
                      .slice(0, 4)
                      .map(({ book, ordre }, bookIndex) => (
                        <div
                          key={book.id}
                          className="aspect-[3/4] relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/books/${book.id}`);
                          }}
                        >
                          {book.image_couverture ? (
                            <img
                              src={book.image_couverture}
                              alt={`Couverture de ${book.titre}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                background: 'linear-gradient(135deg, #6B4C7B, #8B1538)',
                              }}
                            >
                              <BookOpen className="w-4 h-4 text-white/70" />
                            </div>
                          )}

                          {/* Order badge */}
                          <div
                            className="absolute top-2 left-2 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: 'rgba(212, 175, 55, 0.9)',
                              color: '#2C1810'
                            }}
                          >
                            {ordre}
                          </div>

                          {/* Rating badge */}
                          {book.note_generale > 0 && (
                            <div
                              className="absolute top-2 right-2 px-1.5 py-0.5 text-xs font-bold rounded-full flex items-center gap-1"
                              style={{
                                backgroundColor: 'rgba(212, 175, 55, 0.9)',
                                color: '#2C1810'
                              }}
                            >
                              ★{book.note_generale}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="mb-6 p-6 rounded-lg text-center" style={{ backgroundColor: 'rgba(139, 21, 56, 0.05)' }}>
                    <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Cette liste ne contient aucun livre</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/lists/${list.id}/manage`);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter des livres
                    </Button>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4">
                  <span
                    className="text-sm font-medium opacity-60"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#2C1810'
                    }}
                  >
                    {list._count.list_books} livre{list._count.list_books > 1 ? 's' : ''}
                  </span>
                  <span
                    className="text-xs opacity-50"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#2C1810'
                    }}
                  >
                    {list.user.nom_complet}
                  </span>
                  <span className="text-xs opacity-40" style={{ color: '#2C1810' }}>
                    •
                  </span>
                  <span
                    className="text-xs opacity-50"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#2C1810'
                    }}
                  >
                    {new Date(list.date_creation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la liste</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la liste "{listToDelete?.nom}" ?
              Cette action est irréversible et supprimera également tous les livres associés à cette liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}