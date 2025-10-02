'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Star, Flame, TrendingUp } from 'lucide-react';
import { useDiscoveryCarousels } from '@/hooks/use-home-data';
import { BookCard, BookCardSkeleton } from '@/components/ui/book-card';

interface CarouselProps {
  title: string;
  subtitle: string;
  books: any[];
  icon: React.ComponentType<any>;
  isLoading?: boolean;
}

function Carousel({ title, subtitle, books, icon: Icon, isLoading }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="mb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 text-white">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-ink-900">{title}</h3>
            <p className="text-ash-500 text-sm">{subtitle}</p>
          </div>
        </div>
        
        {/* Navigation */}
        {!isLoading && books.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-lg border border-ash-300 hover:border-violet-500 hover:bg-violet-50 transition-all"
              aria-label="Défiler vers la gauche"
            >
              <ChevronLeft size={20} className="text-ash-600" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-lg border border-ash-300 hover:border-violet-500 hover:bg-violet-50 transition-all"
              aria-label="Défiler vers la droite"
            >
              <ChevronRight size={20} className="text-ash-600" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <BookCardSkeleton key={index} size="md" />
            ))
          ) : books.length === 0 ? (
            // Empty state
            <div className="w-full text-center py-12 text-ash-500">
              <Icon size={48} className="mx-auto mb-4 opacity-50" />
              <p>Aucun livre trouvé pour cette section</p>
            </div>
          ) : (
            // Books
            books.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                size="md"
                className="snap-start"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function DiscoveryCarousels() {
  const { data: carousels, isLoading, error } = useDiscoveryCarousels();

  if (error) {
    return (
      <section className="bg-gradient-to-b from-white to-ash-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center text-ash-500">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p>Impossible de charger les découvertes</p>
          </div>
        </div>
      </section>
    );
  }

  const {
    nouveautes = [],
    meilleuresNotes = [],
    sagasEnCours = [],
    darkSpicy = []
  } = carousels || {};

  return (
    <section className="bg-gradient-to-b from-white to-ash-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl font-bold text-ink-900 mb-4">
            Découvertes & Collections
          </h2>
          <p className="text-ash-500 text-lg max-w-2xl mx-auto">
            Explorez nos sélections soigneusement organisées pour nourrir votre passion littéraire
          </p>
        </motion.div>

        {/* Carousels */}
        <div className="space-y-8">
          {/* Nouveautés */}
          <Carousel
            title="Nouveautés"
            subtitle="Les derniers ajouts à votre bibliothèque"
            books={nouveautes}
            icon={Clock}
            isLoading={isLoading}
          />

          {/* Meilleures Notes */}
          <Carousel
            title="Meilleures Notes"
            subtitle="Les livres qui ont marqué vos lectures"
            books={meilleuresNotes}
            icon={Star}
            isLoading={isLoading}
          />

          {/* Sagas en Cours */}
          <Carousel
            title="Sagas en Cours"
            subtitle="Poursuivez vos aventures littéraires"
            books={sagasEnCours}
            icon={TrendingUp}
            isLoading={isLoading}
          />

          {/* Dark & Spicy */}
          <Carousel
            title="Dark & Spicy"
            subtitle="Pour les âmes en quête d"intensité'
            books={darkSpicy}
            icon={Flame}
            isLoading={isLoading}
          />
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <button className="px-8 py-3 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all">
            Explorer tout le catalogue
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* Hide scrollbars */
const styles="
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
';

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}