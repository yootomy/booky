'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '@/utils/orpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Tag, 
  TrendingUp, 
  Hash,
  Cloud,
  List,
  Grid3X3,
  Filter,
  Star,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import type { TagFilters, TagType } from '@/types/api';
import { TAG_TYPE_LABELS, TAG_TYPE_ICONS, TAG_TYPE_COLORS } from '@/types/tag';

export default function TagsPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cloud' | 'grid' | 'list'>('cloud');
  const [selectedTypes, setSelectedTypes] = useState<TagType[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filters: TagFilters = {
    q: search || undefined,
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    est_favori: showFavoritesOnly || undefined,
    include_stats: true,
    sort: 'utilisation_count',
    order: 'desc',
  };

  const { data: tagsResponse, isLoading } = useQuery({
    queryKey: ["tags", filters],
    queryFn: () => tagsApi.getAll(filters),
  });

  const tags = tagsResponse?.data || [];

  const toggleType = (type: TagType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getTagSize = (count: number, maxCount: number) => {
    const ratio = maxCount > 0 ? count / maxCount : 0;
    const minSize = 14;
    const maxSize = 32;
    return minSize + (maxSize - minSize) * ratio;
  };

  const maxUsageCount = Math.max(...tags.map(tag => tag.utilisation_count), 1);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Tags & Labels
        </h1>
        <p className="text-gray-300">
          Découvrez les tropes, genres et avertissements de vos livres préférés
        </p>
      </div>

      {/* Contrôles */}
      <div className="space-y-4 mb-8">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres et vues */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Filtres par type */}
            {Object.entries(TAG_TYPE_LABELS).map(([type, label]) => (
              <Button
                key={type}
                variant={selectedTypes.includes(type as TagType) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleType(type as TagType)}
              >
                <span className="mr-1">{TAG_TYPE_ICONS[type as TagType]}</span>
                {label}
              </Button>
            ))}
            
            {/* Filtre favoris */}
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm`
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Heart className={`h-4 w-4 mr-1 ${showFavoritesOnly ? `},fill-current` : `"}"} />
              Favoris
            </Button>
          </div>
          
          {/* Contrôles de vue */}
          <div className="flex gap-2">
            <Button
              variant={view === "cloud" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("cloud")}
            >
              <Cloud className="h-4 w-4 mr-2" />
              Nuage
            </Button>
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grid")}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grille
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Hash className="h-6 w-6 text-rose-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{tags.length}</div>
            <div className="text-sm text-gray-400">Tags</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {tags.filter(tag => tag.utilisation_count > 0).length}
            </div>
            <div className="text-sm text-gray-400">Utilisés</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-6 w-6 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {tags.filter(tag => tag.est_favori).length}
            </div>
            <div className="text-sm text-gray-400">Favoris</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{maxUsageCount}</div>
            <div className="text-sm text-gray-400">Plus utilisé</div>
          </CardContent>
        </Card>
      </div>

      {/* Vue Nuage de tags */}
      {view === "cloud" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cloud className="h-5 w-5" />
              <span>Nuage de tags</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-6 bg-gray-600 rounded w-24 inline-block mr-2 mb-2"></div>
                ))}
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 items-center">
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tags/${tag.id}`}>
                    <Badge
                      variant="outline"
                      className="hover:scale-105 transition-transform cursor-pointer border-2 relative"
                      style={{
                        fontSize: "${getTagSize(tag.utilisation_count, maxUsageCount)}px`,
                        borderColor: tag.couleur,
                        color: tag.couleur,
                        opacity: 0.7 + (tag.utilisation_count / maxUsageCount) * 0.3,
                      }}
                    >
                      <span className="mr-1">{TAG_TYPE_ICONS[tag.type]}</span>
                      {tag.nom}
                      <span className="ml-1 text-xs opacity-75">
                        ({tag.utilisation_count})
                      </span>
                      {tag.est_favori && (
                        <Heart className="h-3 w-3 ml-1 fill-current text-pink-400" />
                      )}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Aucun tag trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vue Grille */}
      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-600 rounded flex-1"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4`></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            tags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Card className="h-full hover:bg-gray-800/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: tag.couleur }}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {TAG_TYPE_LABELS[tag.type]}
                        </Badge>
                      </div>
                      {tag.est_favori && (
                        <Heart className="h-4 w-4 fill-current text-pink-400" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-white group-hover:text-rose-300 transition-colors mb-2">
                      {tag.nom}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{tag.utilisation_count} utilisations</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Vue Liste */}
      {view === "list" && (
        <div className="space-y-4">
          {/* Groupement par type */}
          {Object.entries(TAG_TYPE_LABELS).map(([type, label]) => {
            const typeTags = tags.filter(tag => tag.type === type);
            if (typeTags.length === 0) return null;

            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <span>{TAG_TYPE_ICONS[type as TagType]}</span>
                    <span>{label}</span>
                    <Badge variant="secondary">{typeTags.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4`>
                    {typeTags.map((tag) => (
                      <Link key={tag.id} href={`/tags/${tag.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: tag.couleur }}
                            />
                            <span className="font-medium text-white">{tag.nom}</span>
                            {tag.est_favori && (
                              <Heart className="h-4 w-4 fill-current text-pink-400" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <TrendingUp className="h-4 w-4" />
                            <span>{tag.utilisation_count}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* État vide */}
      {!isLoading && tags.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun tag trouvé</h3>
          <p className="text-gray-400 mb-6">
            {search || selectedTypes.length > 0 || showFavoritesOnly
              ? "Essayez avec des critères différents`
              : "Aucun tag disponible pour le moment"
            }
          </p>
          {(search || selectedTypes.length > 0 || showFavoritesOnly) && (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setSearch("")}>
                Effacer la recherche
              </Button>
              <Button variant="outline" onClick={() => {
                setSelectedTypes([]);
                setShowFavoritesOnly(false);
              }}>
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}