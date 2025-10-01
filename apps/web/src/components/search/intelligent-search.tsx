"use client";

// =============================================================================
// 🔍 COMPOSANT DE RECHERCHE INTELLIGENTE AVEC AUTOCOMPLETE
// =============================================================================
// Recherche avancée avec suggestions en temps réel, historique et filtres intelligents
// Combine recherche locale et API externes avec cache optimisé

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  SearchIcon, 
  FilterIcon, 
  HistoryIcon, 
  TrendingUpIcon, 
  BookIcon, 
  UserIcon, 
  TagIcon, 
  ClockIcon, 
  XIcon,
  CommandIcon,
  ArrowRightIcon,
  SparklesIcon
} from "lucide-react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useDebounce } from "@/hooks/use-debounce";
import { booksApi } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import type { Book } from "@/types/book";
import type { Category } from "@/types/category";
import type { Tag } from "@/types/tag";

// =============================================================================
// 🎨 INTERFACES ET TYPES
// =============================================================================

interface IntelligentSearchProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
  showExternalResults?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
}

interface SearchResult {
  type: 'book' | 'author' | 'category' | 'tag' | 'external';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  image?: string;
  url?: string;
}

interface SearchSuggestion {
  id: string;
  query: string;
  type: 'recent' | 'popular' | 'suggestion';
  count?: number;
  timestamp?: Date;
}

// =============================================================================
// 🔧 HOOKS ET UTILITAIRES
// =============================================================================

// Hook pour gérer l'historique de recherche
function useSearchHistory() {
  const [history, setHistory] = useState<SearchSuggestion[]>([]);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('booky-search-history');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        } catch (error) {
          console.error('Erreur lors du chargement de l\'historique:', error);
        }
      }
    }
  }, []);

  // Ajouter une recherche à l'historique
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setHistory(prev => {
      // Supprimer l'entrée existante si elle existe
      const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      
      // Ajouter la nouvelle entrée en tête
      const newHistory = [
        {
          id: Date.now().toString(),
          query: query.trim(),
          type: 'recent' as const,
          timestamp: new Date(),
        },
        ...filtered
      ].slice(0, 10); // Garder seulement les 10 dernières

      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('booky-search-history', JSON.stringify(newHistory));
      }

      return newHistory;
    });
  }, []);

  // Supprimer une entrée de l'historique
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('booky-search-history', JSON.stringify(filtered));
      }
      return filtered;
    });
  }, []);

  // Vider l'historique
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('booky-search-history');
    }
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}

// Hook pour les suggestions intelligentes
function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      // Recherche dans les livres
      const booksResponse = await booksApi.search(debouncedQuery, { 
        limit: 5,
        include_categories: true,
        include_tags: true 
      });

      const results: SearchResult[] = [];

      // Ajouter les livres
      if (booksResponse.data) {
        booksResponse.data.forEach((book: Book) => {
          results.push({
            type: 'book',
            id: book.id,
            title: book.titre,
            subtitle: book.auteur,
            description: book.resume_personnel,
            image: book.image_couverture,
            url: '/books/${book.id}',
            metadata: {
              note: book.note_generale,
              statut: book.statut,
              categories: book.categories?.map(c => c.category.nom).join(', '),
            }
          });
        });
      }

      // Suggestions d'auteurs (extraits des livres)
      const authors = new Set<string>();
      booksResponse.data?.forEach((book: Book) => {
        if (book.auteur && book.auteur.toLowerCase().includes(debouncedQuery.toLowerCase())) {
          authors.add(book.auteur);
        }
      });

      authors.forEach(author => {
        results.push({
          type: 'author',
          id: 'author-${author}',
          title: author,
          subtitle: 'Auteur',
          url: '/books?author=${encodeURIComponent(author)}',
          metadata: { searchType: 'author' }
        });
      });

      return results.slice(0, 8); // Limiter à 8 résultats
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL
// =============================================================================

