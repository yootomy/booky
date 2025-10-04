'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { booksApi, categoriesApi, tagsApi } from '@/utils/orpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookCard } from '@/components/books/book-card';
import { transformBookForCard } from '@/utils/book-transformer';
import { CategoryBadge } from '@/components/categories';
import { 
  Search, 
  BookOpen, 
  Tag, 
  Grid3X3,
  Filter,
  X,
  Clock,
  TrendingUp,
  Hash,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import debounce from 'lodash/debounce';
import type { BookFilters, TagType } from '@/types/api';
import { TAG_TYPE_ICONS, TAG_TYPE_LABELS } from '@/types/tag';

interface SearchResult {
  type: 'book' | 'category' | 'tag';
  item: any;
  relevance?: number;
}

interface SearchHistory {
  query: string;
  timestamp: number;
  results_count: number;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeQuery, setActiveQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'all' | 'books' | 'categories' | 'tags'>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem('booky-search-history');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse search history: ", e);
      }
    }
  }, []);

  // Sauvegarder dans localStorage
  const saveSearchHistory = useCallback((newHistory: SearchHistory[]) => {
    setSearchHistory(newHistory);
    localStorage.setItem("booky-search-history", JSON.stringify(newHistory));
  }, []);

  // Recherche de livres
  const { data: booksResponse, isLoading: booksLoading } = useQuery({
    queryKey: ['search-books', activeQuery],
    queryFn: () => booksApi.search(activeQuery, {
      include_categories: true,
      include_tags: true,
      limit: 20
    }),
    enabled: !!activeQuery && (searchType === 'all' || searchType === 'books'),
  });

  // Recherche de catégories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['search-categories', activeQuery],
    queryFn: () => categoriesApi.getAll({
      q: activeQuery,
      include_stats: true,
      limit: 10
    }),
    enabled: !!activeQuery && (searchType === 'all' || searchType === 'categories'),
  });

  // Recherche de tags
  const { data: tagsResponse, isLoading: tagsLoading } = useQuery({
    queryKey: ['search-tags', activeQuery],
    queryFn: () => tagsApi.getAll({
      q: activeQuery,
      include_stats: true,
      limit: 15
    }),
    enabled: !!activeQuery && (searchType === 'all' || searchType === 'tags'),
  });

  // Générer des suggestions
  const generateSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      // Suggestions basées sur l'historique
      const historySuggestions = searchHistory
        .filter(h => h.query.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .map(h => h.query);

      // Suggestions prédéfinies
      const predefinedSuggestions = [
        'Dark Romance',
        'Enemies to Lovers',
        'Mafia Romance',
        'Urban Fantasy',
        'Paranormal',
        'Vampire',
        'Werewolf',
        'Second Chance',
        'Age Gap',
        'Reverse Harem'
      ].filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
       .slice(0, 4);

      const allSuggestions = [...new Set([...historySuggestions, ...predefinedSuggestions])];
      setSuggestions(allSuggestions.slice(0, 6));
    }, 300),
    [searchHistory]
  );

  // Effet pour les suggestions
  useEffect(() => {
    generateSuggestions(query);
  }, [query, generateSuggestions]);

  // Combiner les résultats
  useEffect(() => {
    const combined: SearchResult[] = [];

    if (booksResponse?.data) {
      booksResponse.data.forEach((book) => {
        combined.push({
          type: 'book',
          item: book,
          relevance: calculateBookRelevance(book, activeQuery)
        });
      });
    }

    if (categoriesResponse?.data) {
      categoriesResponse.data.forEach((category) => {
        combined.push({
          type: 'category',
          item: category,
          relevance: calculateCategoryRelevance(category, activeQuery)
        });
      });
    }

    if (tagsResponse?.data) {
      tagsResponse.data.forEach((tag) => {
        combined.push({
          type: 'tag',
          item: tag,
          relevance: calculateTagRelevance(tag, activeQuery)
        });
      });
    }

    // Trier par pertinence
    combined.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    setResults(combined);
  }, [booksResponse, categoriesResponse, tagsResponse, activeQuery]);

  const calculateBookRelevance = (book: any, query: string): number => {
    const q = query.toLowerCase();
    let score = 0;
    
    if (book.titre.toLowerCase().includes(q)) score += 10;
    if (book.auteur.toLowerCase().includes(q)) score += 8;
    if (book.resume_perso?.toLowerCase().includes(q)) score += 5;
    if (book.categories?.some((cat: any) => cat.nom.toLowerCase().includes(q))) score += 6;
    if (book.tags?.some((tag: any) => tag.nom.toLowerCase().includes(q))) score += 7;
    
    return score;
  };

  const calculateCategoryRelevance = (category: any, query: string): number => {
    const q = query.toLowerCase();
    let score = 0;
    
    if (category.nom.toLowerCase().includes(q)) score += 10;
    if (category.description?.toLowerCase().includes(q)) score += 5;
    
    return score;
  };

  const calculateTagRelevance = (tag: any, query: string): number => {
    const q = query.toLowerCase();
    let score = 0;
    
    if (tag.nom.toLowerCase().includes(q)) score += 10;
    score += tag.utilisation_count * 0.1; // Boost par popularité
    
    return score;
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setActiveQuery(searchQuery);
    setShowSuggestions(false);
    
    // Ajouter à l'historique
    const newHistoryItem: SearchHistory = {
      query: searchQuery,
      timestamp: Date.now(),
      results_count: 0 // Will be updated when results come in
    };
    
    const updatedHistory = [
      newHistoryItem,
      ...searchHistory.filter(h => h.query !== searchQuery)
    ].slice(0, 10);
    
    saveSearchHistory(updatedHistory);

    // Mettre à jour l'URL
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    router.push('/search?${params.toString()}');
  };

  const clearSearch = () => {
    setQuery('');
    setActiveQuery('');
    setResults([]);
    setSuggestions([]);
    router.push('/search');
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('booky-search-history');
  };

  const isLoading = booksLoading || categoriesLoading || tagsLoading;

  return (
    <div className='container mx-auto py-8 px-4 max-w-6xl'>
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Recherche globale
        </h1>
        <p className="text-gray-300">
          Trouvez des livres, catégories et tags dans toute votre bibliothèque
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher des livres, catégories, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(query);
              }
              if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-10 h-12 text-lg"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && (query || searchHistory.length > 0) && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1">
            <CardContent className="p-2">
              {/* Historique récent */}
              {searchHistory.length > 0 && !query && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>Recherches récentes</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearHistory}>
                      Effacer
                    </Button>
                  </div>
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-8"
                      onClick={() => {
                        setQuery(item.query);
                        handleSearch(item.query);
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{item.query}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.results_count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && query && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Suggestions</span>
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-8"
                      onClick={() => {
                        setQuery(suggestion);
                        handleSearch(suggestion);
                      }}
                    >
                      <Search className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtres de type */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={searchType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchType("all")}
        >
          <Search className="h-4 w-4 mr-2" />
          Tout
        </Button>
        <Button
          variant={searchType === "books" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchType("books")}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Livres
        </Button>
        <Button
          variant={searchType === "categories" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchType("categories")}
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Catégories
        </Button>
        <Button
          variant={searchType === "tags" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchType("tags")}
        >
          <Tag className="h-4 w-4 mr-2" />
          Tags
        </Button>
      </div>

      {/* Résultats */}
      {activeQuery && (
        <div className="space-y-6">
          {/* En-tête des résultats */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Résultats pour "{activeQuery}"
              </h2>
              <p className="text-gray-400">
                {isLoading ? 'Recherche en cours...' : `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
              </p>
            </div>
            {activeQuery && (
              <Button variant="outline" onClick={clearSearch}>
                <X className="h-4 w-4 mr-2" />
                Effacer la recherche
              </Button>
            )}
          </div>

          {isLoading ? (
            // État de chargement
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-20 bg-gray-600 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length > 0 ? (
            // Résultats groupés par type
            <div className="space-y-8">
              {/* Livres */}
              {results.some(r => r.type === "book") && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Livres ({results.filter(r => r.type === "book").length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results
                      .filter(r => r.type === "book")
                      .slice(0, 9)
                      .map((result, index) => (
                        <BookCard key={`book-${index}`} book={transformBookForCard(result.item)} />
                      ))}
                  </div>
                </div>
              )}

              {/* Catégories */}
              {results.some(r => r.type === "category") && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                    <Grid3X3 className="h-5 w-5" />
                    <span>Catégories ({results.filter(r => r.type === "category").length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results
                      .filter(r => r.type === "category")
                      .slice(0, 6)
                      .map((result, index) => (
                        <Link key={`category-${index}`} href={`/categories/${result.item.id}`}>
                          <Card className="hover:bg-gray-800/50 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <CategoryBadge category={result.item} />
                                <div className="text-sm text-gray-400">
                                  {result.item._count?.books || 0} livres
                                </div>
                              </div>
                              {result.item.description && (
                                <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                  {result.item.description}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {results.some(r => r.type === "tag") && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Tags ({results.filter(r => r.type === "tag").length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results
                      .filter(r => r.type === "tag")
                      .slice(0, 20)
                      .map((result, index) => (
                        <Link key={`tag-${index}`} href={`/tags/${result.item.id}`}>
                          <Badge
                            variant="outline"
                            className="hover:scale-105 transition-transform cursor-pointer px-3 py-1"
                            style={{ borderColor: result.item.couleur }}
                          >
                            <span className="mr-1">{TAG_TYPE_ICONS[result.item.type as TagType]}</span>
                            {result.item.nom}
                            <span className="ml-1 text-xs opacity-75">
                              ({result.item.utilisation_count})
                            </span>
                          </Badge>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Aucun résultat
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucun résultat trouvé</h3>
              <p className="text-gray-400 mb-6">
                Essayez avec des termes différents ou vérifiez l&apos;orthographe
              </p>
              <div className="space-x-2">
                <Button variant="outline" onClick={clearSearch}>
                  Nouvelle recherche
                </Button>
                <Button variant="outline" onClick={() => setSearchType("all")}>
                  Rechercher dans tout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* État initial - Suggestions populaires */}
      {!activeQuery && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Recherches populaires</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "Dark Romance", "Enemies to Lovers", "Mafia Romance",
                  "Urban Fantasy", "Paranormal", "Vampire", "Werewolf",
                  "Second Chance", "Age Gap", "Reverse Harem"
                ].map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(term);
                      handleSearch(term);
                    }}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {searchHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Historique récent</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    Effacer tout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchHistory.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => {
                        setQuery(item.query);
                        handleSearch(item.query);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Search className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{item.query}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4 max-w-6xl"><div className="animate-pulse"><div className="h-8 bg-gray-600 rounded w-1/4 mb-4"></div><div className="h-12 bg-gray-700 rounded mb-6"></div></div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}