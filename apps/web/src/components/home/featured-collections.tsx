'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Heart } from 'lucide-react';
import { useFeaturedCollections } from '@/hooks/use-featured-collections';

interface Collection {
  id: string;
  nom: string;
  description?: string;
  books: {
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    note_generale: number;
  }[];
}

interface FeaturedCollectionsProps {}

function CollectionCard({ collection, index }: { collection: Collection; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <Link href={'/collections/${collection.id}' as any}>
        <div
          className="relative rounded-2xl p-8 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(139, 21, 56, 0.1)",
            boxShadow: "0 8px 32px rgba(139, 21, 56, 0.08)"
          }}
        >
          {/* Decorative background element */}
          <div 
            className="absolute top-0 right-0 w-24 h-24 opacity-5"
            style={{
              background: 'radial-gradient(circle, #8B1538 0%, transparent 70%)',
              transform: "translate(50%, -50%)"
            }}
          />
          
          {/* Header */}
          <div className="relative mb-6">
            <h3 
              className="text-2xl font-bold mb-2 group-hover:text-[#8B1538] transition-colors duration-300"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
            >
              {collection.nom}
            </h3>
            {collection.description && (
              <p 
                className="text-sm opacity-75 leading-relaxed"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#2C1810'
                }}
              >
                {collection.description}
              </p>
            )}
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {collection.books.slice(0, 4).map((book, bookIndex) => (
              <div
                key={book.id}
                className="aspect-[3/4] relative rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300"
                style={{ transitionDelay: '${bookIndex * 50}ms' }}
              >
                {book.image_couverture ? (
                  <Image
                    src={book.image_couverture}
                    alt={'Couverture de ${book.titre}'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #6B4C7B, #8B1538)",
                    }}
                  >
                    <BookOpen className="w-4 h-4 text-white/70" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm font-medium opacity-60"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810'
              }}
            >
              {collection.books.length} livre{collection.books.length > 1 ? 's' : ''}
            </span>
            
            <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300" style={{ color: '#8B1538' }}>
              Voir la collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CollectionSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="rounded-2xl p-8"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        border: "1px solid rgba(139, 21, 56, 0.05)"
      }}
    >
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg mb-3 w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded-lg mb-6 w-full"></div>
        
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedCollections({}: FeaturedCollectionsProps) {
  const { data: collections, isLoading, error } = useFeaturedCollections();
  // Debug: affichons toujours quelque chose pour tester
  console.log("FeaturedCollections: ", { collections, isLoading, error });
  
  // Ne rien afficher s'il n'y a pas de données
  if (collections.length === 0 && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#FAF8F5" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <CollectionSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </section>
    );
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
            Nos obsessions du moment
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Trois portes, mille tentations
          </p>
        </motion.div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.slice(0, 3).map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              index={index}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href={"/collections" as any}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg group focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'rgba(139, 21, 56, 0.08)',
              color: '#8B1538',
              border: '1px solid rgba(139, 21, 56, 0.2)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
            }}
          >
            <Heart className="w-5 h-5 group-hover:fill-current transition-all" />
            Découvrir toutes nos collections
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}