'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Heart, Star, Clock, ChevronRight } from 'lucide-react';

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
        const response = await fetch('/api/proxy/books?limit=6&sort=date_ajout&order=desc');
        if (response.ok) {
          const data = await response.json();
          setBooks(data.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des derniers livres:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentBooks();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 px-4 sm:px-8 lg:px-20" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header Placeholder */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 w-64 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-96 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Books Grid Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(107, 76, 123, 0.1)',
                    boxShadow: '0 8px 32px rgba(139, 21, 56, 0.08)'
                  }}
                >
                  {/* Book Cover Placeholder */}
                  <div className="h-48 bg-gray-300"></div>

                  {/* Book Info Placeholder */}
                  <div className="p-5">
                    <div className="h-5 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button Placeholder */}
          <div className="text-center">
            <div className="h-12 w-80 bg-gray-300 rounded-full mx-auto animate-pulse"></div>
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
      case 'lu': return '#10B981';
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
    <section className="py-16 px-4 sm:px-8 lg:px-20" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-6 h-6" style={{ color: '#8B1538' }} />
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                color: '#2C1810',
                fontWeight: 700
              }}
            >
              Dernières découvertes
            </h2>
          </div>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '1.1rem',
              color: '#2C1810',
              opacity: 0.7,
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}
          >
            Les récentes additions à cette collection intime de passions secrètes
          </p>
        </motion.div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: 'easeOut'
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group cursor-pointer"
              onClick={() => window.location.href = `/books/${book.id}`}
            >
              <div
                className="relative rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(107, 76, 123, 0.1)',
                  boxShadow: '0 8px 32px rgba(139, 21, 56, 0.08)'
                }}
              >
                {/* Book Cover */}
                <div className="relative h-48 overflow-hidden">
                  {book.image_couverture ? (
                    <img
                      src={book.image_couverture}
                      alt={book.titre}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                      }}
                    >
                      <BookOpen className="w-12 h-12 text-white opacity-70" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(to top, rgba(44, 24, 16, 0.7) 0%, transparent 100%)'
                    }}
                  />

                  {/* Rating only */}
                  {book.note_generale > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm"
                         style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                      <Star className="w-3 h-3 fill-current" style={{ color: '#B8860B' }} />
                      <span style={{ fontSize: '0.75rem', color: '#2C1810', fontWeight: 600 }}>
                        {book.note_generale}
                      </span>
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="p-5">
                  <h3
                    className="mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-[#8B1538]"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#2C1810',
                      lineHeight: '1.3'
                    }}
                  >
                    {book.titre}
                  </h3>

                  <p
                    className="mb-3 opacity-80"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.9rem',
                      color: '#6B4C7B',
                      fontWeight: 500
                    }}
                  >
                    par {book.auteur}
                  </p>

                  {book.resume_personnel && (
                    <p
                      className="text-sm opacity-70 line-clamp-2 mb-3"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#2C1810',
                        lineHeight: '1.4'
                      }}
                    >
                      {book.resume_personnel}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.8rem',
                        color: '#6B4C7B',
                        opacity: 0.8
                      }}
                    >
                      {book.date_ajout && !isNaN(new Date(book.date_ajout).getTime())
                        ? new Date(book.date_ajout).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })
                        : (book as any).date_creation && !isNaN(new Date((book as any).date_creation).getTime())
                        ? new Date((book as any).date_creation).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })
                        : 'Récent'
                      }
                    </span>

                    <ChevronRight
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-8px] group-hover:translate-x-0"
                      style={{ color: '#8B1538' }}
                    />
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
            onClick={() => window.location.href = '/books'}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)',
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