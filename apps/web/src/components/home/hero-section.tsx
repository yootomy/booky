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

  const userName = user?.nom_complet?.split(' ')[0] || 'Bruna';


  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{backgroundColor: '#FAF8F5'}}>
      {/* Background Image with sophisticated overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{
          backgroundImage: `url('/images/hero.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Elegant left overlay for text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, 
            rgba(250, 248, 245, 1) 0%, 
            rgba(250, 248, 245, 0.95) 25%, 
            rgba(250, 248, 245, 0.7) 40%, 
            rgba(250, 248, 245, 0.3) 60%, 
            transparent 100%)`
        }}
      />
      
      {/* Subtle paper grain texture */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(44, 24, 16, 0.03) 100%)'
        }}
      />
      

      {/* Content - Left aligned composition */}
      <div className="relative z-10 px-4 sm:px-8 lg:px-20 py-8 sm:py-12 lg:py-16 max-w-none w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Main Title - Elegant serif with crimson accent */}
            <h1 className="mb-6" style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              lineHeight: '1.1',
              fontWeight: 700,
              color: '#2C1810'
            }}>
              Bibliothèque Romance secrète{' '}
              <span 
                className="block mt-2" 
                style={{
                  fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                de {userName}
              </span>
            </h1>

            {/* Subtitle - Refined sans-serif */}
            <p 
              className="mb-10 leading-relaxed max-w-xl"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.25rem',
                color: '#2C1810',
                opacity: 0.8,
                lineHeight: '1.6'
              }}
            >
              Explorez une collection intime de romances intenses, entre ombre et lumière, passion et mystère.
            </p>

          </motion.div>

            {/* Action Buttons - Refined CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center"
            >
              {/* Primary CTA */}
              <button
                onClick={() => window.location.href = '/books'}
                className="group px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(139, 21, 56, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 21, 56, 0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                Explorer mes désirs
              </button>

              {/* Secondary CTA */}
              <button
                onClick={() => window.location.href = '/categories'}
                className="group px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(107, 76, 123, 0.3)',
                  color: '#6B4C7B',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  boxShadow: '0 4px 20px rgba(107, 76, 123, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                Univers & atmosphères
              </button>

              {/* Surprise CTA */}
              <button
                onClick={() => setShowConseilModal(true)}
                className="group relative px-8 py-4 rounded-full transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600/30 overflow-hidden"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(229, 197, 128, 0.2) 0%, rgba(229, 197, 128, 0.1) 50%, transparent 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid #E5C580',
                  boxShadow: '0 0 20px rgba(229, 197, 128, 0.4), inset 0 0 20px rgba(229, 197, 128, 0.1)',
                  minWidth: '200px',
                  minHeight: '70px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(229, 197, 128, 0.6), inset 0 0 30px rgba(229, 197, 128, 0.2)';
                  e.currentTarget.style.borderColor = '#F0D999';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(229, 197, 128, 0.4), inset 0 0 20px rgba(229, 197, 128, 0.1)';
                  e.currentTarget.style.borderColor = '#E5C580';
                }}
              >
                {/* Point d'interrogation central */}
                <div
                  className="group-hover:opacity-0 transition-all duration-700 ease-out"
                  style={{
                    color: '#C89D63',
                    fontSize: '1.8rem',
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 600,
                  }}
                >
                  ?
                </div>

                {/* Texte révélé au hover */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out delay-200"
                  style={{
                    color: '#3B2B1F',
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '0 12px',
                    lineHeight: '1.2',
                  }}
                >
                  Laissez-moi vous surprendre
                </div>
              </button>
            </motion.div>
        </div>
      </div>

      {/* Elegant bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: `linear-gradient(to top,
            #FAF8F5 0%,
            rgba(250, 248, 245, 0.8) 40%,
            transparent 100%)`
        }}
      />

      {/* Conseil Request Modal */}
      <ConseilRequestModal
        isOpen={showConseilModal}
        onClose={() => setShowConseilModal(false)}
      />
    </section>
  );
}