"use client";

import { useState, useEffect } from "react";
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  BookOpen, 
  Calendar, 
  User,
  Tag,
  Folder,
  Heart,
  Flame,
  Skull
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types pour les filtres
export interface FilterState {
  // Filtres par genre/tags
  selectedGenres: string[];
  selectedTropes: string[];
  selectedTriggers: string[];
  selectedCategories: string[];
  
  // Filtres par notes/niveaux
  minGeneralRating?: number;
  maxGeneralRating?: number;
  minSpicyLevel?: number;
  maxSpicyLevel?: number;
  minDarkLevel?: number;
  maxDarkLevel?: number;
  minRomanceLevel?: number;
  maxRomanceLevel?: number;
  
  // Filtres par statut
  selectedStatuses: string[];
  
  // Filtres par auteur
  selectedAuthors: string[];
  
  // Filtres par date
  dateFrom?: Date;
  dateTo?: Date;
  
  // Filtre par pages
  minPages?: number;
  maxPages?: number;
  
  // Filtre par rythme
  selectedRhythms: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset?: () => void;
  className?: string;
  availableOptions?: {
    genres?: Array<{ id: string; name: string; color: string; count: number }>;
    tropes?: Array<{ id: string; name: string; color: string; count: number }>;
    triggers?: Array<{ id: string; name: string; color: string; count: number }>;
    categories?: Array<{ id: string; name: string; color: string; count: number }>;
    authors?: Array<{ name: string; count: number }>;
    statuses?: Array<{ value: string; label: string; count: number }>;
    rhythms?: Array<{ value: string; label: string; count: number }>;
  };
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, icon, children, defaultOpen = false }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

