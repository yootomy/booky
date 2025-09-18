import { NextRequest, NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  type?: string;
  details?: any[];
  execution_time_ms?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type BookStatus = "lu" | "en_cours" | "a_lire";
export type BookRhythm = "slow_burn" | "medium_burn" | "fast_pace" | "insta_love";
export type TagType = "genre" | "trope" | "trigger" | "personnalise";
export type SagaStatus = "ongoing" | "completed" | "hiatus" | "unknown";

export interface BookFilters {
  status?: BookStatus;
  genre?: string;
  author?: string;
  spicyLevel?: number;
  darkLevel?: number;
  romanceLevel?: number;
  minRating?: number;
  maxRating?: number;
  tags?: string[];
  categories?: string[];
  sagaId?: string;
  sagaSlug?: string;
}

export interface BookSortOptions {
  sortBy?: "title" | "author" | "dateRead" | "rating" | "createdAt" | "sagaOrder";
  sortOrder?: "asc" | "desc";
}

// Saga types
export interface SagaFilters {
  status?: SagaStatus;
  search?: string;
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

export interface AssignSagaInput {
  sagaId: string;
  sagaOrder: number;
}

export interface ReorderSagaInput {
  items: Array<{
    bookId: string;
    sagaOrder: number;
  }>;
}

// Types pour les paramètres dynamiques des routes
export interface RouteParams {
  params: Promise<Record<string, string>>;
}

export interface BookParams {
  params: Promise<{ id: string }>;
}

export interface BookCategoryParams {
  params: Promise<{ id: string; categoryId: string }>;
}

export interface BookTagParams {
  params: Promise<{ id: string; tagId: string }>;
}

export interface CategoryParams {
  params: Promise<{ id: string }>;
}

export interface TagParams {
  params: Promise<{ id: string }>;
}

export interface SagaParams {
  params: Promise<{ id: string }>;
}

export interface BookSagaParams {
  params: Promise<{ bookId: string }>;
}

// Type pour les handlers d'API avec paramètres dynamiques
export type ApiHandler<T = any, P = any> = (
  request: NextRequest,
  context: { params: Promise<P> }
) => Promise<NextResponse<ApiResponse<T>>>;

// Utilitaire pour résoudre les paramètres async
export async function resolveParams<T>(params: Promise<T>): Promise<T> {
  return await params;
}
