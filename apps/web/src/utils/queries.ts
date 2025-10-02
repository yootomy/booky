/**
 * Query Keys et Mutations TanStack Query
 * Configuration centralisée pour toutes les requêtes API
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  authApi,
  booksApi,
  categoriesApi,
  tagsApi,
  dashboardApi,
  statsApi,
  goalsApi,
  exportApi,
  uploadApi,
  importApi
} from "./orpc";
import type {
  ApiResponse,
  PaginatedResponse,
  BookFilters,
  CategoryFilters,
  TagFilters,
  ApiError
} from "../types/api";
import type { Book, BookCreateInput, BookUpdateInput } from "../types/book";
import type { Category, CategoryCreateInput, CategoryUpdateInput } from "../types/category";
import type { Tag, TagCreateInput, TagUpdateInput } from "../types/tag";
import type { AuthUser, LoginCredentials, RegisterCredentials, AuthResponse } from "../types/auth";
import type { DashboardData, ReadingGoal } from "../types/dashboard";

// ===== QUERY KEYS FACTORY =====

export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  
  // Books
  books: {
    all: ['books'] as const,
    lists: () => [...queryKeys.books.all, 'list'] as const,
    list: (filters?: BookFilters) => [...queryKeys.books.lists(), filters] as const,
    details: () => [...queryKeys.books.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.books.details(), id] as const,
    search: (query: string, filters?: Partial<BookFilters>) => 
      [...queryKeys.books.all, 'search', query, filters] as const,
    recommendations: (bookId: string) => 
      [...queryKeys.books.all, 'recommendations', bookId] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: CategoryFilters) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    stats: (id: string) => [...queryKeys.categories.all, 'stats', id] as const,
  },
  
  // Tags
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: (filters?: TagFilters) => [...queryKeys.tags.lists(), filters] as const,
    details: () => [...queryKeys.tags.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tags.details(), id] as const,
    byType: (type: string) => [...queryKeys.tags.all, 'type', type] as const,
    stats: (id: string) => [...queryKeys.tags.all, 'stats', id] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    data: () => [...queryKeys.dashboard.all, 'data'] as const,
    stats: (filters?: Record<string, unknown>) => [...queryKeys.dashboard.all, 'stats', filters] as const,
    activity: (limit?: number) => [...queryKeys.dashboard.all, 'activity', limit] as const,
    currentReading: () => [...queryKeys.dashboard.all, 'current-reading'] as const,
    wishlist: () => [...queryKeys.dashboard.all, 'wishlist'] as const,
    topBooks: () => [...queryKeys.dashboard.all, 'top-books'] as const,
  },
  
  // Stats
  stats: {
    all: ['stats'] as const,
    global: (filters?: Record<string, unknown>) => [...queryKeys.stats.all, 'global', filters] as const,
    books: (filters?: Record<string, unknown>) => [...queryKeys.stats.all, 'books', filters] as const,
    categories: (filters?: Record<string, unknown>) => [...queryKeys.stats.all, 'categories', filters] as const,
    tags: (filters?: Record<string, unknown>) => [...queryKeys.stats.all, 'tags', filters] as const,
    reading: (filters?: Record<string, unknown>) => [...queryKeys.stats.all, 'reading', filters] as const,
    evolution: (period: string) => [...queryKeys.stats.all, 'evolution', period] as const,
    comparison: (year?: number) => [...queryKeys.stats.all, 'comparison', year] as const,
  },
  
  // Goals
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    details: () => [...queryKeys.goals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.goals.details(), id] as const,
    progress: (id: string) => [...queryKeys.goals.all, 'progress', id] as const,
  },
  
  // Export
  exports: {
    all: ['exports'] as const,
    history: () => [...queryKeys.exports.all, 'history"] as const,
  },
} as const;

// ===== AUTH HOOKS =====

export function useAuth() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin(options?: UseMutationOptions<AuthResponse, ApiError, LoginCredentials>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
        toast.success("Connexion réussie", {
          description: 'Bienvenue ${data.user?.nom_complet}' });
      }
    },
    onError: (error) => {
      toast.error('Erreur de connexion", {
        description: error.error || "Identifiants incorrects"
      });
    },
    ...options,
  });
}

export function useRegister(options?: UseMutationOptions<AuthResponse, ApiError, RegisterCredentials>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
        toast.success("Inscription réussie", {
          description: "Bienvenue dans Booky !"
        });
      }
    },
    onError: (error) => {
      toast.error("Erreur d"inscription', {
        description: error.error || "Impossible de créer le compte"
      });
    },
    ...options,
  });
}

export function useLogout(options?: UseMutationOptions<{ success: boolean }, ApiError, void>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Déconnexion réussie");
    },
    ...options,
  });
}

// ===== BOOKS HOOKS =====

export function useBooks(
  filters?: BookFilters, 
  options?: UseQueryOptions<PaginatedResponse<Book>>
) {
  return useQuery({
    queryKey: queryKeys.books.list(filters),
    queryFn: () => booksApi.getAll(filters),
    ...options,
  });
}

export function useBooksInfinite(
  filters?: BookFilters,
  options?: UseInfiniteQueryOptions<PaginatedResponse<Book>>
) {
  return useInfiniteQuery({
    queryKey: queryKeys.books.list(filters),
    queryFn: ({ pageParam = 1 }) => 
      booksApi.getAll({ ...filters, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    ...options,
  });
}

export function useBook(id: string, options?: UseQueryOptions<ApiResponse<Book>>) {
  return useQuery({
    queryKey: queryKeys.books.detail(id),
    queryFn: () => booksApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useBookSearch(
  query: string, 
  filters?: Partial<BookFilters>,
  options?: UseQueryOptions<PaginatedResponse<Book>>
) {
  return useQuery({
    queryKey: queryKeys.books.search(query, filters),
    queryFn: () => booksApi.search(query, filters),
    enabled: query.length >= 2,
    ...options,
  });
}

export function useBookRecommendations(
  bookId: string,
  options?: UseQueryOptions<ApiResponse<Book[]>>
) {
  return useQuery({
    queryKey: queryKeys.books.recommendations(bookId),
    queryFn: () => booksApi.getRecommendations(bookId),
    enabled: !!bookId,
    ...options,
  });
}

export function useCreateBook(options?: UseMutationOptions<ApiResponse<Book>, ApiError, BookCreateInput>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: booksApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      
      if (data.success) {
        toast.success("Livre ajouté", {
          description: '${data.data?.titre}' a été ajouté à votre bibliothèque"});
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l"ajout', {
        description: error.error || "Impossible d"ajouter le livre'
      });
    },
    ...options,
  });
}

export function useUpdateBook(options?: UseMutationOptions<ApiResponse<Book>, ApiError, { id: string; data: BookUpdateInput }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => booksApi.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.books.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      
      if (data.success) {
        toast.success('Livre modifié', {
          description: '${data.data?.titre}' a été mis à jour"});
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification", {
        description: error.error || "Impossible de modifier le livre"
      });
    },
    ...options,
  });
}

export function useDeleteBook(options?: UseMutationOptions<{ success: boolean }, ApiError, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: booksApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      queryClient.removeQueries({ queryKey: queryKeys.books.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      
      toast.success("Livre supprimé", {
        description: "Le livre a été retiré de votre bibliothèque"
      });
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression", {
        description: error.error || "Impossible de supprimer le livre'
      });
    },
    ...options,
  });
}

export function useBulkUpdateBooks(
  options?: UseMutationOptions<{ success: boolean; updated: number }, ApiError, { ids: string[]; data: Partial<BookUpdateInput> }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, data }) => booksApi.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      
      toast.success('${result.updated}'livres modifiés");
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification groupée", {
        description: error.error
      });
    },
    ...options,
  });
}

// ===== CATEGORIES HOOKS =====

export function useCategories(
  filters?: CategoryFilters,
  options?: UseQueryOptions<PaginatedResponse<Category>>
) {
  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: () => categoriesApi.getAll(filters),
    ...options,
  });
}

export function useCategory(id: string, options?: UseQueryOptions<ApiResponse<Category>>) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCategoryStats(id: string, options?: UseQueryOptions<ApiResponse<any>>) {
  return useQuery({
    queryKey: queryKeys.categories.stats(id),
    queryFn: () => categoriesApi.getStats(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCategory(
  options?: UseMutationOptions<ApiResponse<Category>, ApiError, CategoryCreateInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      
      if (data.success) {
        toast.success('Catégorie créée', {
          description: '${data.data?.nom}' a été ajoutée"});
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de la création", {
        description: error.error
      });
    },
    ...options,
  });
}

export function useUpdateCategory(
  options?: UseMutationOptions<ApiResponse<Category>, ApiError, { id: string; data: CategoryUpdateInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      
      if (data.success) {
        toast.success("Catégorie modifiée");
      }
    },
    ...options,
  });
}

export function useDeleteCategory(options?: UseMutationOptions<{ success: boolean }, ApiError, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      
      toast.success("Catégorie supprimée");
    },
    ...options,
  });
}

// ===== TAGS HOOKS =====

export function useTags(
  filters?: TagFilters,
  options?: UseQueryOptions<PaginatedResponse<Tag>>
) {
  return useQuery({
    queryKey: queryKeys.tags.list(filters),
    queryFn: () => tagsApi.getAll(filters),
    ...options,
  });
}

export function useTag(id: string, options?: UseQueryOptions<ApiResponse<Tag>>) {
  return useQuery({
    queryKey: queryKeys.tags.detail(id),
    queryFn: () => tagsApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useTagsByType(type: string, options?: UseQueryOptions<ApiResponse<Tag[]>>) {
  return useQuery({
    queryKey: queryKeys.tags.byType(type),
    queryFn: () => tagsApi.getByType(type as any),
    enabled: !!type,
    ...options,
  });
}

export function useCreateTag(
  options?: UseMutationOptions<ApiResponse<Tag>, ApiError, TagCreateInput>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      
      if (data.success) {
        toast.success("Tag créé", {
          description: '${data.data?.nom}' a été ajouté'});
      }
    },
    ...options,
  });
}

export function useUpdateTag(
  options?: UseMutationOptions<ApiResponse<Tag>, ApiError, { id: string; data: TagUpdateInput }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => tagsApi.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.detail(id) });
      
      if (data.success) {
        toast.success("Tag modifié");
      }
    },
    ...options,
  });
}

// ===== DASHBOARD HOOKS =====

export function useDashboard(options?: UseQueryOptions<ApiResponse<DashboardData>>) {
  return useQuery({
    queryKey: queryKeys.dashboard.data(),
    queryFn: dashboardApi.getData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useDashboardStats(
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<ApiResponse<any>>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(filters),
    queryFn: () => dashboardApi.getStats(filters),
    ...options,
  });
}

export function useCurrentReading(options?: UseQueryOptions<ApiResponse<any>>) {
  return useQuery({
    queryKey: queryKeys.dashboard.currentReading(),
    queryFn: dashboardApi.getCurrentReading,
    ...options,
  });
}

export function useWishlist(options?: UseQueryOptions<ApiResponse<any>>) {
  return useQuery({
    queryKey: queryKeys.dashboard.wishlist(),
    queryFn: dashboardApi.getWishlist,
    ...options,
  });
}

// ===== STATS HOOKS =====

export function useGlobalStats(
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<ApiResponse<any>>
) {
  return useQuery({
    queryKey: queryKeys.stats.global(filters),
    queryFn: () => statsApi.getGlobal(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useBookStats(
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<ApiResponse<any>>
) {
  return useQuery({
    queryKey: queryKeys.stats.books(filters),
    queryFn: () => statsApi.getBooks(filters),
    ...options,
  });
}

export function useStatsEvolution(
  period: string,
  options?: UseQueryOptions<ApiResponse<any>>
) {
  return useQuery({
    queryKey: queryKeys.stats.evolution(period),
    queryFn: () => statsApi.getEvolution(period),
    enabled: !!period,
    ...options,
  });
}

// ===== GOALS HOOKS =====

export function useGoals(options?: UseQueryOptions<ApiResponse<ReadingGoal[]>>) {
  return useQuery({
    queryKey: queryKeys.goals.lists(),
    queryFn: goalsApi.getAll,
    ...options,
  });
}

export function useGoal(id: string, options?: UseQueryOptions<ApiResponse<ReadingGoal>>) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => goalsApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateGoal(
  options?: UseMutationOptions<ApiResponse<ReadingGoal>, ApiError, Partial<ReadingGoal>>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
      
      if (data.success) {
        toast.success("Objectif créé", {
          description: data.data?.titre
        });
      }
    },
    ...options,
  });
}

// ===== EXPORT HOOKS =====

export function useExportHistory(options?: UseQueryOptions<ApiResponse<any[]>>) {
  return useQuery({
    queryKey: queryKeys.exports.history(),
    queryFn: exportApi.getHistory,
    ...options,
  });
}

export function useCreateExport(
  options?: UseMutationOptions<ApiResponse<{ download_url: string }>, ApiError, any>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ type, format, filters }) => exportApi.create(type, format, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exports.history() });
      toast.success("Export créé", {
        description: "Le fichier sera bientôt disponible"
      });
    },
    ...options,
  });
}

// ===== UPLOAD HOOKS =====

export function useUploadImage(
  options?: UseMutationOptions<any, ApiError, File>
) {
  return useMutation({
    mutationFn: uploadApi.image,
    onSuccess: () => {
      toast.success("Image uploadée");
    },
    onError: (error) => {
      toast.error("Erreur d"upload', {
        description: error.error
      });
    },
    ...options,
  });
}

// ===== IMPORT HOOKS =====

export function useImportBooks(
  options?: UseMutationOptions<ApiResponse<{ imported: number; errors: any[] }>, ApiError, any[]>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: importApi.books,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      
      if (data.success) {
        toast.success("${data.data?.imported}'livres importés');
      }
    },
    ...options,
  });
}

// ===== UTILITY HOOKS =====

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateBooks: () => queryClient.invalidateQueries({ queryKey: queryKeys.books.all }),
    invalidateCategories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    invalidateTags: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags.all }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
    invalidateGoals: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals.all }),
  };
}