'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookCardProps } from '@/lib/types/home';
import { RatingChips } from './rating-chips';
import { RhythmBadge } from './rhythm-badge';
import { SagaPill } from './saga-pill';

export function BookCard({ 
  book, 
  size = 'md', 
  showStats = true, 
  className 
}: BookCardProps) {
  const isRead = book.statut === 'LU';
  const isReading = book.statut === 'EN_COURS';

  const sizeClasses = {
    sm: 'w-24 h-36', // 96x144px
    md: 'w-28 h-42', // 112x168px  
    lg: 'w-32 h-48', // 128x192px
  };

  const cardSizeClasses = {
    sm: 'p-3',
    md: 'p-4', 
    lg: "p-5",
  };

  const textSizeClasses = {
    sm: {
      title: "text-xs",
      author: "text-xs",
    },
    md: {
      title: "text-sm",
      author: "text-xs",
    },
    lg: {
      title: "text-base",
      author: `text-sm`,
    },
  };

  return (
    <div 
      className={cn(
        `book-card group cursor-pointer transition-smooth`,
        cardSizeClasses[size],
        className
      )}
    >
      <Link href={`/books/${book.id}`} className="block">
        <div className="flex flex-col h-full">
          {/* Cover Image */}
          <div className="relative mb-3 flex-shrink-0">
            <div className={cn("relative mx-auto", sizeClasses[size])}>
              {book.image_couverture ? (
                <Image
                  src={book.image_couverture}
                  alt={book.titre}
                  fill
                  className="object-cover rounded-lg border border-ash-300/20 group-hover:border-violet-400/40 transition-colors"
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                  priority={size === "lg"}
                />
              ) : (
                <div className={cn(
                  "flex items-center justify-center rounded-lg border border-ash-300/20 bg-ink-700 group-hover:border-violet-400/40 transition-colors",
                  sizeClasses[size]
                )}>
                  <BookOpen className="w-6 h-6 text-ash-400" />
                </div>
              )}

              {/* Reading Status Indicators */}
              {isRead && (
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm"
                  title="Lu"
                />
              )}
              {isReading && (
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white shadow-sm"
                  title="En cours de lecture"
                />
              )}

              {/* Saga Pill */}
              {book.saga && book.sagaOrder && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <SagaPill 
                    sagaName={book.saga.name}
                    tomeNumber={book.sagaOrder}
                    size={size === "sm" ? "sm" : "md"}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Book Info */}
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div className="mb-2">
              <h3 className={cn(
                "font-medium text-ash-100 line-clamp-2 leading-tight group-hover:text-violet-300 transition-colors",
                textSizeClasses[size].title
              )}>
                {book.titre}
              </h3>
              <p className={cn(
                `text-ash-400 line-clamp-1 mt-1',
                textSizeClasses[size].author
              )}>
                {book.auteur}
              </p>
            </div>

            {/* Stats and Badges */}
            {showStats && (
              <div className="flex flex-col gap-2">
                {/* Rating and Rhythm */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ash-300 bg-ink-600 px-2 py-0.5 rounded">
                    {book.note_generale}/10
                  </span>
                  <RhythmBadge rhythm={book.rythme} size={size === "sm" ? "sm" : "md"} />
                </div>

                {/* Rating Chips */}
                <RatingChips
                  spicy={book.niveau_spicy}
                  dark={book.niveau_dark}
                  romance={book.niveau_romance}
                  size={size === "sm" ? "sm" : "md"}
                  showLabels={size !== "sm"}
                />
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

// Skeleton component for loading states
export function BookCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-24 h-36',
    md: 'w-28 h-42',
    lg: 'w-32 h-48',
  };

  const cardSizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  return (
    <div className={cn('glass-dark rounded-lg animate-pulse', cardSizeClasses[size])}>
      <div className="flex flex-col h-full">
        <div className={cn("bg-ash-600/50 rounded-lg mb-3 mx-auto", sizeClasses[size])} />
        <div className="flex-1">
          <div className="h-4 bg-ash-600/50 rounded mb-2" />
          <div className="h-3 bg-ash-600/50 rounded w-3/4 mb-3" />
          <div className="flex gap-2 mb-2">
            <div className="h-6 bg-ash-600/50 rounded w-12" />
            <div className="h-6 bg-ash-600/50 rounded w-16" />
          </div>
          <div className="flex gap-1">
            <div className="h-5 bg-ash-600/50 rounded w-8" />
            <div className="h-5 bg-ash-600/50 rounded w-8" />
            <div className="h-5 bg-ash-600/50 rounded w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}