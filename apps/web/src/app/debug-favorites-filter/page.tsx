'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/utils/orpc';

interface Book {
  id: string;
  titre: string;
  auteur: string;
}

interface ComparisonResult {
  bookId: string;
  bookTitle: string;
  inFavorites: boolean;
  favoriteIdMatch: string | null;
  exactMatch: boolean;
  bookIdType: string;
  favoriteIdType: string;
}

export default function DebugFavoritesFilterPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const { favorites, isFavorite, hasInitialLoad } = useFavorites();

  const loadBooks = async () => {
    try {
      setLoading(true);
      // Charger quelques livres pour tester
      const response = await apiClient.get('/api/books?limit=20') as { data: any };
      const booksData = response.data || [];
      setBooks(booksData);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeComparison = () => {
    if (!hasInitialLoad || books.length === 0) return;

    const favoriteIds = Array.from(favorites);
    
    const results: ComparisonResult[] = books.map(book => {
      // Chercher des correspondances potentielles
      const exactMatch = favoriteIds.includes(book.id);
      
      // Chercher des correspondances approximatives
      let favoriteIdMatch: string | null = null;
      if (!exactMatch) {
        favoriteIdMatch = favoriteIds.find(fId => {
          // Comparaisons possibles
          return (
            fId === book.id.toString() || // string vs number
            fId.toString() === book.id ||
            fId === book.id.replace(/^0+/, '') || // suppression des zéros en début
            book.id === fId.replace(/^0+/, '') ||
            fId.toLowerCase() === book.id.toLowerCase() // case insensitive
          );
        }) || null;
      }

      return {
        bookId: book.id,
        bookTitle: book.titre,
        inFavorites: exactMatch || !!favoriteIdMatch,
        favoriteIdMatch,
        exactMatch,
        bookIdType: typeof book.id,
        favoriteIdType: favoriteIds.length > 0 ? typeof favoriteIds[0] : 'unknown'
      };
    });

    setComparison(results);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (hasInitialLoad && books.length > 0) {
      analyzeComparison();
    }
  }, [favorites, books, hasInitialLoad]);

  const favoriteBooks = comparison.filter(c => c.inFavorites);
  const issuesFound = comparison.some(c => c.inFavorites && !c.exactMatch);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">🔍 Debug Filtre Favoris</h1>
      
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? "Connecté" : "Déconnecté"}
              </Badge>
              <span className="text-sm">{user?.email || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              <span className="text-sm">{favorites.size} favoris détectés</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">{favoriteBooks.length} livres favoris trouvés</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {issuesFound ? (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm">
                {issuesFound ? 'Problèmes détectés' : 'Pas de problème'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Analyse des IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={loadBooks} disabled={loading} className="w-full">
                {loading ? 'Chargement...' : 'Recharger les livres'}
              </Button>
              
              <div className="text-sm space-y-2">
                <div><strong>Livres chargés:</strong> {books.length}</div>
                <div><strong>Favoris dans le hook:</strong> {favorites.size}</div>
                <div><strong>Hook initialisé:</strong> {hasInitialLoad ? 'Oui' : 'Non'}</div>
                <div><strong>Correspondances trouvées:</strong> {favoriteBooks.length}</div>
              </div>

              {favorites.size > 0 && (
                <div className="bg-muted p-3 rounded">
                  <h4 className="font-medium mb-2">IDs des favoris:</h4>
                  <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                    {Array.from(favorites).map((id, index) => (
                      <div key={index} className="font-mono">
                        "{id}" ({typeof id})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Résultats de Comparaison</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {comparison.length > 0 ? (
              <div className="space-y-2">
                {comparison.slice(0, 20).map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border text-xs ${
                      result.inFavorites 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }'}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{result.bookTitle}</div>
                        <div className="text-muted-foreground font-mono">
                          ID: "{result.bookId}" ({result.bookIdType})
                        </div>
                        {result.favoriteIdMatch && (
                          <div className="text-orange-600 font-mono">
                            Match: "{result.favoriteIdMatch}"
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {result.exactMatch ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : result.inFavorites ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <Badge variant={result.inFavorites ? "default" : "outline"} className="text-xs">
                          {result.inFavorites ? 'Favori' : 'Non'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {comparison.length > 20 && (
                  <div className="text-center text-muted-foreground text-sm py-2">
                    ... et {comparison.length - 20} autres livres
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {!hasInitialLoad ? 'En attente du chargement des favoris...' :
                 books.length === 0 ? 'Aucun livre chargé' :
                 'Aucune comparaison disponible'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Raw Data */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Données Brutes (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Premiers favoris (raw):</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                {JSON.stringify(Array.from(favorites).slice(0, 5), null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Premiers livres (IDs only):</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                {JSON.stringify(books.slice(0, 5).map(b => b.id), null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}