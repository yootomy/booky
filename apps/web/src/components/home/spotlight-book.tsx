'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ExternalLink, Heart, Star, Calendar } from 'lucide-react';
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="h-10 w-80 bg-muted rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-96 bg-muted/70 rounded mx-auto animate-pulse"></div>
          </motion.div>

          <div className="relative rounded-3xl overflow-hidden animate-pulse bg-card/60 backdrop-blur-xl border border-border shadow-lg">
            <div className="flex flex-col lg:flex-row">
              {/* Cover placeholder */}
              <div className="lg:w-1/3 relative">
                <div className="aspect-[2/3] bg-muted lg:rounded-l-3xl"></div>
              </div>

              {/* Content placeholder */}
              <div className="lg:w-2/3 p-8 lg:p-12 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-muted/70 rounded w-1/2 mb-6"></div>

                  <div className="space-y-3 mb-8">
                    <div className="h-4 bg-muted/70 rounded"></div>
                    <div className="h-4 bg-muted/70 rounded"></div>
                    <div className="h-4 bg-muted/70 rounded w-3/4"></div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <div className="h-8 bg-muted/70 rounded-full w-20"></div>
                    <div className="h-8 bg-muted/70 rounded-full w-24"></div>
                    <div className="h-8 bg-muted/70 rounded-full w-16"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-12 bg-muted rounded-full w-32"></div>
                    <div className="h-12 bg-muted/70 rounded-full w-40"></div>
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
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl font-bold mb-4 text-foreground"
            style={{
              fontFamily: 'Playfair Display, serif'
            }}
          >
            Coup de Cœur du moment
          </h2>
          <p
            className="text-lg opacity-75 max-w-2xl mx-auto text-foreground"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Notre sélection spéciale pour vous
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-2xl p-4 sm:p-6 lg:p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-card/60 backdrop-blur-xl border border-border shadow-lg"
        >
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Book Cover */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative group overflow-hidden rounded-xl">
                <div className="w-32 h-48 sm:w-40 sm:h-60 lg:w-48 lg:h-72 relative overflow-hidden rounded-xl">
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
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              {/* Left Column */}
              <div className="space-y-3 lg:space-y-4">
                {/* Title & Author */}
                <div>
                  <h3
                    className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 lg:mb-3 group-hover:text-primary transition-colors duration-300 text-foreground"
                    style={{
                      fontFamily: 'Playfair Display, serif'
                    }}
                  >
                    {book.titre}
                  </h3>
                  <p
                    className="text-base lg:text-lg mb-3 lg:mb-4"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#6B4C7B'
                    }}
                  >
                    par {book.auteur}
                  </p>
                  <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span
                        className="text-xl lg:text-2xl font-bold text-primary"
                        style={{
                          fontFamily: "Inter, sans-serif"
                        }}
                      >
                        {book.note_generale}/10
                      </span>
                    </div>
                  </div>

                  {/* Rythme badge */}
                  <div className="mb-3 lg:mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/60 uppercase tracking-wide">Rythme:</span>
                      <RhythmBadgeLarge rhythm={book.rythme} />
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div>
                  <RatingChipsLarge
                    spicy={book.niveau_spicy}
                    dark={book.niveau_dark}
                    romance={book.niveau_romance}
                  />
                </div>

                {/* Categories & Tags */}
                <div className="space-y-2 lg:space-y-3">
                  {book.categories && book.categories.length > 0 && (
                    <div>
                      <h4 className="text-xs lg:text-sm font-semibold text-foreground/80 mb-1 lg:mb-2">Genres</h4>
                      <div className="flex flex-wrap gap-2">
                        {book.categories.slice(0, 3).map((category: any) => (
                          <span
                            key={category.id}
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${category.couleur}20`,
                              color: category.couleur,
                              border: `1px solid ${category.couleur}40`
                            }}
                          >
                            {category.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {book.tags && book.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs lg:text-sm font-semibold text-foreground/80 mb-1 lg:mb-2">Tropes</h4>
                      <div className="flex flex-wrap gap-2">
                        {book.tags.slice(0, 6).map((tag: any) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-md text-xs font-medium"
                            style={{
                              backgroundColor: `${tag.couleur}15`,
                              color: tag.couleur,
                              border: `1px solid ${tag.couleur}30`
                            }}
                          >
                            {tag.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3 lg:space-y-4">
                {/* Excerpt */}
                {excerpt && (
                  <div className="rounded-xl p-4 lg:p-6 border-l-4 border-l-primary bg-primary/5">
                    <h4 className="text-xs lg:text-sm font-semibold text-foreground/80 mb-2 lg:mb-3">Pourquoi craquer ?</h4>
                    <p
                      className="italic leading-relaxed line-clamp-4 lg:line-clamp-5 text-foreground"
                      style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "clamp(0.9rem, 2vw, 1rem)"
                      }}
                    >
                      "{excerpt}"
                    </p>
                  </div>
                )}

                {/* Book Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card/40 rounded-lg p-2.5 lg:p-3 border border-border">
                    <div className="text-xs text-foreground/60 uppercase tracking-wide">Pages</div>
                    <div className="text-base lg:text-lg font-bold text-foreground">
                      {book.nombre_pages || "N/A"}
                    </div>
                  </div>
                  <div className="bg-card/40 rounded-lg p-2.5 lg:p-3 border border-border">
                    <div className="text-xs text-foreground/60 uppercase tracking-wide flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      Favoris
                    </div>
                    <div className="text-base lg:text-lg font-bold text-foreground">
                      {book._count?.book_favorite ? `${book._count.book_favorite}` : "0"}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 lg:pt-4">
                  <Link
                    href={`/books/${book.id}`}
                    className="inline-flex items-center justify-center gap-2 lg:gap-3 px-6 lg:px-8 py-3 lg:py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 w-full text-sm lg:text-base"
                    style={{
                      background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                      color: 'white',
                      fontFamily: 'Inter, sans-serif',
                      boxShadow: "0 8px 25px rgba(139, 21, 56, 0.3)"
                    }}
                  >
                    <BookOpen className='w-5 h-5' />
                    Découvrir ce livre
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}