'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Star, ChevronRight, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  date_creation: string;
  categories?: Array<{
    id: string;
    nom: string;
    couleur: string;
  }>;
}

function getBookImage(book: Book) {
  return book.image_couverture || '/placeholder-book.svg';
}

function BookCard({ book, index }: { book: Book; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ y: -2 }}
      className="group cursor-pointer"
    >
      <Link href={`/books/${book.id}`}>
        <div className="relative rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-xl bg-card/90 backdrop-blur-xl border border-border shadow-lg">
          {/* Book Cover */}
          <div className="relative aspect-[2/3] overflow-hidden">
            {book.image_couverture ? (
              <Image
                src={getBookImage(book)}
                alt={`Couverture de ${book.titre}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-book.svg";
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                }}
              >
                <BookOpen className="w-8 h-8 text-white opacity-70" />
              </div>
            )}

            {/* New Badge */}
            <div className="absolute top-2 left-2">
              <div className="px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-1 bg-primary/90 border border-white/20">
                <Clock className="w-3 h-3 text-white" />
                <span className="text-white">Nouveau</span>
              </div>
            </div>

            {/* Rating badge */}
            {book.note_generale > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full backdrop-blur-sm bg-black/70 border border-white/20">
                <Star className="w-2.5 h-2.5 fill-current text-yellow-400" />
                <span className="text-xs text-white font-semibold">
                  {book.note_generale}
                </span>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="p-3">
            <h3 className="text-foreground font-semibold text-sm line-clamp-2 mb-1 leading-tight">
              {book.titre}
            </h3>

            <p className="text-foreground/70 text-xs mb-2">
              {book.auteur}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-foreground/50 text-xs">
                {new Date(book.date_creation).toLocaleDateString("fr-FR", {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
              <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity duration-200 text-primary" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function BooksSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="rounded-xl overflow-hidden bg-card/60 backdrop-blur-xl border border-border shadow-md">
            <div className="aspect-[2/3] bg-muted"></div>
            <div className="p-3">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted/70 rounded mb-2 w-2/3"></div>
              <div className="h-3 bg-muted/70 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LatestAdditions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['homepage-data'],
    queryFn: async () => {
      const response = await apiClient.get('/api/public/homepage');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const recentBooks = data?.recent_books?.slice(0, 4) || [];

  // Ne rien afficher si pas de livres
  if (!isLoading && recentBooks.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-primary" />
            <h2
              className="text-xl sm:text-2xl font-bold text-foreground"
              style={{
                fontFamily: 'Playfair Display, serif'
              }}
            >
              Fraîchement arrivés
            </h2>
          </div>
          <p
            className="text-foreground/70"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: "1.1rem",
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: "1.6"
            }}
          >
            Les derniers livres ajoutés au sanctuaire
          </p>
        </motion.div>

        {/* Books Grid */}
        {isLoading ? (
          <BooksSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {recentBooks.map((book: Book, index: number) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
        )}

        {/* CTA */}
        {!isLoading && recentBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <Link
              href="/books?sort=recent"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: "1rem",
                fontWeight: 600,
                boxShadow: "0 8px 25px rgba(139, 21, 56, 0.3)",
              }}
            >
              Découvrir tout le catalogue
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
