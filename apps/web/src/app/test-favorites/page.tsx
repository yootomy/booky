'use client';

import React from 'react';
import { FavoritesTest } from '@/components/test/FavoritesTest';

export default function TestFavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test du système de Favoris</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <FavoritesTest testBookId="book-1" />
          <FavoritesTest testBookId="book-2" />
        </div>

        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions de test</h2>
          <ul className="space-y-2 text-sm">
            <li>1. <strong>Non connecté</strong> : Cliquer sur "Ajouter" doit afficher un toast demandant de se connecter</li>
            <li>2. <strong>Connecté</strong> : Cliquer sur "Ajouter" doit ajouter le livre aux favoris (optimiste)</li>
            <li>3. <strong>Persistance</strong> : Actualiser la page doit conserver l'état des favoris</li>
            <li>4. <strong>Cohérence</strong> : Les deux composants doivent rester synchronisés</li>
            <li>5. <strong>Erreurs</strong> : En cas d'erreur API, afficher un toast et revenir à l'état précédent</li>
          </ul>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test dans le Catalogue</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Allez dans <strong>/books</strong> pour tester le toggle global et les cœurs sur les cartes.
          </p>
          <ul className="space-y-2 text-sm">
            <li>• Le bouton "Favoris/Tous" doit filtrer les livres affichés</li>
            <li>• Les cœurs sur les cartes doivent être cohérents avec l'état</li>
            <li>• Ajouter/retirer un favori pendant le filtre actif doit mettre à jour la grille</li>
            <li>• L'accessibilité (aria-labels, titres) doit être présente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}