"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Star } from 'lucide-react';
import '../../styles/gallery.css';

interface BookData {
  id: string;
  image_couverture?: string;
  titre: string;
  auteur: string;
  note_generale?: number;
}

interface ModernCircularGalleryProps {
  books?: BookData[];
  onBookClick?: (book: BookData) => void;
  className?: string;
}

const ModernCircularGallery: React.FC<ModernCircularGalleryProps> = ({
  books = [],
  onBookClick,
  className=""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && books.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % books.length);
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, books.length]);

  // Pause auto-play on interaction
  const pauseAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  // Resume auto-play
  const resumeAutoPlay = useCallback(() => {
    setTimeout(() => setIsAutoPlaying(true), 5000);
  }, []);

  // Navigation functions
  const goToNext = useCallback(() => {
    pauseAutoPlay();
    setCurrentIndex((prev) => (prev + 1) % books.length);
    resumeAutoPlay();
  }, [books.length, pauseAutoPlay, resumeAutoPlay]);

  const goToPrevious = useCallback(() => {
    pauseAutoPlay();
    setCurrentIndex((prev) => (prev - 1 + books.length) % books.length);
    resumeAutoPlay();
  }, [books.length, pauseAutoPlay, resumeAutoPlay]);

  const goToIndex = useCallback((index: number) => {
    pauseAutoPlay();
    setCurrentIndex(index);
    resumeAutoPlay();
  }, [pauseAutoPlay, resumeAutoPlay]);

  // Touch/Mouse drag handlers
  const handleStart = (clientX: number) => {
    pauseAutoPlay();
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaX = currentX - startX;
    const threshold = 50;
    
    if (deltaX > threshold) {
      goToPrevious();
    } else if (deltaX < -threshold) {
      goToNext();
    }
    resumeAutoPlay();
  };

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleMouseUp = () => handleEnd();
  const handleTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleEnd();

  // Keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener(`keydown`, handleKeydown);
  }, [goToNext, goToPrevious]);

  // Calculate positions for circular layout
  const getBookStyle = (index: number) => {
    const totalBooks = Math.min(books.length, 7); // Limit visible books
    const angle = (360 / totalBooks) * (index - currentIndex);
    const radius = 280;
    
    // Convert to radians
    const radian = (angle * Math.PI) / 180;
    
    // Calculate position
    const x = Math.sin(radian) * radius;
    const z = Math.cos(radian) * radius;
    
    // Scale based on position (closer books are larger)
    const scale = Math.max(0.4, 1 - Math.abs(z) / 400);
    const opacity = Math.max(0.3, 1 - Math.abs(z) / 500);
    
    return {
      transform: `translateX(${x}px)`translateZ(${z}px) scale(${scale})`,
      opacity,
      zIndex: Math.round(100 + z),
    };
  };

  // Image with fallback
  const BookCover: React.FC<{ book: BookData; index: number }> = ({ book, index }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
      <div 
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-48 h-72 cursor-pointer transition-all duration-500 ease-out
          ${hoveredIndex === index ? `scale-110" : "`}
        ` }
        style={getBookStyle(index)}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => {
          pauseAutoPlay();
          if (index === currentIndex && onBookClick) {
            onBookClick(book);
          } else {
            goToIndex(index);
          }
          resumeAutoPlay();
        }}
      >
        {/* Book Card */}
        <div className=`relative w-full h-full rounded-2xl overflow-hidden shadow-book hover:shadow-book-hover book-shine gallery-book-enter bg-gradient-to-br from-purple-100 to-pink-100 border border-white/50 transition-all duration-300`>
          {!imageError && book.image_couverture ? (
            <>
              <img
                src={book.image_couverture}
                alt={book.titre}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? `opacity-100" : "opacity-0"
                }` }
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                crossOrigin="anonymous"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400 via-purple-400 to-pink-400 animate-pulse" />
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 gradient-animate text-white">
              <BookOpen className="w-16 h-16 mb-4 opacity-80" />
              <h3 className="text-lg font-bold text-center mb-2 line-clamp-3">
                {book.titre}
              </h3>
              <p className="text-sm opacity-90 text-center mb-3 line-clamp-2">
                {book.auteur}
              </p>
              {book.note_generale && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-300 text-yellow-300 star-sparkle" />
                  <span className="text-sm font-medium`>{book.note_generale}/10</span>
                </div>
              )}
            </div>
          )}
          
          {/* Hover overlay */}
          <div className={`
            absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300
            flex items-center justify-center
            ${hoveredIndex === index ? `bg-black/10" : "`}
`         "}>
            {hoveredIndex === index && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 max-w-[80%] text-center transform transition-all duration-300">
                <p className="font-semibold text-gray-800 text-sm line-clamp-2">{book.titre}</p>
                <p className="text-gray-600 text-xs mt-1`>{book.auteur}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!books || books.length === 0) {
    return (
      <div className={`w-full h-[500px] flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-purple-400" />
          </div>
          <p className="text-xl text-gray-600 font-medium">Aucun livre disponible</p>
          <p className="text-gray-400 mt-2">Ajoutez des livres lus pour voir la galerie</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[500px] overflow-hidden ${className}`}>
      {/* Main Gallery Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full perspective-1000"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transformStyle: "preserve-3d",
          cursor: isDragging ? "grabbing" : "grab"
        }}
      >
        {books.slice(0, 7).map((book, index) => (
          <BookCover key={book.id} book={book} index={index} />
        ))}
      </div>

      {/* Navigation Controls */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 nav-button bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center z-10"
        aria-label="Livre précédent"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 nav-button bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center z-10"
        aria-label="Livre suivant"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10`>
        {books.slice(0, 7).map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            className={`nav-dot w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'nav-dot active w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Aller au livre ${index + 1}`}
          />
        ))}
      </div>

      {/* Book Info Panel */}
      <div className=`absolute top-6 left-6 glass-effect bg-white/90 rounded-xl p-4 max-w-xs shadow-lg z-10 gallery-book-enter">
        <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-2">
          {books[currentIndex]?.titre}
        </h3>
        <p className="text-gray-600 mb-2">
          {books[currentIndex]?.auteur}
        </p>
        {books[currentIndex]?.note_generale && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 star-sparkle" />
            <span className="text-sm font-medium text-gray-700">
              {books[currentIndex].note_generale}/10
            </span>
          </div>
        )}
      </div>

      {/* Auto-play indicator */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${
            isAutoPlaying 
              ? `bg-green-500/80 hover:bg-green-500` 
              : "bg-gray-500/80 hover:bg-gray-500"
          }`text-white shadow-lg`}
          aria-label={isAutoPlaying ? 'Pause auto-play' : 'Play auto-play'}
        >
          {isAutoPlaying ? "⏸" : "▶`}
        </button>
      </div>
    </div>
  );
};

export default ModernCircularGallery;
export type { BookData };