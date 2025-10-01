/**
 * StarRating - Composant étoiles pour la note générale (1-10)
 * Utilisé pour la notation principale des livres
 */

"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ratingDarkRomanceStyles } from "@/lib/theme-variants";

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  showLabel?: boolean;
  className?: string;
  starClassName?: string;
  emptyStarClassName?: string;
  filledStarClassName?: string;
  hoverEffect?: boolean;
  allowHalf?: boolean;
}

export function StarRating({
  value,
  onChange,
  max = 10,
  size = "md",
  readonly = false,
  showValue = false,
  showLabel = false,
  className,
  starClassName,
  emptyStarClassName,
  filledStarClassName,
  hoverEffect = true,
  allowHalf = false,
}: StarRatingProps) {
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

  const handleStarClick = (starValue: number) => {
    if (readonly || !onChange) return;
    
    // Si on permet les demi-étoiles, gérer le click sur la moitié gauche/droite
    if (allowHalf) {
      onChange(starValue);
    } else {
      onChange(Math.ceil(starValue));
    }
  };

  const handleStarHover = (starValue: number) => {
    if (readonly || !hoverEffect) return;
    setHoveredValue(starValue);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setHoveredValue(0);
    setIsHovering(false);
  };

  const displayValue = isHovering && hoverEffect ? hoveredValue : value;
  const clampedValue = Math.max(0, Math.min(max, displayValue));

  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 1;
    const isFilled = clampedValue >= starValue;
    const isHalfFilled = allowHalf && clampedValue >= starValue - 0.5 && clampedValue < starValue;
    const isHovered = isHovering && hoveredValue >= starValue;

    return (
      <button
        key={starIndex}
        type="button"
        disabled={readonly}
        className={cn(
          "relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm",
          !readonly && "cursor-pointer",
          readonly && "cursor-default",
          starClassName
        )}
        onClick={() => handleStarClick(starValue)}
        onMouseEnter={() => handleStarHover(starValue)}
        onFocus={() => handleStarHover(starValue)}
        aria-label={'Noter ${starValue} sur ${max}'}
      >
        {/* Étoile de base (vide) */}
        <Star
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            ratingDarkRomanceStyles.starEmpty,
            emptyStarClassName
          )}
        />
        
        {/* Étoile remplie */}
        {(isFilled || isHovered) && (
          <Star
            className={cn(
              sizeClasses[size],
              "absolute inset-0 transition-all duration-200",
              ratingDarkRomanceStyles.starFilled,
              filledStarClassName,
              isHovered && !readonly && "scale-110"
            )}
            fill="currentColor"
          />
        )}
        
        {/* Demi-étoile */}
        {isHalfFilled && !isFilled && !isHovered && (
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star
              className={cn(
                sizeClasses[size],
                "transition-all duration-200",
                ratingDarkRomanceStyles.starFilled,
                filledStarClassName
              )}
              fill="currentColor"
            />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={cn("flex items-center", containerSizeClasses[size], className)}>
      {showLabel && (
        <span className={cn("font-medium text-foreground mr-2", textSizeClasses[size])}>
          Note générale :
        </span>
      )}
      
      <div
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
        role="radiogroup"
        aria-label={'Notation sur ${max} étoiles'}
      >
        {Array.from({ length: max }, (_, index) => renderStar(index))}
      </div>
      
      {showValue && (
        <span className={cn("ml-2 font-medium text-foreground", textSizeClasses[size])}>
          {displayValue.toFixed(allowHalf ? 1 : 0)}/{max}
        </span>
      )}
      
      {isHovering && !readonly && hoverEffect && (
        <span className={cn("ml-2 text-muted-foreground", textSizeClasses[size])}>
          {hoveredValue}/{max}
        </span>
      )}
    </div>
  );
}

// Variante en lecture seule pour l'affichage
export function StarDisplay({
  value,
  max = 10,
  size = "md",
  showValue = true,
  className,
}: Pick<StarRatingProps, "value" | "max" | "size" | "showValue" | "className">) {
  return (
    <StarRating
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

// Hook personnalisé pour gérer l'état d'une notation
export function useStarRating(initialValue: number = 0, max: number = 10) {
  const [value, setValue] = React.useState(initialValue);
  const [isValid, setIsValid] = React.useState(true);

  const handleChange = React.useCallback((newValue: number) => {
    const clampedValue = Math.max(0, Math.min(max, newValue));
    setValue(clampedValue);
    setIsValid(clampedValue >= 1 && clampedValue <= max);
  }, [max]);

  const reset = React.useCallback(() => {
    setValue(0);
    setIsValid(false);
  }, []);

  return {
    value,
    setValue: handleChange,
    reset,
    isValid,
    isEmpty: value === 0,
    isComplete: value > 0,
  };
}