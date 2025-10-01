/**
 * Hooks React Query pour la gestion des Sagas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sagasApi } from '../utils/orpc';
import { toast } from 'sonner';
import type { 
  SagaFilters, 
  SagaBooksFilters, 
  SagaCreateInput, 
  SagaUpdateInput,
  AssignBookToSagaInput,
  ReorderSagaInput,
  UseSagasOptions,
  UseSagaOptions,
  UseSagaBooksOptions
} from '../types/saga';

// ===== QUERY KEYS =====

export const sagaKeys = {
  all: ['sagas'] as const,
  lists: () => [...sagaKeys.all, 'list'] as const,
  list: (filters: SagaFilters) => [...sagaKeys.lists(), filters] as const,
  details: () => [...sagaKeys.all, 'detail'] as const,
  detail: (id: string) => [...sagaKeys.details(), id] as const,
  detailBySlug: (slug: string) => [...sagaKeys.details(), 'slug', slug] as const,
  books: (id: string) => [...sagaKeys.detail(id), 'books'] as const,
  booksWithFilters: (id: string, filters: SagaBooksFilters) => [...sagaKeys.books(id), filters] as const,
  neighbors: (bookId: string) => [...sagaKeys.all, 'neighbors', bookId] as const,
  nextOrder: (id: string) => [...sagaKeys.detail(id), 'nextOrder'] as const,
  orderAvailable: (id: string, order: number, excludeBookId?: string) => 
    [...sagaKeys.detail(id), 'orderAvailable', order, excludeBookId] as const,
  search: (query: string) => [...sagaKeys.all, 'search', query] as const,
};

// ===== HOOKS DE LECTURE =====

/**
 * Hook pour récupérer la liste des sagas avec filtres
 */
