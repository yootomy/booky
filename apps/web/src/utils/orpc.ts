import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// Stub type for ORPC client (replaced with REST APIs)
type AppRouterClient = any;
import type {
  ApiResponse,
  PaginatedResponse,
  BookFilters,
  CategoryFilters,
  TagFilters,
  SagaFilters,
  SagaBooksFilters,
  UserRole,
  BookStatus,
  BookRhythm,
  TagType,
  SagaStatus,
  ApiError
} from "../types/api";
import type { Book, BookCreateInput, BookUpdateInput } from "../types/book";
import type { Category, CategoryCreateInput, CategoryUpdateInput } from "../types/category";
import type { Tag, TagCreateInput, TagUpdateInput } from "../types/tag";
import type { 
  Saga, 
  SagaCreateInput, 
  SagaUpdateInput, 
  AssignBookToSagaInput, 
  ReorderSagaInput,
  SagaListResponse,
  SagaDetailResponse,
  SagaBooksResponse,
  SagaNeighborsResponse
} from "../types/saga";
import type { AuthUser, LoginCredentials, RegisterCredentials, AuthResponse } from "../types/auth";
import type { DashboardData, ReadingGoal } from "../types/dashboard";

// ===== CONFIGURATION TANSTACK QUERY =====

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Gestion des erreurs globales
      const apiError = error as unknown as ApiError;
      
      if (apiError.statusCode === 401) {
        toast.error("Session expirée", {
          description: "Veuillez vous reconnecter",
          action: {
            label: "Se reconnecter",
            onClick: () => {
              window.location.href="/login";
            }
          }
        });
        return;
      }
      
      if (apiError.statusCode === 403) {
        toast.error("Accès refusé", {
          description: "Vous n'avez pas les permissions nécessaires"
        });
        return;
      }
      
      if (apiError.statusCode >= 500) {
        toast.error("Erreur serveur", {
          description: "Une erreur inattendue s'est produite",
          action: {
            label: "Réessayer",
            onClick: () => {
              queryClient.invalidateQueries();
            }
          }
        });
        return;
      }
      
      // Erreur générique
      toast.error('Erreur: ${apiError.error || (error as Error).message}', {
        action: {
          label: "Réessayer",
          onClick: () => {
            queryClient.invalidateQueries();
          }
        }
      });
    }
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = error as unknown as ApiError;
        // Ne pas retry les erreurs 4xx
        if (apiError.statusCode >= 400 && apiError.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false
    }
  }
});

// ===== CLIENT HTTP PERSONNALISÉ =====

class ApiClient {
  private baseURL: string;
  
  constructor() {
    // Appel direct au serveur API (plus de proxy)
    this.baseURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Appel direct au serveur - plus de proxy
    let cleanEndpoint = endpoint;
    // S'assurer que l'endpoint commence par /api
    if (!cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = `/api${cleanEndpoint}`;
    }
    const url = `${this.baseURL}${cleanEndpoint}`;

    const config: RequestInit = {
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          success: false,
          error: errorData.error || response.statusText,
          statusCode: response.status,
          timestamp: new Date().toISOString()
        };
        throw apiError;
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          success: false,
          error: 'Erreur de connexion réseau',
          statusCode: 0,
          timestamp: new Date().toISOString()
        } as ApiError;
      }
      throw error;
    }
  }
  
  // ===== MÉTHODES HTTP =====
  
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request<T>(url, { method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined
    });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

// ===== API METHODS - AUTHENTIFICATION =====

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>("/auth/login", credentials),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<AuthResponse>("/auth/register", credentials),

  logout: () =>
    apiClient.post<{ success: boolean }>("/auth/logout"),
  
  me: () =>
    apiClient.get<ApiResponse<AuthUser>>("/auth/me"),

  refreshToken: () =>
    apiClient.post<AuthResponse>("/auth/refresh"),

  forgotPassword: (email: string) =>
    apiClient.post<{ success: boolean; message: string }>("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ success: boolean; message: string }>("/auth/reset-password", { token, password }),

  verifyEmail: (token: string) =>
    apiClient.post<{ success: boolean; message: string }>("/auth/verify-email", { token }),
};

// ===== API METHODS - LIVRES =====

