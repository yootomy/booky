'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, BookOpen, Sparkles, Quote } from 'lucide-react';

export function AboutBruna() {
  return (
    <section className="py-16 px-4 sm:px-8 lg:px-20 bg-background transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h2
            className="text-foreground"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: "clamp(2rem, 4vw, 2.5rem)",
              fontWeight: 700
            }}
          >
            À propos de Bruna
          </h2>
          <p
            className="text-foreground/70"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: "1.1rem",
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: "1.6"
            }}
          >
            La passionnée derrière cette collection de dark romance
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="rounded-2xl p-6 lg:p-8 transition-all duration-500 bg-card/60 backdrop-blur-xl border border-border shadow-lg"
        >
          {/* Layout mobile-first avec proportions équilibrées */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-center">
            {/* Photo de Bruna - Taille plus généreuse */}
            <div className="flex-shrink-0">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px] mx-auto lg:mx-0">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg">
                  {/* Placeholder pour la photo */}
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                    }}
                  >
                    <div className="text-center">
                      <Heart className="w-12 h-12 text-white mx-auto mb-3 opacity-70" />
                      <p className="text-white/80 font-medium">Photo de Bruna</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu à propos - Centré dans l'espace disponible */}
            <div className="flex-1 flex items-center justify-center lg:justify-start">
              <div className="max-w-[500px] lg:max-w-[600px] space-y-4 text-center lg:text-left">
              <blockquote
                className="italic text-foreground/80"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                  lineHeight: "1.5"
                }}
              >
                "Chaque livre est une promesse d"évasion, un voyage vers des émotions intenses où passion et mystère se rencontrent."
              </blockquote>

              <p
                className="text-foreground/80 leading-relaxed"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: "1rem",
                  lineHeight: '1.6'
                }}
              >
                Passionnée de dark romance depuis toujours, j'ai créé cette collection pour partager les histoires qui m'ont fait vibrer. Entre anti-héros irrésistibles et héroïnes fortes, ma mission est simple : vous aider à trouver votre prochaine obsession littéraire.
              </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}