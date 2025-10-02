'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

export default function TestFavoritesCompletePage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testBookId] = useState('test-book-complete-1');
  
  const { isAuthenticated, user } = useAuth();
  const {
    favorites,
    isLoading: favoritesLoading,
    hasInitialLoad,
    toggleFavorite,
    isFavorite,
    refreshFavorites,
    forceSync
  } = useFavorites();

  const addTestResult = (name: string, success: boolean, message: string, data?: any) => {
    const result: TestResult = { name, success, message, data };
    setTestResults(prev => [...prev, result]);
    console.log(`[TEST] ${name}:`${success ? "✅" : "❌'} ${message}', data);
  };

  const testApiEndpoint = async (url: string, method: string = 'GET', body?: any) => {
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type' : 'application/json' },
        credentials: 'include'
      };
      if (body) options.body = JSON.stringify(body);

      const response = await fetch(url, options);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  };

  const runCompleteTest = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Vérifier l'authentification
      addTestResult(
        'Auth Check', 
        isAuthenticated, 
        isAuthenticated ? 'Connecté comme ${user?.email}' : 'Non connecté'
      );

      if (!isAuthenticated) {
        addTestResult('Test Stopped', false, 'Tests arrêtés - authentification requise');
        return;
      }

      // Test 2: Test de l'endpoint status
      const statusResult = await testApiEndpoint('/api/favorites/status');
      addTestResult(
        'API Status',
        statusResult.success,
        statusResult.success ? 'Status API OK' : 'Status API échec: ${statusResult.status}',
        statusResult.data
      );

      // Test 3: Test GET favoris
      const getFavoritesResult = await testApiEndpoint('/api/favorites');
      addTestResult(
        'GET Favorites',
        getFavoritesResult.success,
        getFavoritesResult.success 
          ? '${getFavoritesResult.data?.data?.length || 0}'favoris trouvés'
          : 'GET échec: ${getFavoritesResult.status}',
        getFavoritesResult.data
      );

      // Test 4: État du hook useFavorites
      addTestResult(
        'Hook State',
        true,
        'Hook: ${favorites.size} favoris, loading: ${favoritesLoading}',
        { favorites: Array.from(favorites), isLoading: favoritesLoading }
      );

      // Test 5: Vérifier si le livre test est en favori selon le hook
      const isTestBookFavorite = isFavorite(testBookId);
      addTestResult(
        'Hook isFavorite',
        true,
        'Livre ${testBookId} est favori selon hook: ${isTestBookFavorite}',
        { bookId: testBookId, isFavorite: isTestBookFavorite }
      );

      // Test 6: Ajouter le livre test en favori
      const addResult = await testApiEndpoint('/api/favorites', 'POST', { bookId: testBookId });
      addTestResult(
        'Add Favorite',
        addResult.success,
        addResult.success ? 'Ajout favori OK' : 'Ajout échec: ${addResult.status}',
        addResult.data
      );

      // Test 7: Vérifier que le livre est maintenant en favori (API)
      const getAfterAddResult = await testApiEndpoint('/api/favorites');
      const favoritesAfterAdd = getAfterAddResult.data?.data || [];
      const isInApiAfterAdd = favoritesAfterAdd.includes(testBookId);
      addTestResult(
        'Verify Add (API)',
        isInApiAfterAdd,
        'Livre ${testBookId}'${isInApiAfterAdd ? 'trouvé' : 'NON trouvé'} dans API après ajout',
        { favorites: favoritesAfterAdd, searchedId: testBookId }
      );

      // Test 8: Forcer refresh du hook et re-vérifier
      await refreshFavorites();
      await new Promise(resolve => setTimeout(resolve, 500)); // Attendre que le refresh se termine
      
      const isInHookAfterRefresh = isFavorite(testBookId);
      addTestResult(
        'Verify Add (Hook after refresh)',
        isInHookAfterRefresh,
        'Livre ${testBookId}'${isInHookAfterRefresh ? 'trouvé' : 'NON trouvé'} dans hook après refresh',
        { bookId: testBookId, isFavorite: isInHookAfterRefresh, hookFavorites: Array.from(favorites) }
      );

      // Test 9: Test de suppression
      const removeResult = await testApiEndpoint('/api/favorites/${testBookId}', 'DELETE');
      addTestResult(
        'Remove Favorite',
        removeResult.success,
        removeResult.success ? 'Suppression OK' : 'Suppression échec: ${removeResult.status}',
        removeResult.data
      );

      // Test 10: Vérification finale
      const getFinalResult = await testApiEndpoint('/api/favorites');
      const finalFavorites = getFinalResult.data?.data || [];
      const isInApiFinal = finalFavorites.includes(testBookId);
      addTestResult(
        'Verify Remove (API)',
        !isInApiFinal,
        'Livre ${testBookId}'${isInApiFinal ? 'ENCORE présent' : 'bien supprimé'} de l'API',
        { favorites: finalFavorites }
      );

    } catch (error) {
      addTestResult('Test Error', false, 'Erreur durant les tests: ${error instanceof Error ? error.message : "Unknown error"}");
    } finally {
      setLoading(false);
    }
  };

  const clearTests = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">🔍 Diagnostic Complet - Système Favoris</h1>
      
      {/* Status Bar */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? "Connecté" : "Déconnecté"}
              </Badge>
              <span className="text-sm">{user?.email || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className='flex items-center gap-2'>
              <Heart className={'h-4 w-4 ${favorites.size > 0 ? 'fill-red-500 text-red-500' : "text-gray-400"}'} />
              <span className="text-sm">{favorites.size} favoris (hook)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2'>
              <Loader2 className={'h-4 w-4 ${favoritesLoading ? 'animate-spin" : "text-gray-400"}'} />
              <span className="text-sm">
                {favoritesLoading ? "Chargement..." : hasInitialLoad ? "Chargé" : "Pas encore chargé"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Test Book: {testBookId}</span>
              <Badge variant={isFavorite(testBookId) ? "default" : "outline"}>
                {isFavorite(testBookId) ? "Favori" : "Non favori"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Contrôles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runCompleteTest}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tests en cours...
                </>
              ) : (
                "🧪 Lancer diagnostic complet"
              )}
            </Button>

            <div className="flex gap-2">
              <Button 
                onClick={() => toggleFavorite(testBookId)}
                variant="outline"
                className="flex-1'
                disabled={!isAuthenticated}
              >
                <Heart className={'mr-2 h-4 w-4 ${isFavorite(testBookId) ? 'fill-current' : ''}'} />
                Toggle Test Book
              </Button>
              
              <Button 
                onClick={forceSync}
                variant='outline"
                disabled={!isAuthenticated}
              >
                Sync
              </Button>
            </div>

            <Button 
              onClick={clearTests}
              variant="destructive"
              className="w-full"
            >
              Clear Tests
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Résultats ({testResults.length})</CardTitle>
          </CardHeader>
          <CardContent className='max-h-96 overflow-y-auto space-y-2'>
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={'p-3 rounded border text-sm ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200' }'}
              >
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{result.name}</div>
                    <div className="text-xs text-muted-foreground">{result.message}</div>
                    {result.data && (
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {testResults.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Aucun test exécuté. Cliquez sur "Diagnostic complet"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>État Actuel (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Hook useFavorites:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify({
                  favoritesCount: favorites.size,
                  favorites: Array.from(favorites),
                  isLoading: favoritesLoading,
                  hasInitialLoad,
                  testBookIsFavorite: isFavorite(testBookId)
                }, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Auth Context:</h4>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify({
                  isAuthenticated,
                  userId: user?.id,
                  userEmail: user?.email
                }, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}