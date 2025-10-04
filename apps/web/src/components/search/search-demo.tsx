"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  SearchBar, 
  FilterPanel, 
  SortDropdown, 
  TagSelector, 
  QuickTagSelector,
  useSorting
} from "./index";
import type { FilterState, TagOption } from "./index";

// Mock data pour la démo
const mockTags: TagOption[] = [
  { id: "1", name: "Dark Romance", color: "#8B0000", type: "GENRE", count: 45 },
  { id: "2", name: "Spicy", color: "#FF4500", type: "GENRE", count: 32 },
  { id: "3", name: "Enemies to Lovers", color: "#DC143C", type: "TROPE", count: 28 },
  { id: "4", name: "Mafia", color: "#2E0854", type: "TROPE", count: 19 },
  { id: "5", name: "Violence", color: "#B22222", type: "TRIGGER", count: 15 },
  { id: "6", name: "Kidnapping", color: "#8B0000", type: "TRIGGER", count: 12 },
  { id: "7", name: "Favori", color: "#6A0DAD", type: "PERSONNALISE", count: 8 },
];

const mockGenres = [
  { id: "1", name: "Dark Romance", color: "#8B0000", count: 45 },
  { id: "2", name: "Contemporary Romance", color: "#FF69B4", count: 38 },
  { id: "3", name: "Fantasy Romance", color: "#9370DB", count: 22 },
];

const mockCategories = [
  { id: "1", name: "Mes Favoris", color: "#FFD700", count: 15 },
  { id: "2", name: "À Relire", color: "#32CD32", count: 8 },
];

export function SearchDemo() {
  // États pour la démo
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    selectedGenres: [],
    selectedTropes: [],
    selectedTriggers: [],
    selectedCategories: [],
    selectedStatuses: [],
    selectedAuthors: [],
    selectedRhythms: [],
  });

  const { sortConfig, updateSort } = useSorting();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Composants de Recherche & Filtres</h1>
        <p className="text-muted-foreground">
          Démonstration des composants SearchBar, FilterPanel, SortDropdown et TagSelector
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Filtres */}
        <div className="space-y-4">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => setFilters({
              selectedGenres: [],
              selectedTropes: [],
              selectedTriggers: [],
              selectedCategories: [],
              selectedStatuses: [],
              selectedAuthors: [],
              selectedRhythms: [],
            })}
            availableOptions={{
              genres: mockGenres,
              categories: mockCategories,
            }}
          />
        </div>

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barre de recherche */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Barre de recherche</CardTitle>
              <CardDescription>
                Recherche avec suggestions intelligentes et autocomplétion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchBar
                placeholder="Rechercher des livres, auteurs, genres..."
                onSearch={setSearchQuery}
                recentSearches={["Dark Romance", "Colleen Hoover", "Mafia"]}
                popularSearches={["Spicy", "Enemies to Lovers", "Contemporary"]}
              />
              
              {searchQuery && (
                <div className="text-sm text-muted-foreground">
                  Recherche actuelle: <strong>{searchQuery}</strong>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tri et sélection de tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tri et Tags</CardTitle>
              <CardDescription>
                Options de tri et sélection de tags avec couleurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Trier par:
                  </label>
                  <SortDropdown
                    value={sortConfig}
                    onChange={updateSort}
                  />
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Tags sélectionnés: ({selectedTags.length})
                  </label>
                  <TagSelector
                    selectedTags={selectedTags}
                    onSelectionChange={setSelectedTags}
                    availableTags={mockTags}
                    showCreateNew
                    onCreateNew={(name, type) => {
                      console.log("Créer nouveau tag:", name, type);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sélection rapide de tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags populaires</CardTitle>
              <CardDescription>
                Sélection rapide des tags les plus utilisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickTagSelector
                selectedTags={selectedTags}
                onSelectionChange={setSelectedTags}
                popularTags={mockTags.slice(0, 6)}
              />
            </CardContent>
          </Card>

          {/* Résumé des sélections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Résumé des filtres actifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche */}
              {searchQuery && (
                <div>
                  <h4 className="font-medium mb-2">Recherche:</h4>
                  <Badge variant="secondary">{searchQuery}</Badge>
                </div>
              )}

              {/* Tri */}
              <div>
                <h4 className="font-medium mb-2">Tri:</h4>
                <Badge variant="outline">
                  {sortConfig.field} ({sortConfig.direction === "asc" ? "croissant" : "décroissant"})
                </Badge>
              </div>

              {/* Tags sélectionnés */}
              {selectedTags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags sélectionnés ({selectedTags.length}):</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tagId) => {
                      const tag = mockTags.find(t => t.id === tagId);
                      return tag ? (
                        <Badge
                          key={tagId}
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: tag.color
                          }}
                        >
                          {tag.name} ({tag.type})
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Statuts */}
              {filters.selectedStatuses.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Statuts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {filters.selectedStatuses.map(status => (
                      <Badge key={status} variant="secondary">
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(filters.minGeneralRating || filters.maxGeneralRating) && (
                <div>
                  <h4 className="font-medium mb-2">Note générale:</h4>
                  <Badge variant="secondary">
                    {filters.minGeneralRating || 0} - {filters.maxGeneralRating || 10}
                  </Badge>
                </div>
              )}

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>
                  Ces composants sont entièrement fonctionnels et prêts à être intégrés 
                  dans les pages de catalogue et d'administration.
                </p>
                <p className="mt-2">
                  Ils supportent les thèmes dark/light, sont responsifs et accessibles.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}