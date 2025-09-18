/**
 * Composant de démonstration des providers
 * Test de l'AuthProvider et FiltersProvider
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useFilters } from "@/providers/filters-provider";
import { CardDarkRomance, CardDarkRomanceContent, CardDarkRomanceHeader, CardDarkRomanceTitle } from "./ui/card-dark-romance";
import { ButtonDarkRomance } from "./ui/button-dark-romance";
import { BadgeDarkRomance } from "./ui/badge-dark-romance";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { BookStatus, BookRhythm, TagType } from "@/types/api";
import { User, LogIn, LogOut, Search, Filter, X } from "lucide-react";

export function ProvidersDemo() {
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading, 
    login, 
    logout
  } = useAuth();

  const {
    searchQuery,
    setSearchQuery,
    clearSearchQuery,
    selectedStatuses,
    toggleStatus,
    selectedGenres,
    toggleGenre,
    selectedTags,
    toggleTag,
    sortBy,
    sortOrder,
    setSortBy,
    toggleSortOrder,
    hasActiveFilters,
    clearAllFilters,
    getBookFilters,
  } = useFilters();

  const handleLogin = async () => {
    try {
      await login({
        email: "bruna@booky.fr",
        password: "BrunaBooky2025!"
      });
    } catch (error) {
      console.log("Login failed (expected during demo):", error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold text-center mb-8">Demo Providers - Auth & Filters</h2>
      
      {/* Section Authentification */}
      <CardDarkRomance variant="blood-glow">
        <CardDarkRomanceHeader>
          <CardDarkRomanceTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            État d'authentification
          </CardDarkRomanceTitle>
        </CardDarkRomanceHeader>
        <CardDarkRomanceContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Connecté:</Label>
                <BadgeDarkRomance variant={isAuthenticated ? "read" : "to-read"}>
                  {isAuthenticated ? "Oui" : "Non"}
                </BadgeDarkRomance>
              </div>
              <div>
                <Label>Chargement:</Label>
                <BadgeDarkRomance variant={authLoading ? "reading" : "read"}>
                  {authLoading ? "Oui" : "Non"}
                </BadgeDarkRomance>
              </div>
            </div>
            
            {user && (
              <div className="space-y-2">
                <Label>Utilisateur:</Label>
                <div className="text-sm space-y-1">
                  <p><strong>Nom:</strong> {user.nom_complet}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Rôle:</strong> <BadgeDarkRomance variant="romance">{user.role}</BadgeDarkRomance></p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {isAuthenticated ? (
                <ButtonDarkRomance 
                  variant="outline-crimson" 
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </ButtonDarkRomance>
              ) : (
                <ButtonDarkRomance 
                  variant="gradient-blood" 
                  onClick={handleLogin}
                  disabled={authLoading}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Se connecter (demo)
                </ButtonDarkRomance>
              )}
            </div>
          </div>
        </CardDarkRomanceContent>
      </CardDarkRomance>

      {/* Section Filtres */}
      <CardDarkRomance variant="purple-glow">
        <CardDarkRomanceHeader>
          <CardDarkRomanceTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            État des filtres
            {hasActiveFilters && (
              <BadgeDarkRomance variant="spicy" className="text-xs">
                Actifs
              </BadgeDarkRomance>
            )}
          </CardDarkRomanceTitle>
        </CardDarkRomanceHeader>
        <CardDarkRomanceContent>
          <div className="space-y-4">
            {/* Recherche */}
            <div className="space-y-2">
              <Label htmlFor="search">Recherche:</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Rechercher un livre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                {searchQuery && (
                  <ButtonDarkRomance
                    variant="outline-crimson"
                    size="icon"
                    onClick={clearSearchQuery}
                  >
                    <X className="h-4 w-4" />
                  </ButtonDarkRomance>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Recherche active: "{searchQuery}"
                </p>
              )}
            </div>

            {/* Filtres par statut */}
            <div className="space-y-2">
              <Label>Statuts sélectionnés:</Label>
              <div className="flex flex-wrap gap-2">
                {Object.values(BookStatus).map((status) => (
                  <BadgeDarkRomance
                    key={status}
                    variant={selectedStatuses.includes(status) ? "read" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleStatus(status)}
                  >
                    {status === BookStatus.LU && "Lu"}
                    {status === BookStatus.EN_COURS && "En cours"}
                    {status === BookStatus.A_LIRE && "À lire"}
                  </BadgeDarkRomance>
                ))}
              </div>
            </div>

            {/* Tri */}
            <div className="space-y-2">
              <Label>Tri:</Label>
              <div className="flex gap-2 items-center">
                <select 
                  value={sortBy || ""}
                  onChange={(e) => setSortBy(e.target.value || null)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Aucun tri</option>
                  <option value="titre">Titre</option>
                  <option value="auteur">Auteur</option>
                  <option value="note_generale">Note générale</option>
                  <option value="date_lecture">Date de lecture</option>
                  <option value="date_creation">Date d'ajout</option>
                </select>
                
                {sortBy && (
                  <ButtonDarkRomance
                    variant="outline-purple"
                    size="sm"
                    onClick={toggleSortOrder}
                  >
                    {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
                  </ButtonDarkRomance>
                )}
              </div>
            </div>

            {/* Genres simulés */}
            <div className="space-y-2">
              <Label>Genres (simulé):</Label>
              <div className="flex flex-wrap gap-2">
                {['fantasy', 'romance', 'dark-romance', 'contemporary'].map((genre) => (
                  <BadgeDarkRomance
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "genre" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </BadgeDarkRomance>
                ))}
              </div>
            </div>

            {/* Actions globales */}
            <div className="flex gap-2 pt-4 border-t">
              <ButtonDarkRomance
                variant="gradient-royal"
                className="flex items-center gap-2"
                onClick={() => {
                  setSearchQuery("From Blood and Ash");
                  toggleStatus(BookStatus.LU);
                  toggleGenre("fantasy");
                  setSortBy("note_generale");
                }}
              >
                <Search className="h-4 w-4" />
                Preset Demo
              </ButtonDarkRomance>
              
              {hasActiveFilters && (
                <ButtonDarkRomance
                  variant="outline-crimson"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Effacer tout
                </ButtonDarkRomance>
              )}
            </div>

            {/* Debug des filtres actuels */}
            <details className="space-y-2 pt-4 border-t">
              <summary className="cursor-pointer text-sm font-medium">
                Debug: Filtres actuels (BookFilters)
              </summary>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(getBookFilters(), null, 2)}
              </pre>
            </details>
          </div>
        </CardDarkRomanceContent>
      </CardDarkRomance>
    </div>
  );
}