'use client';

import React, { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConseilRequestModal } from '@/components/conseil/ConseilRequestModal';

export function HeroSection() {
  const [showConseilModal, setShowConseilModal] = useState(false);
  const libraryOwner = 'Bruna';

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background transition-colors duration-500">
      {/* Background Image avec overlay adaptatif au thème */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{
          backgroundImage: "url('/images/hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Overlay adaptatif : sombre en dark mode, clair en light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/30" />

      {/* Gradient décoratif avec les couleurs du thème */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 mix-blend-multiply" />


      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center space-y-8"
        >
          {/* Surtitre élégant */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block"
          >
            <p
              className="text-foreground/70 tracking-[0.2em] uppercase text-sm sm:text-base"
              style={{
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Bibliothèque des Tentations
            </p>
          </motion.div>

          {/* Titre principal majestueux */}
          <h1
            className="text-foreground font-normal"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}
          >
            Collection
            <span className="block mt-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              de {libraryOwner}
            </span>
          </h1>

          {/* Citation poétique */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-foreground/80 leading-relaxed max-w-2xl mx-auto italic"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
              lineHeight: '1.8',
            }}
          >
            « Explorez un univers de passion et de mystère, où chaque page révèle des émotions intenses entre ombre et lumière. »
          </motion.p>

          {/* Boutons d'action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6"
          >
            {/* CTA Principal avec effet glassmorphism */}
            <button
              onClick={() => window.location.href="/books"}
              className="group relative px-8 py-4 sm:px-10 sm:py-5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background w-full sm:w-auto overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                color: 'white',
                fontFamily: 'Playfair Display, serif',
                fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
                fontWeight: 500,
                boxShadow: '0 10px 40px rgba(139, 21, 56, 0.3)',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Découvrir mes lectures
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </span>

              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </button>

            {/* Lien secondaire mystérieux */}
            <button
              onClick={() => setShowConseilModal(true)}
              className="group relative transition-all duration-300 hover:scale-105 focus:outline-none px-6 py-3"
            >
              <span
                className="relative text-foreground/70 group-hover:text-foreground transition-colors duration-300"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
                  fontWeight: 500,
                  fontStyle: "italic",
                }}
              >
                Surprends-moi...
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-500" />
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Dégradé de transition en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />

      {/* Modal */}
      <ConseilRequestModal
        isOpen={showConseilModal}
        onClose={() => setShowConseilModal(false)}
      />
    </section>
  );
}
