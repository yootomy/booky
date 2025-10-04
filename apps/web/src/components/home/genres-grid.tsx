'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Folder, TrendingUp, Hash } from 'lucide-react';
import { usePopularCategories } from '@/hooks/use-home-data';

interface GenreTileProps {
  genre: {
    id: string;
    nom: string;
    couleur?: string;
    utilisation_count?: number;
  };
  index: number;
}

function GenreTile({ genre, index }: GenreTileProps) {
  const colors = [
    'from-violet-600 to-violet-500',
    'from-crimson-600 to-crimson-500', 
    'from-blue-600 to-blue-500',
    'from-emerald-600 to-emerald-500',
    'from-orange-600 to-orange-500',
    'from-pink-600 to-pink-500',
    'from-indigo-600 to-indigo-500',
    'from-teal-600 to-teal-500'
  ];

  const colorClass = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`relative group cursor-pointer rounded-xl p-6 bg-gradient-to-br ${colorClass} hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
    >
      {/* Content */}
      <div className="relative z-10 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Hash size={20} />
          </div>
          {genre.utilisation_count && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {genre.utilisation_count}
            </span>
          )}
        </div>
        
        <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-2">
          {genre.nom}
        </h3>

        <p className="text-white/80 text-sm">
          {genre.utilisation_count ? `${genre.utilisation_count} livres` : "Genre populaire"}
        </p>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
      
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform" />
    </motion.div>
  );
}

function CategoryTile({ category, index }: { category: any; index: number }) {
  const colors = [
    'from-gray-500 to-gray-400',
    'from-slate-600 to-slate-500',
    'from-purple-600 to-purple-500',
    'from-rose-600 to-rose-500'
  ];

  const colorClass = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index + 4) * 0.1, duration: 0.3 }}
      className={`relative group cursor-pointer rounded-xl p-6 bg-gradient-to-br ${colorClass} hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
    >
      <div className="relative z-10 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Folder size={20} />
          </div>
          {category._count?.book_category && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {category._count.book_category}
            </span>
          )}
        </div>
        
        <h3 className="font-serif text-lg font-semibold mb-1">
          {category.nom}
        </h3>

        <p className="text-white/80 text-sm">
          {category._count?.book_category ? `${category._count.book_category} livres` : "Catégorie"}
        </p>
      </div>

      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
    </motion.div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
  );
}

export function GenresGrid() {
  const { data: categories = [], isLoading, error } = usePopularCategories();

  if (error) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center text-gray-500">
            <Palette size={48} className="mx-auto mb-4 opacity-50" />
            <p>Impossible de charger les genres et catégories</p>
          </div>
        </div>
      </section>
    );
  }

  // Simuler des genres populaires pour la démo
  const mockGenres = [
    { id: "1", nom: "Dark Romance", utilisation_count: 15 },
    { id: "2", nom: 'Fantasy Romance', utilisation_count: 12 },
    { id: '3', nom: 'Contemporary', utilisation_count: 10 },
    { id: '4', nom: 'Paranormal', utilisation_count: 8 },
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl font-bold text-gray-800 mb-4">
            Genres & Catégories
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explorez votre bibliothèque par thème et découvrez vos univers préférés
          </p>
        </motion.div>

        {isLoading ? (
          <GridSkeleton />
        ) : (
          <div className="space-y-8">
            {/* Genres Grid */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Palette size={20} className="text-purple-600" />
                <h3 className="font-serif text-xl font-semibold text-gray-800">
                  Genres Favoris
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockGenres.map((genre, index) => (
                  <GenreTile key={genre.id} genre={genre} index={index} />
                ))}
              </div>
            </div>

            {/* Categories Grid */}
            {categories.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Folder size={20} className="text-rose-600" />
                  <h3 className="font-serif text-xl font-semibold text-gray-800">
                    Catégories Populaires
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.slice(0, 4).map((category: any, index: number) => (
                    <CategoryTile key={category.id} category={category} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-center mt-12 space-x-4"
        >
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all">
            Parcourir Tous les Genres
          </button>
          <button className="px-6 py-3 border border-rose-500 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
            Gérer Mes Catégories
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="text-center mt-8"
        >
          <div className="flex justify-center items-center gap-6 text-gray-500">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} />
              <span className="text-sm">{mockGenres.length} genres explorés</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Folder size={16} />
              <span className="text-sm">{categories.length} catégories actives</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}