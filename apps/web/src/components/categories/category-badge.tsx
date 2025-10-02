/**
 * CategoryBadge - Badge pour afficher les catégories avec couleur et icône
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { type Category } from "@/types/category";
import { cn } from "@/lib/utils";

export interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  variant?: "default" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
}

export function CategoryBadge({
  category,
  size="md",
  showIcon = false,
  variant="default",
  className,
  onClick
}: CategoryBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        sizeClasses[size],
        "font-medium",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      style={{
        backgroundColor: variant === "default" ? category.couleur : undefined,
        borderColor: variant === "outline" ? category.couleur : undefined,
        color: variant === "outline" ? category.couleur : undefined
      }}
      onClick={onClick}
    >
      {showIcon && category.icone && (
        <span className="mr-1" aria-hidden="true">
          {category.icone}
        </span>
      )}
      {category.nom}
    </Badge>
  );
}

// Export par défaut pour compatibilité
export default CategoryBadge;