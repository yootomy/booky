/**
 * RomanceRating - Composant cœurs pour le niveau romance (1-10) ❤️
 * Utilisé pour indiquer le niveau de contenu romantique
 */

"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ratingDarkRomanceStyles } from "@/lib/theme-variants";

export interface RomanceRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  showLabel?: boolean;
  className?: string;
  romanceClassName?: string;
  emptyRomanceClassName?: string;
  filledRomanceClassName?: string;
  hoverEffect?: boolean;
  allowHalf?: boolean;
}

export function RomanceRating({
  value,
  onChange,
  max = 10,
  size = "md",
  readonly = false,
  showValue = false,
  showLabel = false,
  className,
  romanceClassName,
  emptyRomanceClassName,
  filledRomanceClassName,
  hoverEffect = true,
  allowHalf = false,
}: RomanceRatingProps) {
  const [hoveredValue, setHoveredValue] = React.useState<number>(0);
  const [isHovering, setIsHovering] = React.useState(false);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5",
  };

  const containerSizeClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const handleRomanceClick = (romanceValue: number) => {
    if (readonly || !onChange) return;
    
    if (allowHalf) {
      onChange(romanceValue);
    } else {
      onChange(Math.ceil(romanceValue));
    }
  };

  const handleRomanceHover = (romanceValue: number) => {
    if (readonly || !hoverEffect) return;
    setHoveredValue(romanceValue);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setHoveredValue(0);
    setIsHovering(false);
  };

  const displayValue = isHovering && hoverEffect ? hoveredValue : value;
  const clampedValue = Math.max(0, Math.min(max, displayValue));

  // Fonction pour obtenir l'intensité de la couleur selon la valeur
  const getRomanceIntensity = (romanceIndex: number) => {
    const romanceValue = romanceIndex + 1;
    const intensity = romanceValue / max;
    
    if (intensity <= 0.3) return "text-pink-300"; // Léger
    if (intensity <= 0.6) return "text-pink-400"; // Moyen
    if (intensity <= 0.8) return "text-pink-500"; // Romantique
    return "text-pink-600"; // Très romantique
  };

  const renderRomance = (romanceIndex: number) => {
    const romanceValue = romanceIndex + 1;
    const isFilled = clampedValue >= romanceValue;
    const isHalfFilled = allowHalf && clampedValue >= romanceValue - 0.5 && clampedValue < romanceValue;
    const isHovered = isHovering && hoveredValue >= romanceValue;
    const intensityColor = getRomanceIntensity(romanceIndex);

    return (
      <button
        key={romanceIndex}
        type="button"
        disabled={readonly}
        className={cn(
          "relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm",
          !readonly && "cursor-pointer hover:scale-110",
          readonly && "cursor-default",
          romanceClassName
        )}
        onClick={() => handleRomanceClick(romanceValue)}
        onMouseEnter={() => handleRomanceHover(romanceValue)}
        onFocus={() => handleRomanceHover(romanceValue)}
        aria-label={`Niveau romance ${romanceValue} sur ${max}`}
      >
        {/* Cœur de base (vide) */}
        <Heart
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            "text-gray-300 dark:text-gray-600",
            emptyRomanceClassName
          )}
        />
        
        {/* Cœur rempli */}
        {(isFilled || isHovered) && (
          <Heart
            className={cn(
              sizeClasses[size],
              "absolute inset-0 transition-all duration-200",
              intensityColor,
              ratingDarkRomanceStyles.romanceFilled,
              filledRomanceClassName,
              isHovered && !readonly && "scale-110 drop-shadow-lg animate-pulse"
            )}
            fill="currentColor"
          />
        )}
        
        {/* Demi-cœur */}
        {isHalfFilled && !isFilled && !isHovered && (
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Heart
              className={cn(
                sizeClasses[size],
                "transition-all duration-200",
                intensityColor,
                ratingDarkRomanceStyles.romanceFilled,
                filledRomanceClassName
              )}
              fill="currentColor"
            />
          </div>
        )}
      </button>
    );
  };

  // Obtenir le label descriptif selon la valeur
  const getRomanceLabel = (val: number) => {
    if (val === 0) return "Pas de romance";
    if (val <= 2) return "Très léger";
    if (val <= 4) return "Léger";
    if (val <= 6) return "Romantique";
    if (val <= 8) return "Très romantique";
    return "Passionné";
  };

  return (
    <div className={cn("flex items-center", containerSizeClasses[size], className)}>
      {showLabel && (
        <span className={cn("font-medium text-foreground mr-2", textSizeClasses[size])}>
          Niveau Romance ❤️ :
        </span>
      )}
      
      <div
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
        role="radiogroup"
        aria-label={`Niveau romance sur ${max}`}
      >
        {Array.from({ length: max }, (_, index) => renderRomance(index))}
      </div>
      
      {showValue && (
        <div className="ml-2 flex flex-col">
          <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
            {displayValue.toFixed(allowHalf ? 1 : 0)}/{max}
          </span>
          <span className={cn("text-xs text-muted-foreground", size === "lg" && "text-sm")}>
            {getRomanceLabel(displayValue)}
          </span>
        </div>
      )}
      
      {isHovering && !readonly && hoverEffect && (
        <span className={cn("ml-2 text-muted-foreground", textSizeClasses[size])}>
          {hoveredValue}/{max} - {getRomanceLabel(hoveredValue)}
        </span>
      )}
    </div>
  );
}

