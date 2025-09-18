'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, BookOpen, Clock, Star, ArrowRight, Sparkles } from 'lucide-react';
import { usePersonalizedSection } from '@/hooks/use-personalized-section';

interface PersonalizedBook {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  statut?: 'LU' | 'EN_COURS' | 'A_LIRE';
  progress?: number;
  date_modification?: string;
}

interface PersonalizedSectionProps {}

function BookCard({ book, variant }: { book: PersonalizedBook; variant: 'suggestion' | 'current' | 'next' }) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'suggestion':
        return {
          borderColor: 'rgba(139, 21, 56, 0.2)',
          bgGradient: 'from-pink-50 to-rose-50'
        };
      case 'current':
        return {
          borderColor: 'rgba(249, 115, 22, 0.2)',
          bgGradient: 'from-orange-50 to-amber-50'
        };
      case 'next':
        return {
          borderColor: 'rgba(59, 130, 246, 0.2)',
          bgGradient: 'from-blue-50 to-indigo-50'
        };
    }
  };

  const style = getVariantStyle();

  return (
    <div className="group cursor-pointer">
      <Link href={`/books/${book.id}`}>
        <div className="flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border bg-gradient-to-r"
             style={{ 
               borderColor: style.borderColor,
               background: `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)`
             }}>
          
          <div className="w-12 h-16 relative flex-shrink-0">
            <Image
              src={book.image_couverture || '/placeholder-book.svg'}
              alt={`Couverture de ${book.titre}`}
              fill
              className="object-cover rounded"
              sizes="48px"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 
              className="font-semibold text-sm mb-1 truncate group-hover:text-[#8B1538] transition-colors"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
              title={book.titre}
            >
              {book.titre}
            </h4>
            
            <p 
              className="text-xs opacity-70 truncate mb-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810'
              }}
            >
              {book.auteur}
            </p>

            <div className="flex items-center gap-2">
              {book.note_generale > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs font-medium" style={{ color: '#2C1810' }}>
                    {book.note_generale}/10
                  </span>
                </div>
              )}
              
              {book.statut && (
                <div className="text-xs px-2 py-1 rounded-full"
                     style={{
                       backgroundColor: book.statut === 'EN_COURS' ? '#FEF3C7' : 
                                      book.statut === 'LU' ? '#D1FAE5' : '#DBEAFE',
                       color: book.statut === 'EN_COURS' ? '#92400E' :
                             book.statut === 'LU' ? '#065F46' : '#1E40AF'
                     }}>
                  {book.statut === 'EN_COURS' ? 'En cours' :
                   book.statut === 'LU' ? 'Lu' : 'À lire'}
                </div>
              )}
            </div>
          </div>

          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                     style={{ color: '#8B1538' }} />
        </div>
      </Link>
    </div>
  );
}

function PersonalizedSubSection({ 
  title, 
  books, 
  variant, 
  emptyMessage,
  cta
}: { 
  title: string;
  books: PersonalizedBook[];
  variant: 'suggestion' | 'current' | 'next';
  emptyMessage: string;
  cta?: { text: string; href: string };
}) {
  if (books.length === 0) {
    return (
      <div className="text-center p-8 rounded-xl bg-white/30 backdrop-blur-sm border border-gray-100">
        <p 
          className="text-sm opacity-60 mb-4"
          style={{
            fontFamily: 'Inter, sans-serif',
            color: '#2C1810'
          }}
        >
          {emptyMessage}
        </p>
        {cta && (
          <Link
            href={cta.href as any}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'rgba(139, 21, 56, 0.08)',
              color: '#8B1538',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {cta.text}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 
        className="text-xl font-bold mb-4"
        style={{
          fontFamily: 'Playfair Display, serif',
          color: '#2C1810'
        }}
      >
        {title}
      </h3>
      
      <div className="space-y-3">
        {books.slice(0, 3).map((book) => (
          <BookCard key={book.id} book={book} variant={variant} />
        ))}
      </div>
      
      {books.length > 3 && (
        <div className="mt-4 text-center">
          <Link
            href={`/dashboard/books?filter=${variant}` as any}
            className="text-sm font-medium hover:text-[#8B1538] transition-colors"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#6B4C7B'
            }}
          >
            Voir tout ({books.length})
          </Link>
        </div>
      )}
    </div>
  );
}

export function PersonalizedSection({}: PersonalizedSectionProps) {
  const { data, isLoading, error, isAuthenticated } = usePersonalizedSection();

  // Ne rien afficher si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null;
  }

  // Ne rien afficher si pas de données personnalisées
  if (!isLoading && (!data.suggestions.length && !data.currentReading.length && !data.toReadNext.length)) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-gray-100 rounded-xl animate-pulse">
                      <div className="w-12 h-16 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6" style={{ color: '#8B1538' }} />
            <h2 
              className="text-4xl font-bold"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
            >
              Vos lectures personnelles
            </h2>
            <Sparkles className="w-6 h-6" style={{ color: '#8B1538' }} />
          </div>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Suggestions sur-mesure et suivi de vos lectures
          </p>
        </motion.div>

        {/* Personalized Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Suggestions basées sur les favoris */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <PersonalizedSubSection
              title="Parce que vous avez aimé"
              books={data.suggestions}
              variant="suggestion"
              emptyMessage="Ajoutez quelques favoris pour recevoir des suggestions personnalisées"
              cta={{ text: "Découvrir des livres", href: "/books" }}
            />
          </motion.div>

          {/* Lectures en cours */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PersonalizedSubSection
              title="Poursuivre votre lecture"
              books={data.currentReading}
              variant="current"
              emptyMessage="Aucune lecture en cours pour le moment"
              cta={{ text: "Commencer un livre", href: "/books" }}
            />
          </motion.div>

          {/* À lire ensuite */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <PersonalizedSubSection
              title="À lire ensuite"
              books={data.toReadNext}
              variant="next"
              emptyMessage="Votre liste de lecture est vide"
              cta={{ text: "Ajouter des livres", href: "/books" }}
            />
          </motion.div>
        </div>

        {/* Dashboard CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: 'linear-gradient(135deg, #8B1538, #6B4C7B)',
              color: 'white',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <BookOpen className="w-5 h-5" />
            Gérer ma bibliothèque
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}