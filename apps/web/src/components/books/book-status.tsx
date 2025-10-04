"use client";

import { 
  CheckCircle2, 
  BookOpen, 
  BookMarked, 
  XCircle,
  Clock,
  Calendar,
  Star,
  TrendingUp,
  Heart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types de statut
export type BookStatusType="LU" | "EN_COURS" | "A_LIRE" | "ABANDONNE";

export interface BookStatusProps {
  status: BookStatusType;
  variant?: "default" | "minimal" | "detailed";
  size?: "xs" | "sm" | "md" | "lg";
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

// Configuration des statuts
const STATUS_CONFIG: Record<BookStatusType, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
}> = {
  LU: {
    label: "Lu",
    shortLabel: "Lu",
    icon: CheckCircle2,
    color: '#10B981', // Green
    bgColor: "#10B981",
    description: "Livre terminé et lu complètement"
  },
  EN_COURS: {
    label: "En cours de lecture",
    shortLabel: "En cours",
    icon: BookOpen,
    color: '#F59E0B', // Amber
    bgColor: "#F59E0B",
    description: "Lecture actuellement en cours"
  },
  A_LIRE: {
    label: "À lire",
    shortLabel: "À lire",
    icon: BookMarked,
    color: '#6366F1', // Indigo
    bgColor: "#6366F1",
    description: "Dans la liste de lecture, à lire prochainement"
  },
  ABANDONNE: {
    label: "Abandonné",
    shortLabel: "Abandonné",
    icon: XCircle,
    color: "#EF4444", // Red
    bgColor: "#EF4444",
    description: "Lecture arrêtée, livre abandonné"
  }
};

export function BookStatus({
  status,
  variant="default",
  size="sm",
  showIcon = true,
  showText = true,
  className,
  onClick
}: BookStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2"
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
        title={config.description}
      >
        {showIcon && (
          <Icon 
            className={cn(iconSizes[size])} 
            style={{ color: config.color }}
          />
        )}
        {showText && (
          <span 
            className={cn("font-medium", size === "xs" ? "text-xs" : "text-sm")}
            style={{ color: config.color }}
          >
            {size === "xs" || size === "sm" ? config.shortLabel : config.label}
          </span>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
          onClick && "cursor-pointer hover:bg-muted/50",
          className
        )}
        onClick={onClick}
        style={{ borderColor: config.color }}
      >
        {showIcon && (
          <Icon 
            className={iconSizes[size]} 
            style={{ color: config.color }}
          />
        )}
        <div className="flex flex-col">
          <span className="font-medium text-sm">{config.label}</span>
          <span className="text-xs text-muted-foreground">{config.description}</span>
        </div>
      </div>
    );
  }

  // Variant par défaut (badge)
  return (
    <Badge
      className={cn(
        sizeClasses[size],
        "inline-flex items-center gap-1.5 font-medium border-0 text-white transition-all",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{ backgroundColor: config.bgColor }}
      onClick={onClick}
      title={config.description}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showText && (size === "xs" ? config.shortLabel : config.label)}
    </Badge>
  );
}

// Composant pour sélectionner/changer le statut
interface BookStatusSelectorProps {
  currentStatus: BookStatusType;
  onStatusChange: (status: BookStatusType) => void;
  disabled?: boolean;
  className?: string;
}

export function BookStatusSelector({
  currentStatus,
  onStatusChange,
  disabled = false,
  className
}: BookStatusSelectorProps) {
  const statuses: BookStatusType[] = ["A_LIRE", "EN_COURS", "LU", "ABANDONNE"];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {statuses.map((status) => (
        <BookStatus
          key={status}
          status={status}
          variant={status === currentStatus ? "default" : "minimal"}
          size="sm"
          onClick={!disabled ? () => onStatusChange(status) : undefined}
          className={cn(
            "transition-all",
            !disabled && "hover:scale-105",
            disabled && "opacity-50 cursor-not-allowed",
            status !== currentStatus && "opacity-70 hover:opacity-100"
          )}
        />
      ))}
    </div>
  );
}

// Indicateur de progression pour "En cours"
interface ReadingProgressProps {
  currentPage?: number;
  totalPages?: number;
  percentage?: number;
  className?: string;
  showText?: boolean;
}

export function ReadingProgress({
  currentPage,
  totalPages,
  percentage,
  className,
  showText = true
}: ReadingProgressProps) {
  // Calculer le pourcentage si on a les pages
  let progress = percentage;
  if (!progress && currentPage && totalPages) {
    progress = Math.round((currentPage / totalPages) * 100);
  }

  if (!progress) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
          style={{ width: '${Math.min(progress, 100)}%' }}
        />
      </div>
      {showText && (
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>
            {currentPage && totalPages 
              ? 'Page ${currentPage}/${totalPages}'
              : '${progress}% lu'
            }
          </span>
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}

// Composant pour les statistiques de lecture
interface ReadingStatsProps {
  dateStarted?: Date;
  dateFinished?: Date;
  rating?: number;
  className?: string;
}

export function ReadingStats({
  dateStarted,
  dateFinished,
  rating,
  className
}: ReadingStatsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {dateStarted && (
        <Badge variant="outline" className="text-xs">
          <Calendar className="w-3 h-3 mr-1" />
          Commencé le {dateStarted.toLocaleDateString("fr-FR")}
        </Badge>
      )}
      
      {dateFinished && (
        <Badge variant="outline" className="text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Terminé le {dateFinished.toLocaleDateString("fr-FR")}
        </Badge>
      )}
      
      {rating && rating > 0 && (
        <Badge variant="outline" className="text-xs">
          <Star className="w-3 h-3 mr-1" />
          {rating}/10
        </Badge>
      )}
    </div>
  );
}

// Composant combiné pour l'affichage complet du statut
interface BookStatusDisplayProps {
  status: BookStatusType;
  currentPage?: number;
  totalPages?: number;
  dateStarted?: Date;
  dateFinished?: Date;
  rating?: number;
  onStatusChange?: (status: BookStatusType) => void;
  variant?: "compact" | "full";
  className?: string;
}

export function BookStatusDisplay({
  status,
  currentPage,
  totalPages,
  dateStarted,
  dateFinished,
  rating,
  onStatusChange,
  variant="compact",
  className
}: BookStatusDisplayProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Statut principal */}
      <div className="flex items-center justify-between">
        <BookStatus status={status} variant="default" />
        
        {variant === "full" && onStatusChange && (
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Modifier
          </button>
        )}
      </div>

      {/* Progression pour "En cours" */}
      {status === "EN_COURS" && (currentPage || totalPages) && (
        <ReadingProgress
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      {/* Statistiques */}
      {variant === "full" && (
        <ReadingStats
          dateStarted={dateStarted}
          dateFinished={dateFinished}
          rating={rating}
        />
      )}
    </div>
  );
}