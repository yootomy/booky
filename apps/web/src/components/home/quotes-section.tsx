'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Heart, BookOpen, Sparkles } from 'lucide-react';
import { useFeaturedQuote, usePersonalizedBooks } from '@/hooks/use-home-data';

export function QuotesSection() {
  const { data: featuredQuote, isLoading: quoteLoading } = useFeaturedQuote();
  const { data: personalizedBooks = [], isLoading: booksLoading } = usePersonalizedBooks();
  
  // Trouver un livre avec "pourquoi_aimer" rempli
  const bookWithReason = personalizedBooks.find((book: any) => book.pourquoi_aimer);

  return (
    <section className="bg-gradient-to-br from-purple-50 to-rose-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl font-bold text-gray-800 mb-4">
            Citations & Coups de Cœur
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Les mots qui vous ont touchés et les raisons qui font battre votre cœur de lectrice
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Citation du Cœur */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white rounded-xl p-6 border border-purple-200 hover:border-purple-400 transition-all shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                <Quote size={20} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-gray-800">
                Citation du Cœur
              </h3>
            </div>

            {quoteLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mt-4"></div>
              </div>
            ) : featuredQuote ? (
              <div>
                <blockquote className="text-gray-700 text-lg italic leading-relaxed mb-4 font-serif">
                  "{featuredQuote.text}"
                </blockquote>
                <cite className="text-gray-600 text-sm font-medium flex items-center gap-2">
                  <BookOpen size={14} />
                  <span>{featuredQuote.bookTitle}</span>
                  <span className="text-gray-400">—</span>
                  <span>{featuredQuote.author}</span>
                </cite>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Quote size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-2">Aucune citation favorite trouvée</p>
                <p className="text-sm">Ajoutez des citations à vos livres pour les voir ici</p>
              </div>
            )}
          </motion.div>

          {/* Pourquoi Vous Allez L'aimer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="bg-white rounded-xl p-6 border border-rose-200 hover:border-rose-400 transition-all shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <Heart size={20} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-gray-800">
                Pourquoi Vous Allez L'aimer
              </h3>
            </div>

            {booksLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mt-4"></div>
              </div>
            ) : bookWithReason ? (
              <div>
                <p className="text-gray-700 text-lg leading-relaxed mb-4">
                  {bookWithReason.pourquoi_aimer}
                </p>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <BookOpen size={14} />
                  <span className="font-medium">{bookWithReason.titre}</span>
                  <span className="text-gray-400">—</span>
                  <span>{bookWithReason.auteur}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-2">Aucune raison d"aimer trouvée</p>
                <p className="text-sm">Partagez vos coups de cœur pour les voir ici</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mt-8 space-x-4"
        >
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all">
            Découvrir Plus de Citations
          </button>
          <button className="px-6 py-3 border border-rose-500 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
            Partager Mon Avis
          </button>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-10 right-10 text-purple-200 opacity-20"
          >
            <Quote size={64} />
          </motion.div>
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-10 left-10 text-rose-200 opacity-20"
          >
            <Heart size={56} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}