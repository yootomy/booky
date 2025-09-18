/**
 * Types pour les Sagas
 * Utilisés côté frontend pour la gestion des séries de livres
 */

import type { Book } from './book';

// ===== ENUMS =====

export enum SagaStatus {
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  HIATUS = 'HIATUS',
  UNKNOWN = 'UNKNOWN'
}

// ===== TYPES PRINCIPAUX =====

export interface Saga {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: SagaStatus;
  createdAt: string;
  updatedAt: string;
  
  // Métadonnées calculées (optionnelles)
  bookCount?: number;
  firstBook?: {
    id: string;
    titre: string;
  } | null;
  lastBook?: {
    id: string;
    titre: string;
  } | null;
  
  // Relation avec les livres (optionnelle)
  books?: BookInSaga[];
}

export interface BookInSaga {
  id: string;
  titre: string;
  auteur: string;
  sagaOrder: number;
  image_couverture?: string;
  
  // Saga relation complète si nécessaire
  saga?: Saga;
}

export interface SagaNeighbors {
  previous?: {
    id: string;
    titre: string;
    sagaOrder: number;
  };
  next?: {
    id: string;
    titre: string;
    sagaOrder: number;
  };
}

// ===== TYPES POUR LES FORMULAIRES =====

export interface SagaCreateInput {
  name: string;
  slug?: string;
  description?: string;
  status?: SagaStatus;
}

export interface SagaUpdateInput extends Partial<SagaCreateInput> {
  id: string;
}

export interface AssignBookToSagaInput {
  sagaId: string;
  sagaOrder: number;
}

export interface ReorderSagaInput {
  items: Array<{
    bookId: string;
    sagaOrder: number;
  }>;
}

// ===== TYPES POUR LES FILTRES =====

export interface SagaFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SagaStatus;
}

export interface SagaBooksFilters {
  page?: number;
  pageSize?: number;
  include_categories?: boolean;
  include_tags?: boolean;
}

// ===== TYPES POUR LES RÉPONSES =====

export interface SagaListResponse {
  success: boolean;
  data: Saga[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SagaDetailResponse {
  success: boolean;
  data: Saga;
}

export interface SagaBooksResponse {
  success: boolean;
  data: BookInSaga[];
}

export interface SagaNeighborsResponse {
  success: boolean;
  data: SagaNeighbors;
}

// ===== TYPES UTILITAIRES =====

export interface SagaOption {
  value: string;
  label: string;
  status: SagaStatus;
  bookCount?: number;
}

export interface SagaValidationError {
  field: 'name' | 'slug' | 'description' | 'sagaOrder';
  message: string;
}

// ===== TYPES POUR LES HOOKS =====

export interface UseSagasOptions extends SagaFilters {
  enabled?: boolean;
}

export interface UseSagaOptions {
  enabled?: boolean;
  includeBooks?: boolean;
}

export interface UseSagaBooksOptions extends SagaBooksFilters {
  enabled?: boolean;
}

// ===== TYPES POUR LA SÉLECTION =====

export interface SagaSelectProps {
  value?: string;
  onChange: (sagaId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  onCreateSaga?: (saga: Saga) => void;
}

export interface SagaOrderInputProps {
  sagaId: string;
  value?: number;
  onChange: (order: number | undefined) => void;
  error?: string;
  disabled?: boolean;
  excludeBookId?: string; // ID du livre à exclure de la validation d'ordre
}