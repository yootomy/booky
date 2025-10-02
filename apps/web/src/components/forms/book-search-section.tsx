"use client";

// =============================================================================
// 🔍 COMPOSANT DE RECHERCHE DE LIVRES POUR FORMULAIRE
// =============================================================================
// Section de recherche intégrée au formulaire d'ajout de livre
// Permet de rechercher et importer automatiquement les données dans le formulaire

import { useState } from "react";
import { SearchIcon, BookIcon, Loader2, ExternalLinkIcon, ChevronDown, ChevronUp, Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import { useSmartExternalSearch } from "@/hooks/use-external-search";
import { formatPublicationDate, getDefaultCoverUrl } from "@/utils/external-api";
import type { ExternalBookResult } from "@/types/api";

// =============================================================================
// 🎨 INTERFACES ET TYPES
// =============================================================================

interface BookSearchSectionProps {
  onBookSelect: (book: ExternalBookResult) => void;
  className?: string;
}

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL
// =============================================================================

export function BookSearchSection({ onBookSelect, className }: BookSearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"general" | 'title' | 'author' | 'isbn'>('general');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Hook de recherche externe (avec debounce intégré)
  const { 
    query,
    updateQuery,
    searchResults,
    isLoading,
    isError,
    error,
    refetch: performSearch
  } = useSmartExternalSearch('', {
    maxResults: 8, // Limiter les résultats pour la recherche intégrée
    preferredSource: "combined", // Recherche combinée
    searchType: searchType,
    debounceMs: 500
  });

  // Gérer la recherche
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Veuillez entrer un terme de recherche");
      return;
    }
    
    setIsExpanded(true);
    updateQuery(searchQuery);
  };

  // Gérer la sélection d'un livre
  const handleBookSelect = (book: ExternalBookResult) => {
    onBookSelect(book);
    setIsExpanded(false);
    toast.success('Livre sélectionné : ' + book.titre);
  };

  // Gérer l'appui sur Entrée
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Card className={className}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <SearchIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                    🚀 Recherche rapide
                  </CardTitle>
                  <CardDescription>
                    Importez automatiquement les informations depuis Google Books ou Open Library
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  Optionnel
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            
            {/* Type de recherche */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Rechercher par :</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('general')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    searchType === 'general'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔍 Général
                </button>
                <button
                  type= 'button'
                  onClick={() => setSearchType('title')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    searchType === "title"
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📖 Titre
                </button>
                <button
                  type='button'
                  onClick={() => setSearchType('author')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    searchType === 'author'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ✍️ Auteur
                </button>
                <button
                  type='button'
                  onClick={() => setSearchType('isbn')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    searchType === 'isbn'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔢 ISBN
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={
                    searchType === "general" ? "Rechercher un livre..." :
                    searchType === "title" ? "Titre du livre..." :
                    searchType === "author" ? "Nom de l'auteur..." :
                    "Code ISBN (978-...)..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <SearchIcon className="w-4 h-4 mr-2" />
                )}
                Rechercher
              </Button>
            </div>

            {/* Gestion des erreurs */}
            {isError && error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  Erreur lors de la recherche : {error instanceof Error ? error.message : "Erreur inconnue"}
                </AlertDescription>
              </Alert>
            )}

            {/* Résultats de recherche */}
            {searchResults && ("totalResults" in searchResults ? searchResults.totalResults > 0 : searchResults.totalItems > 0) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {("totalResults" in searchResults ? searchResults.totalResults : searchResults.totalItems)} résultat{(('totalResults' in searchResults ? searchResults.totalResults : searchResults.totalItems) > 1) ? 's' : ''} trouvé{(('totalResults' in searchResults ? searchResults.totalResults : searchResults.totalItems) > 1) ? 's' : ''}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {searchResults.executionTime}ms
                  </Badge>
                </div>
                
                <ScrollArea className="h-96 pr-4">
                  <div className='grid gap-3'>
                    {('combinedResults' in searchResults ? searchResults.combinedResults : searchResults.items).map((book, index) => (
                      <Card key={`${book.source}-${book.identifiant_externe || book.id}`} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex space-x-4">
                            {/* Image de couverture */}
                            <div className="w-16 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {book.image_couverture ? (
                                <img 
                                  src={book.image_couverture} 
                                  alt={book.titre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display="none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML='<div class="text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>';
                                    }
                                  }}
                                />
                              ) : (
                                <BookIcon className="w-6 h-6 text-gray-400" />
                              )}
                            </div>

                            {/* Informations du livre */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="min-w-0 flex-1 pr-2">
                                  <h5 className="font-medium text-gray-900 truncate">
                                    {book.titre}
                                  </h5>
                                  <p className="text-sm text-gray-600 truncate">
                                    {book.auteur}
                                  </p>
                                </div>
                                <Badge 
                                  variant="outline"
                                  className={book.source === "google_books" 
                                    ? "border-blue-200 text-blue-700 bg-blue-50" 
                                    : "border-green-200 text-green-700 bg-green-50"
                                  }
                                >
                                  {book.source === "google_books" ? "Google Books" : "Open Library"}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                                  {book.date_publication && (
                                    <span>📅 {formatPublicationDate(book.date_publication)}</span>
                                  )}
                                  {book.editeur && (
                                    <span>🏢 {book.editeur}</span>
                                  )}
                                  {book.nombre_pages && (
                                    <span>📄 {book.nombre_pages} pages</span>
                                  )}
                                  {book.langue && (
                                    <span>🌍 {(() => {
                                      const langNames: { [key: string]: string } = {
                                        'en': 'Anglais', 'fr': 'Français', 'es': 'Espagnol',
                                        'de': 'Allemand', 'it': 'Italien', 'pt' : 'Portugais'
                                      };
                                      return langNames[book.langue.toLowerCase()] || book.langue.toUpperCase();
                                    })()}</span>
                                  )}
                                  {book.isbn && (
                                    <span className="col-span-2">🔢 ISBN: {book.isbn}</span>
                                  )}
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => handleBookSelect(book)}
                                  className="ml-2"
                                >
                                  <Import className="w-3 h-3 mr-1" />
                                  Utiliser
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Aucun résultat */}
            {searchResults && (('totalResults' in searchResults && searchResults.totalResults === 0) || ('totalItems' in searchResults && searchResults.totalItems === 0)) && (
              <Alert>
                <BookIcon className="w-4 h-4" />
                <AlertDescription>
                  Aucun livre trouvé pour "{searchQuery}". Vous pouvez remplir le formulaire manuellement ci-dessous.
                </AlertDescription>
              </Alert>
            )}

            {/* Info sur les sources */}
            <div className="text-xs text-gray-500 border-t pt-3">
              <p className="flex items-center">
                <ExternalLinkIcon className="w-3 h-3 mr-1" />
                Recherche dans Google Books et Open Library
              </p>
            </div>

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}