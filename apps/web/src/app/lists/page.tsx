'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  List,
  Search,
  BookOpen,
  User,
  Calendar,
  Eye,
  Heart,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Fonction pour highlight les termes de recherche
const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp('(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})', 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-primary/20 text-primary px-1 rounded font-medium">
        {part}
      </span>
    ) : part
  );
};

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  ordre: number;
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
  books?: Book[];
}

export default function ListsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [filteredLists, setFilteredLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLists();
  }, []);

  // Effet pour filtrer les listes localement
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLists(lists);
    } else {
      const filtered = lists.filter(list => {
        const searchTerm = searchQuery.toLowerCase();
        return (
          list.nom.toLowerCase().includes(searchTerm) ||
          list.description?.toLowerCase().includes(searchTerm) ||
          list.user.nom_complet.toLowerCase().includes(searchTerm) ||
          // Recherche dans les livres de la liste
          (list.books && list.books.some(book =>
            book.titre.toLowerCase().includes(searchTerm) ||
            book.auteur.toLowerCase().includes(searchTerm)
          ))
        );
      });
      setFilteredLists(filtered);
    }
  }, [searchQuery, lists]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('est_publique', 'true'); // Seulement les listes publiques
      params.append('limit', '50');
      params.append('sort', 'ordre_affichage');
      params.append('order', 'asc');

      const response = await apiClient.get('/api/lists?${params.toString()}');
      const data = await response.json();

      if (data.success) {
        // Pour chaque liste, récupérer un aperçu des livres (max 4)
        const listsWithBooks = await Promise.all(
          data.data.map(async (list: CustomList) => {
            try {
              const booksResponse = await apiClient.get('/api/lists/${list.id}/books?limit=4');
              const booksData = await booksResponse.json();

              return {
                ...list,
                books: booksData.success ? booksData.data.books.slice(0, 4) : []
              };
            } catch (error) {
              return { ...list, books: [] };
            }
          })
        );

        setLists(listsWithBooks);
        setFilteredLists(listsWithBooks);
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

  if (loading) {
    return (
      <div className="w-full bg-background" style={{
        minHeight: '100vh',
        height: '100%'
      }}>
        <div className="container mx-auto py-12 px-4 sm:px-8 lg:px-20 min-h-screen">
          {/* Header Hero Placeholder */}
          <div className="text-center mb-12 space-y-6">
            <div className="space-y-4">
              <div className="h-16 w-96 bg-muted rounded mx-auto animate-pulse"></div>
              <div className="h-6 w-2/3 bg-muted rounded mx-auto animate-pulse"></div>
              <div className="h-6 w-1/2 bg-muted rounded mx-auto animate-pulse"></div>
            </div>

            {/* Search bar placeholder */}
            <div className="relative max-w-lg mx-auto">
              <div className="h-12 w-full bg-muted rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="text-center mb-8">
            <div className="h-4 w-32 bg-muted rounded mx-auto animate-pulse"></div>
          </div>

          {/* Lists Grid Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer animate-pulse"
              >
                <Card
                  className="overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-card/95 backdrop-blur-xl border border-primary/10 shadow-xl"
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-4 h-4 bg-muted rounded-full"></div>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </div>
                      <div className="w-6 h-6 bg-muted rounded"></div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>

                    {/* Books Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[...Array(4)].map((_, bookIndex) => (
                        <div key={bookIndex} className="aspect-[2/3] bg-muted rounded"></div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-muted rounded-full"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-muted rounded w-12"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background" style={{
      minHeight: '100vh',
      height: '100%'
    }}>
      <div className="container mx-auto py-12 px-4 sm:px-8 lg:px-20 min-h-screen">
        {/* Header Hero */}
        <div className="text-center mb-12 space-y-6">
          <div className="space-y-4">
            <h1
              className="text-5xl md:text-6xl font-bold text-foreground"
              style={{
                fontFamily: 'Playfair Display, serif'
              }}
            >
              Les Collections de{' '}
              <span
                className="block mt-2"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Bruna
              </span>
            </h1>
            <p
              className="text-xl max-w-3xl mx-auto leading-relaxed text-muted-foreground"
            >
              Plongez dans mes univers soigneusement sélectionnés de dark romance,
              où chaque liste raconte une histoire et révèle mes coups de cœur littéraires.
            </p>
          </div>

          {/* Barre de recherche stylée */}
          <div className="relative max-w-lg mx-auto">
            <Input
              placeholder="Rechercher parmi mes collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-3 text-lg rounded-full bg-background/90 backdrop-blur-sm shadow-lg border-2 border-primary/30"
            />
          </div>

          {/* Statistiques élégantes */}
          {lists.length > 0 && (
            <div className="flex justify-center items-center gap-8 text-sm mt-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>{filteredLists.length} collection{filteredLists.length > 1 ? 's' : ''} {searchQuery && 'sur ${lists.length}'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/70"></div>
                <span>{filteredLists.reduce((acc, list) => acc + list._count.list_books, 0)} livres</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Créées avec ❤️</span>
              </div>
            </div>
          )}

          {/* Résultats de recherche */}
          {searchQuery && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                {filteredLists.length > 0
                  ? `${filteredLists.length} résultat${filteredLists.length > 1 ? 's' : ''} pour "${searchQuery}"`
                  : `Aucun résultat pour "${searchQuery}"'
                }
              </p>
            </div>
          )}
        </div>

        {/* Listes */}
        {filteredLists.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto space-y-6">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #F3E5E7 0%, #E8D2D6 100%)'
                }}
              >
                <List className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3
                  className="text-2xl font-semibold text-foreground"
                  style={{
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  {searchQuery ? "Aucune collection trouvée" : "Mes collections arrivent bientôt"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Aucune collection ne correspond à votre recherche."
                    : "Je prépare avec soin mes sélections pour vous offrir le meilleur de la dark romance."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredLists.map((list, index) => {
              const isCompact = list.books && list.books.length <= 3;
              return (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => router.push('/books?collection=${list.id}')}
                >
                  <div
                    className="relative rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-card/95 backdrop-blur-xl border border-primary/10 shadow-xl"
                  >
                    {/* Decorative background element */}
                    <div
                      className="absolute top-0 right-0 w-16 h-16 opacity-5"
                      style={{
                        background: 'radial-gradient(circle, ${list.couleur} 0%, transparent 70%)',
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
                        <h3
                          className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300"
                          style={{
                            fontFamily: 'Playfair Display, serif'
                          }}
                        >
                          {highlightSearchTerm(list.nom, searchQuery)}
                        </h3>
                        {list.description && (
                          <p
                            className="text-sm opacity-75 leading-relaxed line-clamp-2 text-foreground"
                            style={{
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            {highlightSearchTerm(list.description, searchQuery)}
                          </p>
                        )}
                      </div>

                      {/* Books Grid - style homepage */}
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        {list.books?.slice(0, 4).map((book, bookIndex) => (
                          <div
                            key={book.id}
                            className="aspect-[2/3] relative rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300"
                            style={{ transitionDelay: '${bookIndex * 50}ms' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/books/${book.id}');
                            }}
                          >
                            {book.image_couverture ? (
                              <img
                                src={book.image_couverture}
                                alt={'Couverture de ${book.titre}'}
                                className="w-full h-full object-contain bg-gray-50"
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

                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span
                            className="text-sm font-medium opacity-60 text-foreground"
                            style={{
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            {list._count.list_books} livre{list._count.list_books > 1 ? 's' : ''}
                          </span>
                          <span
                            className="text-xs opacity-50 text-foreground"
                            style={{
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            {list.user.nom_complet}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300 text-primary">
                          Voir la collection
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Call to action élégant */}
        <div className="mt-20 text-center">
          <div
            className="max-w-4xl mx-auto p-12 rounded-3xl shadow-lg bg-card/80 backdrop-blur-xl border border-primary/20"
          >
            <div className="space-y-6">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                }}
              >
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-4">
                <h3
                  className="text-3xl font-bold text-foreground"
                  style={{
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  Tombée sous le charme ?
                </h3>
                <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                  Explorez l'intégralité de ma bibliothèque et découvrez tous mes secrets littéraires,
                  mes notes personnelles et mes recommandations exclusives.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => router.push('/books')}
                  className="border-0 rounded-full px-8 text-white hover:shadow-lg transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                  }}
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Explorer tous les livres
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/categories')}
                  className="rounded-full px-8 hover:shadow-md transition-all duration-300 border-2 border-primary text-primary"
                >
                  Parcourir par genre
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}