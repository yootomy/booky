'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Zap, Moon, Heart, Clock, Star, ArrowRight } from 'lucide-react';
import { usePlaylistsIndociles } from '@/hooks/use-playlists-indociles';

interface Playlist {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  books: {
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    note_generale: number;
  }[];
  total_count: number;
}

interface PlaylistsIndocilesProps {}

function PlaylistCard({ playlist, index }: { playlist: Playlist; index: number }) {
  const Icon = playlist.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <Link href={`/books?playlist=${playlist.id}`}>
        <div 
          className="relative p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${playlist.color}20`,
            boxShadow: `0 8px 32px ${playlist.color}08`
          }}
        >
          {/* Decorative background */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 opacity-5"
            style={{
              background: `radial-gradient(circle, ${playlist.color} 0%, transparent 70%)`
            }}
          />

          {/* Header */}
          <div className="relative mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: `${playlist.color}15`,
                  color: playlist.color
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              
              <div>
                <h3 
                  className="text-xl font-bold group-hover:text-[#8B1538] transition-colors duration-300"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    color: '#2C1810'
                  }}
                >
                  {playlist.title}
                </h3>
                <p 
                  className="text-sm opacity-70"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    color: '#2C1810'
                  }}
                >
                  {playlist.total_count} livre{playlist.total_count > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <p 
              className="text-sm leading-relaxed opacity-80"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#6B4C7B'
              }}
            >
              {playlist.description}
            </p>
          </div>

          {/* Books preview */}
          <div className="flex -space-x-2 mb-4">
            {playlist.books.slice(0, 4).map((book, bookIndex) => (
              <div 
                key={book.id} 
                className="relative w-12 h-16 rounded border-2 border-white shadow-sm"
                style={{ zIndex: 4 - bookIndex }}
              >
                <Image
                  src={book.image_couverture || '/placeholder-book.svg'}
                  alt={`Couverture de ${book.titre}`}
                  fill
                  className="object-cover rounded"
                  sizes="48px"
                />
              </div>
            ))}
            
            {playlist.total_count > 4 && (
              <div 
                className="w-12 h-16 rounded flex items-center justify-center text-xs font-bold border-2 border-white"
                style={{
                  backgroundColor: `${playlist.color}20`,
                  color: playlist.color
                }}
              >
                +{playlist.total_count - 4}
              </div>
            )}
          </div>

          {/* Featured books titles */}
          <div className="space-y-1 mb-4">
            {playlist.books.slice(0, 3).map((book) => (
              <div key={book.id} className="flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-400 fill-current flex-shrink-0" />
                <p 
                  className="text-xs truncate"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    color: '#2C1810'
                  }}
                  title={`${book.titre} - ${book.auteur}`}
                >
                  <span className="font-medium">{book.titre}</span>
                  <span className="opacity-70"> • {book.auteur}</span>
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm font-semibold group-hover:text-[#8B1538] transition-colors duration-300"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: playlist.color
              }}
            >
              Explorer cette sélection
            </span>
            <ArrowRight 
              className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" 
              style={{ color: playlist.color }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PlaylistSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="p-6 rounded-2xl animate-pulse"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        border: '1px solid rgba(139, 21, 56, 0.05)'
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        <div>
          <div className="h-5 bg-gray-200 rounded mb-1 w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-12 h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="space-y-1 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
        ))}
      </div>
    </motion.div>
  );
}

export function PlaylistsIndociles({}: PlaylistsIndocilesProps) {
  const { data: playlists, isLoading, error } = usePlaylistsIndociles();

  // Ne rien afficher si pas de données
  if (playlists.length === 0 && !isLoading) {
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <PlaylistSkeleton key={index} index={index} />
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
          <h2 
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#2C1810'
            }}
          >
            Playlists pour cœurs indociles
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Sélections algorithmiques pour toutes vos humeurs
          </p>
        </motion.div>

        {/* Playlists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {playlists.map((playlist, index) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              index={index}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p 
            className="text-sm opacity-60"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Sélections mises à jour automatiquement selon vos préférences
          </p>
        </motion.div>
      </div>
    </section>
  );
}