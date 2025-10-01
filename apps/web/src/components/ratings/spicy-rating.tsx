/**
 * SpicyRating - Composant piments pour le niveau spicy (1-10) 🌶️
 * Utilisé pour indiquer le niveau de contenu explicite/érotique
 */

"use client";

import * as React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { ratingDarkRomanceStyles } from "@/lib/theme-variants";

export interface SpicyRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  showLabel?: boolean;
  className?: string;
  spicyClassName?: string;
  emptySpicyClassName?: string;
  filledSpicyClassName?: string;
  hoverEffect?: boolean;
  allowHalf?: boolean;
}

export function SpicyRating({
  value,
  onChange,
  max = 10,
  size = "md",
  readonly = false,
  showValue = false,
  showLabel = false,
  className,
  spicyClassName,
  emptySpicyClassName,
  filledSpicyClassName,
  hoverEffect = true,
  allowHalf = false,
}: SpicyRatingProps) {
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

  const handleSpicyClick = (spicyValue: number) => {
    if (readonly || !onChange) return;
    
    if (allowHalf) {
      onChange(spicyValue);
    } else {
      onChange(Math.ceil(spicyValue));
    }
  };

  const handleSpicyHover = (spicyValue: number) => {
    if (readonly || !hoverEffect) return;
    setHoveredValue(spicyValue);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setHoveredValue(0);
    setIsHovering(false);
  };

  const displayValue = isHovering && hoverEffect ? hoveredValue : value;
  const clampedValue = Math.max(0, Math.min(max, displayValue));

  // Fonction pour obtenir l`intensité de la couleur selon la valeur
  const getSpicyIntensity = (spicyIndex: number) => {
    const spicyValue = spicyIndex + 1;
    const intensity = spicyValue / max;
    
    if (intensity <= 0.3) return "text-orange-400"; // Doux
    if (intensity <= 0.6) return "text-orange-500"; // Moyen
    if (intensity <= 0.8) return "text-red-500"; // Fort
    return "text-red-600"; // Très fort
  };

  const renderSpicy = (spicyIndex: number) => {
    const spicyValue = spicyIndex + 1;
    const isFilled = clampedValue >= spicyValue;
    const isHalfFilled = allowHalf && clampedValue >= spicyValue - 0.5 && clampedValue < spicyValue;
    const isHovered = isHovering && hoveredValue >= spicyValue;
    const intensityColor = getSpicyIntensity(spicyIndex);

    return (
      <button
        key={spicyIndex}
        type="button"
        disabled={readonly}
        className={cn(
          "relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm",
          !readonly && "cursor-pointer hover:scale-110",
          readonly && "cursor-default",
          spicyClassName
        )}
        onClick={() => handleSpicyClick(spicyValue)}
        onMouseEnter={() => handleSpicyHover(spicyValue)}
        onFocus={() => handleSpicyHover(spicyValue)}
        aria-label={'Niveau spicy ${spicyValue} sur ${max}'}
      >
        {/* Piment de base (vide) */}
        <Flame
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            "text-gray-300 dark:text-gray-600",
            emptySpicyClassName
          )}
        />
        
        {/* Piment rempli */}
        {(isFilled || isHovered) && (
          <Flame
            className={cn(
              sizeClasses[size],
              "absolute inset-0 transition-all duration-200",
              intensityColor,
              ratingDarkRomanceStyles.spicyFilled,
              filledSpicyClassName,
              isHovered && !readonly && "scale-110 drop-shadow-sm"
            )}
            fill="currentColor"
          />
        )}
        
        {/* Demi-piment */}
        {isHalfFilled && !isFilled && !isHovered && (
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Flame
              className={cn(
                sizeClasses[size],
                "transition-all duration-200",
                intensityColor,
                ratingDarkRomanceStyles.spicyFilled,
                filledSpicyClassName
              )}
              fill="currentColor"
            />
          </div>
        )}
      </button>
    );
  };

  // Obtenir le label descriptif selon la valeur
  const getSpicyLabel = (val: number) => {
    if (val === 0) return "Pas de contenu spicy";
    if (val <= 2) return "Très doux";
    if (val <= 4) return "Doux";
    if (val <= 6) return "Moyen";
    if (val <= 8) return "Fort";
    return "Très fort";
  };

  return (
    <div className={cn("flex items-center", containerSizeClasses[size], className)}>
      {showLabel && (
        <span className={cn("font-medium text-foreground mr-2", textSizeClasses[size])}>
          Niveau Spicy 🌶️ :
        </span>
      )}
      
      <div
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
        role="radiogroup"
        aria-label={'Niveau spicy sur ${max}'}
      >
        {Array.from({ length: max }, (_, index) => renderSpicy(index))}
      </div>
      
      {showValue && (
        <div className="ml-2 flex flex-col">
          <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
            {displayValue.toFixed(allowHalf ? 1 : 0)}/{max}
          </span>
          <span className={cn("text-xs text-muted-foreground", size === "lg" && "text-sm")}>
            {getSpicyLabel(displayValue)}
          </span>
        </div>
      )}
      
      {isHovering && !readonly && hoverEffect && (
        <span className={cn("ml-2 text-muted-foreground", textSizeClasses[size])}>
          {hoveredValue}/{max} - {getSpicyLabel(hoveredValue)}
        </span>
      )}
    </div>
  );
}

// Variante en lecture seule pour l'affichage
export function SpicyDisplay({
  value,
  max = 10,
  size = "md",
  showValue = true,
  className,
}: Pick<SpicyRatingProps, "value" | "max" | "size" | "showValue" | "className">) {
  return (
    <SpicyRating
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

// Composant Badge Spicy pour un affichage compact
export function SpicyBadge({ 
  value, 
  max = 10, 
  className 
}: { 
  value: number; 
  max?: number; 
  className?: string; 
}) {
  const getSpicyColor = () => {
    const intensity = value / max;
    if (intensity <= 0.3) return "bg-orange-100 text-orange-800 border-orange-200";
    if (intensity <= 0.6) return "bg-orange-200 text-orange-900 border-orange-300";
    if (intensity <= 0.8) return "bg-red-100 text-red-800 border-red-200";
    return "bg-red-200 text-red-900 border-red-300";
  };

  if (value === 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
        "bg-gray-100 text-gray-600 border-gray-200",
        className
      )}>
        Pas de contenu spicy
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
      getSpicyColor(),
      className
    )}>
      <Flame className="h-3 w-3" fill="currentColor" />
      {value}/{max}
    </span>
  );
}

// Hook personnalisé pour gérer l'état d'une notation spicy
export function useSpicyRating(initialValue: number = 0, max: number = 10) {
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
    if (value === 0) return "Pas de contenu spicy";
    if (value <= 2) return "Très doux";
    if (value <= 4) return "Doux";
    if (value <= 6) return "Moyen";
    if (value <= 8) return "Fort";
    return "Très fort";
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