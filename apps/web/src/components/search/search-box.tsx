'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Book, 
  User, 
  Tag, 
  Folder, 
  ChevronRight, 
  X,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSearchSuggestions, SuggestionItem } from '@/hooks/use-search-suggestions';

interface SearchBoxProps {
  className?: string;
  placeholder?: string;
  onSearchComplete?: (query: string) => void;
  variant?: 'default' | 'compact';
}

export function SearchBox({ 
  className, 
  placeholder = "Rechercher un livre, un auteur...",
  onSearchComplete,
  variant = 'default'
}: SearchBoxProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const {
    suggestions,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    clearSuggestions,
    selectedIndex,
    setSelectedIndex,
  } = useSearchSuggestions({
    debounceMs: 300,
    minQueryLength: 2,
    maxSuggestions: 8,
  });

  // Afficher les suggestions si on a du texte, qu'on est focus et qu'on a des résultats
  const shouldShowSuggestions = isFocused && searchTerm.length >= 2 && (suggestions.length > 0 || isLoading);

  // Fonction pour surligner les termes qui matchent
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
          {part}
        </mark>
      ) : part
    );
  }, []);

  // Fonction pour obtenir l'icône selon le type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book': return <Book className="h-4 w-4 text-blue-500" />;
      case 'author': return <User className="h-4 w-4 text-green-500" />;
      case 'tag': return <Tag className="h-4 w-4 text-orange-500" />;
      case 'category': return <Folder className="h-4 w-4 text-purple-500" />;
      default: return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  // Fonction pour obtenir le libellé du type
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'book': return 'Livre';
      case 'author': return 'Auteur';
      case 'tag': return 'Tag';
      case 'category': return 'Catégorie';
      default: return '';
    }
  };

  // Gestion des touches clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0;
        setSelectedIndex(nextIndex);
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1;
        setSelectedIndex(prevIndex);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (searchTerm.trim()) {
          handleSearch(searchTerm);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          const suggestion = suggestions[selectedIndex];
          const text = suggestion.title || suggestion.name || suggestion.label || '';
          setSearchTerm(text);
          setSelectedIndex(-1);
        }
        break;
    }
  }, [shouldShowSuggestions, suggestions, selectedIndex, searchTerm]);

  // Gestion du clic sur une suggestion
  const handleSuggestionClick = useCallback((suggestion: SuggestionItem) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);

    switch (suggestion.type) {
      case 'book':
        router.push(`/books/${suggestion.id}`);
        break;
      
      case 'author':
        router.push(`/books?author=${encodeURIComponent(suggestion.name || '')}`);
        break;
      
      case 'tag':
        router.push(`/books?tag=${suggestion.id}`);
        break;
      
      case 'category':
        router.push(`/books?category=${suggestion.id}`);
        break;
    }

    onSearchComplete?.(searchTerm);
  }, [router, searchTerm, onSearchComplete]);

  // Gestion de la recherche complète
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
    router.push(`/books?q=${encodeURIComponent(query.trim())}`);
    onSearchComplete?.(query);
  }, [router, onSearchComplete]);

  // Gestion du focus/blur
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Délai pour permettre les clics sur les suggestions
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  // Gestion de la soumission du formulaire
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  // Effacer la recherche
  const handleClear = useCallback(() => {
    setSearchTerm('');
    clearSuggestions();
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [setSearchTerm, clearSuggestions]);

  // Scroll automatique pour la suggestion sélectionnée
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <div className={cn("relative w-full max-w-lg", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "pl-10 pr-20", 
              variant === 'compact' ? 'h-9' : 'h-11'
            )}
            role="combobox"
            aria-expanded={shouldShowSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-owns={shouldShowSuggestions ? 'search-suggestions' : undefined}
            aria-activedescendant={
              selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
            }
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0 hover:bg-transparent"
                aria-label="Effacer la recherche"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              aria-label="Rechercher"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Liste des suggestions */}
      {shouldShowSuggestions && (
        <div 
          ref={suggestionsRef}
          id="search-suggestions"
          className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border rounded-md shadow-lg max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Suggestions de recherche"
        >
          {isLoading && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Recherche en cours...</span>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && searchTerm.length >= 2 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Aucun résultat pour "{searchTerm}"
              </p>
              <p className="text-xs text-muted-foreground">
                Essayez avec d'autres termes ou parcourez les catégories
              </p>
            </div>
          )}

          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.id}`}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors",
                index === selectedIndex 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-muted"
              )}
              onMouseDown={(e) => e.preventDefault()} // Empêche le blur avant le clic
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex-shrink-0">
                {getTypeIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">
                    {suggestion.type === 'book' && suggestion.title && 
                      highlightMatch(suggestion.title, searchTerm)
                    }
                    {(suggestion.type === 'author' || suggestion.type === 'tag' || suggestion.type === 'category') && 
                      (suggestion.name || suggestion.label) &&
                      highlightMatch(suggestion.name || suggestion.label || '', searchTerm)
                    }
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getTypeLabel(suggestion.type)}
                  </Badge>
                </div>
                
                {suggestion.type === 'book' && suggestion.author && (
                  <p className="text-sm text-muted-foreground truncate">
                    par {highlightMatch(suggestion.author, searchTerm)}
                  </p>
                )}
              </div>

              {suggestion.type === 'book' && suggestion.cover && (
                <div className="flex-shrink-0">
                  <img
                    src={suggestion.cover}
                    alt=""
                    className="w-8 h-10 object-cover rounded"
                  />
                </div>
              )}
            </div>
          ))}

          {suggestions.length > 0 && (
            <div className="px-4 py-2 bg-muted/50 border-t">
              <p className="text-xs text-muted-foreground text-center">
                ↑↓ pour naviguer • Entrée pour sélectionner • Tab pour compléter
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}