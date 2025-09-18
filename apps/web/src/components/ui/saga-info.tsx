'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronLeft, ChevronRight, Crown, Sparkles, Feather } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSagaBooks } from '@/hooks/use-sagas';
import { cn } from '@/lib/utils';

interface SagaInfoProps {
  saga: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    status: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'UNKNOWN';
  };
  sagaOrder: number;
  sagaNeighbors?: {
    previous?: {
      id: string;
      titre: string;
      sagaOrder: number;
      image_couverture?: string;
    } | null;
    next?: {
      id: string;
      titre: string;
      sagaOrder: number;
      image_couverture?: string;
    } | null;
  } | null;
}

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'ONGOING':
      return 'bg-gradient-to-r from-violet-50 to-violet-100 text-violet-800 border-violet-200';
    case 'COMPLETED':
      return 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200';
    case 'HIATUS':
      return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ONGOING':
      return 'En cours';
    case 'COMPLETED':
      return 'Terminée';
    case 'HIATUS':
      return 'En pause';
    default:
      return 'Statut inconnu';
  }
};

export function SagaInfo({ saga, sagaOrder, sagaNeighbors }: SagaInfoProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch all books in the saga
  const { data: sagaBooksResponse, isLoading } = useSagaBooks(saga.id, {
    include_categories: false,
    include_tags: false
  });
  
  const allSagaBooks = sagaBooksResponse?.data || [];
  const currentBookIndex = allSagaBooks.findIndex(book => book.sagaOrder === sagaOrder);

  // Set initial active card to current book
  useEffect(() => {
    if (currentBookIndex !== -1) {
      setActiveCardIndex(currentBookIndex);
    }
  }, [currentBookIndex]);


  // Keyboard navigation with roving tabindex
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (!gridRef.current?.contains(activeElement)) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (activeCardIndex > 0) {
            setActiveCardIndex(activeCardIndex - 1);
            // Focus the new active card
            const newCard = gridRef.current?.querySelector(`[data-index="${activeCardIndex - 1}"] > div`) as HTMLElement;
            newCard?.focus();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (activeCardIndex < allSagaBooks.length - 1) {
            setActiveCardIndex(activeCardIndex + 1);
            // Focus the new active card
            const newCard = gridRef.current?.querySelector(`[data-index="${activeCardIndex + 1}"] > div`) as HTMLElement;
            newCard?.focus();
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          // Grid navigation - find cards in same column
          const columns = window.innerWidth < 640 ? 2 : window.innerWidth < 768 ? 3 : window.innerWidth < 1024 ? 4 : 5;
          const newIndex = e.key === 'ArrowUp' 
            ? Math.max(0, activeCardIndex - columns)
            : Math.min(allSagaBooks.length - 1, activeCardIndex + columns);
          setActiveCardIndex(newIndex);
          // Focus the new active card
          const newCard = gridRef.current?.querySelector(`[data-index="${newIndex}"] > div`) as HTMLElement;
          newCard?.focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const activeCard = gridRef.current?.querySelector(`[data-index="${activeCardIndex}"] a`) as HTMLElement;
          activeCard?.click();
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [activeCardIndex, allSagaBooks.length]);


  if (allSagaBooks.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 21, 56, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(139, 21, 56, 0.08)'
      }}
    >
      {/* Floating decorative icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            y: [0, -8, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-4 right-8"
        >
          <Crown className="w-4 h-4" style={{color: '#B8860B'}} />
        </motion.div>

        <motion.div
          animate={{
            rotate: [0, 360],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-6 left-6"
        >
          <Sparkles className="w-3 h-3" style={{color: '#6B4C7B'}} />
        </motion.div>
      </div>

      <CardContent className="p-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                boxShadow: '0 4px 20px rgba(139, 21, 56, 0.3)'
              }}
            >
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href={`/sagas/${saga.slug}` as any}
                  className="group transition-all duration-300"
                >
                  <h2
                    className="text-2xl font-bold mb-1 group-hover:opacity-80 transition-opacity"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {saga.name}
                  </h2>
                </Link>
                <span
                  className="text-lg font-medium"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    color: '#6B4C7B'
                  }}
                >
                  Tome {sagaOrder}
                </span>
                <Badge
                  className={cn("text-xs font-medium px-3 py-1", getStatusBadgeStyle(saga.status))}
                  style={{
                    borderRadius: '12px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {getStatusLabel(saga.status)}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {saga.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base leading-relaxed mb-8"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#2C1810',
              opacity: 0.8,
              lineHeight: '1.7'
            }}
          >
            {saga.description}
          </motion.p>
        )}

        {/* Saga Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full"
        >
          <div className="flex items-center gap-3 mb-8">
            <Feather className="w-5 h-5" style={{color: '#6B4C7B'}} />
            <h4
              className="text-lg font-semibold"
              style={{
                fontFamily: 'Playfair Display, serif',
                color: '#2C1810'
              }}
            >
              Tomes de la saga
            </h4>
          </div>

          {/* Grid container */}
          <div className="w-full">
            <div
              ref={gridRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-8 lg:gap-8 justify-items-center w-full"
              role="region"
              aria-label="Tomes de la saga"
            >
              {allSagaBooks.map((book, index) => {
                const isCurrentBook = book.sagaOrder === sagaOrder;
                const isActiveCard = index === activeCardIndex;
                const isRead = (book as any).statut === 'LU';
                const isReading = (book as any).statut === 'EN_COURS';
                
                return (
                  <motion.div
                    key={book.id}
                    data-index={index}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col w-full max-w-[140px] transition-all duration-300"
                    style={{ minHeight: '260px' }}
                  >
                    <div
                      className="group cursor-pointer text-center h-full flex flex-col hover:transform hover:scale-105 transition-all duration-300"
                      tabIndex={isActiveCard ? 0 : -1}
                      role="button"
                      aria-selected={isCurrentBook}
                      onClick={() => setActiveCardIndex(index)}
                      style={{
                        background: isCurrentBook
                          ? 'linear-gradient(135deg, rgba(139, 21, 56, 0.08) 0%, rgba(107, 76, 123, 0.05) 100%)'
                          : 'transparent',
                        borderRadius: '20px',
                        padding: '12px',
                        border: isCurrentBook ? '2px solid rgba(139, 21, 56, 0.2)' : '2px solid transparent'
                      }}
                    >
                      <Link href={`/books/${book.id}`} className="block h-full flex flex-col">
                        <div className="relative mb-4 mx-auto flex-shrink-0 w-full flex justify-center">
                          {/* Loading skeleton */}
                          {isLoading && (
                            <div
                              className="animate-pulse rounded-xl"
                              style={{
                                aspectRatio: '2/3',
                                width: '90px',
                                height: '135px',
                                background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.1) 0%, rgba(107, 76, 123, 0.05) 100%)'
                              }}
                            />
                          )}

                          {/* Cover image */}
                          {!isLoading && (
                            <>
                              {book.image_couverture ? (
                                <img
                                  src={book.image_couverture}
                                  alt={book.titre}
                                  className={cn(
                                    "object-cover rounded-xl transition-all duration-300 shadow-lg group-hover:shadow-2xl",
                                    isCurrentBook ? "ring-2 ring-offset-2 ring-red-700" : "group-hover:scale-105"
                                  )}
                                  loading="lazy"
                                  style={{
                                    aspectRatio: '2/3',
                                    width: '90px',
                                    height: '135px',
                                    filter: isCurrentBook ? 'brightness(1.05)' : 'none'
                                  }}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg group-hover:shadow-2xl",
                                    isCurrentBook ? "ring-2 ring-offset-2 ring-red-700" : "group-hover:scale-105"
                                  )}
                                  style={{
                                    aspectRatio: '2/3',
                                    width: '90px',
                                    height: '135px',
                                    background: isCurrentBook
                                      ? 'linear-gradient(135deg, rgba(139, 21, 56, 0.15) 0%, rgba(107, 76, 123, 0.1) 100%)'
                                      : 'linear-gradient(135deg, rgba(250, 248, 245, 0.8) 0%, rgba(240, 235, 230, 0.6) 100%)'
                                  }}
                                >
                                  <BookOpen className="w-6 h-6" style={{color: isCurrentBook ? '#8B1538' : '#6B4C7B'}} />
                                </div>
                              )}

                              {/* Status indicators */}
                              {isRead && (
                                <div
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                                  style={{background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'}}
                                  title="Lu"
                                >
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                              {isReading && (
                                <div
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                                  style={{background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'}}
                                  title="En cours de lecture"
                                >
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center space-y-3 min-h-0 px-1">
                          <div
                            className="text-xs font-bold uppercase tracking-wide text-center"
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              color: isCurrentBook ? '#8B1538' : '#6B4C7B',
                              letterSpacing: '0.1em'
                            }}
                          >
                            Tome {book.sagaOrder}
                          </div>

                          <div
                            className="text-sm line-clamp-2 leading-tight font-medium text-center transition-colors duration-300"
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              color: isCurrentBook ? '#2C1810' : '#374151',
                              fontSize: '0.875rem',
                              lineHeight: '1.3'
                            }}
                          >
                            {book.titre}
                          </div>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </CardContent>
    </motion.div>
  );
}