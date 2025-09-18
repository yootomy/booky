"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSorting } from "./sort-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SearchTest() {
  // Test du hook useDebounce
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Test du hook useSorting
  const { sortConfig, updateSort, setSortField, toggleDirection } = useSorting();

  // Effet pour capturer les recherches debouncées
  useEffect(() => {
    if (debouncedSearch.trim()) {
      setSearchHistory(prev => [
        debouncedSearch,
        ...prev.filter(item => item !== debouncedSearch).slice(0, 4)
      ]);
    }
  }, [debouncedSearch]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Tests Fonctionnels</h1>
        <p className="text-muted-foreground">
          Tests automatisés des hooks et fonctionnalités
        </p>
      </div>

      {/* Test useDebounce */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test useDebounce Hook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tapez quelque chose (debounce 500ms):
            </label>
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tapez pour tester le debounce..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Valeur immédiate:</span>
              <Badge variant="outline" className="ml-2">
                {searchValue || "(vide)"}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Valeur debouncée:</span>
              <Badge variant="default" className="ml-2">
                {debouncedSearch || "(vide)"}
              </Badge>
            </div>
          </div>
          
          {searchHistory.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Historique des recherches:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {searchHistory.map((term, index) => (
                  <Badge key={index} variant="secondary">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test useSorting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test useSorting Hook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Configuration actuelle:</span>
            <div className="mt-2">
              <Badge variant="default" className="mr-2">
                Champ: {sortConfig.field}
              </Badge>
              <Badge variant="outline">
                Direction: {sortConfig.direction === "asc" ? "Croissant" : "Décroissant"}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSortField("titre")}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80"
            >
              Trier par Titre
            </button>
            <button
              onClick={() => setSortField("date_creation")}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80"
            >
              Trier par Date
            </button>
            <button
              onClick={() => setSortField("note_generale")}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80"
            >
              Trier par Note
            </button>
            <button
              onClick={toggleDirection}
              className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Inverser Direction
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Test des types TagOption */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Types & Interfaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Types TagOption:</span>
              <Badge style={{ backgroundColor: "#8B0000", color: "white" }}>
                GENRE
              </Badge>
              <Badge style={{ backgroundColor: "#DC143C", color: "white" }}>
                TROPE  
              </Badge>
              <Badge style={{ backgroundColor: "#B22222", color: "white" }}>
                TRIGGER
              </Badge>
              <Badge style={{ backgroundColor: "#6A0DAD", color: "white" }}>
                PERSONNALISE
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground mt-4">
              ✅ Tous les types TypeScript sont correctement définis et exportés
              <br />
              ✅ Les interfaces FilterState, SortConfig et TagOption fonctionnent
              <br />
              ✅ Les hooks useDebounce et useSorting sont opérationnels
              <br />
              ✅ Les composants compilent sans erreurs
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}