'use client';

import React from 'react';
import { Flame, Moon, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RatingChipsProps } from '@/lib/types/home';

export function RatingChips({ 
  spicy, 
  dark, 
  romance, 
  size = 'md', 
  showLabels = true 
}: RatingChipsProps) {
  const sizeClasses = {
    sm: 'h-5 px-1.5 text-xs',
    md: 'h-6 px-2 text-xs',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  const formatRating = (value: number) => value.toString();

  return (
    <div className="flex gap-1 flex-wrap">
      {/* Spicy Level */}
      {spicy > 0 && (
        <div className={cn(
          'rating-spicy flex items-center gap-1 rounded-full font-medium transition-all hover:scale-105',
          sizeClasses[size]
        )}>
          <Flame className={iconSizeClasses[size]} />
          {showLabels && <span>Spicy</span>}
          <span className="font-bold">{formatRating(spicy)}</span>
        </div>
      )}

      {/* Dark Level */}
      {dark > 0 && (
        <div className={cn(
          'rating-dark flex items-center gap-1 rounded-full font-medium transition-all hover:scale-105',
          sizeClasses[size]
        )}>
          <Moon className={iconSizeClasses[size]} />
          {showLabels && <span>Dark</span>}
          <span className="font-bold">{formatRating(dark)}</span>
        </div>
      )}

      {/* Romance Level */}
      {romance > 0 && (
        <div className={cn(
          'rating-romance flex items-center gap-1 rounded-full font-medium transition-all hover:scale-105',
          sizeClasses[size]
        )}>
          <Heart className={iconSizeClasses[size]} />
          {showLabels && <span>Romance</span>}
          <span className="font-bold">{formatRating(romance)}</span>
        </div>
      )}
    </div>
  );
}

// Component for large display (e.g., spotlight book)
export function RatingChipsLarge({ 
  spicy, 
  dark, 
  romance, 
  className 
}: { 
  spicy: number; 
  dark: number; 
  romance: number; 
  className?: string; 
}) {
  return (
    <div className={cn('flex gap-3', className)}>
      {/* Spicy Level */}
      <div className="flex flex-col items-center gap-1">
        <div className="rating-spicy h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <Flame className="w-5 h-5" />
        </div>
        <div className="text-center">
          <div className="text-xs text-ash-400 uppercase tracking-wide">Spicy</div>
          <div className="text-sm font-bold text-ash-200">{spicy}/10</div>
        </div>
      </div>

      {/* Dark Level */}
      <div className="flex flex-col items-center gap-1">
        <div className="rating-dark h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <Moon className="w-5 h-5" />
        </div>
        <div className="text-center">
          <div className="text-xs text-ash-400 uppercase tracking-wide">Dark</div>
          <div className="text-sm font-bold text-ash-200">{dark}/10</div>
        </div>
      </div>

      {/* Romance Level */}
      <div className="flex flex-col items-center gap-1">
        <div className="rating-romance h-10 w-10 rounded-full flex items-center justify-center transition-all hover:scale-105">
          <Heart className="w-5 h-5" />
        </div>
        <div className="text-center">
          <div className="text-xs text-ash-400 uppercase tracking-wide">Romance</div>
          <div className="text-sm font-bold text-ash-200">{romance}/10</div>
        </div>
      </div>
    </div>
  );
}

// Progress bar style for detailed views
export function RatingBars({ 
  spicy, 
  dark, 
  romance, 
  className 
}: { 
  spicy: number; 
  dark: number; 
  romance: number; 
  className?: string; 
}) {
  const RatingBar = ({ 
    label, 
    value, 
    icon: Icon, 
    colorClass 
  }: { 
    label: string; 
    value: number; 
    icon: React.ElementType; 
    colorClass: string; 
  }) => (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-20">
        <Icon className="w-4 h-4 text-ash-400" />
        <span className="text-sm text-ash-300">{label}</span>
      </div>
      <div className="flex-1 h-2 bg-ink-700 rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: '${(value / 10) * 100}%' }}
        />
      </div>
      <span className="text-sm font-semibold text-ash-200 w-8 text-right">{value}</span>
    </div>
  );

  return (
    <div className={cn('space-y-3', className)}>
      <RatingBar 
        label="Spicy" 
        value={spicy} 
        icon={Flame} 
        colorClass="bg-gradient-to-r from-crimson-600 to-crimson-500" 
      />
      <RatingBar 
        label="Dark" 
        value={dark} 
        icon={Moon} 
        colorClass="bg-gradient-to-r from-ink-600 to-ink-500" 
      />
      <RatingBar 
        label="Romance" 
        value={romance} 
        icon={Heart} 
        colorClass="bg-gradient-to-r from-violet-600 to-violet-500" 
      />
    </div>
  );
}