export function useSagas(options: UseSagasOptions = {}) {
  const { enabled = true, ...filters } = options;
  
  return useQuery({
    queryKey: sagaKeys.list(filters),
    queryFn: () => sagasApi.getAll(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer une saga par ID
 */
export function useSaga(id: string, options: UseSagaOptions = {}) {
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: sagaKeys.detail(id),
    queryFn: () => sagasApi.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook pour récupérer une saga par slug
 */
export function useSagaBySlug(slug: string, enabled: boolean = true) {
  return useQuery({
    queryKey: sagaKeys.detailBySlug(slug),
    queryFn: () => sagasApi.getBySlug(slug),
    enabled: enabled && !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook pour récupérer les livres d'une saga
 */
export function useSagaBooks(id: string, options: UseSagaBooksOptions = {}) {
  const { enabled = true, ...filters } = options;
  
  return useQuery({
    queryKey: sagaKeys.booksWithFilters(id, filters),
    queryFn: () => sagasApi.getBooks(id, filters),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer les voisins d'un livre dans sa saga
 */
export function useSagaNeighbors(bookId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: sagaKeys.neighbors(bookId),
    queryFn: () => sagasApi.getBookNeighbors(bookId),
    enabled: enabled && !!bookId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook pour obtenir le prochain ordre disponible dans une saga
 */
export function useSagaNextOrder(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: sagaKeys.nextOrder(id),
    queryFn: () => sagasApi.getNextOrder(id),
    enabled: enabled && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour vérifier si un ordre est disponible
 */
export function useSagaOrderAvailable(
  id: string, 
  order: number, 
  excludeBookId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: sagaKeys.orderAvailable(id, order, excludeBookId),
    queryFn: () => sagasApi.checkOrderAvailable(id, order, excludeBookId),
    enabled: enabled && !!id && order > 0,
    staleTime: 30 * 1000, // 30 secondes
  });
}

/**
 * Hook pour rechercher des sagas (autocomplete)
 */
export function useSagaSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: sagaKeys.search(query),
    queryFn: () => sagasApi.search(query, 10),
    enabled: enabled && query.length >= 2,
    staleTime: 30 * 1000, // 30 secondes
  });
}

// ===== HOOKS DE MUTATION =====

/**
 * Hook pour créer une nouvelle saga
 */
export function useCreateSaga() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SagaCreateInput) => sagasApi.create(data),
    onSuccess: (response) => {
      // Invalider les listes de sagas
      queryClient.invalidateQueries({ queryKey: sagaKeys.lists() });
      
      toast.success('Saga créée avec succès`, {
        description: `La saga "${response.data.name}" a été créée'
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création', {
        description: error.error || 'Une erreur inattendue s\'est produite'
      });
    }
  });
}

/**
 * Hook pour mettre à jour une saga
 */
export function useUpdateSaga() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SagaUpdateInput> }) => 
      sagasApi.update(id, data),
    onSuccess: (response, { id }) => {
      // Mettre à jour le cache de la saga spécifique
      queryClient.setQueryData(sagaKeys.detail(id), response);
      
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: sagaKeys.lists() });
      
      toast.success('Saga mise à jour', {
        description: 'Les modifications ont été enregistrées'
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour', {
        description: error.error || 'Une erreur inattendue s\'est produite'
      });
    }
  });
}

/**
 * Hook pour supprimer une saga
 */
export function useDeleteSaga() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => sagasApi.delete(id),
    onSuccess: (_, id) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: sagaKeys.detail(id) });
      
      // Invalider les listes
      queryClient.invalidateQueries({ queryKey: sagaKeys.lists() });
      
      // Invalider les livres qui pourraient être affectés
      queryClient.invalidateQueries({ queryKey: ['books'] });
      
      toast.success('Saga supprimée', {
        description: 'La saga a été supprimée avec succès'
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression', {
        description: error.error || 'Une erreur inattendue s\'est produite'
      });
    }
  });
}

/**
 * Hook pour assigner un livre à une saga
 */
export function useAssignBookToSaga() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: string; data: AssignBookToSagaInput }) => 
      sagasApi.assignBook(bookId, data),
    onSuccess: (response, { bookId, data }) => {
      // Invalider le livre spécifique
      queryClient.invalidateQueries({ queryKey: ['books', 'detail', bookId] });
      
      // Invalider les livres de la saga
      queryClient.invalidateQueries({ queryKey: sagaKeys.books(data.sagaId) });
      
      // Invalider la saga
      queryClient.invalidateQueries({ queryKey: sagaKeys.detail(data.sagaId) });
      
      toast.success('Livre assigné à la saga', {
        description: 'Le livre a été assigné à l'ordre ${data.sagaOrder}'
      });
    },
    onError: (error: any) => {
      // Gestion spéciale pour les conflits d'ordre
      if (error.statusCode === 409) {
        toast.error('Conflit d\'ordre', {
          description: error.error || 'Cet ordre est déjà occupé dans cette saga'
        });
        return;
      }
      
      toast.error('Erreur lors de l\'assignation', {
        description: error.error || 'Une erreur inattendue s\'est produite'
      });
    }
  });
}

/**
 * Hook pour retirer un livre d'une saga
 */
export function useRemoveBookFromSaga() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bookId: string) => sagasApi.removeBook(bookId),
    onSuccess: (response, bookId) => {
      // Invalider le livre spécifique
      queryClient.invalidateQueries({ queryKey: ['books', 'detail', bookId] });
      
      // Invalider toutes les sagas car on ne connaît pas l'ancienne saga
      queryClient.invalidateQueries({ queryKey: sagaKeys.all });
      
      toast.success('Livre retiré de la saga', {
        description: 'Le livre ne fait plus partie de la saga'
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors du retrait', {
        description: error.error || 'Une erreur inattendue s\'est produite'
      });
    }
  });
}

/**
 * Hook pour réorganiser les livres d'une saga
 */
export function useReorderSaga() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReorderSagaInput }) => 
      sagasApi.reorderBooks(id, data),
    onSuccess: (response, { id }) => {
      // Invalider les livres de la saga
      queryClient.invalidateQueries({ queryKey: sagaKeys.books(id) });
      
      // Invalider tous les livres affectés
      response.data.forEach(book => {
        queryClient.invalidateQueries({ queryKey: ['books', 'detail', book.id] });
      });
      
      toast.success('Ordre mis à jour', {
        description: 'L\'ordre des livres dans la saga a été modifié'
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la réorganisation', {
        description: error.error || 'Une erreur inattendue s\'est produite'
      });
    }
  });
}