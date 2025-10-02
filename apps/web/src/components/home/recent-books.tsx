'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Heart, Star, Clock, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture: string | null;
  note_generale: number;
  statut: string;
  date_ajout: string;
  resume_personnel?: string;
}

export function RecentBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentBooks = async () => {
      try {
        const response = await apiClient.get('/api/books?limit=6&sort=date_creation&order=desc');
        if (response.ok) {
          const data = await response.json();
          setBooks(data.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des derniers livres:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentBooks();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-8 lg:px-20 bg-background transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header Placeholder */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-96 bg-muted/70 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Books Grid Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="rounded-2xl overflow-hidden bg-card/60 backdrop-blur-xl border border-border shadow-lg">
                  {/* Book Cover Placeholder */}
                  <div className="h-48 bg-muted"></div>

                  {/* Book Info Placeholder */}
                  <div className="p-5">
                    <div className="h-5 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted/70 rounded w-2/3 mb-3"></div>
                    <div className="h-3 bg-muted/70 rounded mb-1"></div>
                    <div className="h-3 bg-muted/70 rounded w-4/5 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-muted/70 rounded w-16"></div>
                      <div className="w-4 h-4 bg-muted/70 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button Placeholder */}
          <div className="text-center">
            <div className="h-12 w-80 bg-muted rounded-full mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!books.length) {
    return null;
  }

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "lu": return '#10B981';
      case 'en_cours': return '#F59E0B';
      case 'a_lire': return '#8B1538';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'lu': return 'Lu';
      case 'en_cours': return 'En cours';
      case 'a_lire': return 'À lire';
      default: return statut;
    }
  };

  return (
    <section className="py-16 px-4 sm:px-8 lg:px-20 bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-primary" />
            <h2
              className="text-foreground"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: "clamp(2rem, 4vw, 2.5rem)",
                fontWeight: 700
              }}
            >
              Dernières découvertes
            </h2>
          </div>
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
            Les récentes additions à cette collection intime de passions secrètes
          </p>
        </motion.div>

        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              whileHover={{ y: -2 }}
              className="group cursor-pointer"
              onClick={() => window.location.href = `/books/${book.id}`}
            >
              <div className="relative rounded-xl overflow-hidden transition-all duration-200 group-hover:shadow-lg bg-card/60 backdrop-blur-xl border border-border shadow-md">
                {/* Book Cover */}
                <div className="relative aspect-[2/3] overflow-hidden">
                  {book.image_couverture ? (
                    <img
                      src={book.image_couverture}
                      alt={book.titre}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                      }}
                    >
                      <BookOpen className="w-8 h-8 text-white opacity-70" />
                    </div>
                  )}

                  {/* Rating badge */}
                  {book.note_generale > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full backdrop-blur-sm bg-black/70 border border-white/20">
                      <Star className="w-2.5 h-2.5 fill-current text-yellow-400" />
                      <span className="text-xs text-white font-semibold">
                        {book.note_generale}
                      </span>
                    </div>
                  )}
                </div>

                {/* Book Info - Always visible */}
                <div className="p-3">
                  <h3 className="text-foreground font-semibold text-sm line-clamp-2 mb-1 leading-tight">
                    {book.titre}
                  </h3>
                  <p className="text-foreground/70 text-xs mb-2">
                    {book.auteur}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/50 text-xs">
                      {(book as any).date_creation && !isNaN(new Date((book as any).date_creation).getTime())
                        ? new Date((book as any).date_creation).toLocaleDateString("fr-FR", {
                            day: 'numeric',
                            month: 'short'
                          })
                        : book.date_ajout && !isNaN(new Date(book.date_ajout).getTime())
                        ? new Date(book.date_ajout).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })
                        : "Récent"
                      }
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity duration-200 text-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={() => window.location.href="/books"}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              fontSize: "1rem",
              fontWeight: 600,
              boxShadow: "0 8px 25px rgba(139, 21, 56, 0.3)",
            }}
          >
            <Heart className="w-5 h-5 group-hover:fill-current transition-all" />
            Découvrir toute la collection
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}