'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Tag, Star, Heart, TrendingUp } from 'lucide-react';
import { useTrustStats } from '@/hooks/use-trust-stats';

interface TrustStats {
  total_books: number;
  unique_authors: number;
  total_genres: number;
  excellent_books_percentage: number;
  total_favorites: number;
  active_readers: number;
}

interface TrustStatsProps {}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  index, 
  color = '#8B1538',
  suffix = '' 
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string; 
  index: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group text-center"
    >
      <div 
        className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 21, 56, 0.1)',
          boxShadow: '0 4px 20px rgba(139, 21, 56, 0.05)'
        }}
      >
        {/* Icon */}
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${color}15`,
            color: color
          }}
        >
          <Icon className="w-8 h-8" />
        </div>

        {/* Value */}
        <div 
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: 'Playfair Display, serif',
            color: color
          }}
        >
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
        </div>

        {/* Label */}
        <div 
          className="text-sm opacity-75 leading-relaxed"
          style={{
            fontFamily: 'Inter, sans-serif',
            color: '#2C1810'
          }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function StatSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="text-center"
    >
      <div 
        className="p-6 rounded-2xl animate-pulse"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(139, 21, 56, 0.05)'
        }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200"></div>
        <div className="h-8 bg-gray-200 rounded mb-2 w-16 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
      </div>
    </motion.div>
  );
}

export function TrustStats({}: TrustStatsProps) {
  const { data: stats, isLoading, error } = useTrustStats();
  // Ne rien afficher si pas de données et pas en loading
  if (!stats && !isLoading) {
    return null;
  }

  // Utiliser les stats réelles uniquement
  const displayStats = stats || {
    total_books: 0,
    unique_authors: 0,
    total_genres: 0,
    excellent_books_percentage: 0,
    total_favorites: 0,
    active_readers: 0
  };

  const statsConfig = [
    {
      icon: BookOpen,
      value: displayStats.total_books,
      label: 'Livres dans notre sanctuaire',
      color: '#8B1538'
    },
    {
      icon: Users,
      value: displayStats.unique_authors,
      label: 'Auteurs qui nous hantent',
      color: '#6B4C7B'
    },
    {
      icon: Tag,
      value: displayStats.total_genres,
      label: 'Nuances d\'ombre & de désir',
      color: '#B8860B'
    },
    {
      icon: Star,
      value: displayStats.excellent_books_percentage,
      label: 'des livres notés ≥ 8/10',
      color: '#059669',
      suffix: '%'
    },
    {
      icon: Heart,
      value: displayStats.total_favorites,
      label: 'Coups de cœur partagés',
      color: '#DC2626'
    },
    {
      icon: TrendingUp,
      value: displayStats.active_readers,
      label: 'Âmes complices ce mois-ci',
      color: '#7C2D12'
    }
  ];

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
            Notre univers en chiffres
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            La passion partagée par une communauté grandissante
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {statsConfig.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              index={index}
              color={stat.color}
              suffix={stat.suffix}
            />
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-center"
        >
          <div 
            className="max-w-2xl mx-auto p-8 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.05) 0%, rgba(107, 76, 123, 0.05) 100%)',
              border: '1px solid rgba(139, 21, 56, 0.1)'
            }}
          >
            <h3 
              className="text-2xl font-bold mb-4"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
            >
              Rejoignez notre cercle intime
            </h3>
            
            <p 
              className="text-lg opacity-75 mb-6"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810'
              }}
            >
              Une sélection sombre & lumineuse, une fois par mois. Zéro spam.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="votre.email@secret.com"
                className="flex-1 px-6 py-3 rounded-full border-2 transition-all duration-300 focus:outline-none focus:scale-[1.02]"
                style={{
                  borderColor: 'rgba(139, 21, 56, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#2C1810',
                  fontFamily: 'Inter, sans-serif'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8B1538'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(139, 21, 56, 0.2)'}
              />
              
              <button
                className="px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  background: 'linear-gradient(135deg, #8B1538, #6B4C7B)',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                S'abonner
              </button>
            </div>

            <div className="flex justify-center items-center gap-6 mt-6 text-xs opacity-60">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" style={{ color: '#8B1538' }} />
                <span style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}>
                  Gratuit toujours
                </span>
              </div>
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#2C1810' }}></div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" style={{ color: '#6B4C7B' }} />
                <span style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}>
                  Désabonnement facile
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}