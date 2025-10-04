'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingUp, Star, BookOpen, Heart, MessageCircle, Tag } from 'lucide-react';
import { useTrendingNew } from '@/hooks/use-trending-new';

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy: number;
  rythme: 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';
  date_creation: string;
  date_publication?: string;
  trending_score?: number;
  favorite_count?: number;
  question_count?: number;
  tags?: string[];
}

interface TrendingNewProps {}

type TabType = 'new' | 'trending';

// Fonction utilitaire pour obtenir l'image du livre
function getBookImage(book: Book) {
  return book.image_couverture || '/placeholder-book.svg';
}

// Fonction utilitaire pour tronquer le titre/auteur
function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function RythmeChip({ rythme }: { rythme: Book['rythme'] }) {
  const getRythmeInfo = (rythme: Book['rythme']) => {
    switch (rythme) {
      case 'SLOW_BURN':
        return { label: 'Lent', color: '#6B7280', bgColor: '#F3F4F6' };
      case 'MEDIUM_BURN':
        return { label: 'Mesuré', color: '#6B4C7B', bgColor: '#F3E8FF' };
      case 'FAST_PACE':
        return { label: 'Intense', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'INSTA_LOVE':
        return { label: 'Foudre', color: '#8B1538', bgColor: '#FEE2E2' };
      default:
        return { label: 'Mesuré', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const { label, color, bgColor } = getRythmeInfo(rythme);

  return (
    <span 
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
      style={{
        color: color,
        backgroundColor: bgColor
      }}
    >
      {label}
    </span>
  );
}

function SpicyIndicator({ level }: { level: number }) {
  const getIndicatorColor = () => {
    if (level <= 3) return '#6B7280';
    if (level <= 6) return '#F59E0B';
    return "#EF4444";
  };

  return (
    <span
      className="text-xs font-medium px-2 py-1 rounded-full"
      title={`Niveau spicy: ${level}/10`}
      style={{
        backgroundColor: `${getIndicatorColor()}15`,
        color: getIndicatorColor()
      }}
    >
      {level}/10
    </span>
  );
}

function BookCard({ book, index, showTrendingBadge = false }: { 
  book: Book; 
  index: number; 
  showTrendingBadge?: boolean; 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-pointer flex-shrink-0 w-40"
    >
      <Link href={`/books/${book.id}`}>
        <div className="relative">
          {/* Book Cover */}
          <div className="aspect-[3/4] relative mb-3 rounded-lg overflow-hidden group-hover:shadow-lg transition-all duration-300">
            <Image
              src={getBookImage(book)}
              alt={`Couverture de ${book.titre}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="160px"
              onError={(e) => {
                e.currentTarget.src="/placeholder-book.svg";
              }}
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {showTrendingBadge && (
                <div
                  className="px-2 py-1 rounded-md text-xs font-bold backdrop-blur-sm"
                  style={{
                    backgroundColor: "rgba(249, 115, 22, 0.9)",
                    color: "white"
                  }}
                >
                  Trend
                </div>
              )}
            </div>

            {/* Rating overlay */}
            {book.note_generale > 0 && (
              <div className="absolute bottom-2 right-2">
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-md backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white'
                  }}
                >
                  <Star className="w-3 h-3 fill-current" style={{ color: "#B8860B" }} />
                  <span className="text-xs font-semibold">{book.note_generale}</span>
                </div>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="space-y-1">
            <h3 
              className="font-semibold text-sm leading-tight group-hover:text-[#8B1538] transition-colors duration-300 line-clamp-2"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
              title={book.titre}
            >
              {truncateText(book.titre, 60)}
            </h3>
            
            <p 
              className="text-xs opacity-75 line-clamp-1"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810'
              }}
              title={book.auteur}
            >
              {truncateText(book.auteur, 40)}
            </p>

            {/* Chips row */}
            <div className="flex items-center gap-2 pt-1">
              <RythmeChip rythme={book.rythme} />
              <SpicyIndicator level={book.niveau_spicy} />
            </div>

            {/* Trending info */}
            {showTrendingBadge && (book.favorite_count || book.question_count) && (
              <div className="flex items-center gap-3 pt-1">
                {book.favorite_count && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" style={{ color: "#8B1538" }} />
                    <span className="text-xs" style={{ color: "#8B1538" }}>
                      {book.favorite_count}
                    </span>
                  </div>
                )}
                {book.question_count && (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" style={{ color: "#6B4C7B" }} />
                    <span className="text-xs" style={{ color: "#6B4C7B" }}>
                      {book.question_count}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function BooksSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex-shrink-0 w-40 animate-pulse">
          <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 rounded w-12"></div>
            <div className="h-5 bg-gray-200 rounded w-6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendingNew({}: TrendingNewProps) {
  const { newBooks, trendingBooks, isLoading, error } = useTrendingNew();
  const [activeTab, setActiveTab] = useState<TabType>("new");

  const currentBooks = activeTab === 'new' ? newBooks : trendingBooks;

  // Ne rien afficher si pas de données
  if (newBooks.length === 0 && trendingBooks.length === 0 && !isLoading) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#2C1810'
            }}
          >
            {activeTab === 'new' ? 'Tombées de la nuit' : 'On chuchote ces titres'}
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            {activeTab === 'new' 
              ? 'Les dernières arrivées dans notre sanctuaire' : 'Ce que tout le monde dévore en secret'
            }
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div 
            className="flex rounded-full p-1"
            style={{
              backgroundColor: 'rgba(139, 21, 56, 0.08)',
              border: '1px solid rgba(139, 21, 56, 0.15)'
            }}
          >
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-semibold ${
                activeTab === 'new'
                  ? 'text-white shadow-lg' : 'hover:bg-white/50'
              }`}
              style={{
                backgroundColor: activeTab === "new" ? "#8B1538" : "transparent",
                color: activeTab === "new" ? "white" : "#8B1538",
                fontFamily: "Inter, sans-serif"
              }}
            >
              <Clock className="w-4 h-4" />
              Nouveautés
            </button>

            <button
              onClick={() => setActiveTab('trending')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-semibold ${
                activeTab === 'trending'
                  ? 'text-white shadow-lg' : 'hover:bg-white/50'
              }`}
              style={{
                backgroundColor: activeTab === "trending" ? "#8B1538" : "transparent",
                color: activeTab === "trending" ? "white" : "#8B1538",
                fontFamily: "Inter, sans-serif"
              }}
            >
              <TrendingUp className="w-4 h-4" />
              Tendances
            </button>
          </div>
        </motion.div>

        {/* Books Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-transparent"
              style={{ scrollbarWidth: "thin" }}
            >
              {currentBooks.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  showTrendingBadge={activeTab === 'trending'}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link
            href={activeTab === "new" ? "/books?sort=recent" : "/books?sort=trending"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'rgba(139, 21, 56, 0.08)',
              color: '#8B1538',
              border: '1px solid rgba(139, 21, 56, 0.2)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {activeTab === 'new' ? (
              <>
                <Clock className="w-4 h-4" />
                Voir toutes les nouveautés
              </>
            ) : (
              <>
                <TrendingUp className='w-4 h-4' />
                Voir toutes les tendances
              </>
            )}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}