// Variante en lecture seule pour l'affichage
export function RomanceDisplay({
  value,
  max = 10,
  size = "md",
  showValue = true,
  className,
}: Pick<RomanceRatingProps, "value" | "max" | "size" | "showValue" | "className">) {
  return (
    <RomanceRating
      value={value}
      max={max}
      size={size}
      showValue={showValue}
      readonly={true}
      hoverEffect={false}
      className={className}
    />
  );
}

// Composant Badge Romance pour un affichage compact
export function RomanceBadge({ 
  value, 
  max = 10, 
  className 
}: { 
  value: number; 
  max?: number; 
  className?: string; 
}) {
  const getRomanceColor = () => {
    const intensity = value / max;
    if (intensity <= 0.3) return "bg-pink-100 text-pink-800 border-pink-200";
    if (intensity <= 0.6) return "bg-pink-200 text-pink-900 border-pink-300";
    if (intensity <= 0.8) return "bg-pink-300 text-pink-900 border-pink-400";
    return "bg-pink-400 text-pink-950 border-pink-500";
  };

  if (value === 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
        "bg-gray-100 text-gray-600 border-gray-200",
        className
      )}>
        Pas de romance
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
      getRomanceColor(),
      className
    )}>
      <Heart className="h-3 w-3" fill="currentColor" />
      {value}/{max}
    </span>
  );
}

// Hook personnalisé pour gérer l'état d'une notation romance
export function useRomanceRating(initialValue: number = 0, max: number = 10) {
  const [value, setValue] = React.useState(initialValue);
  const [isValid, setIsValid] = React.useState(true);

  const handleChange = React.useCallback((newValue: number) => {
    const clampedValue = Math.max(0, Math.min(max, newValue));
    setValue(clampedValue);
    setIsValid(clampedValue >= 0 && clampedValue <= max);
  }, [max]);

  const reset = React.useCallback(() => {
    setValue(0);
    setIsValid(true);
  }, []);

  const getLabel = React.useCallback(() => {
    if (value === 0) return "Pas de romance";
    if (value <= 2) return "Très léger";
    if (value <= 4) return "Léger";
    if (value <= 6) return "Romantique";
    if (value <= 8) return "Très romantique";
    return "Passionné";
  }, [value]);

  return {
    value,
    setValue: handleChange,
    reset,
    isValid,
    isEmpty: value === 0,
    isComplete: value > 0,
    label: getLabel(),
  };
}