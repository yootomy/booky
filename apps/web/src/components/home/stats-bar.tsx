'use client';

import React from 'react';
import { BookOpen, CheckCircle, Clock, Star, BookMarked, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHomeStats } from '@/hooks/use-home-data';

interface StatChipProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  colorClass?: string;
  index: number;
}

function StatChip({ icon: Icon, label, value, colorClass = 'from-violet-600 to-violet-500', index }: StatChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        'glass-dark px-4 py-3 rounded-xl border border-ash-500/30 hover:border-ash-400/50 transition-all hover:scale-105',
        'flex items-center gap-3 min-w-0'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r',
        colorClass
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-semibold text-ash-100 truncate">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-xs text-ash-400 uppercase tracking-wide truncate">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function StatChipSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-dark px-4 py-3 rounded-xl border border-ash-500/30 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-ash-600/50 animate-pulse" />
      <div className="flex-1">
        <div className="h-5 bg-ash-600/50 rounded mb-1 animate-pulse" />
        <div className="h-3 bg-ash-600/50 rounded w-3/4 animate-pulse" />
      </div>
    </motion.div>
  );
}

export function StatsBar() {
  const { data: stats, isLoading, error } = useHomeStats();

  if (error) {
    return (
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-ash-400">
            <p>Impossible de charger les statistiques</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <StatChipSkeleton key={index} index={index} />
            ))
          ) : stats ? (
            // Real data
            <>
              <StatChip
                icon={BookOpen}
                label="Total livres"
                value={stats.data?.overview?.total_books || 0}
                colorClass="from-violet-600 to-violet-500"
                index={0}
              />
              <StatChip
                icon={CheckCircle}
                label="Lu"
                value={stats.data?.reading_progress?.books_read || 0}
                colorClass="from-green-600 to-green-500"
                index={1}
              />
              <StatChip
                icon={Clock}
                label="En cours"
                value={stats.data?.reading_progress?.books_in_progress || 0}
                colorClass="from-orange-600 to-orange-500"
                index={2}
              />
              <StatChip
                icon={BookMarked}
                label="À lire"
                value={stats.data?.reading_progress?.books_to_read || 0}
                colorClass="from-blue-600 to-blue-500"
                index={3}
              />
              <StatChip
                icon={Star}
                label="Note moyenne"
                value={stats.data?.ratings_summary?.average_rating?.toFixed(1) || "N/A"}
                colorClass="from-crimson-600 to-crimson-500"
                index={4}
              />
              <StatChip
                icon={TrendingUp}
                label="Sagas"
                value={0}
                colorClass="from-violet-700 to-violet-600"
                index={5}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}