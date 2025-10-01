'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/utils/orpc';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useMobileContext } from '@/contexts/MobileContext';
import { MobileAwareLayout } from '@/components/mobile-aware-layout';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Book,
  Star,
  Calendar,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  RefreshCcw,
  X,
  Heart,
  Eye,
  Clock,
  TrendingUp
} from 'lucide-react';

// =============================================================================
// 📚 PAGE CATALOGUE DE LIVRES
// =============================================================================

interface BookFilters {
  search: string;
  statut: string;
  niveau_spicy: number[]; // Range avec slider
  niveau_dark: number[];  // Range avec slider
  note_min: number;
  note_max: number;
  auteur: string;
  genre: string;
  tags: string[]; // Changé de tag: string à tags: string[]
  rythme: string;
  collection: string; // Nouveau filtre pour les collections
  sort: string;
  order: string;
  page: number;
  limit: number;
  favoritesOnly: boolean; // Nouveau filtre pour les favoris uniquement
}

interface Book {
  id: string;
  titre: string;
  auteur: string;
  isbn?: string;
  image_couverture?: string;
  statut: 'LU' | 'EN_COURS' | 'A_LIRE';
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  rythme: 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';
  date_creation: string;
  date_lecture?: string;
  resume_personnel?: string;
  is_favorite?: boolean;
  views_count?: number;
  categories: Array<{
    id: string;
    nom: string;
    couleur: string;
    icone?: string;
  }>;
  tags: Array<{
    id: string;
    nom: string;
    couleur: string;
  }>;
}

interface BooksResponse {
  success: boolean;
  data: Book[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  search_info: {
    total_results: number;
    filters_applied: string[];
    execution_time_ms: number;
  };
}

const defaultFilters: BookFilters = {
  search: '',
  statut: 'ALL',
  niveau_spicy: [0, 10], // Range avec slider
  niveau_dark: [0, 10],  // Range avec slider
  note_min: 0,
  note_max: 10,
  auteur: '',
  genre: 'ALL',
  tags: [], // Changé de tag: 'ALL_TAGS' à tags: []
  rythme: 'ALL',
  collection: 'ALL', // Nouveau filtre pour les collections
  sort: 'date_creation',
  order: 'desc',
  page: 1,
  limit: 20,
  favoritesOnly: false
};

const statutOptions = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'LU', label: '📖 Lu' },
  { value: 'EN_COURS', label: '📚 En cours' },
  { value: 'A_LIRE', label: '📝 À lire' }
];

const rythmeOptions = [
  { value: 'ALL', label: 'Tous les rythmes' },
  { value: 'SLOW_BURN', label: '🔥 Slow Burn' },
  { value: 'MEDIUM_BURN', label: '⚡ Medium Burn' },
  { value: 'FAST_PACE', label: '🚀 Fast Pace' },
  { value: 'INSTA_LOVE', label: '💕 Insta Love' }
];

const sortOptions = [
  { value: 'date_creation', label: 'Date d\'ajout' },
  { value: 'titre', label: 'Titre' },
  { value: 'auteur', label: 'Auteur' },
  { value: 'note_generale', label: 'Note' },
  { value: 'date_lecture', label: 'Date de lecture' },
  { value: 'views_count', label: 'Popularité' },
  { value: 'trending', label: 'Tendance' }
];

