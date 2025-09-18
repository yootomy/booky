'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ExternalLink, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RatingChipsLarge } from '@/components/ui/rating-chips';
import { RhythmBadgeLarge } from '@/components/ui/rhythm-badge';
import { SagaPillLarge } from '@/components/ui/saga-pill';
import { useSpotlightBook } from '@/hooks/use-home-data';

function SpotlightSkeleton() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cover skeleton */}
            <div className="flex-shrink-0">
              <div className="w-48 h-72 bg-gray-200 rounded-xl animate-pulse" />
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              </div>
              <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SpotlightBook() {
  const { data: book, isLoading, error } = useSpotlightBook();

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="h-10 w-80 bg-gray-300 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-96 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </motion.div>

          <div
            className="relative rounded-3xl overflow-hidden animate-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 21, 56, 0.1)',
              boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
            }}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Cover placeholder */}
              <div className="lg:w-1/3 relative">
                <div className="aspect-[2/3] bg-gray-300 lg:rounded-l-3xl"></div>
              </div>

              {/* Content placeholder */}
              <div className="lg:w-2/3 p-8 lg:p-12 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>

                  <div className="space-y-3 mb-8">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                    <div className="h-8 bg-gray-200 rounded-full w-16"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 bg-gray-300 rounded-full w-32"></div>
                    <div className="h-12 bg-gray-200 rounded-full w-40"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !book) {
    return null; // Don't show section if no spotlight book
  }

  const excerpt = book.resume_personnel || book.pourquoi_aimer;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#2C1810'
            }}
          >
            Coup de Cœur du moment
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Notre sélection spéciale pour vous
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-2xl p-8 lg:p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 21, 56, 0.1)',
            boxShadow: '0 8px 32px rgba(139, 21, 56, 0.08)'
          }}
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Book Cover */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative group overflow-hidden rounded-xl">
                <div className="w-48 h-72 relative overflow-hidden rounded-xl">
                  {book.image_couverture ? (
                    <Image
                      src={book.image_couverture}
                      alt={book.titre}
                      fill
                      className="object-cover rounded-xl shadow-2xl border border-ash-300/20 group-hover:scale-105 transition-transform duration-300"
                      sizes="192px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-xl border border-gray-300 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Saga badge - repositionné en bas discrètement */}
                {book.saga && book.sagaOrder && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full text-center shadow-md backdrop-blur-sm bg-opacity-90">
                      {book.saga.name} - Tome {book.sagaOrder}
                    </div>
                  </div>
                )}

                {/* Favorite indicator - repositionné en haut à droite avec meilleur style */}
                {book._count?.book_favorite && book._count.book_favorite > 0 && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                    <Heart className="w-3 h-3 text-white fill-current" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Title & Author */}
                <div>
                  <h3 
                    className="text-2xl lg:text-3xl font-bold mb-3 group-hover:text-[#8B1538] transition-colors duration-300"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      color: '#2C1810'
                    }}
                  >
                    {book.titre}
                  </h3>
                  <p 
                    className="text-lg mb-3"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#6B4C7B'
                    }}
                  >
                    par {book.auteur}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: 'rgba(139, 21, 56, 0.1)'
                        }}
                      >
                        <BookOpen className="w-5 h-5" style={{ color: '#8B1538' }} />
                      </div>
                      <span 
                        className="text-2xl font-bold"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          color: '#8B1538'
                        }}
                      >
                        {book.note_generale}/10
                      </span>
                    </div>
                    <RhythmBadgeLarge rhythm={book.rythme} />
                  </div>
                </div>

                {/* Ratings */}
                <div className="py-4">
                  <RatingChipsLarge
                    spicy={book.niveau_spicy}
                    dark={book.niveau_dark}
                    romance={book.niveau_romance}
                  />
                </div>

                {/* Excerpt */}
                {excerpt && (
                  <div 
                    className="rounded-xl p-6 border-l-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.03) 0%, rgba(107, 76, 123, 0.03) 100%)',
                      borderLeftColor: '#8B1538'
                    }}
                  >
                    <p 
                      className="italic leading-relaxed line-clamp-3"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        color: '#2C1810',
                        fontSize: '1.1rem'
                      }}
                    >
                      "{excerpt}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href={`/books/${book.id}`}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    background: 'linear-gradient(135deg, #8B1538, #6B4C7B)',
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                  Voir la critique
                </Link>

                <Link
                  href={`/books/${book.id}`}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: 'rgba(139, 21, 56, 0.08)',
                    color: '#8B1538',
                    border: '1px solid rgba(139, 21, 56, 0.2)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <ExternalLink className="w-5 h-5" />
                  Détail du livre
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}