export function IntelligentSearch({
  className,
  placeholder = "Rechercher des livres, auteurs, genres...",
  onResultSelect,
  showExternalResults = false,
  maxSuggestions = 8,
  debounceMs = 300
}: IntelligentSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks personnalisés
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  const { data: suggestions = [], isLoading } = useSearchSuggestions(query);

  // Combiner toutes les suggestions
  const allSuggestions = [
    ...suggestions,
    ...(query.length < 2 ? history.slice(0, 5) : [])
  ];

  // Gérer la sélection d'un résultat
  const handleSelect = useCallback((result: SearchResult | SearchSuggestion) => {
    let finalQuery = '';
    let url = '';

    if ('query' in result) {
      // C'est un élément d'historique
      finalQuery = result.query;
      url = '/search?q=${encodeURIComponent(result.query)}';
    } else {
      // C'est un résultat de recherche
      finalQuery = result.title;
      url = result.url || '/search?q=${encodeURIComponent(result.title)}';
    }

    setQuery(finalQuery);
    addToHistory(finalQuery);
    setIsOpen(false);

    if (onResultSelect) {
      onResultSelect(result as SearchResult);
    } else {
      router.push(url as any);
    }
  }, [router, addToHistory, onResultSelect]);

  // Gérer la recherche directe
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    addToHistory(searchQuery);
    setIsOpen(false);

    const url = '/search?q=${encodeURIComponent(searchQuery)}';
    router.push(url as any);
  }, [router, addToHistory]);

  // Navigation au clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (allSuggestions[selectedIndex]) {
          handleSelect(allSuggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, allSuggestions, selectedIndex, handleSelect, handleSearch, query]);

  // Raccourcis clavier globaux
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K pour ouvrir la recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Input de recherche principal */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12"
          autoComplete="off"
        />
        
        {/* Raccourci clavier */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Kbd>⌘K</Kbd>
        </div>
      </div>

      {/* Dropdown des suggestions */}
      {isOpen && (
        <Card className="absolute top-14 left-0 right-0 z-50 shadow-lg border">
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              {/* Chargement */}
              {isLoading && query.length >= 2 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Recherche en cours...
                </div>
              )}

              {/* Aucun résultat */}
              {!isLoading && query.length >= 2 && suggestions.length === 0 && (
                <div className="p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">
                    Aucun résultat pour "{query}"
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSearch(query)}
                    className="text-xs"
                  >
                    <SearchIcon className="h-3 w-3 mr-1" />
                    Rechercher quand même
                  </Button>
                </div>
              )}

              {/* Résultats de suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-muted-foreground px-2 py-1 font-medium flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3" />
                    Suggestions
                  </div>
                  {suggestions.map((result, index) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      isSelected={index === selectedIndex}
                      onClick={() => handleSelect(result)}
                    />
                  ))}
                </div>
              )}

              {/* Séparateur */}
              {suggestions.length > 0 && history.length > 0 && query.length < 2 && (
                <Separator className="my-2" />
              )}

              {/* Historique */}
              {history.length > 0 && query.length < 2 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <HistoryIcon className="h-3 w-3" />
                      Recherches récentes
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearHistory}
                      className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Effacer
                    </Button>
                  </div>
                  {history.slice(0, 5).map((item, index) => (
                    <SearchHistoryItem
                      key={item.id}
                      item={item}
                      isSelected={suggestions.length + index === selectedIndex}
                      onClick={() => handleSelect(item)}
                      onRemove={() => removeFromHistory(item.id)}
                    />
                  ))}
                </div>
              )}

              {/* Actions rapides */}
              {query.trim() && (
                <>
                  <Separator className="my-2" />
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground px-2 py-1 font-medium">
                      Actions rapides
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm h-auto p-2"
                      onClick={() => handleSearch(query)}
                    >
                      <SearchIcon className="h-4 w-4 mr-2" />
                      Rechercher "{query}"
                      <ArrowRightIcon className="h-3 w-3 ml-auto" />
                    </Button>
                  </div>
                </>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Overlay pour fermer */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// 📖 COMPOSANT RÉSULTAT DE RECHERCHE
// =============================================================================

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}

function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const getIcon = () => {
    switch (result.type) {
      case 'book': return <BookIcon className="h-4 w-4" />;
      case 'author': return <UserIcon className="h-4 w-4" />;
      case 'category': return <TagIcon className="h-4 w-4" />;
      case 'tag': return <TagIcon className="h-4 w-4" />;
      default: return <SearchIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (result.type) {
      case 'book': return 'Livre';
      case 'author': return 'Auteur';
      case 'category': return 'Catégorie';
      case 'tag': return 'Tag';
      default: return 'Résultat';
    }
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left h-auto p-2 space-y-1",
        isSelected && "bg-muted"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3 w-full">
        {result.image ? (
          <img 
            src={result.image} 
            alt="" 
            className="w-8 h-10 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
            {getIcon()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{result.title}</span>
            <Badge variant="outline" className="text-xs">
              {getTypeLabel()}
            </Badge>
          </div>
          
          {result.subtitle && (
            <div className="text-sm text-muted-foreground truncate">
              {result.subtitle}
            </div>
          )}
          
          {result.metadata && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {result.metadata.categories && '${result.metadata.categories} • '}
              {result.metadata.note && 'Note: ${result.metadata.note}/10'}
            </div>
          )}
        </div>

        <ArrowRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Button>
  );
}

// =============================================================================
// 📝 COMPOSANT HISTORIQUE
// =============================================================================

interface SearchHistoryItemProps {
  item: SearchSuggestion;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function SearchHistoryItem({ item, isSelected, onClick, onRemove }: SearchHistoryItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md hover:bg-muted group",
      isSelected && "bg-muted"
    )}>
      <Button
        variant="ghost"
        className="flex-1 justify-start text-left h-auto p-0"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{item.query}</span>
        </div>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <XIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default IntelligentSearch;