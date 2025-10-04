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
  placeholder="Rechercher un livre, un auteur...",
  onSearchComplete,
  variant="default"
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

    const regex = new RegExp('(${query})', 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className={cn(
            "font-bold rounded px-1 py-0.5 transition-colors",
            "bg-primary/20 text-primary",
            "dark:bg-primary/30 dark:text-primary-foreground"
          )}
          style={{
            backgroundColor: "rgba(139, 21, 56, 0.15)",
            color: 'rgb(139, 21, 56)'
          }}
        >
          {part}
        </mark>
      ) : part
    );
  }, []);

  // Fonction pour obtenir l'icône selon le type
  const getTypeIcon = (type: string) => {
    const iconClass="h-4 w-4 transition-colors";
    switch (type) {
      case "book":
        return <Book className={cn(iconClass, "text-blue-600 dark:text-blue-400")} />;
      case "author":
        return <User className={cn(iconClass, "text-emerald-600 dark:text-emerald-400")} />;
      case "tag":
        return <Tag className={cn(iconClass, "text-amber-600 dark:text-amber-400")} />;
      case "category":
        return <Folder className={cn(iconClass, "text-violet-600 dark:text-violet-400")} />;
      default:
        return <Search className={cn(iconClass, "text-muted-foreground")} />;
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
      case "book":
        router.push(`/books/${suggestion.id}`);
        break;

      case "author":
        router.push(`/books?author=${encodeURIComponent(suggestion.name || '')}`);
        break;

      case "tag":
        router.push(`/books?tag=${suggestion.id}`);
        break;

      case "category":
        router.push('/books?category=${suggestion.id}');
        break;
    }

    onSearchComplete?.(searchTerm);
  }, [router, searchTerm, onSearchComplete]);

  // Gestion de la recherche complète
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
    router.push('/books?q=${encodeURIComponent(query.trim())}');
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
    <div className={cn('relative w-full max-w-lg', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-200",
            variant === "compact" ? 'h-3.5 w-3.5' : 'h-4 w-4',
            isFocused
              ? 'text-primary scale-110'
              : "text-muted-foreground group-hover:text-foreground"
          )} />

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
              "transition-all duration-300 border-2 rounded-xl font-medium",
              "pl-10 pr-20 bg-background/80 backdrop-blur-sm",
              "focus:bg-background focus:shadow-lg focus:shadow-primary/10",
              "hover:border-primary/20 focus:border-primary/40",
              "placeholder:text-muted-foreground/70",
              "dark:bg-background/60 dark:focus:bg-background/90",
              "dark:border-border dark:hover:border-primary/30",
              variant === "compact"
                ? "h-9 text-sm" : "h-11 text-base",
              // Mobile optimizations
              "text-base md:text-sm", // Prevent zoom on iOS
              "min-w-0" // Allow shrinking
            )}
            style={{
              WebkitAppearance: "none", // Remove iOS styling
              fontSize: "16px", // Prevent iOS zoom
            }}
            role="combobox"
            aria-expanded={shouldShowSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-owns={shouldShowSuggestions ? 'search-suggestions' : undefined}
            aria-activedescendant={
              selectedIndex >= 0 ? 'suggestion-${selectedIndex}' : undefined
            }
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className={cn(
                  "p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200",
                  "rounded-full opacity-70 hover:opacity-100",
                  variant === "compact" ? "h-5 w-5" : "h-6 w-6"
                )}
                aria-label="Effacer la recherche"
              >
                <X className={cn(
                  variant === "compact" ? "h-2.5 w-2.5" : "h-3 w-3"
                )} />
              </Button>
            )}

            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 transition-all duration-200 rounded-full",
                "hover:bg-primary/10 hover:text-primary",
                "active:scale-95",
                variant === "compact" ? "h-5 w-5" : "h-6 w-6"
              )}
              aria-label="Rechercher"
            >
              {isLoading ? (
                <Loader2 className={cn(
                  "animate-spin text-primary",
                  variant === "compact" ? "h-2.5 w-2.5" : "h-3 w-3"
                )} />
              ) : (
                <ChevronRight className={cn(
                  "group-hover:translate-x-0.5 transition-transform duration-200",
                  variant === "compact" ? "h-2.5 w-2.5" : "h-3 w-3"
                )} />
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
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-3 rounded-2xl shadow-2xl",
            "bg-background/95 backdrop-blur-xl border-2 border-border/50",
            "max-h-[60vh] md:max-h-80 overflow-y-auto",
            "dark:bg-background/90 dark:border-border/30",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200",
            // Mobile optimizations
            "mx-2 md:mx-0", // Add margin on mobile
          )}
          style={{
            boxShadow: "0 20px 60px rgba(139, 21, 56, 0.15), 0 8px 25px rgba(0, 0, 0, 0.08)",
          }}
          role="listbox"
          aria-label="Suggestions de recherche"
        >
          {isLoading && suggestions.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="font-medium">Recherche en cours...</span>
            </div>
          )}

          {error && (
            <div className="px-4 py-4 text-sm font-medium rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 m-2">
              {error}
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && searchTerm.length >= 2 && (
            <div className="px-6 py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-2">
                Aucun résultat pour "<span className="text-primary">{searchTerm}</span>"
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Essayez avec d'autres termes ou<br className='hidden sm:inline' />
                parcourez les catégories
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
                "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200",
                "border-b border-border/30 last:border-b-0",
                "first:rounded-t-2xl last:rounded-b-2xl",
                "active:scale-[0.98] md:active:scale-100", // Mobile touch feedback
                index === selectedIndex
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "hover:bg-muted/70 hover:shadow-sm"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-background/50">
                {getTypeIcon(suggestion.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm md:text-base truncate leading-tight">
                    {suggestion.type === "book" && suggestion.title &&
                      highlightMatch(suggestion.title, searchTerm)
                    }
                    {(suggestion.type === "author" || suggestion.type === "tag" || suggestion.type === "category") &&
                      (suggestion.name || suggestion.label) &&
                      highlightMatch(suggestion.name || suggestion.label || '', searchTerm)
                    }
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      "bg-background/80 border border-border/50",
                      "dark:bg-background/60"
                    )}
                  >
                    {getTypeLabel(suggestion.type)}
                  </Badge>
                </div>

                {suggestion.type === "book" && suggestion.author && (
                  <p className="text-xs md:text-sm text-muted-foreground truncate leading-tight">
                    par {highlightMatch(suggestion.author, searchTerm)}
                  </p>
                )}
              </div>

              {suggestion.type === "book" && suggestion.cover && (
                <div className="flex-shrink-0">
                  <img
                    src={suggestion.cover}
                    alt=""
                    className="w-7 h-9 md:w-8 md:h-10 object-cover rounded-lg shadow-sm border border-border/20"
                  />
                </div>
              )}
            </div>
          ))}

          {suggestions.length > 0 && (
            <div className="px-4 py-3 bg-muted/30 border-t border-border/30 rounded-b-2xl">
              <p className="text-xs text-muted-foreground text-center font-medium">
                <span className="hidden md:inline">↑↓ pour naviguer • Entrée pour sélectionner • Tab pour compléter</span>
                <span className="md:hidden">Tapez pour sélectionner</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}