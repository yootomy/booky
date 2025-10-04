'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TestApiPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (endpoint: string, method: string, data: any, status: number) => {
    const result = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      status,
      data,
      id: Date.now()
    };
    setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testEndpoint = async (url: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();
      
      addResult(url, method, data, response.status);
      
      if (response.ok) {
        toast.success(`${method} ${url} - OK`);
      } else {
        toast.error(`${method} ${url} - ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addResult(url, method, { error: errorMessage }, 0);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Test au chargement
  useEffect(() => {
    // Test automatique au chargement
    const runInitialTests = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      testEndpoint('/api/favorites/debug', 'GET');
    };
    runInitialTests();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Test API Favoris</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Tests API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => testEndpoint("/api/favorites", "GET")}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              GET /api/favorites
            </Button>

            <Button
              onClick={() => testEndpoint("/api/favorites/debug", "GET")}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              GET /api/favorites/debug
            </Button>

            <Button
              onClick={() => testEndpoint("/api/favorites/status", "GET")}
              disabled={loading}
              className="w-full justify-start"
              variant="default"
            >
              GET /api/favorites/status (NEW)
            </Button>

            <Button
              onClick={() => testEndpoint("/api/favorites", "POST", { bookId: "test-book-1" })}
              disabled={loading}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              POST /api/favorites (Add test-book-1)
            </Button>

            <Button
              onClick={() => testEndpoint("/api/favorites", "POST", { bookId: "test-book-2" })}
              disabled={loading}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              POST /api/favorites (Add test-book-2)
            </Button>

            <Button
              onClick={() => testEndpoint("/api/favorites/test-book-1", "DELETE")}
              disabled={loading}
              className="w-full justify-start bg-red-600 hover:bg-red-700"
            >
              DELETE /api/favorites/test-book-1
            </Button>

            <Button
              onClick={() => testEndpoint("/api/favorites/reset", "POST")} 
              disabled={loading}
              className="w-full justify-start bg-orange-600 hover:bg-orange-700"
            >
              POST /api/favorites/reset
            </Button>

            {/* Tests avec de vrais IDs de livres si on en a */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground mb-2">Tests avec vrais livres:</p>
              <Button
                onClick={() => testEndpoint("/api/favorites", "POST", { bookId: "674f8e7adf1a1a2b8c3d4e5f" })}
                disabled={loading}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-xs"
              >
                Add It Ends with Us
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Résultats ({results.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-2">
            {results.map((result) => (
              <div
                key={result.id}
                className={`p-3 rounded border text-xs ${
                  result.status >= 200 && result.status < 300
                    ? "bg-green-50 border-green-200"
                    : result.status >= 400
                    ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono font-semibold">
                    {result.method} {result.endpoint}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.status >= 200 && result.status < 300
                      ? "bg-green-100 text-green-800"
                      : result.status >= 400
                      ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                    {result.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Aucun résultat encore. Cliquez sur un bouton pour tester.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">🧪 Séquence de test recommandée:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><code>GET /api/favorites/debug</code> - Voir l"état initial</li>
          <li><code>GET /api/favorites</code> - Liste actuelle</li>
          <li><code>POST /api/favorites</code> - Ajouter test-book-1</li>
          <li><code>GET /api/favorites</code> - Vérifier l'ajout</li>
          <li><code>POST /api/favorites</code> - Re-ajouter (doit être idempotent)</li>
          <li><code>DELETE /api/favorites/test-book-1</code> - Supprimer</li>
          <li><code>GET /api/favorites</code> - Vérifier la suppression</li>
        </ol>
      </div>
    </div>
  );
}