export function FilterPanel({ 
  filters, 
  onFiltersChange, 
  onReset, 
  className,
  availableOptions = {}
}: FilterPanelProps) {
  const {
    genres = [],
    tropes = [],
    triggers = [],
    categories = [],
    authors = [],
    statuses = [
      { value: "LU", label: "Lu", count: 0 },
      { value: "EN_COURS", label: "En cours", count: 0 },
      { value: "A_LIRE", label: "À lire", count: 0 },
      { value: "ABANDONNE", label: "Abandonné", count: 0 },
    ],
    rhythms = [
      { value: "slow", label: "Slow", count: 0 },
      { value: "medium", label: "Medium", count: 0 },
      { value: "fast", label: "Fast", count: 0 },
      { value: "insta", label: "Insta", count: 0 },
    ]
  } = availableOptions;

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  // Compter le nombre total de filtres actifs
  const getActiveFiltersCount = () => {
    let count = 0;
    count += filters.selectedGenres.length;
    count += filters.selectedTropes.length;
    count += filters.selectedTriggers.length;
    count += filters.selectedCategories.length;
    count += filters.selectedStatuses.length;
    count += filters.selectedAuthors.length;
    count += filters.selectedRhythms.length;
    if (filters.minGeneralRating) count++;
    if (filters.maxGeneralRating) count++;
    if (filters.minSpicyLevel) count++;
    if (filters.maxSpicyLevel) count++;
    if (filters.minDarkLevel) count++;
    if (filters.maxDarkLevel) count++;
    if (filters.minRomanceLevel) count++;
    if (filters.maxRomanceLevel) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.minPages) count++;
    if (filters.maxPages) count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <div className={cn("p-4 bg-card rounded-lg border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filtres</h3>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeCount}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Filtres par statut */}
        <FilterSection
          title="Statut de lecture"
          icon={<BookOpen className="h-4 w-4" />}
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((status) => (
              <Label
                key={status.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
              >
                <Checkbox
                  checked={filters.selectedStatuses.includes(status.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilters({
                        selectedStatuses: [...filters.selectedStatuses, status.value]
                      });
                    } else {
                      updateFilters({
                        selectedStatuses: filters.selectedStatuses.filter(s => s !== status.value)
                      });
                    }
                  }}
                />
                <span className="text-sm flex-1">{status.label}</span>
                {status.count > 0 && (
                  <span className="text-xs text-muted-foreground">({status.count})</span>
                )}
              </Label>
            ))}
          </div>
        </FilterSection>

        {/* Filtres par note générale */}
        <FilterSection
          title="Note générale"
          icon={<Star className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min-rating" className="text-xs text-muted-foreground">
                Minimum
              </Label>
              <Input
                id="min-rating"
                type="number"
                min="0"
                max="10"
                value={filters.minGeneralRating || ""}
                onChange={(e) => updateFilters({
                  minGeneralRating: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="max-rating" className="text-xs text-muted-foreground">
                Maximum
              </Label>
              <Input
                id="max-rating"
                type="number"
                min="0"
                max="10"
                value={filters.maxGeneralRating || ""}
                onChange={(e) => updateFilters({
                  maxGeneralRating: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="text-sm"
                placeholder="10"
              />
            </div>
          </div>
        </FilterSection>

        {/* Niveaux spéciaux */}
        <FilterSection
          title="Niveaux spéciaux"
          icon={<Heart className="h-4 w-4" />}
        >
          <div className="space-y-3">
            {/* Niveau Spicy */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Flame className="h-3 w-3" /> Niveau Spicy
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.minSpicyLevel || ""}
                  onChange={(e) => updateFilters({
                    minSpicyLevel: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Min"
                  className="text-sm"
                />
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.maxSpicyLevel || ""}
                  onChange={(e) => updateFilters({
                    maxSpicyLevel: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Max"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Niveau Dark */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Skull className="h-3 w-3" /> Niveau Dark
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.minDarkLevel || ""}
                  onChange={(e) => updateFilters({
                    minDarkLevel: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Min"
                  className="text-sm"
                />
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.maxDarkLevel || ""}
                  onChange={(e) => updateFilters({
                    maxDarkLevel: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Max"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Niveau Romance */}
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Heart className="h-3 w-3" /> Niveau Romance
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.minRomanceLevel || ""}
                  onChange={(e) => updateFilters({
                    minRomanceLevel: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Min"
                  className="text-sm"
                />
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.maxRomanceLevel || ""}
                  onChange={(e) => updateFilters({
                    maxRomanceLevel: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Max"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Filtres par genres */}
        {genres.length > 0 && (
          <FilterSection
            title="Genres"
            icon={<Tag className="h-4 w-4" />}
          >
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {genres.map((genre) => (
                <Label
                  key={genre.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
                >
                  <Checkbox
                    checked={filters.selectedGenres.includes(genre.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilters({
                          selectedGenres: [...filters.selectedGenres, genre.id]
                        });
                      } else {
                        updateFilters({
                          selectedGenres: filters.selectedGenres.filter(g => g !== genre.id)
                        });
                      }
                    }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: genre.color }}
                  />
                  <span className="text-sm flex-1">{genre.name}</span>
                  {genre.count > 0 && (
                    <span className="text-xs text-muted-foreground">({genre.count})</span>
                  )}
                </Label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Filtres par catégories */}
        {categories.length > 0 && (
          <FilterSection
            title="Catégories"
            icon={<Folder className="h-4 w-4" />}
          >
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {categories.map((category) => (
                <Label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
                >
                  <Checkbox
                    checked={filters.selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilters({
                          selectedCategories: [...filters.selectedCategories, category.id]
                        });
                      } else {
                        updateFilters({
                          selectedCategories: filters.selectedCategories.filter(c => c !== category.id)
                        });
                      }
                    }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm flex-1">{category.name}</span>
                  {category.count > 0 && (
                    <span className="text-xs text-muted-foreground">({category.count})</span>
                  )}
                </Label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Filtres par rythme */}
        <FilterSection
          title="Rythme"
          icon={<BookOpen className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-2">
            {rhythms.map((rhythm) => (
              <Label
                key={rhythm.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
              >
                <Checkbox
                  checked={filters.selectedRhythms.includes(rhythm.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilters({
                        selectedRhythms: [...filters.selectedRhythms, rhythm.value]
                      });
                    } else {
                      updateFilters({
                        selectedRhythms: filters.selectedRhythms.filter(r => r !== rhythm.value)
                      });
                    }
                  }}
                />
                <span className="text-sm flex-1">{rhythm.label}</span>
                {rhythm.count > 0 && (
                  <span className="text-xs text-muted-foreground">({rhythm.count})</span>
                )}
              </Label>
            ))}
          </div>
        </FilterSection>

        {/* Filtres par dates */}
        <FilterSection
          title="Période"
          icon={<Calendar className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <div>
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                Date de début
              </Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom?.toISOString().split('T')[0] || ""}
                onChange={(e) => updateFilters({
                  dateFrom: e.target.value ? new Date(e.target.value) : undefined
                })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                Date de fin
              </Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo?.toISOString().split('T')[0] || ""}
                onChange={(e) => updateFilters({
                  dateTo: e.target.value ? new Date(e.target.value) : undefined
                })}
                className="text-sm"
              />
            </div>
          </div>
        </FilterSection>

        {/* Filtres par nombre de pages */}
        <FilterSection
          title="Nombre de pages"
          icon={<BookOpen className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min-pages" className="text-xs text-muted-foreground">
                Minimum
              </Label>
              <Input
                id="min-pages"
                type="number"
                min="0"
                value={filters.minPages || ""}
                onChange={(e) => updateFilters({
                  minPages: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="max-pages" className="text-xs text-muted-foreground">
                Maximum
              </Label>
              <Input
                id="max-pages"
                type="number"
                min="0"
                value={filters.maxPages || ""}
                onChange={(e) => updateFilters({
                  maxPages: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="text-sm"
                placeholder="∞"
              />
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}