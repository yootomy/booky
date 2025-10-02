/**
 * Sidebar - Navigation latérale avec filtres et catégories
 * Sidebar responsive pour filtrage et navigation secondaire
 */

"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronRight,
  ChevronDown,
  Filter,
  X,
  Search,
  Folder,
  Tag as TagIcon,
  Star,
  TrendingUp,
  Calendar,
  Hash,
  Eye,
  EyeOff,
  RotateCcw,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookStatus } from '@/components/books/book-status';
import { type Category } from '@/types/category';
import { type Tag } from '@/types/tag';
import { BookStatus as BookStatusType, TagType } from '@/types/api';
import { cn } from "@/lib/utils";

export interface SidebarFilters {
  search?: string;
  categories?: string[];
  tags?: string[];
  status?: BookStatusType[];
  ratingMin?: number;
  ratingMax?: number;
  spicyMin?: number;
  spicyMax?: number;
  darkMin?: number;
  darkMax?: number;
  romanceMin?: number;
  romanceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  favorites?: boolean;
  hasReview?: boolean;
}

export interface SidebarProps {
  className?: string;
  filters?: SidebarFilters;
  onFiltersChange?: (filters: SidebarFilters) => void;
  categories?: Category[];
  tags?: Tag[];
  onToggle?: () => void;
  isCollapsed?: boolean;
  showFilters?: boolean;
  showQuickStats?: boolean;
  quickStats?: {
    totalBooks: number;
    readBooks: number;
    averageRating: number;
    favoriteGenre: string;
  };
}

