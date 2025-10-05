'use client';

import React, { useState } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Search,
  BookOpen,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { booksApi } from '@/utils/orpc';

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States for featured book management
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [featuredBookLoading, setFeaturedBookLoading] = useState(false);

  // Queries for featured book management
  const { data: currentFeaturedBook, isLoading: featuredBookQueryLoading } = useQuery({
    queryKey: ['featured-book'],
    queryFn: async () => {
      const response = await apiClient.get('/api/featured-book');
      if (!response.success) throw new Error(response.error || "Failed to fetch featured book");
      return response.data;
    }
  });

  const { data: searchResults } = useQuery({
    queryKey: ['book-search', bookSearchQuery],
    queryFn: async () => {
      if (!bookSearchQuery || bookSearchQuery.length < 2) return { data: [] };

      console.log('🔍 Recherche de livres:', bookSearchQuery);
      const response = await booksApi.search(bookSearchQuery, { limit: 10 });
      console.log('📚 Résultats recherche:', response);

      // booksApi.search retourne PaginatedResponse<Book>
      // Structure: { success, data: Book[], total, page, limit }
      return response;
    },
    enabled: bookSearchQuery.length >= 2
  });

  // Functions for featured book management
  const setFeaturedBook = async (bookId: string) => {
    try {
      setFeaturedBookLoading(true);
      const response = await apiClient.post('/api/featured-book', { bookId });

      if (!response.success) {
        throw new Error(response.error || 'Failed to set featured book');
      }

      toast({
        title: "Livre coup de cœur défini",
        description: "Le livre coup de cœur a été mis à jour avec succès",
      });

      // Refresh the featured book data
      queryClient.invalidateQueries({ queryKey: ["featured-book"] });
      queryClient.invalidateQueries({ queryKey: ['spotlight-book'] });
      setShowBookSearch(false);
      setBookSearchQuery('');

    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de définir le livre coup de cœur",
        variant: "destructive",
      });
    } finally {
      setFeaturedBookLoading(false);
    }
  };

  const clearFeaturedBook = async () => {
    try {
      setFeaturedBookLoading(true);
      const response = await apiClient.delete("/api/featured-book");

      if (!response.success) {
        throw new Error(response.error || 'Failed to clear featured book');
      }

      toast({
        title: "Livre coup de cœur réinitialisé",
        description: "Le système affichera maintenant le livre le mieux noté",
      });

      // Refresh the featured book data
      queryClient.invalidateQueries({ queryKey: ["featured-book"] });
      queryClient.invalidateQueries({ queryKey: ['spotlight-book'] });

    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de réinitialiser le livre coup de cœur",
        variant: "destructive",
      });
    } finally {
      setFeaturedBookLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Paramètres du Site
              </h1>
              <p className="text-muted-foreground">
                Configurez le livre coup de cœur affiché sur la page d'accueil
              </p>
            </div>

            <Link href="/admin/dashboard">
              <Button variant="outline">
                Retour au dashboard
              </Button>
            </Link>
          </div>

          {/* Livre Coup de Cœur */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Livre Coup de Cœur du Moment</span>
              </CardTitle>
              <CardDescription>
                Choisissez le livre qui sera mis en avant sur la page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Featured Book */}
              {featuredBookQueryLoading ? (
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted animate-pulse">
                  <div className="w-16 h-20 bg-gray-300 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ) : currentFeaturedBook?.data ? (
                <div className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
                  <div className="w-16 h-20 relative rounded overflow-hidden flex-shrink-0">
                    {currentFeaturedBook.data.image_couverture ? (
                      <img
                        src={currentFeaturedBook.data.image_couverture}
                        alt={currentFeaturedBook.data.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-gray-900">{currentFeaturedBook.data.titre}</h4>
                    <p className="text-sm text-gray-600">par {currentFeaturedBook.data.auteur}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        ⭐ {currentFeaturedBook.data.note_generale}/10
                      </Badge>
                      {currentFeaturedBook.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Par défaut (livre le mieux noté)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBookSearch(true)}
                      disabled={featuredBookLoading}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Changer
                    </Button>
                    {!currentFeaturedBook.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFeaturedBook}
                        disabled={featuredBookLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <Heart className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Aucun livre coup de cœur défini</p>
                  <Button onClick={() => setShowBookSearch(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Choisir un livre
                  </Button>
                </div>
              )}

              {/* Book Search Interface */}
              {showBookSearch && (
                <div className="space-y-4 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Rechercher un livre</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowBookSearch(false);
                        setBookSearchQuery("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tapez le titre ou l'auteur du livre..."
                      value={bookSearchQuery}
                      onChange={(e) => setBookSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults?.data && searchResults.data.length > 0 && (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {searchResults.data.map((book: any) => (
                        <div
                          key={book.id}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-red-300 cursor-pointer transition-colors"
                          onClick={() => setFeaturedBook(book.id)}
                        >
                          <div className="w-12 h-16 relative rounded overflow-hidden flex-shrink-0">
                            {book.image_couverture ? (
                              <img
                                src={book.image_couverture}
                                alt={book.titre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h5 className="font-medium text-sm">{book.titre}</h5>
                            <p className="text-xs text-gray-600">par {book.auteur}</p>
                            <Badge variant="outline" className="text-xs">
                              ⭐ {book.note_generale}/10
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {bookSearchQuery.length >= 2 && (!searchResults?.data || searchResults.data.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun livre trouvé pour "{bookSearchQuery}"
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}
