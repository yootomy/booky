'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, BookOpen, Heart, Award } from 'lucide-react';
import { useAuthorsSpotlight } from '@/hooks/use-authors-spotlight';

interface Author {
  nom: string;
  slug: string;
  livres_count: number;
  note_moyenne: number;
  livre_phare: {
    id: string;
    titre: string;
    image_couverture?: string;
    note_generale: number;
  };
  tagline: string;
  dominant_tags: string[];
}

interface AuthorsSpotlightProps {}

function AuthorCard({ author, index }: { author: Author; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <Link href={'/authors/${author.slug}' as any}>
        <div 
          className="relative p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(139, 21, 56, 0.1)",
            boxShadow: "0 8px 32px rgba(139, 21, 56, 0.05)"
          }}
        >
          {/* Decorative element */}
          <div 
            className="absolute top-0 right-0 w-20 h-20 opacity-5"
            style={{
              background: 'radial-gradient(circle, #8B1538 0%, transparent 70%)',
              transform: "translate(30%, -30%)"
            }}
          />

          <div className="relative">
            {/* Author name */}
            <h3 
              className="text-xl font-bold mb-2 group-hover:text-[#8B1538] transition-colors duration-300"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
            >
              {author.nom}
            </h3>

            {/* Tagline */}
            <p 
              className="text-sm italic mb-4 opacity-80"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#6B4C7B'
              }}
            >
              {author.tagline}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" style={{ color: "#8B1538" }} />
                <span className="text-sm font-medium" style={{ color: "#2C1810" }}>
                  {author.livres_count} livre{author.livres_count > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" style={{ color: '#B8860B' }} />
                <span className="text-sm font-medium" style={{ color: "#2C1810" }}>
                  {author.note_moyenne.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Livre phare */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
              <div className="w-12 h-16 relative flex-shrink-0">
                <Image
                  src={author.livre_phare.image_couverture || '/placeholder-book.svg'}
                  alt={`Couverture de ${author.livre_phare.titre}`}
                  fill
                  className="object-cover rounded"
                  sizes="48px"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold mb-1 truncate"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    color: '#2C1810'
                  }}
                >
                  Son livre phare :
                </p>
                <p 
                  className="text-sm font-bold truncate"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    color: '#8B1538'
                  }}
                  title={author.livre_phare.titre}
                >
                  {author.livre_phare.titre}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-current" style={{ color: "#B8860B" }} />
                  <span className="text-xs" style={{ color: "#6B7280" }}>
                    {author.livre_phare.note_generale}/10
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 text-center">
              <span 
                className="text-sm font-semibold group-hover:text-[#8B1538] transition-colors duration-300"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#6B4C7B'
                }}
              >
                Voir tous ses livres →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function AuthorSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="p-6 rounded-2xl animate-pulse"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        border: "1px solid rgba(139, 21, 56, 0.05)"
      }}
    >
      <div className="h-6 bg-gray-200 rounded mb-2 w-32"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-48"></div>
      <div className="flex gap-4 mb-4">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
        <div className="w-12 h-16 bg-gray-200 rounded"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded mb-1 w-20"></div>
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </motion.div>
  );
}

export function AuthorsSpotlight({}: AuthorsSpotlightProps) {
  const { data: authors, isLoading, error } = useAuthorsSpotlight();

  // Ne rien afficher si pas de données
  if (authors.length === 0 && !isLoading) {
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
            Ces auteurs qui laissent des cicatrices
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Plumes qui marquent, histoires qui restent
          </p>
        </motion.div>

        {/* Authors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {authors.map((author, index) => (
            <AuthorCard
              key={author.slug}
              author={author}
              index={index}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Link
            href={"/authors" as any}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'rgba(139, 21, 56, 0.08)',
              color: '#8B1538',
              border: '1px solid rgba(139, 21, 56, 0.2)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <Award className="w-4 h-4" />
            Découvrir tous nos auteurs
          </Link>
        </motion.div>
      </div>
    </section>
  );
}