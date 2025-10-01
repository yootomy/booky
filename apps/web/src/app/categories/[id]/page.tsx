'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { categoriesApi, booksApi } from '@/utils/orpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from '@/components/categories';
import { BookCard } from '@/components/books/book-card';
import { transformBooksForCards } from '@/utils/book-transformer';
import { 
  ArrowLeft, 
  BookOpen, 
  TrendingUp, 
  Star, 
  Calendar,
  Filter,
  SortDesc,
  BarChart3,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BookFilters } from '@/types/api';
import { BookStatus } from '@/types/api';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [bookFilters, setBookFilters] = useState<BookFilters>({
    categories: categoryId,
    include_categories: true,
    include_tags: true,
    sort: 'date_lecture',
    order: 'desc',
    limit: 20,
  });

  const [showStats, setShowStats] = useState(false);

  // Récupérer les détails de la catégorie
  const { data: categoryResponse, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoriesApi.getById(categoryId),
  });

  // Récupérer les statistiques de la catégorie
  const { data: statsResponse } = useQuery({
    queryKey: ['category-stats', categoryId],
    queryFn: () => categoriesApi.getStats(categoryId),
    enabled: showStats,
  });

  // Récupérer les livres de cette catégorie
  const { data: booksResponse, isLoading: booksLoading } = useQuery({
    queryKey: ['category-books', categoryId, bookFilters],
    queryFn: () => booksApi.getAll(bookFilters),
  });

  const category = categoryResponse?.data;
  const stats = statsResponse?.data;
  const books = booksResponse?.data || [];
  const pagination = booksResponse?.pagination;

  if (categoryLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-600 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Catégorie non trouvée</h1>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const handleStatusFilter = (status?: BookStatus) => {
    setBookFilters(prev => ({
      ...prev,
      statut: status,
      page: 1,
    }));
  };

  const handleSort = (sort: string, order: 'asc' | 'desc' = 'desc') => {
    setBookFilters(prev => ({
      ...prev,
      sort,
      order,
      page: 1,
    }));
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Navigation */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux catégories
        </Button>
      </div>

      {/* En-tête de la catégorie */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <CategoryBadge category={category} size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-white">{category.nom}</h1>
            {category.description && (
              <p className="text-gray-300 mt-2">{category.description}</p>
            )}
          </div>
        </div>

        {/* Métadonnées de la catégorie */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>{category._count?.books || 0} livres</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Créée le {format(new Date(category.date_creation), 'dd MMMM yyyy', { locale: fr })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>{category._count?.books || 0} livres associés</span>
          </div>
          <Badge variant={category.est_actif ? "default" : "secondary"}>
            {category.est_actif ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </div>

      {/* Contrôles et statistiques */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Filtres par statut */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!bookFilters.statut ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(undefined)}
          >
            Tous
          </Button>
          <Button
            variant={bookFilters.statut === BookStatus.LU ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(BookStatus.LU)}
          >
            Lus
          </Button>
          <Button
            variant={bookFilters.statut === BookStatus.EN_COURS ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(BookStatus.EN_COURS)}
          >
            En cours
          </Button>
          <Button
            variant={bookFilters.statut === BookStatus.A_LIRE ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter(BookStatus.A_LIRE)}
          >
            À lire
          </Button>
        </div>

        {/* Contrôles de tri et statistiques */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStats ? 'Masquer' : 'Afficher'} les stats
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('note_generale', 'desc')}
          >
            <Star className="h-4 w-4 mr-2" />
            Mieux notés
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('date_lecture', 'desc`)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Plus récents
          </Button>
        </div>
      </div>

      {/* Statistiques détaillées */}
      {showStats && stats && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Statistiques de la catégorie</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total_livres || 0}</div>
                <div className="text-sm text-gray-400">Total livres</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.livres_lus || 0}</div>
                <div className="text-sm text-gray-400">Lus</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.livres_en_cours || 0}</div>
                <div className="text-sm text-gray-400">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.livres_a_lire || 0}</div>
                <div className="text-sm text-gray-400">À lire</div>
              </div>
            </div>
            
            {stats.note_moyenne && (
              <div className="text-center border-t border-gray-700 pt-4">
                <div className="flex items-center justify-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-xl font-bold text-white">{stats.note_moyenne.toFixed(1)}/10</span>
                </div>
                <div className="text-sm text-gray-400">Note moyenne</div>
              </div>
            )}
            
            {stats.auteurs_populaires && stats.auteurs_populaires.length > 0 && (
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="font-medium text-white mb-2">Auteurs populaires dans cette catégorie</h4>
                <div className="flex flex-wrap gap-2">
                  {stats.auteurs_populaires.slice(0, 5).map((auteur: any, index: number) => (
                    <Badge key={index} variant="secondary">
                      {auteur.nom} ({auteur.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Liste des livres */}
      <div className="space-y-6">
        {booksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transformBooksForCards(books).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setBookFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                >
                  Précédent
                </Button>
                <span className="text-gray-400">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setBookFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aucun livre dans cette catégorie</h3>
            <p className="text-gray-400 mb-6">
              {bookFilters.statut 
                ? `Aucun livre avec le statut "${bookFilters.statut}" dans cette catégorie'
                : 'Cette catégorie ne contient aucun livre pour le moment'
              }
            </p>
            {bookFilters.statut && (
              <Button variant="outline" onClick={() => handleStatusFilter(undefined)}>
                Voir tous les livres
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}