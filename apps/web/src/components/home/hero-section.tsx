'use client';

import React, { useState } from 'react';
import { Heart, Feather, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRandomPick } from '@/hooks/use-random-pick';
import { useAuth } from '@/contexts/AuthContext';
import { ConseilRequestModal } from '@/components/conseil/ConseilRequestModal';
import StarBorder from '@/components/ui/star-border';

export function HeroSection() {
  const { user } = useAuth();
  const { pickRandom } = useRandomPick();
  const [showConseilModal, setShowConseilModal] = useState(false);

  // Toujours afficher "Bruna" - c'est sa bibliothèque
  const libraryOwner = 'Bruna';


  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background transition-colors duration-300">
      {/* Background Image with sophisticated overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{
          backgroundImage: 'url(\'/images/hero.png\')',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          filter: 'brightness(1.1) contrast(1.05)'
        }}
      />

      {/* Elegant centered overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-background/25 to-background/50" />


      {/* Content - Centered composition */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Elegant subtitle first */}
          <p
            className="mb-4 text-foreground/70 tracking-wide"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            Bibliothèque Dark Romance
          </p>

          {/* Main Title - Elegant serif with crimson accent */}
          <h1
            className="mb-6 text-foreground font-bold"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              lineHeight: '1.1',
              fontWeight: 700
            }}
          >
            Collection{' '}
            <span
              className="block mt-2 text-foreground"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
              }}
            >
              de {libraryOwner}
            </span>
          </h1>

          {/* Descriptive text */}
          <p
            className="mb-10 leading-relaxed max-w-2xl mx-auto text-foreground/80"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
              lineHeight: '1.7',
              fontStyle: 'italic'
            }}
          >
            « Explorez un univers de passion et de mystère, où chaque page révèle des émotions intenses entre ombre et lumière. »
          </p>

        </motion.div>

        {/* Action Buttons - Elegant and refined */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Primary CTA - Classic romantic style */}
          <button
            onClick={() => window.location.href = '/books'}
            className="group px-8 py-4 sm:px-10 sm:py-5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
              color: 'white',
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
              fontWeight: 600,
              fontStyle: 'italic',
              boxShadow: '0 10px 30px rgba(139, 21, 56, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(139, 21, 56, 0.4)';
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 21, 56, 0.3)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Découvrir mes lectures
          </button>

          {/* Surprise link - Simple golden text */}
          <button
            onClick={() => setShowConseilModal(true)}
            className="group transition-all duration-300 hover:scale-105 focus:outline-none"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              className="group-hover:underline transition-all duration-300"
              style={{
                color: '#D4AF37',
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                fontWeight: 500,
                fontStyle: 'italic',
              }}
            >
              Clique-moi
            </span>
          </button>
        </motion.div>
      </div>

      {/* Elegant bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* Conseil Request Modal */}
      <ConseilRequestModal
        isOpen={showConseilModal}
        onClose={() => setShowConseilModal(false)}
      />
    </section>
  );
}