// Section collapsible du sidebar
function SidebarSection({ 
  title, 
  icon: Icon, 
  defaultOpen = true, 
  children,
  badge,
  actions
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
  actions?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-2 h-auto font-medium"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            <span>{title}</span>
            {badge && (
              <Badge variant="secondary" className="ml-auto mr-2">
                {badge}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {actions}
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Composant catégorie
function CategoryItem({ 
  category, 
  isSelected, 
  onToggle,
  showCount = true 
}: { 
  category: Category & { _count?: { books: number } };
  isSelected: boolean;
  onToggle: () => void;
  showCount?: boolean;
}) {
  return (
    <div className="flex items-center space-x-2 py-1">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        id={'category-${category.id}'}
      />
      <label
        htmlFor={'category-${category.id}'}
        className="flex-1 flex items-center gap-2 cursor-pointer text-sm"
      >
        <div
          className="w-3 h-3 rounded-full border"
          style={{ backgroundColor: category.couleur }}
        />
        <span className="flex-1 truncate">{category.nom}</span>
        {category.icone && <span>{category.icone}</span>}
        {showCount && category._count?.books && (
          <Badge variant="outline" className="text-xs">
            {category._count.books}
          </Badge>
        )}
      </label>
    </div>
  );
}

// Composant tag
function TagItem({ 
  tag, 
  isSelected, 
  onToggle,
  showCount = true 
}: { 
  tag: Tag & { _count?: { books: number } };
  isSelected: boolean;
  onToggle: () => void;
  showCount?: boolean;
}) {
  return (
    <div className='flex items-center space-x-2 py-1'>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        id={'tag-${tag.id}'}
      />
      <label
        htmlFor={'tag-${tag.id}'}
        className="flex-1 flex items-center gap-2 cursor-pointer text-sm"
      >
        <div
          className="w-3 h-3 rounded-full border"
          style={{ backgroundColor: tag.couleur }}
        />
        <span className="flex-1 truncate">{tag.nom}</span>
        {tag.est_favori && (
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
        )}
        {showCount && tag._count?.books && (
          <Badge variant="outline" className="text-xs">
            {tag._count.books}
          </Badge>
        )}
      </label>
    </div>
  );
}

// Composant slider pour les notes
function RatingSlider({ 
  label, 
  min = 1, 
  max = 10, 
  value, 
  onChange,
  icon 
}: {
  label: string;
  min?: number;
  max?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  icon?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-1">
          {icon && <span>{icon}</span>}
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">
          {value[0]} - {value[1]}
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={onChange}
        min={min}
        max={max}
        step={1}
        className="w-full"
      />
    </div>
  );
}

export function Sidebar({
  className,
  filters = {},
  onFiltersChange,
  categories = [],
  tags = [],
  onToggle,
  isCollapsed = false,
  showFilters = true,
  showQuickStats = true,
  quickStats
}: SidebarProps) {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [tagSearchTerm, setTagSearchTerm] = useState("');

  // Filtrer les catégories selon la recherche
  const filteredCategories = categories.filter(cat =>
    cat.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouper les tags par type et filtrer
  const groupedTags = tags.reduce((acc, tag) => {
    if (tag.nom.toLowerCase().includes(tagSearchTerm.toLowerCase())) {
      if (!acc[tag.type]) acc[tag.type] = [];
      acc[tag.type].push(tag);
    }
    return acc;
  }, {} as Record<TagType, Tag[]>);

  // Handlers pour les filtres
  const handleFilterChange = (key: keyof SidebarFilters, value: any) => {
    onFiltersChange?.({
      ...filters,
      [key]: value
    });
  };

  const toggleCategory = (categoryId: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    handleFilterChange('categories', newCategories);
  };

  const toggleTag = (tagId: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    
    handleFilterChange('tags', newTags);
  };

  const toggleStatus = (status: BookStatusType) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    handleFilterChange('status', newStatuses);
  };

  // Reset des filtres
  const resetFilters = () => {
    onFiltersChange?.({});
    setSearchTerm('');
    setTagSearchTerm('');
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'search' && value) return count + 1;
    if (Array.isArray(value) && value.length > 0) return count + 1;
    if (typeof value === 'boolean' && value) return count + 1;
    if (typeof value === 'number' && value !== (key.includes('Min') ? 1 : 10)) return count + 1;
    return count;
  }, 0);

  if (isCollapsed) {
    return (
      <div className={cn('w-12 border-r bg-muted/30', className)}>
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Ouvrir les filtres"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <aside className={cn("w-80 border-r bg-muted/30", className)}>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h2 className="font-semibold">Filtres</h2>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                disabled={activeFiltersCount === 0}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {onToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Statistiques rapides */}
          {showQuickStats && quickStats && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Aperçu
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="font-medium">{quickStats.totalBooks}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="font-medium">{quickStats.readBooks}</div>
                    <div className="text-xs text-muted-foreground">Lus</div>
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      {quickStats.averageRating}/10
                    </div>
                    <div className="text-xs text-muted-foreground">Moyenne</div>
                  </div>
                  <div>
                    <div className="font-medium truncate">{quickStats.favoriteGenre}</div>
                    <div className="text-xs text-muted-foreground">Genre favori</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showFilters && (
            <>
              {/* Recherche globale */}
              <SidebarSection title="Recherche" icon={Search}>
                <div className="space-y-2">
                  <Input
                    placeholder="Rechercher..."
                    value={filters.search || ""}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>
              </SidebarSection>

              <Separator />

              {/* Statuts de lecture */}
              <SidebarSection title="Statut de lecture">
                <div className="space-y-1">
                  {Object.values(BookStatusType).map((status) => (
                    <div key={status} className="flex items-center space-x-2'>
                      <Checkbox
                        checked={filters.status?.includes(status) || false}
                        onCheckedChange={() => toggleStatus(status)}
                        id={'status-${status}'}
                      />
                      <label
                        htmlFor={'status-${status}'}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <BookStatus status={status} size="xs" variant="minimal" />
                      </label>
                    </div>
                  ))}
                </div>
              </SidebarSection>

              <Separator />

              {/* Notations */}
              <SidebarSection title="Notations" icon={Star}>
                <div className="space-y-4">
                  <RatingSlider
                    label="Note générale"
                    value={[filters.ratingMin || 1, filters.ratingMax || 10]}
                    onChange={(value) => {
                      handleFilterChange("ratingMin", value[0]);
                      handleFilterChange("ratingMax", value[1]);
                    }}
                    icon="⭐"
                  />
                  
                  <RatingSlider
                    label="Niveau Spicy"
                    value={[filters.spicyMin || 1, filters.spicyMax || 10]}
                    onChange={(value) => {
                      handleFilterChange("spicyMin", value[0]);
                      handleFilterChange("spicyMax", value[1]);
                    }}
                    icon="🌶️"
                  />
                  
                  <RatingSlider
                    label="Niveau Dark"
                    value={[filters.darkMin || 1, filters.darkMax || 10]}
                    onChange={(value) => {
                      handleFilterChange("darkMin", value[0]);
                      handleFilterChange('darkMax', value[1]);
                    }}
                    icon="💀"
                  />
                  
                  <RatingSlider
                    label="Niveau Romance"
                    value={[filters.romanceMin || 1, filters.romanceMax || 10]}
                    onChange={(value) => {
                      handleFilterChange("romanceMin", value[0]);
                      handleFilterChange('romanceMax', value[1]);
                    }}
                    icon="❤️"
                  />
                </div>
              </SidebarSection>

              <Separator />

              {/* Catégories */}
              <SidebarSection 
                title="Catégories" 
                icon={Folder}
                badge={filters.categories?.length || undefined}
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange("categories", [])}
                    disabled={!filters.categories?.length}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                }
              >
                <div className="space-y-2">
                  <Input
                    placeholder="Rechercher une catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        isSelected={filters.categories?.includes(category.id) || false}
                        onToggle={() => toggleCategory(category.id)}
                      />
                    ))}
                  </div>
                </div>
              </SidebarSection>

              <Separator />

              {/* Tags */}
              <SidebarSection 
                title="Tags" 
                icon={TagIcon}
                badge={filters.tags?.length || undefined}
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange("tags", [])}
                    disabled={!filters.tags?.length}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                }
              >
                <div className="space-y-2">
                  <Input
                    placeholder="Rechercher un tag..."
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                    className="h-8"
                  />
                  <div className="max-h-64 overflow-y-auto">
                    {Object.entries(groupedTags).map(([type, typeTags]) => (
                      <div key={type} className="mb-3">
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {type === TagType.GENRE && "🎭 Genres"}
                          {type === TagType.TROPE && '💫 Tropes'}
                          {type === TagType.TRIGGER && '⚠️ Triggers'}
                          {type === TagType.PERSONNALISE && '🏷️ Personnalisés'}
                        </Label>
                        <div className="space-y-1">
                          {typeTags.map((tag) => (
                            <TagItem
                              key={tag.id}
                              tag={tag}
                              isSelected={filters.tags?.includes(tag.id) || false}
                              onToggle={() => toggleTag(tag.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SidebarSection>

              <Separator />

              {/* Filtres spéciaux */}
              <SidebarSection title="Autres filtres">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.favorites || false}
                      onCheckedChange={(checked) => handleFilterChange("favorites", checked)}
                      id="favorites-filter"
                    />
                    <label htmlFor="favorites-filter" className="text-sm cursor-pointer">
                      Favoris seulement
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.hasReview || false}
                      onCheckedChange={(checked) => handleFilterChange("hasReview", checked)}
                      id="review-filter"
                    />
                    <label htmlFor="review-filter" className="text-sm cursor-pointer">
                      Avec critique
                    </label>
                  </div>
                </div>
              </SidebarSection>

              <Separator />

              {/* Dates */}
              <SidebarSection title="Dates" icon={Calendar}>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="date-from" className="text-xs">
                      Date de début
                    </Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateFrom || ""}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date-to" className="text-xs">
                      Date de fin
                    </Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateTo || ""}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              </SidebarSection>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}