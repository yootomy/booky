'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/utils/orpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CategoryBadge } from '@/components/categories';
import { 
  Search, 
  BookOpen, 
  TrendingUp, 
  Hash,
  Grid3X3,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import type { CategoryFilters } from '@/types/api';

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'stats'>('grid');

  const filters: CategoryFilters = {
    q: search || undefined,
    include_book_count: true,
    include_books: false,
  };

  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['categories', filters],
    queryFn: () => categoriesApi.getAll(filters),
  });

  const categories = categoriesResponse?.data || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Catégories
        </h1>
        <p className="text-gray-300">
          Explorez les livres par genre et découvrez de nouvelles lectures
        </p>
      </div>

      {/* Contrôles */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('grid')}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Grille
          </Button>
          <Button
            variant={view === 'stats' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('stats')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiques
          </Button>
        </div>
      </div>

      {/* Vue Grille */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-600 rounded flex-1"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            categories.map((category) => (
              <Link key={category.id} href={'/categories/${category.id}'}>
                <Card className="h-full hover:bg-gray-800/50 transition-colors cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.couleur }}
                      />
                      <h3 className="font-semibold text-white group-hover:text-rose-300 transition-colors">
                        {category.nom}
                      </h3>
                    </div>
                    
                    {category.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{category.book_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{Math.round((category.book_count || 0) * 100 / 10)}%</span>
                        </div>
                      </div>
                      
                      {category.est_actif && (
                        <Badge variant="secondary" className="text-xs">
                          Actif
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Vue Statistiques */}
      {view === 'stats' && (
        <div className="space-y-6">
          {/* Stats globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Hash className="h-6 w-6 text-rose-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{categories.length}</div>
                <div className="text-sm text-gray-400">Catégories</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {categories.reduce((sum, cat) => sum + (cat.book_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-400">Livres</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {categories.filter(cat => cat.book_count && cat.book_count > 0).length}
                </div>
                <div className="text-sm text-gray-400">Utilisées</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {Math.round(categories.reduce((sum, cat) => sum + (cat.book_count || 0), 0) / categories.length) || 0}
                </div>
                <div className="text-sm text-gray-400">Livres moy.</div>
              </CardContent>
            </Card>
          </div>

          {/* Liste avec statistiques détaillées */}
          <div className="space-y-4">
            {categories
              .sort((a, b) => (b.book_count || 0) - (a.book_count || 0))
              .map((category) => (
                <Link key={category.id} href={'/categories/${category.id}'}>
                  <Card className="hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <CategoryBadge category={category} />
                          <div>
                            <h3 className="font-semibold text-white">{category.nom}</h3>
                            {category.description && (
                              <p className="text-gray-400 text-sm">{category.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <div className="text-center">
                            <div className="font-semibold text-white">{category.book_count || 0}</div>
                            <div>Livres</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-white">{category.book_count || 0}</div>
                            <div>Livres</div>
                          </div>
                          <div className="text-center">
                            <Badge variant={category.est_actif ? "default" : "secondary"}>
                              {category.est_actif ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {!isLoading && categories.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune catégorie trouvée</h3>
          <p className="text-gray-400 mb-6">
            {search ? 'Essayez avec des termes différents' : 'Aucune catégorie disponible pour le moment'}
          </p>
          {search && (
            <Button variant="outline" onClick={() => setSearch('')}>
              Effacer la recherche
            </Button>
          )}
        </div>
      )}
    </div>
  );
}