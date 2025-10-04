"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { 
  Tag, 
  X, 
  Search, 
  Plus, 
  Check,
  Hash,
  Heart,
  Flame,
  Skull,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TagOption {
  id: string;
  name: string;
  color: string;
  type: "GENRE" | "TROPE" | "TRIGGER" | "PERSONNALISE";
  count?: number;
  description?: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  availableTags?: TagOption[];
  placeholder?: string;
  maxSelection?: number;
  allowMultiple?: boolean;
  showSearch?: boolean;
  showCreateNew?: boolean;
  onCreateNew?: (name: string, type: TagOption["type"]) => void;
  groupByType?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "compact";
}

// Icônes pour les types de tags
const getTagTypeIcon = (type: TagOption["type"]) => {
  switch (type) {
    case "GENRE":
      return <Hash className="h-3 w-3" />;
    case "TROPE":
      return <Heart className="h-3 w-3" />;
    case "TRIGGER":
      return <Skull className="h-3 w-3" />;
    case "PERSONNALISE":
      return <Sparkles className="h-3 w-3" />;
    default:
      return <Tag className="h-3 w-3" />;
  }
};

// Labels pour les types
const getTagTypeLabel = (type: TagOption["type"]) => {
  switch (type) {
    case "GENRE":
      return "Genre";
    case "TROPE":
      return "Trope";
    case "TRIGGER":
      return "Trigger";
    case "PERSONNALISE":
      return "Personnalisé";
    default:
      return "Tag";
  }
};

