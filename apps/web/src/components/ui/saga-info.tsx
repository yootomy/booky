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
      return 'bg-gradient-to-r from-violet-100 to-violet-200 dark:from-violet-900 dark:to-violet-800 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-700';
    case 'COMPLETED':
      return 'bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
    case 'HIATUS':
      return 'bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700';
    default:
      return 'bg-gradient-to-r from-muted to-muted/80 text-muted-foreground border-border';
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
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [activeCardIndex, allSagaBooks.length]);


  if (allSagaBooks.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-4 sm:mb-6 md:mb-8 relative overflow-hidden bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg"
    >

      <CardContent className="p-3 sm:p-4 md:p-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 shadow-lg"
            >
              <BookOpen size={16} className="text-primary-foreground sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Link
                  href={'/sagas/${saga.slug}' as any}
                  className="group transition-all duration-300"
                >
                  <h2
                    className="text-lg sm:text-xl md:text-2xl font-bold mb-0 group-hover:opacity-80 transition-opacity truncate text-foreground"
                    style={{
                      fontFamily: "Playfair Display, serif"
                    }}
                  >
                    {saga.name}
                  </h2>
                </Link>
                <span
                  className="text-sm sm:text-base font-medium whitespace-nowrap text-primary"
                  style={{
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Tome {sagaOrder}
                </span>
                <Badge
                  className={cn("text-xs font-medium px-2 py-0.5", getStatusBadgeStyle(saga.status))}
                  style={{
                    borderRadius: "8px",
                    fontFamily: "Inter, sans-serif"
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
            className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 md:mb-6 text-foreground/80"
            style={{
              fontFamily: 'Inter, sans-serif',
              lineHeight: "1.6"
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
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Feather className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <h4
              className="text-base sm:text-lg font-semibold text-foreground"
              style={{
                fontFamily: 'Playfair Display, serif'
              }}
            >
              Tomes de la saga
            </h4>
          </div>

          {/* Grid container */}
          <div className="w-full">
            <div
              ref={gridRef}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 justify-items-center w-full"
              role="region"
              aria-label="Tomes de la saga"
            >
              {allSagaBooks.map((book, index) => {
                const isCurrentBook = book.sagaOrder === sagaOrder;
                const isActiveCard = index === activeCardIndex;
                const isRead = (book as any).statut === "LU";
                const isReading = (book as any).statut === 'EN_COURS';
                
                return (
                  <motion.div
                    key={book.id}
                    data-index={index}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col w-full max-w-[100px] sm:max-w-[120px] transition-all duration-300"
                    style={{ minHeight: '180px' }}
                  >
                    <div
                      className={`group cursor-pointer text-center h-full flex flex-col hover:transform hover:scale-105 transition-all duration-300 p-1.5 rounded-xl border-2 ${
                        isCurrentBook
                          ? 'bg-primary/10 border-primary/20' : 'border-transparent'
                      }`}
                      tabIndex={isActiveCard ? 0 : -1}
                      role='button'
                      aria-selected={isCurrentBook}
                      onClick={() => setActiveCardIndex(index)}
                    >
                      <Link href={'/books/${book.id}'} className="block h-full flex flex-col">
                        <div className="relative mb-2 mx-auto flex-shrink-0 w-full flex justify-center">
                          {/* Loading skeleton */}
                          {isLoading && (
                            <div
                              className="animate-pulse rounded-xl"
                              style={{
                                aspectRatio: "2/3",
                                width: '60px',
                                height: '90px',
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
                                    isCurrentBook ? "ring-2 ring-offset-2 ring-primary" : "group-hover:scale-105"
                                  )}
                                  loading="lazy"
                                  style={{
                                    aspectRatio: "2/3",
                                    width: "60px",
                                    height: "90px",
                                    filter: isCurrentBook ? "brightness(1.05)" : "none"
                                  }}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg group-hover:shadow-2xl",
                                    isCurrentBook ? "ring-2 ring-offset-2 ring-primary" : "group-hover:scale-105"
                                  )}
                                  style={{
                                    aspectRatio: '2/3',
                                    width: '60px',
                                    height: '90px',
                                    background: isCurrentBook
                                      ? 'linear-gradient(135deg, rgba(139, 21, 56, 0.15) 0%, rgba(107, 76, 123, 0.1) 100%)' : 'linear-gradient(135deg, rgba(250, 248, 245, 0.8) 0%, rgba(240, 235, 230, 0.6) 100%)'
                                  }}
                                >
                                  <BookOpen className={'w-4 h-4 ${isCurrentBook ? "text-primary" : "text-muted-foreground"}'} />
                                </div>
                              )}

                              {/* Status indicators */}
                              {isRead && (
                                <div
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                                  style={{background: "linear-gradient(135deg, #10B981 0%, #059669 100%)"}}
                                  title="Lu"
                                >
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                              {isReading && (
                                <div
                                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                                  style={{background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"}}
                                  title="En cours de lecture"
                                >
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        <div className='flex-1 flex flex-col justify-center space-y-1 min-h-0 px-0.5'>
                          <div
                            className={`text-xs font-bold uppercase tracking-wide text-center ${isCurrentBook ? 'text-primary' : 'text-muted-foreground'}`}
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              letterSpacing: '0.05em'
                            }}
                          >
                            T{book.sagaOrder}
                          </div>

                          <div
                            className={`text-xs line-clamp-2 leading-tight font-medium text-center transition-colors duration-300 ${isCurrentBook ? 'text-foreground' : 'text-muted-foreground'}`}
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: "0.75rem",
                              lineHeight: '1.2'
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