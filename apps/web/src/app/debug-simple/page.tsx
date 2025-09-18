'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugSimplePage() {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test simple de l'API favoris
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });
      const data = await response.json();
      setApiData({
        status: response.status,
        data: data,
        timestamp: new Date().toISOString()
      });
      console.log('Direct API test:', data);
    } catch (error) {
      setApiData({
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Test immédiat au chargement
  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">🚨 Debug Simple - API Direct</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Direct API Favoris</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAPI} disabled={loading} className="w-full">
            {loading ? 'Test en cours...' : 'Tester GET /api/favorites'}
          </Button>
          
          {apiData && (
            <div className="bg-muted p-4 rounded">
              <h3 className="font-semibold mb-2">Résultat API Direct:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Ce qu'on teste :</strong></p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Si l'API /api/favorites retourne bien des données</li>
              <li>Si l'authentification fonctionne (pas de 401)</li>
              <li>Le format exact des données retournées</li>
              <li>Si on a vraiment 6 favoris comme affiché</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Outils de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/debug-favorites-filter'}
              variant="outline" 
              className="w-full"
            >
              → Aller au Debug Avancé
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/test-favorites-complete'}
              variant="outline" 
              className="w-full"
            >
              → Aller aux Tests Complets
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/books'}
              variant="outline" 
              className="w-full"
            >
              → Retour au Catalogue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}