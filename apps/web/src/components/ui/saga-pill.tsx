'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SagaPillProps } from '@/lib/types/home';

export function SagaPill({ sagaName, tomeNumber, size = 'md' }: SagaPillProps) {
  const sizeClasses = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-xs',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold bg-gradient-to-r from-violet-700 to-violet-600 text-white transition-all hover:scale-105 shadow-sm',
        sizeClasses[size]
      )}
      title={`${sagaName} - Tome ${tomeNumber}`}
    >
      <BookOpen className={iconSizeClasses[size]} />
      <span>T{tomeNumber}</span>
    </div>
  );
}

// Large version for detailed views
export function SagaPillLarge({ 
  sagaName, 
  tomeNumber, 
  className 
}: { 
  sagaName: string; 
  tomeNumber: number; 
  className?: string; 
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm bg-gradient-to-r from-violet-700 to-violet-600 text-white transition-all hover:scale-105 shadow-md',
        className
      )}
    >
      <BookOpen className="w-4 h-4" />
      <span>{sagaName}</span>
      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
        Tome {tomeNumber}
      </span>
    </div>
  );
}

// Saga badge with status
export function SagaBadge({ 
  sagaName, 
  status, 
  bookCount,
  className 
}: { 
  sagaName: string; 
  status: string; 
  bookCount?: number;
  className?: string; 
}) {
  const statusColors = {
    ONGOING: 'from-green-600 to-green-500',
    COMPLETED: 'from-violet-600 to-violet-500',
    HIATUS: 'from-orange-600 to-orange-500',
    UNKNOWN: 'from-ash-600 to-ash-500',
  };

  const statusLabels = {
    ONGOING: 'En cours',
    COMPLETED: 'Terminée',
    HIATUS: 'En pause',
    UNKNOWN: 'Statut inconnu',
  };

  const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.UNKNOWN;
  const statusLabel = statusLabels[status as keyof typeof statusLabels] || statusLabels.UNKNOWN;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm text-white transition-all hover:scale-105 shadow-sm",
        `bg-gradient-to-r ${colorClass}`,
        className
      )}
    >
      <BookOpen className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="font-semibold">{sagaName}</span>
        <span className="text-xs opacity-90">
          {statusLabel}
          {bookCount && ` • ${bookCount} tome${bookCount > 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}