"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchSuggestion {
  id: string;
  type: "book" | "author" | "tag" | "category";
  title: string;
  subtitle?: string;
  icon?: string;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  className?: string;
  showSuggestions?: boolean;
  recentSearches?: string[];
  popularSearches?: string[];
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder="Rechercher des livres, auteurs, genres...",
  onSearch,
  onSuggestionSelect,
  className,
  showSuggestions = true,
  recentSearches = [],
  popularSearches = [],
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Mock suggestions - in real app, this would call the API
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const mockSuggestions: SearchSuggestion[] = [
      {
        id: "1",
        type: "book",
        title: `"${searchQuery}" dans les titres`,
        subtitle: "Recherche dans tous les livres",
      },
      {
        id: "2",
        type: "author",
        title: `"${searchQuery}" dans les auteurs`,
        subtitle: "Recherche par auteur",
      },
      {
        id: "3",
        type: "tag",
        title: `"${searchQuery}" dans les tags`,
        subtitle: "Genres, tropes, triggers",
      },
      {
        id: "4",
        type: "category",
        title: `"${searchQuery}" dans les catégories`,
        subtitle: "Collections et catégories",
      },
    ];

    setSuggestions(mockSuggestions);
    setIsLoading(false);
  }, []);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery && isOpen) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, isOpen, fetchSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (!isOpen && value) {
      setIsOpen(true);
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    onSuggestionSelect?.(suggestion);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = suggestions.length + recentSearches.length + popularSearches.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : -1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : totalItems - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else {
            const recentIndex = selectedIndex - suggestions.length;
            if (recentIndex < recentSearches.length) {
              handleSearch(recentSearches[recentIndex]);
            } else {
              const popularIndex = recentIndex - recentSearches.length;
              handleSearch(popularSearches[popularIndex]);
            }
          }
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get suggestion type icon
  const getSuggestionTypeIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "book":
        return "📚";
      case "author":
        return "✍️";
      case "tag":
        return "🏷️";
      case "category":
        return "📁";
      default:
        return "🔍";
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10 dark-romance-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-center text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-r-transparent rounded-full mx-auto"></div>
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3",
                    selectedIndex === index && "bg-muted"
                  )}
                >
                  <span className="text-lg">{getSuggestionTypeIcon(suggestion.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {suggestion.title}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && !query && recentSearches.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Recherches récentes
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm",
                    selectedIndex === suggestions.length + index && "bg-muted"
                  )}
                >
                  {search}
                </button>
              ))}
            </div>
          )}

          {!isLoading && !query && popularSearches.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Recherches populaires
              </div>
              {popularSearches.slice(0, 5).map((search, index) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm",
                    selectedIndex === suggestions.length + recentSearches.length + index && "bg-muted"
                  )}
                >
                  {search}
                </button>
              ))}
            </div>
          )}

          {!isLoading && suggestions.length === 0 && query.length >= 2 && (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune suggestion trouvée</p>
              <p className="text-xs">Appuyez sur Entrée pour rechercher "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}