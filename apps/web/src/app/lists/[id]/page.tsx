'use client';

import React, { useEffect, useState, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  BookOpen,
  User,
  Calendar,
  Star,
  Flame,
  Skull,
  Heart,
  Eye,
  ExternalLink,
  Share2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
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
}

interface ListData {
  list: CustomList;
  books: Book[];
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

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [listData, setListData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    fetchListData();
  }, [resolvedParams.id]);

  const fetchListData = async () => {
    try {
      setLoading(true);

      // Récupérer les détails de la liste
      const listResponse = await apiClient.get(`/api/lists/${resolvedParams.id}?include_books=false`);
      const listResult = await listResponse.json();

      if (!listResult.success) {
        throw new Error(listResult.error || 'Liste non trouvée');
      }

      // Vérifier que la liste est publique
      if (!listResult.data.est_publique) {
        throw new Error('Cette liste n\'est pas publique`);
      }

      // Récupérer les livres de la liste
      const booksResponse = await apiClient.get(`/api/lists/${resolvedParams.id}/books`);
      const booksResult = await booksResponse.json();

      if (!booksResult.success) {
        throw new Error(`Erreur lors du chargement des livres`);
      }

      setListData({
        list: listResult.data,
        books: booksResult.data.books || []
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : `Erreur inconnue`);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating}/10)</span>
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

  const handleShare = async () => {
    if (navigator.share && listData) {
      try {
        await navigator.share({
          title: listData.list.nom,
          text: listData.list.description || `Découvrez la liste `${listData.list.nom}` de ${listData.list.user.nom_complet}`,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback pour les navigateurs qui ne supportent pas l`API Share
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: `Lien copié",
          description: "Le lien de la liste a été copié dans le presse-papiers",
        });
      }
    } else {
      // Fallback : copier le lien
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien de la liste a été copié dans le presse-papiers",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <Skeleton className="h-24 w-16" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-2/3" />
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
        </div>
      </div>
    );
  }

  if (error || !listData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <p className="text-destructive">Erreur: {error}</p>
              <Button onClick={() => router.push("/lists")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux listes
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { list, books } = listData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4">
        {/* Header de navigation */}
        <div className="flex items-center mb-6 space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/lists")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Toutes les listes
          </Button>
        </div>

        {/* En-tête de la liste */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Titre et couleur */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-border flex-shrink-0"
                    style={{ backgroundColor: list.couleur }}
                  />
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {list.nom}
                    </h1>
                    {list.description && (
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {list.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex-shrink-0"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>

              {/* Métadonnées */}
              <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Par {list.user.nom_complet}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{list._count.list_books} livre{list._count.list_books !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Créée le {new Date(list.date_creation).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des livres */}
        {books.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Liste vide</h3>
                  <p className="text-muted-foreground">
                    Cette liste ne contient pas encore de livres.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {books.length} livre{books.length > 1 ? 's' : ''} dans cette liste
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {books.map((book, index) => (
                <Card key={book.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      {/* Numéro d'ordre */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {index + 1}
                      </div>

                      {/* Image de couverture */}
                      <div className="flex-shrink-0">
                        {book.image_couverture ? (
                          <img
                            src={book.image_couverture}
                            alt={'Couverture de ${book.titre}`}
                            className="w-16 h-20 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-muted rounded border flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Informations du livre */}
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                            {book.titre}
                          </h3>
                          <p className="text-muted-foreground flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {book.auteur}
                          </p>
                        </div>

                        {/* Résumé personnel */}
                        {book.resume_personnel && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {book.resume_personnel}
                          </p>
                        )}

                        {/* Badges */}
                        <div className="flex items-center flex-wrap gap-2">
                          <Badge className={cn("text-xs", STATUS_COLORS[book.statut])}>
                            {STATUS_LABELS[book.statut]}
                          </Badge>

                          {book.date_lecture && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(book.date_lecture).toLocaleDateString("fr-FR")}
                            </Badge>
                          )}
                        </div>

                        {/* Niveaux et notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Note</p>
                            {renderRatingStars(book.note_generale)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Spicy</p>
                            {renderSpicyLevel(book.niveau_spicy)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Dark</p>
                            {renderDarkLevel(book.niveau_dark)}
                          </div>
                        </div>

                        {/* Bouton d'action */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors`
                          onClick={() => router.push(`/books/${book.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to action */}
        <div className="mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-8 text-center">
              <div className="space-y-4">
                <Heart className="h-12 w-12 mx-auto text-primary" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Vous aimez cette sélection ?</h3>
                  <p className="text-muted-foreground">
                    Découvrez toutes mes autres listes et explorez ma bibliothèque complète.
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push("/lists")}>
                    Voir toutes les listes
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/books")}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tous les livres
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}