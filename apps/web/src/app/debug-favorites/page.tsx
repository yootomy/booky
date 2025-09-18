'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function DebugFavoritesPage() {
  const [bookId, setBookId] = useState('test-book-1');
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites');
      const data = await response.json();
      console.log('GET /api/favorites:', data);
      setDebugData({ endpoint: 'GET /api/favorites', response: data });
      toast.success('GET Favorites OK');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur GET Favorites');
    } finally {
      setLoading(false);
    }
  };

  const testAddFavorite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      });
      const data = await response.json();
      console.log('POST /api/favorites:', data);
      setDebugData({ endpoint: 'POST /api/favorites', response: data });
      toast.success('POST Favorite OK');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur POST Favorite');
    } finally {
      setLoading(false);
    }
  };

  const testRemoveFavorite = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/favorites/${bookId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      console.log('DELETE /api/favorites:', data);
      setDebugData({ endpoint: 'DELETE /api/favorites', response: data });
      toast.success('DELETE Favorite OK');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur DELETE Favorite');
    } finally {
      setLoading(false);
    }
  };

  const testDebugEndpoint = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites/debug');
      const data = await response.json();
      console.log('GET /api/favorites/debug:', data);
      setDebugData({ endpoint: 'GET /api/favorites/debug', response: data });
      toast.success('Debug Endpoint OK');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur Debug Endpoint');
    } finally {
      setLoading(false);
    }
  };

  const testResetFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites/reset', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('POST /api/favorites/reset:', data);
      setDebugData({ endpoint: 'POST /api/favorites/reset', response: data });
      toast.success('Reset Favorites OK');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur Reset Favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Debug Endpoints Favoris</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Contrôles de test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Book ID:</label>
              <Input
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                placeholder="test-book-1"
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={testGetFavorites} 
                disabled={loading}
                className="w-full"
              >
                GET /api/favorites
              </Button>
              
              <Button 
                onClick={testAddFavorite} 
                disabled={loading}
                className="w-full"
              >
                POST /api/favorites (Add)
              </Button>
              
              <Button 
                onClick={testRemoveFavorite} 
                disabled={loading}
                className="w-full"
              >
                DELETE /api/favorites/{bookId}
              </Button>
              
              <Button 
                onClick={testDebugEndpoint} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                GET /api/favorites/debug
              </Button>
              
              <Button 
                onClick={testResetFavorites} 
                disabled={loading}
                className="w-full"
                variant="destructive"
              >
                POST /api/favorites/reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            {debugData ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  Endpoint: {debugData.endpoint}
                </div>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(debugData.response, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Cliquez sur un bouton pour tester les endpoints
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Testez d'abord <code>GET /api/favorites</code> pour voir l'état initial</li>
          <li>Ajoutez un favori avec <code>POST</code></li>
          <li>Vérifiez avec <code>GET</code> que le favori est bien ajouté</li>
          <li>Utilisez <code>DEBUG</code> pour voir l'état complet du store</li>
          <li>Supprimez avec <code>DELETE</code></li>
          <li>Utilisez <code>RESET</code> pour nettoyer si nécessaire</li>
        </ol>
      </div>
    </div>
  );
}