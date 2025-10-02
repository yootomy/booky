'use client';

import React from 'react';
import { Zap, Clock, Wind, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RhythmBadgeProps } from '@/lib/types/home';
type BookRhythm = 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';

const RHYTHM_CONFIG: Record<BookRhythm, any> = {
  SLOW_BURN: {
    label: 'Slow Burn',
    icon: Clock,
    colorClass: "bg-gradient-to-r from-ash-500 to-ash-400 text-white",
    description: "Développement lent et intense"
  },
  MEDIUM_BURN: {
    label: 'Medium',
    icon: Wind,
    colorClass: "bg-gradient-to-r from-violet-600 to-violet-500 text-white",
    description: "Rythme équilibré"
  },
  FAST_PACE: {
    label: 'Fast Pace',
    icon: Zap,
    colorClass: "bg-gradient-to-r from-crimson-600 to-crimson-500 text-white",
    description: "Action rapide et intense"
  },
  INSTA_LOVE: {
    label: 'Insta Love',
    icon: Heart,
    colorClass: "bg-gradient-to-r from-violet-500 to-crimson-500 text-white",
    description: "Coup de foudre immédiat"
  },
} as const;

export function RhythmBadge({ rhythm, size="md" }: RhythmBadgeProps) {
  const config = RHYTHM_CONFIG[rhythm as keyof typeof RHYTHM_CONFIG];
  
  if (!config) {
    return null;
  }

  const { label, icon: Icon, colorClass } = config;

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
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all hover:scale-105',
        colorClass,
        sizeClasses[size]
      )}
      title={config.description}
    >
      <Icon className={iconSizeClasses[size]} />
      <span>{label}</span>
    </div>
  );
}

// Large version for detailed views
export function RhythmBadgeLarge({ 
  rhythm, 
  className 
}: { 
  rhythm: BookRhythm; 
  className?: string; 
}) {
  const config = RHYTHM_CONFIG[rhythm as keyof typeof RHYTHM_CONFIG];
  
  if (!config) {
    return null;
  }

  const { label, icon: Icon, colorClass, description } = config;

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:scale-105',
        colorClass,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
}

// Grid of all rhythms for filtering
export function RhythmGrid({ 
  selectedRhythms, 
  onToggleRhythm,
  className
}: { 
  selectedRhythms: BookRhythm[]; 
  onToggleRhythm: (rhythm: BookRhythm) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {Object.entries(RHYTHM_CONFIG).map(([key, config]) => {
        const rhythm = key as BookRhythm;
        const isSelected = selectedRhythms.includes(rhythm);
        const { label, icon: Icon, colorClass, description } = config;

        return (
          <button
            key={rhythm}
            onClick={() => onToggleRhythm(rhythm)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all hover:scale-102',
              isSelected 
                ? colorClass + ' shadow-lg' 
                : "bg-ink-700 text-ash-300 border border-ash-500/30 hover:border-ash-400/50"
            )}
            title={description}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}