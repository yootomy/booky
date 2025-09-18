"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedBookForm } from '@/components/forms/enhanced-book-form';
import type { BookCreateInput, BookUpdateInput } from '@/types/book';
import { TagType } from '@/types/api';

export default function TestIntegrationPage() {
  const [testResult, setTestResult] = useState<string>('');

  const handleSubmit = async (data: BookCreateInput | BookUpdateInput) => {
    console.log('📚 Données du formulaire:', data);
    setTestResult(`✅ Livre testé: "${data.titre}" par ${data.auteur}`);
    
    // Simuler une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleCancel = () => {
    setTestResult('❌ Test annulé');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🧪 Test d'intégration - Recherche de livres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Cette page teste la nouvelle intégration de recherche externe dans le formulaire d'ajout de livre.
              Essayez de chercher un livre populaire comme "Harry Potter" ou "It Ends with Us".
            </p>
            {testResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">{testResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulaire Enhanced */}
        <EnhancedBookForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          availableCategories={[
            {
              id: '1',
              nom: 'Romance',
              couleur: '#ff6b9d',
              icone: '💕',
              description: 'Romans d\'amour',
              ordre_affichage: 1,
              est_actif: true,
              date_creation: '2025-01-01T00:00:00.000Z',
              date_modification: '2025-01-01T00:00:00.000Z'
            },
            {
              id: '2',
              nom: 'Dark Romance',
              couleur: '#8b2635',
              icone: '🖤',
              description: 'Romance sombre',
              ordre_affichage: 2,
              est_actif: true,
              date_creation: '2025-01-01T00:00:00.000Z',
              date_modification: '2025-01-01T00:00:00.000Z'
            }
          ]}
          availableTags={[
            {
              id: '1',
              nom: 'Spicy',
              couleur: '#ff4444',
              type: TagType.TROPE,
              utilisation_count: 10,
              est_favori: true,
              date_creation: '2025-01-01T00:00:00.000Z',
              date_modification: '2025-01-01T00:00:00.000Z'
            },
            {
              id: '2',
              nom: 'Enemies to Lovers',
              couleur: '#44aa44',
              type: TagType.TROPE,
              utilisation_count: 5,
              est_favori: false,
              date_creation: '2025-01-01T00:00:00.000Z',
              date_modification: '2025-01-01T00:00:00.000Z'
            }
          ]}
        />
      </div>
    </div>
  );
}