export const booksApi = {
  getAll: (filters?: BookFilters) =>
    apiClient.get<PaginatedResponse<Book>>("/books", filters),
  
  getById: (id: string) =>
    apiClient.get<ApiResponse<Book>>('/books/' + id),
  
  create: (data: BookCreateInput) =>
    apiClient.post<ApiResponse<Book>>('/books', data),
  
  update: (id: string, data: BookUpdateInput) =>
    apiClient.put<ApiResponse<Book>>('/books/' + id, data),
  
  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>('/books/' + id),
  
  search: (query: string, filters?: Partial<BookFilters>) =>
    apiClient.get<PaginatedResponse<Book>>('/books/search', { query, ...filters }),
  
  getRecommendations: (bookId: string) =>
    apiClient.get<ApiResponse<Book[]>>('/books/' + bookId + '/recommendations'),
  
  bulkUpdate: (ids: string[], data: Partial<BookUpdateInput>) =>
    apiClient.patch<{ success: boolean; updated: number }>('/books/bulk', { ids, data }),

  bulkDelete: (ids: string[]) =>
    apiClient.post<{ success: boolean; deleted: number }>('/books/bulk/delete', { ids }),

  // ===== QUESTIONS FAQ =====
  getQuestions: (bookId: string) =>
    apiClient.get<ApiResponse<any[]>>('/books/' + bookId + '/questions'),

  createQuestion: (bookId: string, question: string) =>
    apiClient.post<ApiResponse<any>>('/books/' + bookId + '/questions', { question }),
  
  answerQuestion: (bookId: string, questionId: string, reponse: string) =>
    apiClient.put<ApiResponse<any>>('/books/' + bookId + '/questions/' + questionId, { reponse }),

  moderateQuestion: (bookId: string, questionId: string, status: 'PENDING' | 'ANSWERED' | 'REJECTED') =>
    apiClient.patch<ApiResponse<any>>('/books/' + bookId + '/questions/' + questionId, { status }),

  getUserQuestions: (userId: string) =>
    apiClient.get<ApiResponse<any[]>>('/users/' + userId + '/questions'),

  deleteQuestion: (bookId: string, questionId: string) =>
    apiClient.delete<{ success: boolean }>('/books/' + bookId + '/questions/' + questionId),

  toggleQuestionLike: (bookId: string, questionId: string) =>
    apiClient.post<ApiResponse<{ questionId: string; isLiked: boolean; likesCount: number }>>('/books/' + bookId + '/questions/' + questionId + '/like'),

  getQuestionLikeStatus: (bookId: string, questionId: string) =>
    apiClient.get<ApiResponse<{ questionId: string; isLiked: boolean; likesCount: number }>>('/books/' + bookId + '/questions/' + questionId + '/like'),
};

// ===== API METHODS - FAVORIS =====

