"use client";

// =============================================================================
// 🔍 COMPOSANT DE RECHERCHE EXTERNE DE LIVRES
// =============================================================================
// Interface complète pour rechercher et importer des livres depuis Google Books
// et Open Library avec prévisualisation et options d'import personnalisées

import { useState } from "react";
import { SearchIcon, BookIcon, ImportIcon, Loader2, ExternalLinkIcon, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import {
  useSmartExternalSearch,
  useImportFromGoogleBooks,
  useImportFromOpenLibrary,
} from "@/hooks/use-external-search";
import { 
  formatPublicationDate, 
  getDefaultCoverUrl, 
  validateISBN,
  type BookImportOptions 
} from "@/utils/external-api";
import type { ExternalBookResult } from "@/types/api";

// =============================================================================
// 🎨 INTERFACES ET TYPES
// =============================================================================

interface ExternalBookSearchProps {
  onImportComplete?: (importedBook: any) => void;
  className?: string;
}

interface ImportDialogProps {
  book: ExternalBookResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (importedBook: any) => void;
}

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL DE RECHERCHE
// =============================================================================

export function ExternalBookSearch({ onImportComplete, className }: ExternalBookSearchProps) {
  const [searchType, setSearchType] = useState<"general" | 'title' | 'author' | 'isbn'>('general');
  const [selectedSource, setSelectedSource] = useState<'combined' | 'google_books' | 'open_library'>('combined');
  
  // Hook de recherche intelligente
  const {
    query,
    updateQuery,
    searchResults,
    isLoading,
    isError,
    error,
    refetch,
    source
  } = useSmartExternalSearch('', {
    preferredSource: selectedSource,
    searchType: searchType,
    maxResults: 20,
  });

  // État pour la sélection et l'import
  const [selectedBook, setSelectedBook] = useState<ExternalBookResult | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Gérer la sélection du type de recherche
  const handleSearchTypeChange = (type: string) => {
    setSearchType(type as any);
  };

  // Gérer la sélection de la source
  const handleSourceChange = (source: string) => {
    setSelectedSource(source as any);
  };

  // Ouvrir le dialog d'import
  const handleImportClick = (book: ExternalBookResult) => {
    setSelectedBook(book);
    setImportDialogOpen(true);
  };

  // Détecter automatiquement le type de recherche
  const detectSearchType = (query: string): 'general' | 'title' | 'author' | 'isbn' => {
    const trimmed = query.trim();
    
    // Détecter ISBN
    if (validateISBN(trimmed).valid) {
      return 'isbn';
    }
    
    // Si la requête contient "by" ou "par", considérer comme auteur
    if (trimmed.toLowerCase().includes(' by ') || trimmed.toLowerCase().includes(' par ')) {
      return 'author';
    }
    
    // Par défaut, recherche générale
    return 'general`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Interface de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Rechercher des livres en ligne
          </CardTitle>
          <CardDescription>
            Trouvez et importez des livres depuis Google Books et Open Library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par titre, auteur, ISBN ou mots-clés..."
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => refetch()} disabled={isLoading || !query.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Options de recherche */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Type de recherche</Label>
              <Select value={searchType} onValueChange={handleSearchTypeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="title">Titre</SelectItem>
                  <SelectItem value="author">Auteur</SelectItem>
                  <SelectItem value="isbn">ISBN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Source</Label>
              <Select value={selectedSource} onValueChange={handleSourceChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Toutes sources</SelectItem>
                  <SelectItem value="google_books">Google Books</SelectItem>
                  <SelectItem value="open_library">Open Library</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Indicateur de recherche automatique */}
          {query.trim() && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <InfoIcon className="h-3 w-3" />
              Type détecté automatiquement: {detectSearchType(query)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestion des erreurs */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erreur lors de la recherche: {error instanceof Error ? error.message : "Erreur inconnue"}
          </AlertDescription>
        </Alert>
      )}

      {/* Résultats de recherche */}
      {searchResults && (
        <div className="space-y-4">
          {/* En-tête des résultats */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookIcon className="h-5 w-5" />
              Résultats de recherche
            </h3>
            <Badge variant="secondary">
              {source === "combined" ? (
                searchResults.combinedResults ? 
                  `${searchResults.combinedResults.length}`résultats` : '0 résultats'
              ) : (
                'items` in searchResults && searchResults.items ? 
                  `${searchResults.items.length}`résultats`
                : `0 résultats'
              )}
            </Badge>
          </div>

          {/* Onglets pour les sources combinées */}
          {source === 'combined' && searchResults.googleBooks && searchResults.openLibrary ? (
            <Tabs defaultValue="combined" className="w-full">
              <TabsList>
                <TabsTrigger value="combined">
                  Tous ({searchResults.combinedResults?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="google">
                  Google Books ({
                    "googleBooks" in searchResults 
                      ? searchResults.googleBooks?.items?.length || 0 
                      : 0
                  })
                </TabsTrigger>
                <TabsTrigger value="openlibrary">
                  Open Library ({
                    "openLibrary" in searchResults 
                      ? searchResults.openLibrary?.items?.length || 0 
                      : 0
                  })
                </TabsTrigger>
              </TabsList>

              <TabsContent value="combined">
                <BookResultsList 
                  books={searchResults.combinedResults || []}
                  onImportClick={handleImportClick}
                />
              </TabsContent>

              <TabsContent value="google">
                <BookResultsList 
                  books={
                    "googleBooks" in searchResults 
                      ? searchResults.googleBooks?.items || [] 
                      : []
                  }
                  onImportClick={handleImportClick}
                />
              </TabsContent>

              <TabsContent value="openlibrary">
                <BookResultsList 
                  books={
                    'openLibrary' in searchResults 
                      ? searchResults.openLibrary?.items || [] 
                      : []
                  }
                  onImportClick={handleImportClick}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <BookResultsList 
              books={
                'items' in searchResults 
                  ? searchResults.items 
                  : 'combinedResults' in searchResults 
                    ? searchResults.combinedResults 
                    : []
              }
              onImportClick={handleImportClick}
            />
          )}
        </div>
      )}

      {/* Dialog d'import */}
      {selectedBook && (
        <ImportBookDialog
          book={selectedBook}
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportComplete={onImportComplete}
        />
      )}
    </div>
  );
}

// =============================================================================
// 📚 COMPOSANT LISTE DES RÉSULTATS
// =============================================================================

interface BookResultsListProps {
  books: ExternalBookResult[];
  onImportClick: (book: ExternalBookResult) => void;
}

function BookResultsList({ books, onImportClick }: BookResultsListProps) {
  if (!books.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
          <BookIcon className="h-12 w-12 opacity-60" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Aucun livre trouvé</h3>
        <p className="text-sm max-w-sm mx-auto">
          Essayez avec d'autres mots-clés, un titre d'auteur ou un ISBN pour de meilleurs résultats.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques des résultats */}
      <div className="flex items-center justify-between px-1 pb-2 border-b">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">
            {books.length} résultat{books.length > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(() => {
              const googleCount = books.filter(b => b.source === "google_books").length;
              const openLibCount = books.filter(b => b.source === 'open_library').length;
              const withCovers = books.filter(b => b.image_couverture).length;
              const withDescriptions = books.filter(b => b.resume_officiel && b.resume_officiel.length > 50).length;
              const withRatings = books.filter(b => b.note_moyenne && b.nombre_evaluations).length;
              const withCategories = books.filter(b => b.categories && b.categories.length > 0).length;
              
              return (
                <>
                  {googleCount > 0 && <span>📘 {googleCount} GB</span>}
                  {openLibCount > 0 && <span>📗 {openLibCount} OL</span>}
                  {withCovers > 0 && <span>🖼️ {withCovers}</span>}
                  {withDescriptions > 0 && <span>📝 {withDescriptions}</span>}
                  {withRatings > 0 && <span>⭐ {withRatings}</span>}
                  {withCategories > 0 && <span>🏷️ {withCategories}</span>}
                </>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* Liste des résultats avec scroll amélioré */}
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {books.map((book, index) => (
            <BookResultCard
              key={`${book.source}-${book.identifiant_externe}-${index}`}
              book={book}
              onImportClick={() => onImportClick(book)}
            />
          ))}
        </div>
        {/* Espacement en bas pour le scroll */}
        <div className="h-4" />
      </ScrollArea>
    </div>
  );
}

// =============================================================================
// 📖 COMPOSANT CARTE DE LIVRE
// =============================================================================

interface BookResultCardProps {
  book: ExternalBookResult;
  onImportClick: () => void;
}

function BookResultCard({ book, onImportClick }: BookResultCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Couverture améliorée */}
        <div className="flex-shrink-0 relative">
          <div className="w-20 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm relative`>
            {book.image_couverture && !imageError ? (
              <img
                src={book.image_couverture}
                alt={`Couverture de ${book.titre}`}
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-200 ${
                  imageLoaded ? `opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            ) : null}
            
            {/* Fallback avec message */}
            {(!book.image_couverture || imageError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                <BookIcon className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-500 font-medium leading-tight">
                  Pas de couverture
                </span>
              </div>
            )}
            
            {/* Loading state */}
            {book.image_couverture && !imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {/* Badges source et qualité */}
          <div className="absolute -top-1 -right-1 flex gap-1">
            <Badge 
              variant={book.source === "google_books" ? "default" : "secondary"} 
              className="text-[10px] px-1.5 py-0.5"
            >
              {book.source === "google_books" ? "GB" : "OL"}
            </Badge>
            {/* Badge qualité métadonnées */}
            {(() => {
              const hasPublisher = book.editeur && book.editeur !== "Éditeur inconnu";
              const hasPages = book.nombre_pages && book.nombre_pages > 0;
              const hasDescription = book.resume_officiel && book.resume_officiel.length > 50;
              const quality = [hasPublisher, hasPages, hasDescription].filter(Boolean).length;
              
              if (quality >= 2) {
                return (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 bg-green-50 text-green-600 border-green-200">
                    ✓
                  </Badge>
                );
              }
              return null;
            })()}
          </div>
        </div>

        {/* Informations restructurées */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Titre et auteur */}
          <div className="space-y-1">
            <h4 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
              {book.titre}
            </h4>
            <p className="text-sm text-muted-foreground font-medium">
              {book.auteur}
            </p>
          </div>

          {/* Métadonnées optimisées */}
          <div className="space-y-2">
            {/* Ligne 1: Éditeur et Date (seulement si disponibles et utiles) */}
            <div className="flex items-center gap-4 text-xs">
              {book.editeur && book.editeur !== "Éditeur inconnu" && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">📚</span>
                  <span className="text-muted-foreground truncate">{book.editeur}</span>
                </div>
              )}
              
              {book.date_publication && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">📅</span>
                  <span className="text-muted-foreground">
                    {book.date_publication.length === 4 ? book.date_publication : book.date_publication.slice(0, 4)}
                  </span>
                </div>
              )}
            </div>

            {/* Ligne 2: Pages et Langue (seulement si disponibles) */}
            <div className="flex items-center gap-4 text-xs">
              {book.nombre_pages && book.nombre_pages > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">📄</span>
                  <span className="text-muted-foreground">{book.nombre_pages}p</span>
                </div>
              )}
              
              {book.langue && book.langue !== "Langue inconnue" && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">🌍</span>
                  <span className="text-muted-foreground uppercase">{book.langue}</span>
                </div>
              )}
              
              {book.isbn && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">📟</span>
                  <span className="text-muted-foreground font-mono text-[10px]`>
                    {book.isbn.length > 13 ? `${book.isbn.slice(0, 13)}...` : book.isbn}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags/Catégories si disponibles */}
          {book.categories && book.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.categories.slice(0, 3).map((category, index) => (
                <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border-blue-200`>
                  {category.length > 15 ? `${category.slice(0, 15)}...` : category}
                </Badge>
              ))}
              {book.categories.length > 3 && (
                <span className="text-xs text-muted-foreground">+{book.categories.length - 3}</span>
              )}
            </div>
          )}

          {/* Note moyenne si disponible */}
          {book.note_moyenne && book.nombre_evaluations && (
            <div className="flex items-center gap-1 text-xs">
              <div className="flex`>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xs ${
                    i < Math.round(book.note_moyenne!) ? `text-yellow-400" : "text-gray-300"
                  }`}>⭐</span>
                ))}
              </div>
              <span className="text-muted-foreground">
                {book.note_moyenne.toFixed(1)} ({book.nombre_evaluations})
              </span>
            </div>
          )}

          {/* Description améliorée */}
          {book.resume_officiel && (
            <div className="bg-gray-50/50 rounded-md p-2 border-l-2 border-gray-200">
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed`>
                {book.resume_officiel.length > 200 
                  ? `${book.resume_officiel.slice(0, 200)}...` 
                  : book.resume_officiel}
              </p>
            </div>
          )}
        </div>

        {/* Actions verticales */}
        <div className="flex flex-col gap-2 flex-shrink-0 pt-1">
          <Button 
            onClick={onImportClick} 
            size="sm"
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <ImportIcon className="h-4 w-4 mr-1.5" />
            Importer
          </Button>
          
          <Button variant="outline" size="sm" asChild className="shadow-sm hover:shadow-md transition-shadow">
            <a 
              href={book.source === `google_books" 
                ? "https://books.google.com/books?id=${book.identifiant_externe}` : `https://openlibrary.org${book.identifiant_externe}`
              } 
              target="_blank" 
              rel="noopener noreferrer"
              title="Voir sur le site original"
            >
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// 📥 DIALOG D'IMPORT
// =============================================================================

function ImportBookDialog({ book, open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [importOptions, setImportOptions] = useState<BookImportOptions>({
    externalId: book.identifiant_externe,
    source: book.source,
    autoFillMetadata: true,
    downloadCover: true,
    createCategories: false,
    createTags: false,
    statut: "A_LIRE",
    noteGenerale: 0,
    niveauSpicy: 0,
    niveauDark: 0,
    niveauRomance: 0,
  });

  // Mutations d'import
  const importFromGoogle = useImportFromGoogleBooks();
  const importFromOpenLibrary = useImportFromOpenLibrary();

  // Gérer l'import
  const handleImport = async () => {
    try {
      if (book.source === 'google_books') {
        await importFromGoogle.mutateAsync({
          googleBooksId: book.identifiant_externe,
          options: importOptions,
        });
      } else {
        await importFromOpenLibrary.mutateAsync({
          openLibraryKey: book.identifiant_externe,
          options: importOptions,
        });
      }
      
      onOpenChange(false);
      onImportComplete?.({ ...book, importOptions });
    } catch (error) {
      console.error("Erreur import:", error);
    }
  };

  const isImporting = importFromGoogle.isPending || importFromOpenLibrary.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImportIcon className="h-5 w-5" />
            Importer "{book.titre}"
          </DialogTitle>
          <DialogDescription>
            Personnalisez les options d'import depuis {book.source === 'google_books' ? 'Google Books' : "Open Library`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aperçu du livre */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4`>
                <img
                  src={book.image_couverture || getDefaultCoverUrl(book.titre)}
                  alt={`Couverture de ${book.titre}`}
                  className="w-20 h-30 object-cover rounded"
                />
                <div className="space-y-1">
                  <h4 className="font-semibold">{book.titre}</h4>
                  <p className="text-sm text-muted-foreground">{book.auteur}</p>
                  {book.editeur && (
                    <p className="text-xs text-muted-foreground">{book.editeur}</p>
                  )}
                  {book.date_publication && (
                    <p className="text-xs text-muted-foreground">
                      {formatPublicationDate(book.date_publication)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options d`import */}
          <div className="space-y-4">
            <h4 className="font-medium">Options d"import</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-fill">Remplir automatiquement</Label>
                <Switch
                  id="auto-fill"
                  checked={importOptions.autoFillMetadata}
                  onCheckedChange={(checked) => 
                    setImportOptions(prev => ({ ...prev, autoFillMetadata: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="download-cover">Télécharger couverture</Label>
                <Switch
                  id="download-cover"
                  checked={importOptions.downloadCover}
                  onCheckedChange={(checked) => 
                    setImportOptions(prev => ({ ...prev, downloadCover: checked }))
                  }
                />
              </div>
            </div>

            {/* Statut de lecture */}
            <div className="space-y-2">
              <Label>Statut de lecture</Label>
              <Select 
                value={importOptions.statut}
                onValueChange={(value: any) => 
                  setImportOptions(prev => ({ ...prev, statut: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_LIRE">À lire</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="LU">Lu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes personnelles */}
            <div className="space-y-4">
              <Label>Évaluations personnelles</Label>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Note générale</Label>
                    <span className="text-sm text-muted-foreground">
                      {importOptions.noteGenerale}/10
                    </span>
                  </div>
                  <Slider
                    value={[importOptions.noteGenerale || 0]}
                    onValueChange={([value]) => 
                      setImportOptions(prev => ({ ...prev, noteGenerale: value }))
                    }
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Niveau Spicy 🌶️</Label>
                    <span className="text-sm text-muted-foreground">
                      {importOptions.niveauSpicy}/10
                    </span>
                  </div>
                  <Slider
                    value={[importOptions.niveauSpicy || 0]}
                    onValueChange={([value]) => 
                      setImportOptions(prev => ({ ...prev, niveauSpicy: value }))
                    }
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Niveau Dark 💀</Label>
                    <span className="text-sm text-muted-foreground">
                      {importOptions.niveauDark}/10
                    </span>
                  </div>
                  <Slider
                    value={[importOptions.niveauDark || 0]}
                    onValueChange={([value]) => 
                      setImportOptions(prev => ({ ...prev, niveauDark: value }))
                    }
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Niveau Romance ❤️</Label>
                    <span className="text-sm text-muted-foreground">
                      {importOptions.niveauRomance}/10
                    </span>
                  </div>
                  <Slider
                    value={[importOptions.niveauRomance || 0]}
                    onValueChange={([value]) => 
                      setImportOptions(prev => ({ ...prev, niveauRomance: value }))
                    }
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ImportIcon className="h-4 w-4 mr-2" />
              )}
              {isImporting ? "Import en cours..." : "Importer le livre'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExternalBookSearch;