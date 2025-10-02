/**
 * DarkRating - Composant crânes pour le niveau dark (1-10) 💀
 * Utilisé pour indiquer le niveau de contenu sombre/mystérieux
 */

"use client";

import * as React from "react";
import { Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { ratingDarkRomanceStyles } from "@/lib/theme-variants";

export interface DarkRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  showLabel?: boolean;
  className?: string;
  darkClassName?: string;
  emptyDarkClassName?: string;
  filledDarkClassName?: string;
  hoverEffect?: boolean;
  allowHalf?: boolean;
}

export function DarkRating({
  value,
  onChange,
  max = 10,
  size="md",
  readonly = false,
  showValue = false,
  showLabel = false,
  className,
  darkClassName,
  emptyDarkClassName,
  filledDarkClassName,
  hoverEffect = true,
  allowHalf = false,
}: DarkRatingProps) {
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

  const handleDarkClick = (darkValue: number) => {
    if (readonly || !onChange) return;
    
    if (allowHalf) {
      onChange(darkValue);
    } else {
      onChange(Math.ceil(darkValue));
    }
  };

  const handleDarkHover = (darkValue: number) => {
    if (readonly || !hoverEffect) return;
    setHoveredValue(darkValue);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setHoveredValue(0);
    setIsHovering(false);
  };

  const displayValue = isHovering && hoverEffect ? hoveredValue : value;
  const clampedValue = Math.max(0, Math.min(max, displayValue));

  // Fonction pour obtenir l`intensité de la couleur selon la valeur
  const getDarkIntensity = (darkIndex: number) => {
    const darkValue = darkIndex + 1;
    const intensity = darkValue / max;
    
    if (intensity <= 0.3) return "text-gray-400"; // Léger
    if (intensity <= 0.6) return "text-gray-500"; // Moyen
    if (intensity <= 0.8) return "text-gray-700 dark:text-gray-300"; // Sombre
    return "text-black dark:text-white"; // Très sombre
  };

  const renderDark = (darkIndex: number) => {
    const darkValue = darkIndex + 1;
    const isFilled = clampedValue >= darkValue;
    const isHalfFilled = allowHalf && clampedValue >= darkValue - 0.5 && clampedValue < darkValue;
    const isHovered = isHovering && hoveredValue >= darkValue;
    const intensityColor = getDarkIntensity(darkIndex);

    return (
      <button
        key={darkIndex}
        type="button"
        disabled={readonly}
        className={cn(
          "relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm",
          !readonly && "cursor-pointer hover:scale-110",
          readonly && `cursor-default`,
          darkClassName
        )}
        onClick={() => handleDarkClick(darkValue)}
        onMouseEnter={() => handleDarkHover(darkValue)}
        onFocus={() => handleDarkHover(darkValue)}
        aria-label={`Niveau dark ${darkValue}`sur ${max}`}
      >
        {/* Crâne de base (vide) */}
        <Skull
          className={cn(
            sizeClasses[size],
            `transition-all duration-200",
            "text-gray-300 dark:text-gray-600",
            emptyDarkClassName
          )}
        />
        
        {/* Crâne rempli */}
        {(isFilled || isHovered) && (
          <Skull
            className={cn(
              sizeClasses[size],
              "absolute inset-0 transition-all duration-200",
              intensityColor,
              ratingDarkRomanceStyles.darkFilled,
              filledDarkClassName,
              isHovered && !readonly && "scale-110 drop-shadow-md"
            )}
            fill="currentColor"
          />
        )}
        
        {/* Demi-crâne */}
        {isHalfFilled && !isFilled && !isHovered && (
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Skull
              className={cn(
                sizeClasses[size],
                "transition-all duration-200",
                intensityColor,
                ratingDarkRomanceStyles.darkFilled,
                filledDarkClassName
              )}
              fill="currentColor"
            />
          </div>
        )}
      </button>
    );
  };

  // Obtenir le label descriptif selon la valeur
  const getDarkLabel = (val: number) => {
    if (val === 0) return "Pas de contenu dark";
    if (val <= 2) return "Très léger";
    if (val <= 4) return "Léger";
    if (val <= 6) return "Moyen";
    if (val <= 8) return "Sombre";
    return "Très sombre";
  };

  return (
    <div className={cn("flex items-center", containerSizeClasses[size], className)}>
      {showLabel && (
        <span className={cn("font-medium text-foreground mr-2", textSizeClasses[size])}>
          Niveau Dark 💀 :
        </span>
      )}
      
      <div
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
        role="radiogroup`
        aria-label={`Niveau dark sur ${max}`}
      >
        {Array.from({ length: max }, (_, index) => renderDark(index))}
      </div>
      
      {showValue && (
        <div className="ml-2 flex flex-col">
          <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
            {displayValue.toFixed(allowHalf ? 1 : 0)}/{max}
          </span>
          <span className={cn("text-xs text-muted-foreground", size === "lg" && "text-sm")}>
            {getDarkLabel(displayValue)}
          </span>
        </div>
      )}
      
      {isHovering && !readonly && hoverEffect && (
        <span className={cn("ml-2 text-muted-foreground", textSizeClasses[size])}>
          {hoveredValue}/{max} - {getDarkLabel(hoveredValue)}
        </span>
      )}
    </div>
  );
}

// Variante en lecture seule pour l'affichage
export function DarkDisplay({
  value,
  max = 10,
  size="md",
  showValue = true,
  className,
}: Pick<DarkRatingProps, "value" | "max" | "size" | "showValue" | "className">) {
  return (
    <DarkRating
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

// Composant Badge Dark pour un affichage compact
export function DarkBadge({ 
  value, 
  max = 10, 
  className 
}: { 
  value: number; 
  max?: number; 
  className?: string; 
}) {
  const getDarkColor = () => {
    const intensity = value / max;
    if (intensity <= 0.3) return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700";
    if (intensity <= 0.6) return "bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600";
    if (intensity <= 0.8) return "bg-gray-300 text-black border-gray-400 dark:bg-gray-700 dark:text-white dark:border-gray-500";
    return "bg-black text-white border-gray-900 dark:bg-white dark:text-black dark:border-gray-200";
  };

  if (value === 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
        "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
        className
      )}>
        Pas de contenu dark
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
      getDarkColor(),
      className
    )}>
      <Skull className="h-3 w-3" fill="currentColor" />
      {value}/{max}
    </span>
  );
}

// Hook personnalisé pour gérer l'état d'une notation dark
export function useDarkRating(initialValue: number = 0, max: number = 10) {
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
    if (value === 0) return "Pas de contenu dark";
    if (value <= 2) return "Très léger";
    if (value <= 4) return "Léger";
    if (value <= 6) return "Moyen";
    if (value <= 8) return "Sombre";
    return "Très sombre";
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