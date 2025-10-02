'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Quote, BookOpen, Heart } from 'lucide-react';
import { useHauntingQuotes } from '@/hooks/use-haunting-quotes';

interface HauntingQuote {
  id: string;
  text: string;
  book_title: string;
  book_author: string;
  book_id: string;
  date_added: string;
}

interface HauntingQuotesProps {}

// Fonction utilitaire pour extraire et tronquer une citation
function extractQuote(citationsText: string) {
  const firstQuote = citationsText.split('\n')[0].trim();
  return firstQuote.length > 160 ? firstQuote.substring(0, 160) + "..." : firstQuote;
}

function QuoteCard({ quote, index }: { quote: HauntingQuote; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group cursor-pointer"
    >
      <Link href={`/books/${quote.book_id}`}>
        <div 
          className="relative p-8 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)",
            backdropFilter: 'blur(10px)",
            border: '1px solid rgba(139, 21, 56, 0.1)',
            boxShadow: "0 8px 32px rgba(139, 21, 56, 0.05)"
          }}
        >
          {/* Decorative quote mark */}
          <div 
            className="absolute top-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
          >
            <Quote className="w-12 h-12" style={{ color: '#8B1538' }} />
          </div>

          {/* Quote text */}
          <blockquote 
            className="text-lg leading-relaxed mb-6 relative z-10 group-hover:text-[#6B4C7B] transition-colors duration-300"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#2C1810',
              fontStyle: "italic"
            }}
          >
            "{extractQuote(quote.text)}"
          </blockquote>

          {/* Book info */}
          <div className="flex items-center gap-3 relative z-10">
            <div 
              className="p-2 rounded-lg transition-all duration-300"
              style={{
                backgroundColor: 'rgba(139, 21, 56, 0.1)',
                color: '#8B1538'
              }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            
            <div>
              <div 
                className="font-semibold text-sm group-hover:text-[#8B1538] transition-colors duration-300"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#2C1810'
                }}
              >
                {quote.book_title}
              </div>
              <div 
                className="text-xs opacity-75"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#2C1810'
                }}
              >
                {quote.book_author}
              </div>
            </div>
          </div>

          {/* Hover effect */}
          <div 
            className="absolute bottom-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
            style={{
              background: 'radial-gradient(circle, #8B1538 0%, transparent 70%)',
              transform: "translate(50%, 50%)"
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

export function HauntingQuotes({}: HauntingQuotesProps) {
  const { data: quotes, isLoading, error } = useHauntingQuotes();

  // Ne rien afficher si pas de données
  if (quotes.length === 0 && !isLoading) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#FAF8F5" }}>
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
            Mots qui mordent
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Les phrases qui vous habitent encore
          </p>
        </motion.div>

        {/* Quotes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {quotes.slice(0, 6).map((quote, index) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              index={index}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <Link
            href={"/quotes" as any}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg group focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'rgba(139, 21, 56, 0.08)',
              color: '#8B1538',
              border: '1px solid rgba(139, 21, 56, 0.2)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
            }}
          >
            <Quote className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Découvrir plus de citations
            <Heart className="w-5 h-5 group-hover:fill-current transition-all" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}