export function TagSelector({
  selectedTags,
  onSelectionChange,
  availableTags = [],
  placeholder="Sélectionner des tags...",
  maxSelection,
  allowMultiple = true,
  showSearch = true,
  showCreateNew = false,
  onCreateNew,
  groupByType = true,
  className,
  size="default",
  variant="default"
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagType, setNewTagType] = useState<TagOption["type"]>("PERSONNALISE");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrer les tags selon la recherche
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouper les tags par type si nécessaire
  const groupedTags = groupByType 
    ? filteredTags.reduce((groups, tag) => {
        if (!groups[tag.type]) {
          groups[tag.type] = [];
        }
        groups[tag.type].push(tag);
        return groups;
      }, {} as Record<TagOption["type"], TagOption[]>)
    : { ALL: filteredTags };

  // Obtenir les tags sélectionnés
  const selectedTagObjects = availableTags.filter(tag => 
    selectedTags.includes(tag.id)
  );

  // Gérer la sélection/désélection
  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      // Désélectionner
      onSelectionChange(selectedTags.filter(id => id !== tagId));
    } else {
      // Sélectionner
      if (!allowMultiple) {
        onSelectionChange([tagId]);
        setIsOpen(false);
      } else if (!maxSelection || selectedTags.length < maxSelection) {
        onSelectionChange([...selectedTags, tagId]);
      }
    }
  };

  // Gérer la création d'un nouveau tag
  const handleCreateNew = () => {
    if (newTagName.trim() && onCreateNew) {
      onCreateNew(newTagName.trim(), newTagType);
      setNewTagName("");
      setShowCreateForm(false);
      setSearchQuery("");
    }
  };

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus sur l'input de recherche quand on ouvre
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start text-left font-normal",
          size === "sm" && "h-8 px-2 text-sm",
          size === "lg" && "h-12 px-4 text-base",
          !selectedTags.length && "text-muted-foreground"
        )}
      >
        <Tag className="mr-2 h-4 w-4" />
        
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1 flex-1">
            {variant === "compact" ? (
              <span className="text-sm">
                {selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""} sélectionné{selectedTags.length > 1 ? "s" : ""}
              </span>
            ) : (
              <>
                {selectedTagObjects.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {selectedTagObjects.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedTagObjects.length - 3}
                  </Badge>
                )}
              </>
            )}
          </div>
        ) : (
          <span>{placeholder}</span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header avec recherche */}
          {showSearch && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher des tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Tags sélectionnés (si variant compact) */}
          {variant === "compact" && selectedTagObjects.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="text-xs text-muted-foreground mb-2">Tags sélectionnés:</div>
              <div className="flex flex-wrap gap-1">
                {selectedTagObjects.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    {tag.name}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Liste des tags */}
          <div className="max-h-64 overflow-y-auto">
            {Object.keys(groupedTags).length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun tag trouvé</p>
              </div>
            ) : (
              Object.entries(groupedTags).map(([type, tags]) => (
                <div key={type}>
                  {groupByType && type !== "ALL" && tags.length > 0 && (
                    <div className="px-3 py-2 bg-muted/50 border-b border-border">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {getTagTypeIcon(type as TagOption["type"])}
                        {getTagTypeLabel(type as TagOption["type"])}
                        <span>({tags.length})</span>
                      </div>
                    </div>
                  )}
                  
                  {tags.map((tag) => (
                    <Label
                      key={tag.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                    >
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={() => handleToggleTag(tag.id)}
                        disabled={!allowMultiple && selectedTags.length > 0 && !selectedTags.includes(tag.id)}
                      />
                      
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {tag.name}
                          </span>
                          {!groupByType && (
                            <span className="text-xs text-muted-foreground">
                              {getTagTypeLabel(tag.type)}
                            </span>
                          )}
                        </div>
                        
                        {tag.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {tag.description}
                          </p>
                        )}
                      </div>
                      
                      {tag.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          ({tag.count})
                        </span>
                      )}
                      
                      {selectedTags.includes(tag.id) && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </Label>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Création de nouveau tag */}
          {showCreateNew && onCreateNew && (
            <div className="border-t border-border">
              {!showCreateForm ? (
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full justify-start p-3 h-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un nouveau tag
                </Button>
              ) : (
                <div className="p-3 space-y-3">
                  <Input
                    type="text"
                    placeholder="Nom du tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateNew();
                      }
                      if (e.key === "Escape") {
                        setShowCreateForm(false);
                        setNewTagName("");
                      }
                    }}
                    autoFocus
                  />
                  
                  <div className="flex gap-2">
                    {(["GENRE", "TROPE", "TRIGGER", "PERSONNALISE"] as const).map((type) => (
                      <Label
                        key={type}
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="tagType"
                          value={type}
                          checked={newTagType === type}
                          onChange={() => setNewTagType(type)}
                          className="sr-only"
                        />
                        <Badge 
                          variant={newTagType === type ? "default" : "outline"}
                          className="text-xs"
                        >
                          {getTagTypeIcon(type)}
                          {getTagTypeLabel(type)}
                        </Badge>
                      </Label>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateNew}
                      disabled={!newTagName.trim()}
                    >
                      Créer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewTagName("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer avec infos */}
          {maxSelection && (
            <div className="p-2 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                {selectedTags.length}/{maxSelection} tags sélectionnés
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Version simplifiée pour une sélection rapide
interface QuickTagSelectorProps {
  selectedTags: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  popularTags?: TagOption[];
  className?: string;
}

export function QuickTagSelector({
  selectedTags,
  onSelectionChange,
  popularTags = [],
  className
}: QuickTagSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {popularTags.map((tag) => (
        <Badge
          key={tag.id}
          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
          className="cursor-pointer text-xs"
          style={selectedTags.includes(tag.id) ? {
            backgroundColor: tag.color,
            color: "white"
          } : {
            borderColor: tag.color,
            color: tag.color
          }}
          onClick={() => {
            if (selectedTags.includes(tag.id)) {
              onSelectionChange(selectedTags.filter(id => id !== tag.id));
            } else {
              onSelectionChange([...selectedTags, tag.id]);
            }
          }}
        >
          {getTagTypeIcon(tag.type)}
          {tag.name}
          {tag.count && ` (${tag.count})`}
        </Badge>
      ))}
    </div>
  );
}