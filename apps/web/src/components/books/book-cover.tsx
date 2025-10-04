"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCoverProps {
  src?: string | null;
  alt: string;
  title?: string;
  author?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: boolean;
  shadow?: boolean;
  priority?: boolean;
  onClick?: () => void;
  showLoader?: boolean;
  placeholderVariant?: "default" | "gradient" | "pattern";
}

// Dimensions pour chaque taille
const SIZES = {
  xs: { width: 60, height: 90 },    // 2:3 ratio - très petit
  sm: { width: 80, height: 120 },   // 2:3 ratio - petit
  md: { width: 120, height: 180 },  // 2:3 ratio - moyen
  lg: { width: 160, height: 240 },  // 2:3 ratio - grand
  xl: { width: 200, height: 300 },  // 2:3 ratio - très grand
};

export function BookCover({
  src,
  alt,
  title,
  author,
  size="md",
  className,
  rounded = true,
  shadow = true,
  priority = false,
  onClick,
  showLoader = true,
  placeholderVariant="default"
}: BookCoverProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const dimensions = SIZES[size];
  
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageLoaded(false);
    setHasError(true);
  };

  // Générer une couleur de fond basée sur le titre
  const getGradientColors = () => {
    if (!title) return ["#8B0000", "#DC143C"]; // Dark Romance par défaut
    
    const hash = title.split("").reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      ["#8B0000", "#DC143C"], // Dark Romance
      ["#4B0082", "#6A0DAD"], // Purple
      ["#2E0854", "#4B0082"], // Deep Purple
      ["#8B4513", "#CD853F"], // Brown
      ["#2F4F4F", "#708090"], // Slate
      ["#B22222", "#DC143C"], // Crimson
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const [gradientStart, gradientEnd] = getGradientColors();

  const PlaceholderContent = () => {
    switch (placeholderVariant) {
      case "gradient":
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center text-white"
            style={{
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
            }}
          >
            <BookOpen className="w-8 h-8 mb-2 opacity-80" />
            {title && (
              <div className="text-center px-2">
                <div className="text-xs font-medium line-clamp-2 mb-1">
                  {title}
                </div>
                {author && (
                  <div className="text-[10px] opacity-80 line-clamp-1">
                    {author}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case "pattern":
        return (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Pattern de fond */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)"
              }}
            />
            <BookOpen className="w-8 h-8 mb-2 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Couverture</span>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
            <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pas d"image</span>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted transition-all duration-300",
        rounded && "rounded-lg",
        shadow && "shadow-lg hover:shadow-xl",
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        minWidth: dimensions.width,
        minHeight: dimensions.height
      }}
      onClick={onClick}
    >
      {/* Image principale */}
      {src && !hasError ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            className={cn(
              "object-cover transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            priority={priority}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes={'${dimensions.width}px'}
          />
          
          {/* Loader pendant le chargement */}
          {isLoading && showLoader && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        /* Placeholder quand pas d'image ou erreur */
        <PlaceholderContent />
      )}

      {/* Overlay au hover */}
      {onClick && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
      )}

      {/* Badge de statut (optionnel) */}
      {hasError && src && (
        <div className="absolute top-1 right-1 bg-destructive/80 text-destructive-foreground text-[10px] px-1 py-0.5 rounded">
          Erreur
        </div>
      )}
    </div>
  );
}

// Variante avec aspect ratio personnalisable
interface BookCoverAspectProps extends Omit<BookCoverProps, 'size'> {
  width?: number | string;
  height?: number | string;
  aspectRatio?: number; // width/height ratio
}

export function BookCoverAspect({
  width = 120,
  height,
  aspectRatio = 2/3, // ratio livre standard
  className,
  ...props
}: BookCoverAspectProps) {
  const computedHeight = height || (typeof width === 'number' ? width / aspectRatio : `calc(${width} / ${aspectRatio})`);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ width, height: computedHeight }}
    >
      <BookCover
        {...props}
        className="!w-full !h-full !min-w-0 !min-h-0"
        size="md" // Taille de référence, remplacée par les styles
      />
    </div>
  );
}

// Collection de couvertures
interface BookCoverStackProps {
  books: Array<{
    src?: string | null;
    alt: string;
    title?: string;
  }>;
  size?: BookCoverProps["size"];
  maxVisible?: number;
  className?: string;
}

export function BookCoverStack({
  books,
  size="sm",
  maxVisible = 3,
  className
}: BookCoverStackProps) {
  const visibleBooks = books.slice(0, maxVisible);
  const remainingCount = books.length - maxVisible;

  return (
    <div className={cn("relative", className)}>
      {visibleBooks.map((book, index) => (
        <div
          key={index}
          className="absolute transition-transform hover:z-10"
          style={{
            transform: `translateX(${index * 8}px) translateY(${index * -4}px)`,
            zIndex: visibleBooks.length - index
          }}
        >
          <BookCover
            src={book.src}
            alt={book.alt}
            title={book.title}
            size={size}
            shadow={index === 0}
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="absolute bg-muted border-2 border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-xs font-medium"
          style={{
            ...SIZES[size],
            transform: 'translateX(${visibleBooks.length * 8}px)"translateY(${visibleBooks.length * -4}px)',
            zIndex: 0
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}