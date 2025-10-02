/**
 * RhythmSelector - Composant pour sélectionner le rythme de lecture ⚡
 * Slow (lent), Medium (moyen), Fast (rapide), Insta (instant)
 */

"use client";

import * as React from "react";
import { Clock, Zap, Timer, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { ratingDarkRomanceStyles } from "@/lib/theme-variants";

export type RhythmValue="slow" | "medium" | "fast" | "insta";

export interface RhythmOption {
  value: RhythmValue;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const rhythmOptions: RhythmOption[] = [
  {
    value: "slow",
    label: "Slow",
    description: "Lecture lente et posée",
    icon: Clock,
    color: 'text-blue-500 hover:text-blue-600',
  },
  {
    value: "medium",
    label: "Medium",
    description: "Rythme équilibré",
    icon: Timer,
    color: 'text-green-500 hover:text-green-600',
  },
  {
    value: "fast",
    label: "Fast",
    description: "Rythme soutenu",
    icon: Gauge,
    color: 'text-orange-500 hover:text-orange-600',
  },
  {
    value: "insta",
    label: "Insta",
    description: "Action non-stop",
    icon: Zap,
    color: 'text-red-500 hover:text-red-600',
  },
];

export interface RhythmSelectorProps {
  value?: RhythmValue;
  onChange?: (value: RhythmValue) => void;
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical" | "grid";
  readonly?: boolean;
  showLabel?: boolean;
  showDescription?: boolean;
  className?: string;
  optionClassName?: string;
  allowDeselect?: boolean;
  variant?: "default" | "compact" | "pills";
}

export function RhythmSelector({
  value,
  onChange,
  size="md",
  layout="horizontal",
  readonly = false,
  showLabel = true,
  showDescription = false,
  className,
  optionClassName,
  allowDeselect = false,
  variant="default",
}: RhythmSelectorProps) {
  const handleOptionClick = (optionValue: RhythmValue) => {
    if (readonly || !onChange) return;
    
    // Si allowDeselect est true et que la valeur est déjà sélectionnée, désélectionner
    if (allowDeselect && value === optionValue) {
      onChange(undefined as any);
    } else {
      onChange(optionValue);
    }
  };

  const sizeClasses = {
    sm: {
      icon: "h-3 w-3",
      text: "text-xs",
      padding: "px-2 py-1",
      gap: "gap-1",
    },
    md: {
      icon: "h-4 w-4",
      text: "text-sm",
      padding: "px-3 py-2",
      gap: "gap-2",
    },
    lg: {
      icon: "h-5 w-5",
      text: "text-base",
      padding: "px-4 py-3",
      gap: "gap-3",
    },
  };

  const layoutClasses = {
    horizontal: "flex flex-row",
    vertical: "flex flex-col",
    grid: "grid grid-cols-2",
  };

  const getOptionClasses = (option: RhythmOption, isSelected: boolean) => {
    const baseClasses = cn(
      "relative transition-all duration-200 border rounded-lg",
      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
      !readonly && "cursor-pointer hover:scale-105",
      readonly && "cursor-default opacity-60",
      sizeClasses[size].padding,
      sizeClasses[size].gap
    );

    if (variant === "compact") {
      return cn(
        baseClasses,
        "flex items-center justify-center",
        isSelected 
          ? "bg-primary text-primary-foreground border-primary shadow-md" 
          : "bg-background hover:bg-muted border-border"
      );
    }

    if (variant === "pills") {
      return cn(
        "inline-flex items-center rounded-full border transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        !readonly && "cursor-pointer hover:scale-105",
        readonly && "cursor-default opacity-60",
        sizeClasses[size].padding,
        sizeClasses[size].gap,
        isSelected
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-background hover:bg-muted border-border"
      );
    }

    return cn(
      baseClasses,
      "flex flex-col items-center text-center",
      isSelected
        ? "bg-primary/10 text-primary border-primary shadow-md"
        : "bg-background hover:bg-muted border-border"
    );
  };

  const renderOption = (option: RhythmOption) => {
    const isSelected = value === option.value;
    const Icon = option.icon;

    return (
      <button
        key={option.value}
        type=`button`
        disabled={readonly}
        className={cn(
          getOptionClasses(option, isSelected),
          optionClassName
        )}
        onClick={() => handleOptionClick(option.value)}
        aria-label={`Rythme ${option.label}:`${option.description}`}
        aria-pressed={isSelected}
      >
        <Icon
          className={cn(
            sizeClasses[size].icon,
            `transition-colors duration-200",
            isSelected ? "text-primary" : option.color
          )}
        />
        
        {(showLabel || variant === "compact") && (
          <span className={cn(
            "font-medium transition-colors duration-200",
            sizeClasses[size].text,
            variant === "compact" && size === "sm" && "sr-only"
          )}>
            {option.label}
          </span>
        )}
        
        {showDescription && variant === "default" && (
          <span className={cn(
            "text-xs text-muted-foreground mt-1",
            size === "sm" && "text-[10px]"
          )}>
            {option.description}
          </span>
        )}
        
        {/* Indicateur de sélection */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && variant !== "compact" && (
        <label className={cn("font-medium text-foreground", sizeClasses[size].text)}>
          Rythme ⚡
        </label>
      )}
      
      <div
        className={cn(
          layoutClasses[layout],
          layout === "horizontal" && sizeClasses[size].gap,
          layout === "vertical" && "space-y-2",
          layout === "grid" && "gap-2"
        )}
        role="radiogroup"
        aria-label="Sélection du rythme de lecture"
      >
        {rhythmOptions.map(renderOption)}
      </div>
      
      {value && (
        <div className="text-xs text-muted-foreground">
          Sélectionné : {rhythmOptions.find(opt => opt.value === value)?.description}
        </div>
      )}
    </div>
  );
}

// Composant d'affichage en lecture seule
export function RhythmDisplay({ 
  value, 
  size="md", 
  showDescription = true,
  className 
}: {
  value: RhythmValue;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  className?: string;
}) {
  const option = rhythmOptions.find(opt => opt.value === value);
  
  if (!option) return null;
  
  const Icon = option.icon;
  
  const sizeClasses = {
    sm: { icon: "h-3 w-3", text: "text-xs" },
    md: { icon: "h-4 w-4", text: "text-sm" },
    lg: { icon: "h-5 w-5", text: "text-base" },
  };
  
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Icon className={cn(sizeClasses[size].icon, option.color)} />
      <span className={cn("font-medium", sizeClasses[size].text)}>
        {option.label}
      </span>
      {showDescription && (
        <span className={cn("text-muted-foreground", sizeClasses[size].text)}>
          • {option.description}
        </span>
      )}
    </div>
  );
}

// Badge compact pour l'affichage
export function RhythmBadge({ 
  value, 
  className 
}: { 
  value: RhythmValue; 
  className?: string; 
}) {
  const option = rhythmOptions.find(opt => opt.value === value);
  
  if (!option) return null;
  
  const Icon = option.icon;
  
  const getBadgeColor = () => {
    switch (value) {
      case "slow": return "bg-blue-100 text-blue-800 border-blue-200";
      case "medium": return "bg-green-100 text-green-800 border-green-200";
      case "fast": return "bg-orange-100 text-orange-800 border-orange-200";
      case "insta": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
      getBadgeColor(),
      className
    )}>
      <Icon className="h-3 w-3" />
      {option.label}
    </span>
  );
}

// Hook personnalisé pour gérer l'état du rythme
export function useRhythm(initialValue?: RhythmValue) {
  const [value, setValue] = React.useState<RhythmValue | undefined>(initialValue);
  const [isValid, setIsValid] = React.useState(!!initialValue);

  const handleChange = React.useCallback((newValue: RhythmValue | undefined) => {
    setValue(newValue);
    setIsValid(!!newValue);
  }, []);

  const reset = React.useCallback(() => {
    setValue(undefined);
    setIsValid(false);
  }, []);

  const getOption = React.useCallback(() => {
    return value ? rhythmOptions.find(opt => opt.value === value) : undefined;
  }, [value]);

  return {
    value,
    setValue: handleChange,
    reset,
    isValid,
    isEmpty: !value,
    isComplete: !!value,
    option: getOption(),
  };
}