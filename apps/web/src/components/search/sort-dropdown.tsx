"use client";

import { useState } from "react";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  Star,
  BookOpen,
  User,
  Hash,
  Clock,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SortOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

interface SortDropdownProps {
  value: SortConfig;
  onChange: (sortConfig: SortConfig) => void;
  options?: SortOption[];
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showIcon?: boolean;
  showDirection?: boolean;
}

// Options de tri par défaut pour les livres
const DEFAULT_SORT_OPTIONS: SortOption[] = [
  {
    value: "date_creation",
    label: "Date d'ajout",
    icon: <Calendar className="h-4 w-4" />,
    description: "Trier par date d'ajout dans la bibliothèque"
  },
  {
    value: "date_modification",
    label: "Dernière modification",
    icon: <Clock className="h-4 w-4" />,
    description: "Trier par dernière modification"
  },
  {
    value: "titre",
    label: "Titre",
    icon: <BookOpen className="h-4 w-4" />,
    description: "Trier par ordre alphabétique du titre"
  },
  {
    value: "auteur",
    label: "Auteur",
    icon: <User className="h-4 w-4" />,
    description: "Trier par nom d'auteur"
  },
  {
    value: "note_generale",
    label: "Note générale",
    icon: <Star className="h-4 w-4" />,
    description: "Trier par note générale"
  },
  {
    value: "nombre_pages",
    label: "Nombre de pages",
    icon: <Hash className="h-4 w-4" />,
    description: "Trier par nombre de pages"
  },
  {
    value: "date_lecture",
    label: "Date de lecture",
    icon: <Calendar className="h-4 w-4" />,
    description: "Trier par date de lecture"
  },
  {
    value: "niveau_spicy",
    label: "Niveau Spicy",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Trier par niveau spicy"
  },
  {
    value: "niveau_dark",
    label: "Niveau Dark",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Trier par niveau dark"
  },
  {
    value: "niveau_romance",
    label: "Niveau Romance",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Trier par niveau romance"
  }
];

export function SortDropdown({
  value,
  onChange,
  options = DEFAULT_SORT_OPTIONS,
  className,
  size="default",
  variant="outline",
  showIcon = true,
  showDirection = true
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Trouver l'option actuellement sélectionnée
  const currentOption = options.find(option => option.value === value.field);
  
  // Gérer le changement de champ de tri
  const handleFieldChange = (field: string) => {
    onChange({
      field,
      direction: value.field === field ? value.direction : "desc" // Garder la direction si même champ
    });
  };

  // Gérer le changement de direction
  const handleDirectionToggle = () => {
    onChange({
      ...value,
      direction: value.direction === "asc" ? "desc" : "asc"
    });
  };

  // Obtenir l'icône de direction
  const getDirectionIcon = () => {
    if (value.direction === "asc") {
      return <ArrowUp className="h-3 w-3" />;
    } else {
      return <ArrowDown className="h-3 w-3" />;
    }
  };

  // Obtenir le texte du bouton
  const getButtonText = () => {
    if (currentOption) {
      return currentOption.label;
    }
    return "Trier par";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "flex items-center gap-2",
            showDirection && "pr-2",
            className
          )}
        >
          {showIcon && <ArrowUpDown className="h-4 w-4" />}
          <span>{getButtonText()}</span>
          {showDirection && currentOption && (
            <div className="ml-1 flex items-center">
              {getDirectionIcon()}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64"
        sideOffset={4}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Options de tri
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Options de tri */}
        <DropdownMenuRadioGroup 
          value={value.field} 
          onValueChange={handleFieldChange}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="flex items-start gap-3 p-3 cursor-pointer"
            >
              <div className="flex items-center justify-center w-5 h-5 mt-0.5">
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                )}
              </div>
              {value.field === option.value && (
                <div className="flex items-center justify-center w-5 h-5">
                  {getDirectionIcon()}
                </div>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        
        {/* Contrôles de direction */}
        {currentOption && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Ordre de tri
            </DropdownMenuLabel>
            <div className="p-2 flex gap-1">
              <Button
                variant={value.direction === "asc" ? "default" : "ghost"}
                size="sm"
                onClick={handleDirectionToggle}
                className="flex-1 text-xs"
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                Croissant
              </Button>
              <Button
                variant={value.direction === "desc" ? "default" : "ghost"}
                size="sm"
                onClick={handleDirectionToggle}
                className="flex-1 text-xs"
              >
                <ArrowDown className="h-3 w-3 mr-1" />
                Décroissant
              </Button>
            </div>
          </>
        )}
        
        {/* Info sur le tri actuel */}
        {currentOption && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3 bg-muted/50 rounded-sm mx-2 mb-2">
              <div className="text-xs text-muted-foreground mb-1">
                Tri actuel:
              </div>
              <div className="text-sm font-medium flex items-center gap-2">
                {currentOption.icon}
                {currentOption.label}
                <span className="text-xs text-muted-foreground">
                  ({value.direction === "asc" ? "croissant" : "décroissant"})
                </span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Composant simplifié pour un tri rapide
interface QuickSortProps {
  value: SortConfig;
  onChange: (sortConfig: SortConfig) => void;
  className?: string;
}

export function QuickSort({ value, onChange, className }: QuickSortProps) {
  const quickOptions: SortOption[] = [
    {
      value: "date_creation",
      label: "Plus récents",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      value: "titre",
      label: "A-Z",
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      value: "note_generale",
      label: "Mieux notés",
      icon: <Star className="h-4 w-4" />
    }
  ];

  return (
    <div className={cn("flex gap-2", className)}>
      {quickOptions.map((option) => (
        <Button
          key={option.value}
          variant={value.field === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({
            field: option.value,
            direction: option.value === "titre" ? "asc" : "desc"
          })}
          className="text-xs"
        >
          {option.icon}
          {option.label}
        </Button>
      ))}
    </div>
  );
}

// Hook pour gérer l'état du tri
export function useSorting(initialSort: SortConfig = { field: "date_creation", direction: "desc" }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(initialSort);

  const updateSort = (newSort: SortConfig) => {
    setSortConfig(newSort);
  };

  const toggleDirection = () => {
    setSortConfig(prev => ({
      ...prev,
      direction: prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const setSortField = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field ? prev.direction : "desc"
    }));
  };

  return {
    sortConfig,
    updateSort,
    toggleDirection,
    setSortField
  };
}