export const favoritesApi = {
  // Récupère la liste des IDs de favoris de l'utilisateur connecté
  getAll: (filters?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<string[]>>("/favorites", filters),

  // Ajoute un livre aux favoris (idempotent)
  add: (bookId: string) =>
    apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/favorites', { bookId }),

  // Retire un livre des favoris
  remove: (bookId: string) =>
    apiClient.delete<ApiResponse<{ success: boolean; message: string }>>('/favorites/' + bookId),
};

// ===== API METHODS - CATÉGORIES =====

export const categoriesApi = {
  getAll: (filters?: CategoryFilters) =>
    apiClient.get<PaginatedResponse<Category>>('/categories', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Category>>('/categories/' + id),

  create: (data: CategoryCreateInput) =>
    apiClient.post<ApiResponse<Category>>('/categories', data),

  update: (id: string, data: CategoryUpdateInput) =>
    apiClient.put<ApiResponse<Category>>('/categories/' + id, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>('/categories/' + id),

  getStats: (id: string) =>
    apiClient.get<ApiResponse<any>>('/categories/' + id + '/stats'),
  
  merge: (sourceIds: string[], targetId: string) =>
    apiClient.post<{ success: boolean; merged: number }>("/categories/merge", { sourceIds, targetId }),
};

// ===== API METHODS - SAGAS =====

export const sagasApi = {
  getAll: (filters?: SagaFilters) =>
    apiClient.get<SagaListResponse>('/sagas', filters),

  getById: (id: string) =>
    apiClient.get<SagaDetailResponse>('/sagas/' + id),

  getBySlug: (slug: string) =>
    apiClient.get<SagaDetailResponse>('/sagas/by-slug/' + slug),

  create: (data: SagaCreateInput) =>
    apiClient.post<SagaDetailResponse>('/sagas', data),

  update: (id: string, data: Partial<SagaUpdateInput>) =>
    apiClient.patch<SagaDetailResponse>('/sagas', { id, data }),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>('/sagas/' + id),

  // Gestion des livres dans une saga
  getBooks: (id: string, filters?: SagaBooksFilters) =>
    apiClient.get<SagaBooksResponse>('/sagas/' + id + '/books', filters),
  
  assignBook: (bookId: string, data: AssignBookToSagaInput) =>
    apiClient.patch<{ success: boolean; data: Book; message: string }>('/books/' + bookId + '/saga', data),

  removeBook: (bookId: string) =>
    apiClient.delete<{ success: boolean; data: Book; message: string }>('/books/' + bookId + '/saga'),

  reorderBooks: (id: string, data: ReorderSagaInput) =>
    apiClient.patch<{ success: boolean; data: Book[]; message: string }>('/sagas/' + id + '/reorder', data),

  // Utilitaires
  getBookNeighbors: (bookId: string) =>
    apiClient.get<SagaNeighborsResponse>('/books/' + bookId + '/saga/neighbors'),

  getNextOrder: (id: string) =>
    apiClient.get<{ success: boolean; data: { nextOrder: number } }>('/sagas/' + id + '/next-order'),

  checkOrderAvailable: (id: string, order: number, excludeBookId?: string) =>
    apiClient.get<{ success: boolean; available: boolean; suggestedNextOrder: number }>('/sagas/' + id + '/check-order', {
      order: order.toString(),
      excludeBookId
    }),

  // Recherche pour autocomplete
  search: (search: string, limit: number = 10) =>
    apiClient.get<SagaListResponse>('/sagas', {
      search,
      pageSize: limit,
      page: 1
    }),
};

// ===== API METHODS - TAGS =====

export const tagsApi = {
  getAll: (filters?: TagFilters) =>
    apiClient.get<PaginatedResponse<Tag>>('/tags', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Tag>>('/tags/' + id),

  create: (data: TagCreateInput) =>
    apiClient.post<ApiResponse<Tag>>('/tags', data),

  update: (id: string, data: TagUpdateInput) =>
    apiClient.put<ApiResponse<Tag>>('/tags/' + id, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>('/tags/' + id),

  getByType: (type: TagType) =>
    apiClient.get<ApiResponse<Tag[]>>('/tags/type/' + type),

  getStats: (id: string) =>
    apiClient.get<ApiResponse<any>>('/tags/' + id + '/stats'),

  merge: (sourceIds: string[], targetId: string) =>
    apiClient.post<{ success: boolean; merged: number }>('/tags/merge', { sourceIds, targetId }),

  bulkUpdate: (ids: string[], data: Partial<TagUpdateInput>) =>
    apiClient.patch<{ success: boolean; updated: number }>('/tags/bulk', { ids, data }),
};

// ===== API METHODS - USERS =====

export const usersApi = {
  getAll: (filters?: { page?: number; limit?: number; search?: string; role?: string }) =>
    apiClient.get<PaginatedResponse<any>>('/users', filters),

  getById: (id: string) =>
    apiClient.get<ApiResponse<any>>('/users/' + id),
};

// ===== API METHODS - DASHBOARD =====

export const dashboardApi = {
  getData: () =>
    apiClient.get<ApiResponse<DashboardData>>('/dashboard'),

  getStats: (filters?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>('/dashboard/stats', filters),

  getActivity: (limit?: number) =>
    apiClient.get<ApiResponse<any>>('/dashboard/activity', { limit }),

  getCurrentReading: () =>
    apiClient.get<ApiResponse<any>>('/dashboard/current-reading'),

  getWishlist: () =>
    apiClient.get<ApiResponse<any>>('/dashboard/wishlist'),

  getTopBooks: () =>
    apiClient.get<ApiResponse<any>>('/dashboard/top-books'),
};

// ===== API METHODS - STATISTIQUES =====

export const statsApi = {
  getGlobal: (filters?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>("/stats", filters),

  getBooks: (filters?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>("/stats/books", filters),

  getCategories: (filters?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>("/stats/categories", filters),

  getTags: (filters?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>("/stats/tags", filters),

  getReading: (filters?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>("/stats/reading", filters),

  getEvolution: (period: string) =>
    apiClient.get<ApiResponse<any>>("/stats/evolution", { period }),

  getComparison: (year?: number) =>
    apiClient.get<ApiResponse<any>>("/stats/comparison", { year }),
};

// ===== API METHODS - OBJECTIFS =====

export const goalsApi = {
  getAll: () =>
    apiClient.get<ApiResponse<ReadingGoal[]>>('/goals'),

  getById: (id: string) =>
    apiClient.get<ApiResponse<ReadingGoal>>('/goals/' + id),

  create: (data: Partial<ReadingGoal>) =>
    apiClient.post<ApiResponse<ReadingGoal>>('/goals', data),

  update: (id: string, data: Partial<ReadingGoal>) =>
    apiClient.put<ApiResponse<ReadingGoal>>('/goals/' + id, data),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>('/goals/' + id),

  getProgress: (id: string) =>
    apiClient.get<ApiResponse<any>>('/goals/' + id + '/progress'),
};

// ===== API METHODS - EXPORT =====

export const exportApi = {
  create: (type: string, format: string, filters?: Record<string, unknown>) =>
    apiClient.post<ApiResponse<{ download_url: string }>>('/export', { type, format, filters }),

  getHistory: () =>
    apiClient.get<ApiResponse<any[]>>('/export/history'),

  download: (exportId: string) =>
    apiClient.get<Blob>('/export/' + exportId + '/download'),

  delete: (exportId: string) =>
    apiClient.delete<{ success: boolean }>('/export/' + exportId),
};

// ===== API METHODS - UPLOAD =====

export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return fetch((process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000') + '/api/upload/image', {
      method: 'POST',
      credentials: 'include',
      body: formData
    }).then(res => res.json());
  },
  
  bulk: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return fetch((process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000') + '/api/upload/bulk', {
      method: 'POST',
      credentials: 'include',
      body: formData
    }).then(res => res.json());
  },
};

// ===== API METHODS - IMPORT =====

export const importApi = {
  books: (data: any[]) =>
    apiClient.post<ApiResponse<{ imported: number; errors: any[] }>>('/import/books', { books: data }),

  categories: (data: any[]) =>
    apiClient.post<ApiResponse<{ imported: number; errors: any[] }>>('/import/categories', { categories: data }),

  tags: (data: any[]) =>
    apiClient.post<ApiResponse<{ imported: number; errors: any[] }>>('/import/tags', { tags: data }),

  validate: (type: string, data: any[]) =>
    apiClient.post<ApiResponse<{ valid: any[]; errors: any[] }>>('/import/validate', { type, data }),
};

// ===== API METHODS - EXTERNES =====

export const externalApi = {
  // Google Books
  googleBooksSearch: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>('/external/google-books/search', params),

  googleBooksBook: (id: string) =>
    apiClient.get<ApiResponse<any>>('/external/google-books/book/' + id),

  googleBooksImport: (data: any) =>
    apiClient.post<ApiResponse<any>>('/external/google-books/import', data),

  // Open Library
  openLibrarySearch: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>('/external/open-library/search', params),

  openLibraryBook: (id: string) =>
    apiClient.get<ApiResponse<any>>('/external/open-library/book/' + id),

  openLibraryImport: (data: any) =>
    apiClient.post<ApiResponse<any>>('/external/open-library/import', data),

  // Recherche combinée
  combinedSearch: (params: Record<string, unknown>) =>
    apiClient.get<ApiResponse<any>>('/external/search', params),
};

// ===== CONFIGURATION ORPC (LEGACY) =====

export const link = new RPCLink({
  url: (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000') + '/rpc',
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  },
});

export const client: AppRouterClient = createORPCClient(link);

// Alias pour compatibilité avec les nouveaux composants
export const orpcClient = client;

export const orpc = createTanstackQueryUtils(client);