// Skeleton Loader Component
const BookSkeleton = ({ viewMode }: { viewMode: 'grid' | 'list' }) => (
  <Card
    className={`overflow-hidden animate-pulse bg-card/95 backdrop-blur-xl border border-border shadow-lg ${
      viewMode === 'grid' ? 'book-card-grid' : 'h-32 flex'
    } !p-0'}
    style={{
      borderRadius: '20px'
    }}
  >
    {viewMode === 'grid' ? (
      <>
        {/* Image placeholder avec ratio 2:3 exact */}
        <div className="book-cover-container">
          <div className="w-full h-full bg-muted rounded-none" />
        </div>

        {/* Zone contenu exactement comme les vraies cartes */}
        <div className="book-content">
          <div className="mb-3">
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 bg-muted rounded w-8" />
              <div className="h-3 bg-muted rounded w-8" />
            </div>
          </div>
        </div>
      </>
    ) : (
      <CardContent className="!p-0 h-full flex">
        <div className="flex gap-4 p-4 h-full w-full">
          {/* Vignette 2:3 identique */}
          <div className="w-16 flex-shrink-0 relative overflow-hidden rounded bg-muted" style={{ aspectRatio: '2/3' }} />

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-3/4 mb-2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 bg-muted rounded w-8" />
                <div className="h-3 bg-muted rounded w-8" />
                <div className="h-3 bg-muted rounded w-8" />
              </div>
              <div className="h-4 bg-muted rounded w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    )}
  </Card>
);

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1
  },
  hover: { 
    y: -4, 
    scale: 1.02
  }
};

const heartVariants = {
  inactive: { scale: 1, rotate: 0 },
  active: { 
    scale: [1, 1.3, 1], 
    rotate: [0, -10, 10, 0]
  },
  hover: { scale: 1.1 }
};

function BooksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { viewMode, setViewMode } = useViewMode();
  const { isMobile } = useMobileContext();
  
  // Utiliser le hook useFavorites
  const { 
    favorites, 
    isLoading: favoritesLoading,
    hasInitialLoad,
    toggleFavorite, 
    isFavorite 
  } = useFavorites();

  // Debug: Log des favoris au changement
  useEffect(() => {
    console.log('BooksPageContent: Favorites updated:', Array.from(favorites));
  }, [favorites]);

  const [filters, setFilters] = useState<BookFilters>(defaultFilters);
  const [searchInput, setSearchInput] = useState('');

  // Scroll automatique en haut de page au chargement
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Initialiser les filtres depuis les paramètres d'URL
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const tagParam = searchParams.get('tag');
    const qParam = searchParams.get('q'); // Paramètre de recherche depuis l'URL
    const collectionParam = searchParams.get('collection'); // Paramètre de collection depuis l'URL

    if (categoryParam || tagParam || qParam || collectionParam) {
      const newFilters = { ...defaultFilters };

      if (categoryParam) {
        newFilters.genre = categoryParam;
      }

      if (tagParam) {
        newFilters.tags = [tagParam];
      }

      if (qParam) {
        newFilters.search = qParam;
        setSearchInput(qParam); // Aussi mettre à jour l'input de recherche
      }

      if (collectionParam) {
        newFilters.collection = collectionParam;
      }

      setFilters(newFilters);

      // Scroll en haut quand on arrive avec des paramètres URL
      window.scrollTo(0, 0);
    }
  }, [searchParams]);
  
  // Debounce sur l'input séparé pour éviter les re-renders
  const debouncedSearch = useDebounce(searchInput, 300);

  // Construire les paramètres de requête pour l'API
    const queryParams = useMemo(() => {
    const params: Record<string, string | string[]> = {
      page: filters.page.toString(),
      limit: filters.limit.toString(),
      sort: filters.sort,
      order: filters.order
    };

    // Ne pas envoyer de recherche si moins de 2 caractères (évite les requêtes inutiles)
    if (debouncedSearch && debouncedSearch.trim().length >= 2) {
      params.q = debouncedSearch.trim(); // Utiliser 'q' pour l'API de recherche
    }
    if (filters.statut && filters.statut !== 'ALL') params.statut = filters.statut;
    if (filters.auteur) params.auteur = filters.auteur;
    if (filters.genre && filters.genre !== 'ALL') params.category = filters.genre;
    if (filters.tags && filters.tags.length > 0) params.tag = filters.tags; // Passer l'array directement
    if (filters.rythme && filters.rythme !== 'ALL') params.rythme = filters.rythme;
    if (filters.collection && filters.collection !== 'ALL') params.liste_id = filters.collection;

    // Filtres numériques - utiliser les bons paramètres API
    if (filters.note_min !== 0) params.note_min = filters.note_min.toString();
    if (filters.note_max !== 10) params.note_max = filters.note_max.toString();
    
    // Filtres par niveaux avec ranges (nouveaux paramètres supportés)
    if (filters.niveau_spicy[0] > 0) params.niveau_spicy_min = filters.niveau_spicy[0].toString();
    if (filters.niveau_spicy[1] < 10) params.niveau_spicy_max = filters.niveau_spicy[1].toString();
    if (filters.niveau_dark[0] > 0) params.niveau_dark_min = filters.niveau_dark[0].toString();
    if (filters.niveau_dark[1] < 10) params.niveau_dark_max = filters.niveau_dark[1].toString();

    return params;
  }, [filters, debouncedSearch]);

  // Query pour récupérer les livres avec une clé plus spécifique
  const booksQuery = useQuery({
    queryKey: [
      'books',
      queryParams,
      // Ajouter des clés spécifiques pour forcer le refresh
      filters.collection,
      filters.search,
      filters.genre,
      filters.tags,
      debouncedSearch
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      // Construire les paramètres URL en gérant les arrays pour les tags
      Object.entries(queryParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Pour les tags, on ajoute chaque valeur séparément
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      });
      
      // Choisir l'endpoint selon les paramètres
      let endpoint;
      if (queryParams.q) {
        // API de recherche pour les recherches textuelles
        endpoint = '/api/proxy/search?${searchParams}';
      } else if (queryParams.liste_id) {
        // API spécifique pour les collections
        const listId = Array.isArray(queryParams.liste_id) ? queryParams.liste_id[0] : queryParams.liste_id;
        console.log('Using collection API for listId:', listId);

        // Retirer liste_id des paramètres pour cette API
        const paramsWithoutListId = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (key !== 'liste_id') {
            if (Array.isArray(value)) {
              value.forEach(v => paramsWithoutListId.append(key, v));
            } else {
              paramsWithoutListId.append(key, value);
            }
          }
        });
        endpoint = '/api/proxy/lists/${listId}/books?${paramsWithoutListId}';
      } else {
        // API books standard
        console.log('Using standard books API');
        endpoint = '/api/proxy/books?${searchParams}';
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      const data = await response.json();
      return data;
    },
    placeholderData: (previousData) => previousData, // Équivalent de keepPreviousData
    staleTime: 30000, // 30s - garde les données fraîches plus longtemps
    gcTime: 5 * 60 * 1000, // 5min - cache plus long (remplace cacheTime)
    refetchOnWindowFocus: false // Évite les refetch inutiles
  });

  // Force le refetch quand les filtres importants changent
  useEffect(() => {
    console.log('Filters changed, forcing refetch. Collection:', filters.collection);
    if (booksQuery.refetch) {
      booksQuery.refetch();
    }
  }, [filters.collection, filters.genre, filters.tags, debouncedSearch, booksQuery.refetch]);

  // Query pour récupérer les catégories (pour les filtres)
  const categoriesQuery = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/api/categories?est_actif=true&limit=100');
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      return await response.json();
    }
  });

  // Query pour récupérer les tags (pour les filtres)
  const tagsQuery = useQuery({
    queryKey: ['tags', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tags?limit=100');
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      return await response.json();
    }
  });

  // Query pour récupérer les collections
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await apiClient.get('/api/lists?est_publique=true&limit=100');
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      return await response.json();
    }
  });

  // Gestion des favoris avec authentification
  const handleFavoriteToggle = async (bookId: string) => {
    await toggleFavorite(bookId);
  };

  // Toggle pour afficher uniquement les favoris
  const handleFavoritesFilter = () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour voir vos favoris', {
        action: {
          label: 'Se connecter',
          onClick: () => {
            window.location.href = '/login';
          }
        }
      });
      return;
    }
    updateFilters({ favoritesOnly: !filters.favoritesOnly });
  };

  // Fonctions de mise à jour des filtres
  const updateFilters = useCallback((newFilters: Partial<BookFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset page
  }, []);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchInput(''); // Reset aussi la recherche
  };

  // Fonctions pour gérer la sélection multiple des tags
  const handleTagToggle = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(id => id !== tagId)
      : [...filters.tags, tagId];
    updateFilters({ tags: newTags });
  };

  const removeTag = (tagId: string) => {
    const newTags = filters.tags.filter(id => id !== tagId);
    updateFilters({ tags: newTags });
  };

  const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case 'LU': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'EN_COURS': return 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700';
      case 'A_LIRE': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}'}
      />
    ));
  };

  // Filtrer les livres en fonction des favoris si nécessaire
  // Gérer les différentes structures de réponse selon l'API utilisée
  const allBooks = useMemo(() => {
    if (!booksQuery.data) return [];

    // Pour l'API collections (/lists/{id}/books), les livres sont dans data.data.books
    if (booksQuery.data.data?.books && Array.isArray(booksQuery.data.data.books)) {
      console.log('Using collection API structure - books found:', booksQuery.data.data.books.length);
      return booksQuery.data.data.books;
    }

    // Pour les autres APIs, les livres sont dans data.data
    if (booksQuery.data.data && Array.isArray(booksQuery.data.data)) {
      console.log('Using standard API structure - books found:', booksQuery.data.data.length);
      return booksQuery.data.data;
    }

    // Fallback si la structure est différente
    console.warn('Structure de réponse inattendue:', booksQuery.data);
    return [];
  }, [booksQuery.data]);

  const books = useMemo(() => {
    console.log('BooksPageContent: Filtering books', {
      allBooksCount: allBooks.length,
      favoritesOnly: filters.favoritesOnly,
      isAuthenticated,
      favoritesCount: favorites.size,
      favoritesList: Array.from(favorites)
    });

    if (!filters.favoritesOnly || !isAuthenticated) {
      return allBooks;
    }
    
    // Filtrer uniquement les livres favoris
    console.log('=== FILTERING FAVORITES ===');
    console.log('Available books:', allBooks.map((b: any) => ({ id: b.id, titre: b.titre })));
    console.log('Current favorites:', Array.from(favorites));
    console.log('Book IDs type check:', allBooks.slice(0, 3).map((b: any) => ({ id: b.id, type: typeof b.id })));
    console.log('Favorite IDs type check:', Array.from(favorites).slice(0, 3).map((id: any) => ({ id, type: typeof id })));

    const filteredBooks = allBooks.filter((book: any) => {
      const isBookFavorite = isFavorite(book.id);
      console.log(`Checking book ${book.id} (${book.titre}): ${isBookFavorite ? 'FAVORITE' : 'not favorite'}');
      return isBookFavorite;
    });
    
    console.log('✅ Filtered ${filteredBooks.length} favorite books out of ${allBooks.length} total books');
    console.log('Favorite books found:', filteredBooks.map((b: any) => ({ id: b.id, titre: b.titre })));
    console.log('=== END FILTERING ===');
    
    return filteredBooks;
  }, [allBooks, filters.favoritesOnly, isAuthenticated, isFavorite, favorites.size]);

  // Gérer la pagination selon la structure de réponse
  const pagination = useMemo(() => {
    if (!booksQuery.data) return null;

    // Structure standard avec pagination
    if (booksQuery.data.pagination) {
      return booksQuery.data.pagination;
    }

    // Pour l'API collections, créer une pagination basique
    if (booksQuery.data.data?.books) {
      return {
        page: 1,
        limit: booksQuery.data.data.books.length,
        totalCount: booksQuery.data.data.books.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };
    }

    return null;
  }, [booksQuery.data]);

  const searchInfo = useMemo(() => {
    if (!booksQuery.data) return null;

    // Structure standard avec search_info
    if (booksQuery.data.search_info) {
      return booksQuery.data.search_info;
    }

    // Pour l'API collections, créer des infos basiques
    if (booksQuery.data.data?.books) {
      return {
        total_results: booksQuery.data.data.books.length,
        filters_applied: filters.collection !== 'ALL' ? ['collection'] : [],
        execution_time_ms: 0
      };
    }

    return null;
  }, [booksQuery.data, filters.collection]);
  const categories = categoriesQuery.data?.data || [];
  const tags = tagsQuery.data?.data || [];

  return (
    <MobileAwareLayout>

        <div className="relative z-10">

        {/* Header Hero Section - Style identique à /lists */}
        <div className="text-center mb-12 space-y-6 pt-8">
          <div className="space-y-4">
            <h1
              className="text-5xl md:text-6xl font-bold text-foreground"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Mon Catalogue de{' '}
              <span
                className="block mt-2"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Dark Romance
              </span>
            </h1>
            <p
              className="text-xl max-w-3xl mx-auto leading-relaxed text-foreground/80"
            >
              Explorez ma collection complète de romans captivants, où passion, mystère et émotions intenses
              se mêlent pour créer des histoires inoubliables.
            </p>
          </div>
        </div>

        <style jsx global>{'
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #a855f7, #ec4899);
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #9333ea, #db2777);
          }
          
          /* Cartes de livres avec ratio 2:3 fixe - ZÉRO espacement interne */
          .book-card-grid {
            display: flex;
            flex-direction: column;
            height: auto; /* Hauteur auto basée sur le ratio + contenu */
            padding: 0 !important; /* Force zéro padding */
            margin: 0; /* Zéro marge externe */
            gap: 0; /* Aucun gap entre les enfants flex */
            /* Assurer que l'image colle parfaitement partout */
          }
          
          /* Force suppression de tout espacement sur les enfants directs */
          .book-card-grid > * {
            margin: 0;
            padding: 0;
          }
          
          .book-card-grid > .book-cover-container {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Bloc média avec ratio 2:3 - ZÉRO marge/padding PARTOUT */
          .book-cover-container {
            aspect-ratio: 2/3; /* Ratio constant 2:3 portrait */
            width: 100%;
            height: auto;
            position: relative;
            overflow: hidden;
            background: transparent; /* Fond transparent pour ne jamais se voir */
            margin: 0; /* Zéro marge */
            margin-bottom: 0 !important; /* Force zéro marge en bas */
            padding: 0; /* Zéro padding */
            padding-bottom: 0 !important; /* Force zéro padding en bas */
            border: none; /* Aucune bordure */
            /* Coins supérieurs identiques à la carte */
            border-top-left-radius: inherit;
            border-top-right-radius: inherit;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            /* Assurer hauteur entière pour éviter sous-pixels */
            min-height: 1px;
          }
          
          /* Image de couverture - élément BLOC */
          .book-cover-image {
            display: block; /* Élément bloc pour supprimer baseline */
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            margin: 0; /* Aucune marge */
            padding: 0; /* Aucun padding */
            border: none; /* Aucune bordure */
            outline: none; /* Aucun outline */
            vertical-align: top; /* Supprimer espace baseline */
            transition: transform 0.3s ease;
          }
          
          /* Zoom au survol sans layout shift ni gap */
          .book-card-grid:hover .book-cover-image {
            transform: scale(1.02);
            transform-origin: center center; /* Centre pour éviter les gaps */
          }
          
          /* Placeholder avec même ratio - fond uniquement si nécessaire */
          .book-cover-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%);
            margin: 0;
            padding: 0;
            border: none;
          }
          
          /* Zone contenu fixe - DIRECTEMENT collée à l'image */
          .book-content {
            padding: 8px 12px 12px 12px; /* Petit padding-top seulement */
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 100px;
            margin: 0; /* Zéro marge */
            margin-top: 0 !important; /* Force zéro marge en haut */
            border: none; /* Aucune bordure */
            /* Coller directement à l'image */
            border-top: none;
          }
          
          /* Ellipsis pour les titres longs */
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* Overlays dans l'image - respectent les coins */
          .book-overlay {
            position: absolute;
            z-index: 10;
            margin: 0;
            padding: 0;
            /* S'assurer qu'ils n'ajoutent pas de fond */
          }
          
          /* Badges overlay - aucun fond supplémentaire */
          .book-overlay > * {
            box-shadow: none; /* Supprimer toute ombre qui créerait un halo */
          }
          
          /* Transitions pour le chargement des images */
          .book-cover-image {
            transition: opacity 0.3s ease-in-out;
          }

          .book-cover-placeholder {
            transition: opacity 0.3s ease-in-out;
          }

          /* Barre d'outils sticky - pleine largeur */
          .sticky-toolbar {
            backdrop-filter: blur(12px);
            transition: all 0.3s ease-in-out;
            width: 100%;
            /* Améliorer la visibilité */
            background: rgba(248, 250, 252, 0.95);
            border-bottom: 1px solid rgba(139, 69, 19, 0.1);
          }
          
          /* Effet au scroll pour plus de définition */
          .sticky-toolbar {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          
          .sticky-toolbar:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            background: rgba(248, 250, 252, 0.98);
          }
          
          /* Assurer que le contenu ne passe pas derrière */
          .main-content {
            position: relative;
            z-index: 1;
          }
        '}</style>
        <div className="container mx-auto max-w-7xl px-4 py-4">
        
        {/* Barre d'outils STICKY - Mobile Simple / Desktop Complète */}
        <div className="mb-6">
          <div
            className="sticky top-16 z-30 py-4 md:py-6 mx-2 md:-mx-4 px-4 md:px-8 mb-6 rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-lg"
          >
            {/* VERSION MOBILE - Simplifiée */}
            <div className="flex md:hidden items-center gap-3">
              {/* Recherche mobile */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-12 w-full pl-12 pr-6 rounded-full bg-background border-2 border-primary/20 text-foreground placeholder:text-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300 text-base"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Bouton Filtrer mobile */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="group px-4 py-3 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center gap-2 bg-card border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-medium text-base min-h-[48px] whitespace-nowrap"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Filter className="w-4 h-4" />
                <span>Filtrer</span>
                {(filters.statut !== 'ALL' || filters.genre !== 'ALL' || filters.tags.length > 0 ||
                  filters.auteur || filters.rythme !== 'ALL' || filters.note_min > 0 || filters.note_max < 10 ||
                  filters.niveau_spicy[0] > 0 || filters.niveau_spicy[1] < 10 ||
                  filters.niveau_dark[0] > 0 || filters.niveau_dark[1] < 10 || filters.favoritesOnly) && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* VERSION DESKTOP - Complète */}
            <div className="hidden md:flex flex-row items-center gap-3">
              {/* Recherche desktop */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type="text"
                  placeholder="Rechercher votre prochaine passion..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-14 w-80 pl-12 pr-6 rounded-full bg-background border-2 border-primary/20 text-foreground placeholder:text-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300 text-sm"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Filtres rapides desktop */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="group px-6 py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center gap-3 bg-card border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-medium text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Filter className="w-4 h-4" />
                <span>Filtres</span>
                {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {(filters.statut !== 'ALL' || filters.genre !== 'ALL' || filters.tags.length > 0 ||
                  filters.auteur || filters.rythme !== 'ALL' || filters.note_min > 0 || filters.note_max < 10 ||
                  filters.niveau_spicy[0] > 0 || filters.niveau_spicy[1] < 10 ||
                  filters.niveau_dark[0] > 0 || filters.niveau_dark[1] < 10 || filters.favoritesOnly) && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              {/* Tri rapide desktop */}
              <Select
                value={filters.sort}
                onValueChange={(value) => updateFilters({ sort: value })}
              >
                <SelectTrigger className="w-40 h-12 bg-background border-border text-foreground text-sm">
                  <SortAsc className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ order: filters.order === 'asc' ? 'desc' : 'asc' })}
                className="h-10 px-2"
                title={`Trier par ordre ${filters.order === 'asc' ? 'décroissant' : 'croissant'}'}
              >
                {filters.order === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* Mode d'affichage desktop */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                  title="Vue en grille"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                  title="Vue en liste"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Favoris desktop */}
              <button
                onClick={handleFavoritesFilter}
                disabled={!isAuthenticated || (favoritesLoading && !hasInitialLoad)}
                className={`group px-6 py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base ${
                  filters.favoritesOnly
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                    : 'bg-card border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50'
                }'}
                style={{ fontFamily: 'Inter, sans-serif' }}
                title={isAuthenticated ?
                  (filters.favoritesOnly ? "Afficher tous les livres" : "Afficher uniquement mes favoris") :
                  "Connectez-vous pour voir vos favoris"
                }
              >
                <Heart className={`w-4 h-4 ${filters.favoritesOnly ? 'fill-current' : ''}'} />
                <span>
                  {filters.favoritesOnly ? 'Mes favoris (${favorites.size})' : 'Favoris'}
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible Filters Panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="bg-card/95 backdrop-blur-xl border border-border shadow-xl rounded-3xl overflow-hidden relative z-40">
                  <CardContent className="p-3 md:p-8">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 md:mb-8">
                      <h3
                        className="font-bold flex items-center gap-3 text-xl text-foreground"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        <Filter className="w-5 h-5 text-primary" />
                        Filtres avancés
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-xs text-foreground/60 hover:text-primary"
                      >
                        <RefreshCcw className="w-3 h-3 mr-1" />
                        Réinitialiser
                      </Button>
                    </div>

                    {/* Filters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                      
                      {/* Status & Genre */}
                      <div className="space-y-3 md:space-y-4">
                        {/* Status Filter */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Statut</Label>
                          <Select
                            value={filters.statut}
                            onValueChange={(value) => updateFilters({ statut: value })}
                          >
                            <SelectTrigger className="h-11 md:h-9 text-base md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statutOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Genre Filter */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Genre</Label>
                          <Select
                            value={filters.genre}
                            onValueChange={(value) => updateFilters({ genre: value })}
                          >
                            <SelectTrigger className="h-11 md:h-9 text-base md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">Tous les genres</SelectItem>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.icone} {category.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Collection Filter */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Collection</Label>
                          <Select
                            value={filters.collection}
                            onValueChange={(value) => updateFilters({ collection: value })}
                          >
                            <SelectTrigger className="h-11 md:h-9 text-base md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">Toutes les collections</SelectItem>
                              {collectionsQuery.data?.success && collectionsQuery.data?.data?.map((collection: any) => (
                                <SelectItem key={collection.id} value={collection.id}>
                                  {collection.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tags & Author */}
                      <div className="space-y-3 md:space-y-4">
                        {/* Tags Selection */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            Tags ({filters.tags.length} sélectionné{filters.tags.length > 1 ? 's' : ''})
                          </Label>
                          
                          {/* Selected Tags */}
                          {filters.tags.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {filters.tags.slice(0, 3).map(tagId => {
                                  const tag = tags.find((t: any) => t.id === tagId);
                                  if (!tag) return null;
                                  return (
                                    <Badge 
                                      key={tagId}
                                      className="text-xs cursor-pointer"
                                      style={{ 
                                        backgroundColor: tag.couleur + '20',
                                        borderColor: tag.couleur,
                                        color: tag.couleur,
                                        border: '1px solid ${tag.couleur}'
                                      }}
                                      onClick={() => removeTag(tagId)}
                                    >
                                      {tag.nom}
                                      <X className="w-3 h-3 ml-1" />
                                    </Badge>
                                  );
                                })}
                                {filters.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{filters.tags.length - 3} autres
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Tag Selection Button */}
                          <Button
                            variant="outline"
                            className="w-full justify-center h-11 md:h-9 text-base md:text-sm"
                            onClick={() => setIsTagModalOpen(true)}
                          >
                            <Tag className="w-4 h-4 mr-2" />
                            Sélectionner les tags
                          </Button>
                        </div>

                        {/* Author Filter */}
                        <div>
                          <Label htmlFor="auteur-filter" className="text-sm font-medium mb-2 block">Auteur</Label>
                          <Input
                            id="auteur-filter"
                            type="text"
                            placeholder="Nom de l'auteur"
                            value={filters.auteur}
                            onChange={(e) => updateFilters({ auteur: e.target.value })}
                            className="h-11 md:h-9 text-base md:text-sm"
                          />
                        </div>
                      </div>

                      {/* Rating & Rhythm */}
                      <div className="space-y-3 md:space-y-4">
                        {/* Rating Range */}
                        <div>
                          <Label className="text-sm font-medium mb-3 block">
                            Note ({filters.note_min} - {filters.note_max})
                          </Label>
                          <div className="px-1">
                            <Slider
                              value={[filters.note_min, filters.note_max]}
                              onValueChange={([min, max]) => updateFilters({ note_min: min, note_max: max })}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full h-6 md:h-auto"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0</span>
                              <span>10</span>
                            </div>
                          </div>
                        </div>

                        {/* Rhythm Filter */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Rythme</Label>
                          <Select
                            value={filters.rythme}
                            onValueChange={(value) => updateFilters({ rythme: value })}
                          >
                            <SelectTrigger className="h-11 md:h-9 text-base md:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {rythmeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Levels */}
                      <div className="space-y-3 md:space-y-4">
                        {/* Spicy Level */}
                        <div>
                          <Label className="text-sm font-medium mb-3 block">
                            🌶️ Spicy ({filters.niveau_spicy[0]} - {filters.niveau_spicy[1]})
                          </Label>
                          <div className="px-1">
                            <Slider
                              value={filters.niveau_spicy}
                              onValueChange={(value) => updateFilters({ niveau_spicy: value })}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full h-6 md:h-auto"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0</span>
                              <span>5</span>
                              <span>10</span>
                            </div>
                          </div>
                        </div>

                        {/* Dark Level */}
                        <div>
                          <Label className="text-sm font-medium mb-3 block">
                            🖤 Dark ({filters.niveau_dark[0]} - {filters.niveau_dark[1]})
                          </Label>
                          <div className="px-1">
                            <Slider
                              value={filters.niveau_dark}
                              onValueChange={(value) => updateFilters({ niveau_dark: value })}
                              max={10}
                              min={0}
                              step={1}
                              className="w-full h-6 md:h-auto"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0</span>
                              <span>5</span>
                              <span>10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content */}
        <div className="main-content">
            
            {/* Compteur + Filtres actifs */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              {/* Compteur de résultats */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground font-medium">
                  <strong>{searchInfo?.total_results || books.length}</strong> livre{(searchInfo?.total_results || books.length) > 1 ? 's' : ''} trouvé{(searchInfo?.total_results || books.length) > 1 ? 's' : ''}
                </span>
                {booksQuery.isFetching && (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              {/* Chips des filtres actifs */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filtre de recherche */}
                {debouncedSearch && (
                  <Badge 
                    variant="secondary" 
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 cursor-pointer gap-1"
                    onClick={() => setSearchInput('')}
                  >
                    Recherche: "{debouncedSearch}"
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Filtre de statut */}
                {filters.statut !== 'ALL' && (
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer gap-1"
                    onClick={() => updateFilters({ statut: 'ALL' })}
                  >
                    Statut: {statutOptions.find(s => s.value === filters.statut)?.label}
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Filtre de genre */}
                {filters.genre !== 'ALL' && (
                  <Badge 
                    variant="secondary" 
                    className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer gap-1"
                    onClick={() => updateFilters({ genre: 'ALL' })}
                  >
                    Genre: {categories.find((c: any) => c.id === filters.genre)?.nom || 'Sélectionné'}
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Filtre tags */}
                {filters.tags.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer gap-1"
                    onClick={() => updateFilters({ tags: [] })}
                  >
                    {filters.tags.length === 1
                      ? `Tag: ${tags.find((t: any) => t.id === filters.tags[0])?.nom || 'Sélectionné'}'
                      : 'Tags (${filters.tags.length})'
                    }
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Filtre collection */}
                {filters.collection !== 'ALL' && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer gap-1"
                    onClick={() => updateFilters({ collection: 'ALL' })}
                  >
                    Collection: {collectionsQuery.data?.data?.find((c: any) => c.id === filters.collection)?.nom || 'Sélectionnée'}
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Filtre auteur */}
                {filters.auteur && (
                  <Badge 
                    variant="secondary" 
                    className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 cursor-pointer gap-1"
                    onClick={() => updateFilters({ auteur: '' })}
                  >
                    Auteur: {filters.auteur}
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Filtre note */}
                {(filters.note_min > 0 || filters.note_max < 10) && (
                  <Badge 
                    variant="secondary" 
                    className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 cursor-pointer gap-1"
                    onClick={() => updateFilters({ note_min: 0, note_max: 10 })}
                  >
                    Note: {filters.note_min}-{filters.note_max}
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Filtre favoris */}
                {filters.favoritesOnly && (
                  <Badge 
                    variant="secondary" 
                    className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer gap-1"
                    onClick={() => updateFilters({ favoritesOnly: false })}
                  >
                    Mes favoris
                    <X className="w-3 h-3" />
                  </Badge>
                )}

                {/* Bouton "Effacer tout" */}
                {(debouncedSearch || filters.statut !== 'ALL' || filters.genre !== 'ALL' || 
                  filters.tags.length > 0 || filters.auteur || filters.note_min > 0 || 
                  filters.note_max < 10 || filters.favoritesOnly || filters.rythme !== 'ALL' ||
                  filters.niveau_spicy[0] > 0 || filters.niveau_spicy[1] < 10 ||
                  filters.niveau_dark[0] > 0 || filters.niveau_dark[1] < 10) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetFilters();
                      setSearchInput('');
                    }}
                    className="h-7 px-2 text-gray-500 hover:text-gray-700 text-xs"
                  >
                    <RefreshCcw className="w-3 h-3 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>
            </div>

            {/* Loading with Skeletons */}
            {booksQuery.isLoading && !booksQuery.data && (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6'
                : 'space-y-4'
              }>
                {Array.from({ length: 12 }).map((_, i) => (
                  <BookSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            )}

            {/* Error */}
            {booksQuery.isError && (
              <div className="text-center py-12">
                <p className="text-red-600">Erreur lors du chargement des livres</p>
                <Button 
                  variant="outline" 
                  onClick={() => booksQuery.refetch()}
                  className="mt-4"
                >
                  Réessayer
                </Button>
              </div>
            )}

            {/* Books Grid */}
            {(!booksQuery.isLoading || booksQuery.data) && !booksQuery.isError && (
              <>
                {books.length === 0 ? (
                  <div className="text-center py-12">
                    <Book className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Aucun livre trouvé</h3>
                    <p className="text-foreground/70">
                      Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
                    </p>
                  </div>
                ) : (
                  <motion.div 
                    className={viewMode === 'grid' 
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6'
                      : 'space-y-4'
                    }
                    initial="hidden"
                    animate="visible"
                  >
                    <AnimatePresence mode="popLayout">
                      {books.map((book: Book, index: number) => {
                        const bookIsFavorite = isFavorite(book.id);
                        return (
                          <motion.div
                            key={book.id}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            layout
                            transition={{ delay: index * 0.05 }}
                            className="relative group"
                          >

                            <Link href={'/books/${book.id}'}>
                              <Card
                                className={`overflow-hidden cursor-pointer bg-card/95 backdrop-blur-xl border border-border shadow-lg ${
                                  viewMode === 'grid' ? 'book-card-grid' : 'h-32 flex'
                                } !p-0 group-hover:scale-105 transition-all duration-300'}
                                style={{
                                  borderRadius: '20px',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 21, 56, 0.15)';
                                  e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 21, 56, 0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.1)';
                                }}
                              >
                                {viewMode === 'grid' ? (
                                  /* Vue grille : Structure optimale avec ratio 2:3 */
                                  <>
                                    {/* Bloc média avec ratio 2:3 fixe */}
                                    <div className="book-cover-container">
                                      {/* Placeholder/fallback avec même ratio - toujours visible au début */}
                                      <div className="book-cover-placeholder">
                                        <Book className="w-12 h-12 text-purple-400" />
                                      </div>

                                      {book.image_couverture ? (
                                        <img
                                          src={book.image_couverture}
                                          alt={'${book.titre} — ${book.auteur}'}
                                          className="book-cover-image opacity-0"
                                          loading={index < 6 ? 'eager' : 'lazy'}
                                          onLoad={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.opacity = '1';
                                            const placeholder = target.previousElementSibling as HTMLElement;
                                            if (placeholder) {
                                              placeholder.style.opacity = '0';
                                              setTimeout(() => {
                                                placeholder.style.display = 'none';
                                              }, 300);
                                            }
                                          }}
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      ) : null}

                                      {/* Overlays dans l'image */}

                                    </div>

                                    {/* Zone contenu fixe sous l'image */}
                                    <div className="book-content">
                                      {/* En-tête : titre et auteur - DIRECTEMENT sous l'image */}
                                      <div className="mb-3">
                                        <h3 className="font-semibold text-sm line-clamp-2 mb-2 transition-colors leading-tight m-0 text-foreground">
                                          {book.titre}
                                        </h3>
                                        <p className="text-xs line-clamp-1 m-0 text-foreground/70">
                                          {book.auteur}
                                        </p>
                                      </div>

                                      {/* Pied : rangée méta sur une ligne */}
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-foreground/60">
                                          {book.note_generale > 0 && (
                                            <span className="flex items-center gap-0.5" title="Note générale" style={{ color: '#B8860B' }}>
                                              <Star className="w-3 h-3 fill-current" />
                                              {book.note_generale}
                                            </span>
                                          )}
                                          <span title="Niveau Spicy" className="flex items-center gap-0.5">
                                            🔥{book.niveau_spicy}
                                          </span>
                                          <span title="Niveau Dark" className="flex items-center gap-0.5">
                                            🖤{book.niveau_dark}
                                          </span>
                                          <span title="Romance" className="flex items-center gap-0.5">
                                            💖{book.niveau_romance}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  /* Vue liste : Structure horizontale compacte avec vignette 2:3 */
                                  <CardContent className="!p-0 h-full flex">
                                    <div className="flex gap-4 p-4 h-full w-full">
                                      {/* Vignette 2:3 à gauche */}
                                      <div className="w-16 flex-shrink-0 relative overflow-hidden rounded" style={{ aspectRatio: '2/3' }}>
                                        {book.image_couverture ? (
                                          <img 
                                            src={book.image_couverture} 
                                            alt={'${book.titre} — ${book.auteur}'}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.src = '';
                                              target.style.display = 'none';
                                              const placeholder = target.nextElementSibling as HTMLElement;
                                              if (placeholder) placeholder.style.display = 'flex';
                                            }}
                                          />
                                        ) : null}
                                        
                                        <div className={`absolute inset-0 bg-muted flex items-center justify-center ${book.image_couverture ? 'hidden' : ''}'}>
                                          <Book className="w-4 h-4 text-foreground/40" />
                                        </div>

                                      </div>

                                      {/* Info livre */}
                                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        {/* En-tête */}
                                        <div>
                                          <h3 className="font-semibold text-base text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                            {book.titre}
                                          </h3>
                                          <p className="text-sm text-foreground/70 line-clamp-1 mb-2 flex items-center">
                                            <User className="w-3 h-3 mr-1" />
                                            {book.auteur}
                                          </p>
                                        </div>

                                        {/* Pied */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 text-sm text-foreground/60">
                                            {book.note_generale > 0 && (
                                              <span className="flex items-center gap-1" title="Note générale" style={{ color: '#B8860B' }}>
                                                <Star className="w-3 h-3 fill-current" />
                                                {book.note_generale}
                                              </span>
                                            )}
                                            <span title="Niveau Spicy">🔥{book.niveau_spicy}</span>
                                            <span title="Niveau Dark">🖤{book.niveau_dark}</span>
                                            <span title="Romance">💖{book.niveau_romance}</span>
                                          </div>

                                          {/* Favorite Button for list view */}
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleFavoriteToggle(book.id);
                                            }}
                                            className="p-1 rounded-full hover:bg-background/50 transition-colors"
                                            title={bookIsFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                                            aria-label={bookIsFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                                          >
                                            <Heart
                                              className={`w-4 h-4 transition-colors ${
                                                bookIsFavorite
                                                  ? 'fill-red-500 text-red-500'
                                                  : 'text-gray-600 hover:text-red-500'
                                              }'}
                                            />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={!pagination.hasPreviousPage}
                      onClick={() => updateFilters({ page: filters.page - 1 })}
                    >
                      Précédent
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {/* Première page */}
                      {pagination.page > 3 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({ page: 1 })}
                          >
                            1
                          </Button>
                          {pagination.page > 4 && <span className="px-2">...</span>}
                        </>
                      )}
                      
                      {/* Pages autour de la page courante */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const startPage = Math.max(1, pagination.page - 2);
                        const pageNumber = startPage + i;
                        if (pageNumber > pagination.totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={pagination.page === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateFilters({ page: pageNumber })}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                      
                      {/* Dernière page */}
                      {pagination.page < pagination.totalPages - 2 && (
                        <>
                          {pagination.page < pagination.totalPages - 3 && <span className="px-2">...</span>}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFilters({ page: pagination.totalPages })}
                          >
                            {pagination.totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      disabled={!pagination.hasNextPage}
                      onClick={() => updateFilters({ page: filters.page + 1 })}
                    >
                      Suivant
                    </Button>
                    
                    {/* Info pagination */}
                    <div className="ml-4 text-sm text-foreground/70">
                      Page {pagination.page} sur {pagination.totalPages}
                      ({pagination.totalCount} livre{pagination.totalCount > 1 ? 's' : ''} au total)
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-4"
            style={{
              height: '100vh',
              height: '100dvh',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              className="w-full h-full md:h-auto overflow-hidden md:rounded-lg md:max-w-lg md:w-full md:max-h-[80vh] md:border md:mx-4 flex flex-col md:bg-card"
              style={{
                height: '100vh',
                height: '100dvh',
                maxHeight: '100vh',
                maxHeight: '100dvh',
                background: 'var(--background)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-border bg-muted">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Filtres et options
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 md:max-h-[calc(80vh-160px)]">
                <div className="p-4 md:p-6 space-y-6">

                  {/* Favoris */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Affichage</Label>
                    <button
                      onClick={handleFavoritesFilter}
                      disabled={!isAuthenticated || (favoritesLoading && !hasInitialLoad)}
                      className={`w-full p-4 rounded-xl transition-all duration-300 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                        filters.favoritesOnly
                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                          : 'bg-muted hover:bg-muted/80 border border-border'
                      }' }
                    >
                      <div className="flex items-center gap-3">
                        <Heart className={`w-5 h-5 ${filters.favoritesOnly ? 'fill-current' : 'text-primary'}' } />
                        <div className="text-left">
                          <div className="font-medium">
                            {filters.favoritesOnly ? 'Mes favoris (${favorites.size})' : 'Afficher mes favoris'}
                          </div>
                          <div className="text-sm opacity-75">
                            {filters.favoritesOnly ? 'Affichage des favoris uniquement' : 'Afficher tous les livres'}
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        filters.favoritesOnly ? 'bg-background border-primary' : 'border-primary'
                      }'}>
                        {filters.favoritesOnly && (
                          <div className="w-full h-full rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Tri et Ordre */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Tri</Label>
                    <div className="space-y-3">
                      <Select
                        value={filters.sort}
                        onValueChange={(value) => updateFilters({ sort: value })}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SortAsc className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Trier par..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Button
                          variant={filters.order === 'asc' ? 'default' : 'outline'}
                          onClick={() => updateFilters({ order: 'asc' })}
                          className="flex-1 h-12"
                        >
                          <SortAsc className="w-4 h-4 mr-2" />
                          Croissant
                        </Button>
                        <Button
                          variant={filters.order === 'desc' ? 'default' : 'outline'}
                          onClick={() => updateFilters({ order: 'desc' })}
                          className="flex-1 h-12"
                        >
                          <SortDesc className="w-4 h-4 mr-2" />
                          Décroissant
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mode d'affichage */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Vue</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        onClick={() => setViewMode('grid')}
                        className="flex-1 h-12"
                      >
                        <Grid className="w-4 h-4 mr-2" />
                        Grille
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        onClick={() => setViewMode('list')}
                        className="flex-1 h-12"
                      >
                        <List className="w-4 h-4 mr-2" />
                        Liste
                      </Button>
                    </div>
                  </div>

                  {/* Filtres avancés - Section collapsible */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Filtres avancés</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-primary hover:text-primary/80"
                      >
                        <RefreshCcw className="w-4 h-4 mr-1" />
                        Réinitialiser
                      </Button>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Statut</Label>
                      <Select
                        value={filters.statut}
                        onValueChange={(value) => updateFilters({ statut: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statutOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Genre Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Genre</Label>
                      <Select
                        value={filters.genre}
                        onValueChange={(value) => updateFilters({ genre: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Tous les genres</SelectItem>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.icone} {category.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Collection Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Collection</Label>
                      <Select
                        value={filters.collection}
                        onValueChange={(value) => updateFilters({ collection: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Toutes les collections</SelectItem>
                          {collectionsQuery.data?.success && collectionsQuery.data?.data?.map((collection: any) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rythme Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Rythme</Label>
                      <Select
                        value={filters.rythme}
                        onValueChange={(value) => updateFilters({ rythme: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rythmeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Author Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Auteur</Label>
                      <Input
                        type="text"
                        placeholder="Nom de l'auteur"
                        value={filters.auteur}
                        onChange={(e) => updateFilters({ auteur: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    {/* Tags Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Tags ({filters.tags.length} sélectionné{filters.tags.length > 1 ? 's' : ''})
                      </Label>
                      <Button
                        variant="outline"
                        className="w-full justify-center h-11"
                        onClick={() => {
                          setIsTagModalOpen(true);
                          setIsMobileFiltersOpen(false);
                        }}
                      >
                        <Tag className="w-4 h-4 mr-2" />
                        Sélectionner les tags
                      </Button>
                      {filters.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {filters.tags.slice(0, 3).map(tagId => {
                            const tag = tags.find((t: any) => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <Badge
                                key={tagId}
                                className="text-xs cursor-pointer"
                                style={{
                                  backgroundColor: tag.couleur + '20',
                                  borderColor: tag.couleur,
                                  color: tag.couleur,
                                  border: '1px solid ${tag.couleur}'
                                }}
                                onClick={() => removeTag(tagId)}
                              >
                                {tag.nom}
                                <X className="w-3 h-3 ml-1" />
                              </Badge>
                            );
                          })}
                          {filters.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{filters.tags.length - 3} autres
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rating Range */}
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">
                        Note ({filters.note_min} - {filters.note_max})
                      </Label>
                      <Slider
                        value={[filters.note_min, filters.note_max]}
                        onValueChange={([min, max]) => updateFilters({ note_min: min, note_max: max })}
                        max={10}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Spicy Level */}
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">
                        🌶️ Spicy ({filters.niveau_spicy[0]} - {filters.niveau_spicy[1]})
                      </Label>
                      <Slider
                        value={filters.niveau_spicy}
                        onValueChange={(value) => updateFilters({ niveau_spicy: value })}
                        max={10}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Dark Level */}
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">
                        🖤 Dark ({filters.niveau_dark[0]} - {filters.niveau_dark[1]})
                      </Label>
                      <Slider
                        value={filters.niveau_dark}
                        onValueChange={(value) => updateFilters({ niveau_dark: value })}
                        max={10}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Protection complète Safari */}
              <div
                className="border-t border-border"
                style={{
                  background: 'var(--background)',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 100
                }}
              >
                <div className="p-4 md:p-6" style={{ background: 'var(--muted)' }}>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="flex-1 h-12"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="flex-1 h-12 bg-primary hover:bg-primary/90"
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>
                {/* Zone Safari avec background opaque complet */}
                <div
                  className="md:hidden"
                  style={{
                    height: 'max(3rem, env(safe-area-inset-bottom, 3rem))',
                    background: 'var(--background)',
                    width: '100%',
                    position: 'relative',
                    zIndex: 101
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags Selection Modal */}
      <AnimatePresence>
        {isTagModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
            onClick={() => setIsTagModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-hidden border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                    <Tag className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                    Sélectionner les tags
                  </h3>
                  <div className="flex items-center gap-2">
                    {filters.tags.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateFilters({ tags: [] })}
                        className="text-red-500 hover:text-red-700"
                      >
                        Tout effacer
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTagModalOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {filters.tags.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {filters.tags.length} tag{filters.tags.length > 1 ? 's' : ''} sélectionné{filters.tags.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Selected Tags */}
              {filters.tags.length > 0 && (
                <div className="p-3 md:p-4 bg-muted border-b border-border">
                  <div className="text-xs text-foreground/60 mb-2">Tags sélectionnés:</div>
                  <div className="flex flex-wrap gap-2">
                    {filters.tags.map(tagId => {
                      const tag = tags.find((t: any) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <Badge 
                          key={tagId}
                          className="text-sm cursor-pointer"
                          style={{ 
                            backgroundColor: tag.couleur + '20',
                            borderColor: tag.couleur,
                            color: tag.couleur,
                            border: '1px solid ${tag.couleur}'
                          }}
                          onClick={() => removeTag(tagId)}
                        >
                          {tag.nom}
                          <X className="w-4 h-4 ml-1" />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags Grid */}
              <div className="p-3 md:p-4 overflow-y-auto max-h-80 md:max-h-96">
                <div className="grid grid-cols-1 gap-2">
                  {tags.map((tag: any) => {
                    const isSelected = filters.tags.includes(tag.id);
                    return (
                      <div 
                        key={tag.id} 
                        className={'
                          flex items-center justify-between p-4 md:p-3 rounded-lg cursor-pointer transition-all duration-200 touch-manipulation
                          ${isSelected
                            ? 'bg-primary/10 border-2 border-primary/20 shadow-sm'
                            : 'border-2 border-transparent hover:bg-muted hover:border-border active:bg-muted'
                          }
                        '}
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm" 
                            style={{backgroundColor: tag.couleur}}
                          />
                          <span className={`font-medium text-base md:text-sm ${isSelected ? 'text-primary' : 'text-foreground'}'}>
                            {tag.nom}
                          </span>
                        </div>
                        <div className={'
                          w-7 h-7 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all
                          ${isSelected
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground hover:border-primary'
                          }
                        '}>
                          {isSelected && (
                            <motion.div 
                              className="w-3.5 h-3.5 md:w-3 md:h-3 bg-background rounded-full" 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 md:p-4 border-t border-border bg-muted">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground/60">
                    {tags.length} tags disponibles
                  </div>
                  <Button
                    onClick={() => setIsTagModalOpen(false)}
                    className="bg-primary hover:bg-primary/90 h-11 md:h-9 text-base md:text-sm px-6 md:px-4"
                  >
                    Terminé
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileAwareLayout>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Chargement du catalogue...</p>
        </div>
      </div>
    }>
      <BooksPageContent />
    </Suspense>
  );
}