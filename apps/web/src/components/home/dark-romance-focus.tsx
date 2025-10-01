'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Star, AlertTriangle, BookOpen, Flame } from 'lucide-react';
import { useDarkRomance } from '@/hooks/use-dark-romance';

interface DarkRomanceBook {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_dark: number;
  niveau_romance: number;
  niveau_spicy: number;
  intensite_emotionnelle: number;
  danger: number;
  violence: number;
  dark_score: number;
  resume_court?: string;
  pourquoi_aimer?: string;
  has_triggers: boolean;
}

interface DarkRomanceFocusProps {}

// Fonction utilitaire pour obtenir l'image du livre
function getBookImage(book: DarkRomanceBook) {
  return book.image_couverture || '/placeholder-book.svg';
}

// Fonction utilitaire pour obtenir le texte court
function getBookText(book: DarkRomanceBook) {
  const text = book.resume_court || book.pourquoi_aimer || '';
  if (!text) return null;
  return text.length > 160 ? text.substring(0, 160) + '...' : text;
}

function SpicyLevel({ level }: { level: number }) {
  const getSpicyInfo = (level: number) => {
    if (level <= 3) return { label: 'Tendre', color: '#6B7280' };
    if (level <= 6) return { label: 'Chaud', color: '#F59E0B' };
    return { label: 'Brûlant', color: '#EF4444' };
  };

  const { label, color } = getSpicyInfo(level);

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: '${color}15',
        color: color
      }}
    >
      {label} ({level}/10)
    </div>
  );
}

function DarkScoreBadge({ score }: { score: number }) {
  return (
    <div 
      className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, #8B1538, #6B4C7B)',
        color: 'white'
      }}
    >
      {Math.round(score * 10)}/100
    </div>
  );
}

function BookCard({ book, index }: { book: DarkRomanceBook; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <Link href={'/books/${book.id}'}>
        <div className="relative">
          {/* Book Cover */}
          <div className="aspect-[3/4] relative mb-4 rounded-xl overflow-hidden group-hover:shadow-2xl transition-all duration-500">
            <Image
              src={getBookImage(book)}
              alt={'Couverture de ${book.titre}'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-book.svg';
              }}
            />

            {/* Dark score overlay */}
            <DarkScoreBadge score={book.dark_score} />

            {/* Trigger warning */}
            {book.has_triggers && (
              <div className="absolute top-3 left-3">
                <div 
                  className="p-1.5 rounded-full backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  }}
                  title="Contenus sensibles"
                >
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold text-sm">
                    {book.note_generale}/10
                  </span>
                </div>
                
                <SpicyLevel level={book.niveau_spicy} />
              </div>
            </div>
          </div>

          {/* Book Info */}
          <div className="space-y-2">
            <h3 
              className="font-bold text-lg leading-tight group-hover:text-[#8B1538] transition-colors duration-300 line-clamp-2"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
            >
              {book.titre}
            </h3>
            
            <p 
              className="text-sm opacity-75"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810'
              }}
            >
              par {book.auteur}
            </p>

            {/* Teaser text */}
            {getBookText(book) && (
              <p 
                className="text-sm opacity-80 line-clamp-2 italic"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#6B4C7B'
                }}
              >
                "{getBookText(book)}"
              </p>
            )}

            {/* Intensity indicators */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1">
                <Heart 
                  className="w-4 h-4" 
                  style={{ 
                    color: '#8B1538',
                    fill: book.niveau_romance >= 7 ? '#8B1538' : 'none'
                  }} 
                />
                <span className="text-xs font-medium" style={{ color: '#8B1538' }}>
                  {book.niveau_romance}/10
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Flame 
                  className="w-4 h-4" 
                  style={{ 
                    color: '#6B4C7B',
                    fill: book.intensite_emotionnelle >= 7 ? '#6B4C7B' : 'none'
                  }} 
                />
                <span className="text-xs font-medium" style={{ color: '#6B4C7B' }}>
                  {book.intensite_emotionnelle}/10
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function BookSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div className="animate-pulse">
        <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-4"></div>
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        <div className="h-3 bg-gray-200 rounded mb-3"></div>
        <div className="flex gap-3">
          <div className="h-5 bg-gray-200 rounded w-12"></div>
          <div className="h-5 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </motion.div>
  );
}

export function DarkRomanceFocus({}: DarkRomanceFocusProps) {
  const { data: books, isLoading, error } = useDarkRomance();

  // Ne rien afficher si pas de données
  if (books.length === 0 && !isLoading) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF8F5' }}>
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
            La chambre noire
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto mb-4"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Là où les cœurs se perdent volontairement
          </p>
          
          {/* Content warning */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            Certains contenus peuvent heurter la sensibilité
          </div>
        </motion.div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {books.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              index={index}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center"
        >
          <Link
            href={"/books?genre=dark-romance" as any}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl group focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: 'linear-gradient(135deg, #8B1538, #6B4C7B)',
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
            }}
          >
            <Heart className="w-5 h-5 group-hover:fill-current transition-all" />
            Plonger dans les ténèbres
            <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>
          
          <p 
            className="text-xs opacity-60 mt-4"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Tous nos dark romance • Classés par intensité
          </p>
        </motion.div>
      </div>
    </section>
  );
}