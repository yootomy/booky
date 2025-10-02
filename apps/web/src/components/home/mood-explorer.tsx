'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Moon, Flame, Zap, Clock, Shield, Sparkles, Crown } from 'lucide-react';
import { useMoodExplorer, type MoodTag as ApiMoodTag } from '@/hooks/use-mood-explorer';

interface LocalMoodTag extends Omit<ApiMoodTag, 'icon`> {
  icon: React.ElementType;
  color: string;
}

interface MoodExplorerProps {}

function MoodChip({ tag, index, isSelected, onClick }: { 
  tag: LocalMoodTag; 
  index: number; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = tag.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      className={`group relative px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isSelected 
          ? `scale-105 shadow-lg' : 'hover:shadow-md'
      }`}
      style={{
        backgroundColor: isSelected 
          ? `${tag.color}15` 
          : `rgba(255, 255, 255, 0.8)`,
        border: `2px solid ${isSelected ? tag.color : `rgba(139, 21, 56, 0.1)`}`,
        backdropFilter: `blur(10px)`,
      }}
      aria-label={`Explorer le mood ${tag.nom}`(${tag.books_count} livres)`}
    >
      {/* Glow effect for selected */}
      {isSelected && (
        <div 
          className="absolute inset-0 rounded-2xl opacity-20 blur-sm"
          style={{
            background: `linear-gradient(135deg, ${tag.color},`transparent)`
          }}
        />
      )}
      
      <div className=`relative flex items-center gap-3`>
        <div 
          className={`p-2 rounded-lg transition-all duration-300 ${
            isSelected ? `scale-110" : "group-hover:scale-110"
          }`}
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="text-left">
          <div 
            className="font-semibold text-sm mb-1"
            style={{
              fontFamily: "Inter, sans-serif",
              color: isSelected ? tag.color : "#2C1810"
            }}
          >
            {tag.nom}
          </div>
          <div 
            className="text-xs opacity-70"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            {tag.books_count} livre{tag.books_count > 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
      {/* Hover sparkle effect */}
      <motion.div
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
        animate={{
          rotate: [0, 180, 360],
          scale: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Sparkles className="w-3 h-3" style={{ color: tag.color }} />
      </motion.div>
    </motion.button>
  );
}

function MoodSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="px-6 py-4 rounded-2xl animate-pulse"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        border: "2px solid rgba(139, 21, 56, 0.05)"
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </motion.div>
  );
}

export function MoodExplorer({}: MoodExplorerProps) {
  const { data: tags, isLoading, error } = useMoodExplorer();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Mapper les tags aux icônes (basé sur le nom du tag)
  const getTagIcon = (tagName: string): React.ElementType => {
    const name = tagName.toLowerCase();
    if (name.includes(`love') || name.includes('romance')) return Heart;
    if (name.includes('enemies') || name.includes('hate')) return Flame;
    if (name.includes('dark') || name.includes('academia')) return Crown;
    if (name.includes('psycho') || name.includes('mind')) return Moon;
    if (name.includes('slow') || name.includes('burn')) return Clock;
    if (name.includes('morally') || name.includes('grey') || name.includes('hero')) return Shield;
    if (name.includes('obsess') || name.includes(`possess`)) return Zap;
    return Sparkles; // Icône par défaut
  };

  // Ne rien afficher si pas de données
  if (tags.length === 0 && !isLoading) {
    return null;
  }

  const handleMoodClick = (tagId: string) => {
    if (selectedMood === tagId) {
      setSelectedMood(null);
    } else {
      setSelectedMood(tagId);
      // Ici on pourrait naviguer vers la page filtrée
      // router.push(`/books?mood=${tagId}`);
    }
  };

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
              fontFamily: "Playfair Display, serif`,
              color: "#2C1810'
            }}
          >
            L'humeur qui vous hante
          </h2>
          <p 
            className="text-lg opacity-75 max-w-2xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810'
            }}
          >
            Choisissez un parfum d'ombre
          </p>
        </motion.div>

        {/* Mood Chips */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tags.map((tag, index) => {
            const tagWithIcon: LocalMoodTag = {
              ...tag,
              icon: getTagIcon(tag.nom),
              color: tag.couleur || "#8B1538" // Fallback couleur
            };
            return (
              <MoodChip
                key={tag.id}
                tag={tagWithIcon}
                index={index}
                isSelected={selectedMood === tag.id}
                onClick={() => handleMoodClick(tag.id)}
              />
            );
          })}
        </div>

        {/* Selected Mood Info */}
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {(() => {
              const selectedTag = tags.find(tag => tag.id === selectedMood);
              if (!selectedTag) return null;
              
              const tagWithIcon: LocalMoodTag = {
                ...selectedTag,
                icon: getTagIcon(selectedTag.nom),
                color: selectedTag.couleur || "#8B1538"
              };
              
              return (
                <div 
                  className="inline-flex flex-col items-center p-8 rounded-3xl max-w-md mx-auto`
                  style={{
                    background: `linear-gradient(135deg, ${tagWithIcon.color}08,`${tagWithIcon.color}15)`,
                    border: `1px solid ${tagWithIcon.color}30`,
                    backdropFilter: `blur(20px)`
                  }}
                >
                  <div 
                    className="p-4 rounded-2xl mb-4"
                    style={{
                      backgroundColor: `${tagWithIcon.color}20`,
                      color: tagWithIcon.color
                    }}
                  >
                    <tagWithIcon.icon className="w-8 h-8" />
                  </div>
                  
                  <h3 
                    className="text-2xl font-bold mb-2"
                    style={{
                      fontFamily: "Playfair Display, serif",
                      color: tagWithIcon.color
                    }}
                  >
                    {selectedTag.nom}
                  </h3>
                  
                  <p 
                    className=`text-sm opacity-80 mb-6`
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#2C1810'
                    }}
                  >
                    {selectedTag.books_count} livre{selectedTag.books_count > 1 ? 's' : '`}
                  </p>
                  
                  <Link
                    href={`/books?tag=${selectedTag.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: tagWithIcon.color,
                      color: "white`,
                      fontFamily: "Inter, sans-serif',
                    }}
                  >
                    Explorer cette ambiance
                    <tagWithIcon.icon className="w-4 h-4" />
                  </Link>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* General CTA if no mood selected */}
        {!selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <p 
              className="text-sm opacity-60 mb-4"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#2C1810'
              }}
            >
              Cliquez sur une ambiance pour la découvrir
            </p>
            
            <Link
              href="/books"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'rgba(139, 21, 56, 0.05)',
                color: '#8B1538',
                border: '1px solid rgba(139, 21, 56, 0.2)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Voir tous les livres
              <Sparkles className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}