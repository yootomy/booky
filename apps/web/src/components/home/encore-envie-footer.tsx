'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Tag, Users, Crown, Heart, Sparkles } from 'lucide-react';

interface EncoreEnvieFooterProps {}

const navigationLinks = [
  {
    title: 'Genres',
    description: 'Par atmosphères & univers',
    href: '/books?filter=genre',
    icon: BookOpen,
    color: '#8B1538'
  },
  {
    title: 'Tropes',
    description: 'Vos obsessions favorites',
    href: '/books?filter=trope',
    icon: Tag,
    color: '#6B4C7B'
  },
  {
    title: 'Collections',
    description: 'Sélections éditorialisées',
    href: '/collections',
    icon: Crown,
    color: '#B8860B'
  },
  {
    title: 'Auteurs',
    description: 'Plumes qui marquent',
    href: '/authors',
    icon: Users,
    color: '#059669'
  },
  {
    title: 'Favoris',
    description: 'Coups de cœur partagés',
    href: '/books?sort=favorites',
    icon: Heart,
    color: '#DC2626'
  },
  {
    title: 'Questions',
    description: 'Débats & échanges',
    href: '/questions',
    icon: Sparkles,
    color: '#7C2D12'
  }
];

function NavigationCard({ link, index }: { link: typeof navigationLinks[0]; index: number }) {
  const Icon = link.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group"
    >
      <Link href={link.href as any}>
        <div 
          className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(250, 248, 245, 0.6) 100%)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${link.color}20`
          }}
        >
          {/* Icon */}
          <div 
            className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${link.color}15`,
              color: link.color
            }}
          >
            <Icon className="w-6 h-6" />
          </div>

          {/* Title */}
          <h3 
            className="font-bold text-lg mb-2 group-hover:text-[#8B1538] transition-colors duration-300"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#2C1810'
            }}
          >
            {link.title}
          </h3>

          {/* Description */}
          <p 
            className="text-sm opacity-75"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            {link.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function EncoreEnvieFooter({}: EncoreEnvieFooterProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#2C1810'
            }}
          >
            Encore envie ?
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Explorez notre univers par toutes ses facettes
          </p>
        </motion.div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {navigationLinks.map((link, index) => (
            <NavigationCard key={link.title} link={link} index={index} />
          ))}
        </div>

        {/* Divider */}
        <div 
          className="h-px w-full mb-8 opacity-20"
          style={{ backgroundColor: '#2C1810' }}
        />

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap justify-center items-center gap-6 text-sm"
        >
          <Link
            href={"/about" as any}
            className="transition-colors duration-300 hover:text-[#8B1538]"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#6B4C7B'
            }}
          >
            À propos
          </Link>
          
          <div 
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: '#6B4C7B' }}
          />
          
          <Link
            href={"/contact" as any}
            className="transition-colors duration-300 hover:text-[#8B1538]"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#6B4C7B'
            }}
          >
            Contact
          </Link>
          
          <div 
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: '#6B4C7B' }}
          />
          
          <Link
            href={"/privacy" as any}
            className="transition-colors duration-300 hover:text-[#8B1538]"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#6B4C7B'
            }}
          >
            Confidentialité
          </Link>
          
          <div 
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: '#6B4C7B' }}
          />
          
          <Link
            href={"/help" as any}
            className="transition-colors duration-300 hover:text-[#8B1538]"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#6B4C7B'
            }}
          >
            Aide
          </Link>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-8"
        >
          <p 
            className="text-xs opacity-50"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            © 2024 Booky — Bibliothèque Romance secrète de Bruna
          </p>
        </motion.div>
      </div>
    </section>
  );
}