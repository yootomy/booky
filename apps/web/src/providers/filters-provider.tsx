/**
 * Provider de filtres pour les recherches de livres
 * Gestion centralisée des filtres, recherches et tri
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { BookFilters } from "@/types/api";
import { BookStatus, BookRhythm, TagType } from "@/types/api";

interface FiltersState {
  // Recherche textuelle
  searchQuery: string;
  
  // Filtres par statut et dates
  selectedStatuses: BookStatus[];
  dateFrom: string | null;
  dateTo: string | null;
  
  // Filtres par notes
  ratingFilters: {
    noteGeneraleMin: number | null;
    noteGeneraleMax: number | null;
    niveauSpicyMin: number | null;
    niveauSpicyMax: number | null;
    niveauDarkMin: number | null;
    niveauDarkMax: number | null;
    niveauRomanceMin: number | null;
    niveauRomanceMax: number | null;
  };
  
  // Filtres par métadonnées
  selectedGenres: string[]; // IDs des catégories
  selectedTags: string[]; // IDs des tags
  selectedTagTypes: TagType[];
  selectedAuthors: string[];
  selectedLanguages: string[];
  selectedRhythms: BookRhythm[];
  
  // Options de tri et pagination
  sortBy: string | null; // "titre", 'auteur', 'date_lecture', 'note_generale', etc.
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
  
  // Options d'affichage
  viewMode: 'grid' | 'list';
  includeRelations: boolean;
}

interface FiltersContextValue extends FiltersState {
  // Actions de base
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  
  // Actions pour les statuts
  toggleStatus: (status: BookStatus) => void;
  setStatuses: (statuses: BookStatus[]) => void;
  clearStatuses: () => void;
  
  // Actions pour les dates
  setDateRange: (from: string | null, to: string | null) => void;
  clearDateRange: () => void;
  
  // Actions pour les notes
  setRatingFilter: (type: keyof FiltersState['ratingFilters'], value: number | null) => void;
  clearRatingFilters: () => void;
  
  // Actions pour les genres et tags
  toggleGenre: (genreId: string) => void;
  setGenres: (genreIds: string[]) => void;
  clearGenres: () => void;
  
  toggleTag: (tagId: string) => void;
  setTags: (tagIds: string[]) => void;
  clearTags: () => void;
  
  setTagTypes: (types: TagType[]) => void;
  clearTagTypes: () => void;
  
  // Actions pour les auteurs et langues
  toggleAuthor: (author: string) => void;
  setAuthors: (authors: string[]) => void;
  clearAuthors: () => void;
  
  toggleLanguage: (language: string) => void;
  setLanguages: (languages: string[]) => void;
  clearLanguages: () => void;
  
  // Actions pour le rythme
  toggleRhythm: (rhythm: BookRhythm) => void;
  setRhythms: (rhythms: BookRhythm[]) => void;
  clearRhythms: () => void;
  
  // Actions de tri
  setSortBy: (sortBy: string | null) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleSortOrder: () => void;
  
  // Actions de pagination
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPagination: () => void;
  
  // Actions d'affichage
  setViewMode: (mode: 'grid' | 'list') => void;
  setIncludeRelations: (include: boolean) => void;
  
  // Actions globales
  clearAllFilters: () => void;
  resetFilters: () => void;
  
  // Utilitaires
  hasActiveFilters: boolean;
  getBookFilters: () => BookFilters;
  getUrlSearchParams: () => URLSearchParams;
  
  // Prédéfinis/favoris
  applyPresetFilter: (preset: FilterPreset) => void;
  savedPresets: FilterPreset[];
  saveCurrentAsPreset: (name: string) => void;
  deletePreset: (presetId: string) => void;
}

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Partial<FiltersState>;
  createdAt: string;
}

const defaultState: FiltersState = {
  searchQuery: "",
  selectedStatuses: [],
  dateFrom: null,
  dateTo: null,
  ratingFilters: {
    noteGeneraleMin: null,
    noteGeneraleMax: null,
    niveauSpicyMin: null,
    niveauSpicyMax: null,
    niveauDarkMin: null,
    niveauDarkMax: null,
    niveauRomanceMin: null,
    niveauRomanceMax: null,
  },
  selectedGenres: [],
  selectedTags: [],
  selectedTagTypes: [],
  selectedAuthors: [],
  selectedLanguages: [],
  selectedRhythms: [],
  sortBy: null,
  sortOrder: "desc",
  page: 1,
  limit: 20,
  viewMode: 'grid',
  includeRelations: true,
};

const FiltersContext = React.createContext<FiltersContextValue | null>(null);

interface FiltersProviderProps {
  children: React.ReactNode;
  syncWithUrl?: boolean; // Synchroniser avec l'URL
}

export function FiltersProvider({ children, syncWithUrl = false }: FiltersProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = typeof window !== 'undefined' ? useSearchParams() : null;
  
  const [state, setState] = React.useState<FiltersState>(defaultState);
  const [savedPresets, setSavedPresets] = React.useState<FilterPreset[]>([]);

  // Charger les presets sauvegardés depuis localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('booky-filter-presets');
      if (saved) {
        setSavedPresets(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des presets: ", error);
    }
  }, []);

  // Initialiser depuis l'URL si syncWithUrl est activé
  React.useEffect(() => {
    if (!syncWithUrl || !searchParams) return;
    
    try {
      const params = new URLSearchParams(searchParams);
      
      setState(prevState => ({
        ...prevState,
        searchQuery: params.get('q') || '',
        page: parseInt(params.get('page') || '1'),
        limit: parseInt(params.get('limit') || '20'),
        sortBy: params.get('sort') || null,
        sortOrder: (params.get('order') as 'asc' | 'desc') || 'desc',
        selectedStatuses: params.get('statuses')?.split(',').filter(Boolean) as BookStatus[] || [],
        selectedGenres: params.get('genres')?.split(',').filter(Boolean) || [],
        selectedTags: params.get('tags')?.split(',').filter(Boolean) || [],
        viewMode: (params.get('view') as 'grid' | 'list') || 'grid',
      }));
    } catch (error) {
      console.error("Erreur lors de l'initialisation des filtres depuis l'URL:", error);
    }
  }, [searchParams, syncWithUrl]);

  // Synchroniser avec l'URL quand les filtres changent
  const updateUrl = React.useCallback((newState: FiltersState) => {
    if (!syncWithUrl) return;
    
    const params = new URLSearchParams();
    
    if (newState.searchQuery) params.set('q', newState.searchQuery);
    if (newState.page > 1) params.set('page', newState.page.toString());
    if (newState.limit !== 20) params.set('limit', newState.limit.toString());
    if (newState.sortBy) params.set('sort', newState.sortBy);
    if (newState.sortOrder !== 'desc') params.set('order', newState.sortOrder);
    if (newState.selectedStatuses.length > 0) params.set('statuses', newState.selectedStatuses.join(','));
    if (newState.selectedGenres.length > 0) params.set('genres', newState.selectedGenres.join(','));
    if (newState.selectedTags.length > 0) params.set('tags', newState.selectedTags.join(','));
    if (newState.viewMode !== 'grid') params.set('view', newState.viewMode);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(newUrl, { scroll: false });
  }, [syncWithUrl, pathname, router]);

  // Actions de recherche
  const setSearchQuery = React.useCallback((query: string) => {
    const newState = { ...state, searchQuery: query, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const clearSearchQuery = React.useCallback(() => {
    const newState = { ...state, searchQuery: '', page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Actions pour les statuts
  const toggleStatus = React.useCallback((status: BookStatus) => {
    const newStatuses = state.selectedStatuses.includes(status)
      ? state.selectedStatuses.filter(s => s !== status)
      : [...state.selectedStatuses, status];
    
    const newState = { ...state, selectedStatuses: newStatuses, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const setStatuses = React.useCallback((statuses: BookStatus[]) => {
    const newState = { ...state, selectedStatuses: statuses, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const clearStatuses = React.useCallback(() => {
    const newState = { ...state, selectedStatuses: [], page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Actions pour les dates
  const setDateRange = React.useCallback((from: string | null, to: string | null) => {
    const newState = { ...state, dateFrom: from, dateTo: to, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const clearDateRange = React.useCallback(() => {
    const newState = { ...state, dateFrom: null, dateTo: null, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Actions pour les notes
  const setRatingFilter = React.useCallback((type: keyof FiltersState['ratingFilters'], value: number | null) => {
    const newState = {
      ...state,
      ratingFilters: { ...state.ratingFilters, [type]: value },
      page: 1
    };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const clearRatingFilters = React.useCallback(() => {
    const newState = {
      ...state,
      ratingFilters: defaultState.ratingFilters,
      page: 1
    };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Actions pour les genres
  const toggleGenre = React.useCallback((genreId: string) => {
    const newGenres = state.selectedGenres.includes(genreId)
      ? state.selectedGenres.filter(g => g !== genreId)
      : [...state.selectedGenres, genreId];
    
    const newState = { ...state, selectedGenres: newGenres, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const setGenres = React.useCallback((genreIds: string[]) => {
    const newState = { ...state, selectedGenres: genreIds, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const clearGenres = React.useCallback(() => {
    const newState = { ...state, selectedGenres: [], page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Actions pour les tags (similaire aux genres)
  const toggleTag = React.useCallback((tagId: string) => {
    const newTags = state.selectedTags.includes(tagId)
      ? state.selectedTags.filter(t => t !== tagId)
      : [...state.selectedTags, tagId];
    
    const newState = { ...state, selectedTags: newTags, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const setTags = React.useCallback((tagIds: string[]) => {
    const newState = { ...state, selectedTags: tagIds, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const clearTags = React.useCallback(() => {
    const newState = { ...state, selectedTags: [], page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Fonctions simplifiées pour les autres filtres
  const setTagTypes = React.useCallback((types: TagType[]) => {
    setState(prev => ({ ...prev, selectedTagTypes: types, page: 1 }));
  }, []);

  const clearTagTypes = React.useCallback(() => {
    setState(prev => ({ ...prev, selectedTagTypes: [], page: 1 }));
  }, []);

  const toggleAuthor = React.useCallback((author: string) => {
    setState(prev => ({
      ...prev,
      selectedAuthors: prev.selectedAuthors.includes(author)
        ? prev.selectedAuthors.filter(a => a !== author)
        : [...prev.selectedAuthors, author],
      page: 1
    }));
  }, []);

  const setAuthors = React.useCallback((authors: string[]) => {
    setState(prev => ({ ...prev, selectedAuthors: authors, page: 1 }));
  }, []);

  const clearAuthors = React.useCallback(() => {
    setState(prev => ({ ...prev, selectedAuthors: [], page: 1 }));
  }, []);

  const toggleLanguage = React.useCallback((language: string) => {
    setState(prev => ({
      ...prev,
      selectedLanguages: prev.selectedLanguages.includes(language)
        ? prev.selectedLanguages.filter(l => l !== language)
        : [...prev.selectedLanguages, language],
      page: 1
    }));
  }, []);

  const setLanguages = React.useCallback((languages: string[]) => {
    setState(prev => ({ ...prev, selectedLanguages: languages, page: 1 }));
  }, []);

  const clearLanguages = React.useCallback(() => {
    setState(prev => ({ ...prev, selectedLanguages: [], page: 1 }));
  }, []);

  const toggleRhythm = React.useCallback((rhythm: BookRhythm) => {
    setState(prev => ({
      ...prev,
      selectedRhythms: prev.selectedRhythms.includes(rhythm)
        ? prev.selectedRhythms.filter(r => r !== rhythm)
        : [...prev.selectedRhythms, rhythm],
      page: 1
    }));
  }, []);

  const setRhythms = React.useCallback((rhythms: BookRhythm[]) => {
    setState(prev => ({ ...prev, selectedRhythms: rhythms, page: 1 }));
  }, []);

  const clearRhythms = React.useCallback(() => {
    setState(prev => ({ ...prev, selectedRhythms: [], page: 1 }));
  }, []);

  // Actions de tri
  const setSortBy = React.useCallback((sortBy: string | null) => {
    const newState = { ...state, sortBy, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const setSortOrder = React.useCallback((order: "asc" | "desc") => {
    const newState = { ...state, sortOrder: order, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const toggleSortOrder = React.useCallback(() => {
    const newOrder: 'asc' | 'desc' = state.sortOrder === 'asc' ? "desc" : "asc";
    const newState = { ...state, sortOrder: newOrder, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Actions de pagination
  const setPage = React.useCallback((page: number) => {
    const newState = { ...state, page };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const setLimit = React.useCallback((limit: number) => {
    const newState = { ...state, limit, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const resetPagination = React.useCallback(() => {
    const newState = { ...state, page: 1 };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  // Actions d'affichage
  const setViewMode = React.useCallback((mode: 'grid' | 'list') => {
    const newState = { ...state, viewMode: mode };
    setState(newState);
    updateUrl(newState);
  }, [state, updateUrl]);

  const setIncludeRelations = React.useCallback((include: boolean) => {
    setState(prev => ({ ...prev, includeRelations: include }));
  }, []);

  // Actions globales
  const clearAllFilters = React.useCallback(() => {
    const newState = { ...defaultState, viewMode: state.viewMode, limit: state.limit };
    setState(newState);
    updateUrl(newState);
  }, [state.viewMode, state.limit, updateUrl]);

  const resetFilters = React.useCallback(() => {
    setState(defaultState);
    updateUrl(defaultState);
  }, [updateUrl]);

  // Utilitaires
  const hasActiveFilters = React.useMemo(() => {
    return (
      state.searchQuery !== '' ||
      state.selectedStatuses.length > 0 ||
      state.dateFrom !== null ||
      state.dateTo !== null ||
      Object.values(state.ratingFilters).some(value => value !== null) ||
      state.selectedGenres.length > 0 ||
      state.selectedTags.length > 0 ||
      state.selectedTagTypes.length > 0 ||
      state.selectedAuthors.length > 0 ||
      state.selectedLanguages.length > 0 ||
      state.selectedRhythms.length > 0
    );
  }, [state]);

  const getBookFilters = React.useCallback((): BookFilters => {
    return {
      q: state.searchQuery || undefined,
      statut: state.selectedStatuses.length > 0 ? state.selectedStatuses : undefined,
      date_lecture_from: state.dateFrom || undefined,
      date_lecture_to: state.dateTo || undefined,
      note_generale_min: state.ratingFilters.noteGeneraleMin || undefined,
      note_generale_max: state.ratingFilters.noteGeneraleMax || undefined,
      niveau_spicy_min: state.ratingFilters.niveauSpicyMin || undefined,
      niveau_spicy_max: state.ratingFilters.niveauSpicyMax || undefined,
      niveau_dark_min: state.ratingFilters.niveauDarkMin || undefined,
      niveau_dark_max: state.ratingFilters.niveauDarkMax || undefined,
      niveau_romance_min: state.ratingFilters.niveauRomanceMin || undefined,
      niveau_romance_max: state.ratingFilters.niveauRomanceMax || undefined,
      categories: state.selectedGenres.length > 0 ? state.selectedGenres : undefined,
      tags: state.selectedTags.length > 0 ? state.selectedTags : undefined,
      tag_types: state.selectedTagTypes.length > 0 ? state.selectedTagTypes : undefined,
      langue: state.selectedLanguages.length > 0 ? state.selectedLanguages : undefined,
      rythme: state.selectedRhythms.length > 0 ? state.selectedRhythms : undefined,
      sort: state.sortBy || undefined,
      order: state.sortOrder,
      page: state.page,
      limit: state.limit,
      include_categories: state.includeRelations,
      include_tags: state.includeRelations,
    };
  }, [state]);

  const getUrlSearchParams = React.useCallback((): URLSearchParams => {
    const params = new URLSearchParams();
    const filters = getBookFilters();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      }
    });
    
    return params;
  }, [getBookFilters]);

  // Gestion des presets
  const applyPresetFilter = React.useCallback((preset: FilterPreset) => {
    const newState = { ...defaultState, ...preset.filters };
    setState(newState);
    updateUrl(newState);
  }, [updateUrl]);

  const saveCurrentAsPreset = React.useCallback((name: string) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: { ...state },
      createdAt: new Date().toISOString(),
    };
    
    const newPresets = [...savedPresets, preset];
    setSavedPresets(newPresets);
    
    try {
      localStorage.setItem('booky-filter-presets', JSON.stringify(newPresets));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du preset: ", error);
    }
  }, [state, savedPresets]);

  const deletePreset = React.useCallback((presetId: string) => {
    const newPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(newPresets);
    
    try {
      localStorage.setItem("booky-filter-presets", JSON.stringify(newPresets));
    } catch (error) {
      console.error("Erreur lors de la suppression du preset:", error);
    }
  }, [savedPresets]);

  const contextValue: FiltersContextValue = React.useMemo(
    () => ({
      ...state,
      setSearchQuery,
      clearSearchQuery,
      toggleStatus,
      setStatuses,
      clearStatuses,
      setDateRange,
      clearDateRange,
      setRatingFilter,
      clearRatingFilters,
      toggleGenre,
      setGenres,
      clearGenres,
      toggleTag,
      setTags,
      clearTags,
      setTagTypes,
      clearTagTypes,
      toggleAuthor,
      setAuthors,
      clearAuthors,
      toggleLanguage,
      setLanguages,
      clearLanguages,
      toggleRhythm,
      setRhythms,
      clearRhythms,
      setSortBy,
      setSortOrder,
      toggleSortOrder,
      setPage,
      setLimit,
      resetPagination,
      setViewMode,
      setIncludeRelations,
      clearAllFilters,
      resetFilters,
      hasActiveFilters,
      getBookFilters,
      getUrlSearchParams,
      applyPresetFilter,
      savedPresets,
      saveCurrentAsPreset,
      deletePreset,
    }),
    [
      state,
      setSearchQuery,
      clearSearchQuery,
      toggleStatus,
      setStatuses,
      clearStatuses,
      setDateRange,
      clearDateRange,
      setRatingFilter,
      clearRatingFilters,
      toggleGenre,
      setGenres,
      clearGenres,
      toggleTag,
      setTags,
      clearTags,
      setTagTypes,
      clearTagTypes,
      toggleAuthor,
      setAuthors,
      clearAuthors,
      toggleLanguage,
      setLanguages,
      clearLanguages,
      toggleRhythm,
      setRhythms,
      clearRhythms,
      setSortBy,
      setSortOrder,
      toggleSortOrder,
      setPage,
      setLimit,
      resetPagination,
      setViewMode,
      setIncludeRelations,
      clearAllFilters,
      resetFilters,
      hasActiveFilters,
      getBookFilters,
      getUrlSearchParams,
      applyPresetFilter,
      savedPresets,
      saveCurrentAsPreset,
      deletePreset,
    ]
  );

  return <FiltersContext.Provider value={contextValue}>{children}</FiltersContext.Provider>;
}

// Hook pour utiliser les filtres
export function useFilters(): FiltersContextValue {
  const context = React.useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters doit être utilisé dans un FiltersProvider");
  }
  return context;
}

// Hook pour les filtres de recherche rapide
export function useQuickFilters() {
  const {
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    toggleStatus,
    selectedGenres,
    toggleGenre,
    clearAllFilters,
    hasActiveFilters,
  } = useFilters();

  return {
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    toggleStatus,
    selectedGenres,
    toggleGenre,
    clearAllFilters,
    hasActiveFilters,
  };
}

// Hook pour la pagination
export function usePagination() {
  const { page, limit, setPage, setLimit, resetPagination } = useFilters();
  return { page, limit, setPage, setLimit, resetPagination };
}

// Hook pour le tri
export function useSorting() {
  const { sortBy, sortOrder, setSortBy, setSortOrder, toggleSortOrder } = useFilters();
  return { sortBy, sortOrder, setSortBy, setSortOrder, toggleSortOrder };
}