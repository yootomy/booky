'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Loader2 } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

interface FavoritesTestProps {
  testBookId?: string;
}

export function FavoritesTest({ testBookId = 'test-book-1' }: FavoritesTestProps) {
  const { isAuthenticated, user } = useAuth();
  const {
    favorites,
    isLoading,
    error,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    forceSync
  } = useFavorites();

  const bookIsFavorite = isFavorite(testBookId);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Test des Favoris
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut d'authentification */}
        <div>
          <p className="text-sm text-muted-foreground">
            Utilisateur: {isAuthenticated ? user?.email : "Non connecté"}
          </p>
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Connecté" : "Déconnecté"}
          </Badge>
        </div>

        {/* État des favoris */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Nombre de favoris: {favorites.size}
          </p>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          )}
          {error && (
            <Badge variant="destructive">Erreur: {error}</Badge>
          )}
        </div>

        {/* Test pour un livre spécifique */}
        <div className="border rounded-lg p-3">
          <p className="text-sm font-medium mb-2">
            Test Book ID: {testBookId}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant={bookIsFavorite ? "default" : "outline"}>
              {bookIsFavorite ? "Favoris ❤️" : "Pas en favoris"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleFavorite(testBookId)}
              className="flex items-center gap-1"
            >
              <Heart className={`h-4 w-4 ${bookIsFavorite ? 'fill-current' : ''}`} />
              {bookIsFavorite ? "Retirer" : "Ajouter"}
            </Button>
          </div>
        </div>

        {/* Actions de debug */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshFavorites}
            disabled={isLoading}
          >
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={forceSync}
            disabled={isLoading || !isAuthenticated}
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            Sync forcée
          </Button>
        </div>

        {/* Liste des favoris (debug) */}
        {favorites.size > 0 && (
          <div className="text-xs">
            <p className="font-medium mb-1">IDs en favoris:</p>
            <div className="bg-muted p-2 rounded text-xs font-mono">
              {Array.from(favorites).join(", ")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FavoritesTest;