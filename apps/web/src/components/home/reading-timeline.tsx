'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Star, Clock } from 'lucide-react';
import { useRecentReads } from '@/hooks/use-home-data';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale?: number;
  date_lecture?: string;
  niveau_spicy?: number;
  niveau_dark?: number;
  niveau_romance?: number;
  rythme?: string;
}

interface TimelineItemProps {
  book: Book;
  index: number;
}

function TimelineItem({ book, index }: TimelineItemProps) {
  const getRatingColor = (rating: number = 0) => {
    if (rating >= 8) return 'text-emerald-600';
    if (rating >= 6) return 'text-yellow-600';
    if (rating >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRhythmeBadge = (rythme?: string) => {
    switch (rythme) {
      case 'SLOW_BURN': return { label: 'Slow Burn', color: 'bg-blue-100 text-blue-800' };
      case 'MEDIUM_BURN': return { label: 'Medium', color: 'bg-purple-100 text-purple-800' };
      case 'FAST_PACE': return { label: 'Fast Pace', color: 'bg-orange-100 text-orange-800' };
      case 'INSTA_LOVE': return { label: 'Insta Love', color: 'bg-pink-100 text-pink-800' };
      default: return { label: 'Non défini', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const rhythm = getRhythmeBadge(book.rythme);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex items-center gap-4 p-4 glass-dark rounded-lg border border-ash-300/20 hover:border-violet-500/30 transition-all group"
    >
      {/* Cover */}
      <div className="flex-shrink-0">
        <div className="w-16 h-24 bg-ink-700 rounded-md overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
          {book.image_couverture ? (
            <img
              src={book.image_couverture}
              alt={'Couverture de ${book.titre}'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ash-400">
              <Star size={24} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-serif text-lg font-semibold text-ink-900 line-clamp-1 group-hover:text-violet-700 transition-colors">
          {book.titre}
        </h4>
        <p className="text-ash-500 text-sm line-clamp-1">{book.auteur}</p>
        
        {/* Metadata Row */}
        <div className="flex items-center gap-3 mt-2">
          {/* Date */}
          {book.date_lecture && (
            <div className="flex items-center gap-1 text-xs text-ash-400">
              <Calendar size={12} />
              <span>
                {format(new Date(book.date_lecture), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
          
          {/* Note */}
          {book.note_generale && (
            <div className={'flex items-center gap-1 text-xs font-medium ${getRatingColor(book.note_generale)}'}>
              <Star size={12} fill='currentColor' />
              <span>{book.note_generale}/10</span>
            </div>
          )}
          
          {/* Rythme Badge */}
          <span className={'px-2 py-1 rounded-full text-xs font-medium ${rhythm.color}'}>
            {rhythm.label}
          </span>
        </div>
      </div>

      {/* Tooltip on hover - Levels */}
      <div className="hidden group-hover:flex flex-col gap-1 text-xs">
        {book.niveau_spicy !== undefined && book.niveau_spicy > 0 && (
          <div className="flex items-center gap-2 text-crimson-600 bg-crimson-50 px-2 py-1 rounded">
            <span className="font-medium">Spicy:</span>
            <span>{book.niveau_spicy}/10</span>
          </div>
        )}
        {book.niveau_dark !== undefined && book.niveau_dark > 0 && (
          <div className="flex items-center gap-2 text-ink-700 bg-gray-100 px-2 py-1 rounded">
            <span className="font-medium">Dark:</span>
            <span>{book.niveau_dark}/10</span>
          </div>
        )}
        {book.niveau_romance !== undefined && book.niveau_romance > 0 && (
          <div className="flex items-center gap-2 text-violet-600 bg-violet-50 px-2 py-1 rounded">
            <span className="font-medium">Romance:</span>
            <span>{book.niveau_romance}/10</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 glass-dark rounded-lg animate-pulse">
          <div className="w-16 h-24 bg-ash-300 rounded-md"></div>
          <div className="flex-1">
            <div className="h-5 bg-ash-300 rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-ash-300 rounded mb-2 w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-3 bg-ash-300 rounded w-20"></div>
              <div className="h-3 bg-ash-300 rounded w-16"></div>
              <div className="h-3 bg-ash-300 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReadingTimeline() {
  const { data: recentReads = [], isLoading, error } = useRecentReads();

  if (error) {
    return (
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center text-ash-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>Impossible de charger la timeline des lectures</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl font-bold text-ink-900 mb-4">
            Timeline des Lectures
          </h2>
          <p className="text-ash-500 text-lg max-w-2xl mx-auto">
            Redécouvrez vos dernières aventures littéraires et les émotions qu'elles ont éveillées
          </p>
        </motion.div>

        {/* Timeline Content */}
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <TimelineSkeleton />
          ) : recentReads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 glass-dark rounded-lg border border-ash-300/20"
            >
              <Clock size={64} className="mx-auto mb-4 text-ash-400" />
              <h3 className="font-serif text-xl font-semibold text-ink-900 mb-2">
                Votre timeline est vide
              </h3>
              <p className="text-ash-500 mb-6">
                Ajoutez des dates de lecture à vos livres pour voir votre parcours ici
              </p>
              <button className="px-6 py-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-lg hover:shadow-lg transition-all">
                Explorer le catalogue
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {recentReads.map((book: any, index: number) => (
                <TimelineItem key={book.id} book={book} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* View More */}
        {recentReads.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8"
          >
            <button className="px-6 py-3 border border-violet-600 text-violet-600 rounded-lg hover:bg-violet-600 hover:text-white transition-all">
              Voir toute l'historique
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}