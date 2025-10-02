/**
 * MultiRatingDisplay - Composant d'affichage combiné pour tous les types de ratings
 * Affiche la note générale, spicy, dark, romance et le rythme dans un format compact
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StarDisplay } from "./star-rating";
import { SpicyDisplay, SpicyBadge } from "./spicy-rating";
import { DarkDisplay, DarkBadge } from "./dark-rating";
import { RomanceDisplay, RomanceBadge } from "./romance-rating";
import { RhythmDisplay, RhythmBadge, type RhythmValue } from "./rhythm-selector";

export interface MultiRatingData {
  star?: number;
  spicy?: number;
  dark?: number;
  romance?: number;
  rhythm?: RhythmValue;
  maxRating?: number;
}

export interface MultiRatingDisplayProps {
  data: MultiRatingData;
  layout?: "horizontal" | "vertical" | "compact" | "detailed";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showValues?: boolean;
  showEmpty?: boolean;
  className?: string;
  variant?: "default" | "badges" | "icons-only";
}

export function MultiRatingDisplay({
  data,
  layout="horizontal",
  size="md",
  showLabels = false,
  showValues = true,
  showEmpty = false,
  className,
  variant="default",
}: MultiRatingDisplayProps) {
  const { star, spicy, dark, romance, rhythm, maxRating = 10 } = data;

  const containerClasses = {
    horizontal: "flex items-center gap-4 flex-wrap",
    vertical: "flex flex-col gap-3",
    compact: "flex items-center gap-2 flex-wrap",
    detailed: "grid grid-cols-1 gap-4",
  };

  const sectionClasses = {
    sm: "space-y-1",
    md: "space-y-2", 
    lg: "space-y-3",
  };

  // Fonction pour vérifier si une rating doit être affichée
  const shouldShow = (value: number | undefined) => {
    return value !== undefined && (value > 0 || showEmpty);
  };

  // Rendu pour la variante badges
  if (variant === "badges") {
    return (
      <div className={cn(containerClasses[layout === "detailed" ? "horizontal" : layout], className)}>
        {shouldShow(star) && (
          <div className="flex items-center gap-1">
            {showLabels && <span className="text-xs text-muted-foreground">Note:</span>}
            <span className="text-sm font-medium">{star}/{maxRating}</span>
          </div>
        )}
        {shouldShow(spicy) && <SpicyBadge value={spicy!} max={maxRating} />}
        {shouldShow(dark) && <DarkBadge value={dark!} max={maxRating} />}
        {shouldShow(romance) && <RomanceBadge value={romance!} max={maxRating} />}
        {rhythm && <RhythmBadge value={rhythm} />}
      </div>
    );
  }

  // Rendu pour la variante icons-only
  if (variant === "icons-only") {
    return (
      <div className={cn(containerClasses[layout === "detailed" ? "horizontal" : layout], className)}>
        {shouldShow(star) && (
          <StarDisplay 
            value={star!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        )}
        {shouldShow(spicy) && (
          <SpicyDisplay 
            value={spicy!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        )}
        {shouldShow(dark) && (
          <DarkDisplay 
            value={dark!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        )}
        {shouldShow(romance) && (
          <RomanceDisplay 
            value={romance!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        )}
        {rhythm && (
          <RhythmDisplay 
            value={rhythm} 
            size={size} 
            showDescription={!showLabels}
          />
        )}
      </div>
    );
  }

  // Rendu détaillé par défaut
  if (layout === "detailed") {
    return (
      <div className={cn("space-y-4", className)}>
        {shouldShow(star) && (
          <div className={sectionClasses[size]}>
            <h4 className="text-sm font-semibold text-foreground mb-2">Note générale</h4>
            <StarDisplay 
              value={star!} 
              max={maxRating} 
              size={size} 
              showValue={showValues}
              className="justify-start"
            />
          </div>
        )}
        
        {(shouldShow(spicy) || shouldShow(dark) || shouldShow(romance)) && (
          <div className={sectionClasses[size]}>
            <h4 className="text-sm font-semibold text-foreground mb-2">Niveaux de contenu</h4>
            <div className="space-y-3">
              {shouldShow(spicy) && (
                <SpicyDisplay 
                  value={spicy!} 
                  max={maxRating} 
                  size={size} 
                  showValue={showValues}
                />
              )}
              {shouldShow(dark) && (
                <DarkDisplay 
                  value={dark!} 
                  max={maxRating} 
                  size={size} 
                  showValue={showValues}
                />
              )}
              {shouldShow(romance) && (
                <RomanceDisplay 
                  value={romance!} 
                  max={maxRating} 
                  size={size} 
                  showValue={showValues}
                />
              )}
            </div>
          </div>
        )}
        
        {rhythm && (
          <div className={sectionClasses[size]}>
            <h4 className="text-sm font-semibold text-foreground mb-2">Rythme</h4>
            <RhythmDisplay 
              value={rhythm} 
              size={size} 
              showDescription={true}
            />
          </div>
        )}
      </div>
    );
  }

  // Rendu compact ou horizontal/vertical
  return (
    <div className={cn(containerClasses[layout], className)}>
      {shouldShow(star) && (
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground whitespace-nowrap">Note:</span>}
          <StarDisplay 
            value={star!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        </div>
      )}
      
      {shouldShow(spicy) && (
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground whitespace-nowrap">Spicy:</span>}
          <SpicyDisplay 
            value={spicy!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        </div>
      )}
      
      {shouldShow(dark) && (
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground whitespace-nowrap">Dark:</span>}
          <DarkDisplay 
            value={dark!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        </div>
      )}
      
      {shouldShow(romance) && (
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground whitespace-nowrap">Romance:</span>}
          <RomanceDisplay 
            value={romance!} 
            max={maxRating} 
            size={size} 
            showValue={showValues}
          />
        </div>
      )}
      
      {rhythm && (
        <div className="flex items-center gap-2">
          {showLabels && <span className="text-xs text-muted-foreground whitespace-nowrap">Rythme:</span>}
          <RhythmDisplay 
            value={rhythm} 
            size={size} 
            showDescription={layout !== "compact"}
          />
        </div>
      )}
    </div>
  );
}

// Composant pour une carte de rating complète
export function RatingCard({
  data,
  title,
  description,
  className,
  showAllDetails = false,
}: {
  data: MultiRatingData;
  title?: string;
  description?: string;
  className?: string;
  showAllDetails?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 border rounded-lg bg-card text-card-foreground shadow-sm",
      className
    )}>
      {(title || description) && (
        <div className="mb-3 pb-3 border-b">
          {title && <h3 className="font-semibold text-lg">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      
      <MultiRatingDisplay 
        data={data}
        layout={showAllDetails ? "detailed" : "vertical"}
        size="md"
        showLabels={!showAllDetails}
        showValues={true}
        variant="default"
      />
    </div>
  );
}

// Composant de comparaison entre deux ratings
export function RatingComparison({
  data1,
  data2,
  labels = { first: "Livre 1", second: "Livre 2" },
  className,
}: {
  data1: MultiRatingData;
  data2: MultiRatingData;
  labels?: { first: string; second: string };
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-center">{labels.first}</h4>
        <MultiRatingDisplay 
          data={data1}
          layout="vertical"
          size="sm"
          showValues={true}
          variant="icons-only"
        />
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-center">{labels.second}</h4>
        <MultiRatingDisplay 
          data={data2}
          layout="vertical"
          size="sm"
          showValues={true}
          variant="icons-only"
        />
      </div>
    </div>
  );
}

// Hook pour calculer des statistiques sur les ratings
export function useRatingStats(data: MultiRatingData) {
  return React.useMemo(() => {
    const { star, spicy, dark, romance, maxRating = 10 } = data;
    
    const ratings = [star, spicy, dark, romance].filter((r): r is number => 
      r !== undefined && r > 0
    );
    
    if (ratings.length === 0) {
      return {
        average: 0,
        total: 0,
        count: 0,
        hasRatings: false,
        maxPossible: maxRating * 4,
        percentage: 0,
      };
    }
    
    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const average = total / ratings.length;
    const maxPossible = maxRating * ratings.length;
    const percentage = (total / maxPossible) * 100;
    
    return {
      average: Math.round(average * 10) / 10,
      total,
      count: ratings.length,
      hasRatings: true,
      maxPossible,
      percentage: Math.round(percentage),
    };
  }, [data]);
}