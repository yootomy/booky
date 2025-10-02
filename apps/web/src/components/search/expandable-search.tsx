'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBox } from './search-box';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ExpandableSearchProps {
  className?: string;
}

export function ExpandableSearch({ className = '' }: ExpandableSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Gérer l'ouverture
  const handleOpen = useCallback(() => {
    setIsExpanded(true);
    // Focus l'input après l'animation
    setTimeout(() => {
      const input = inputRef.current?.querySelector('input');
      input?.focus();
    }, 200);
  }, []);

  // Gérer la fermeture
  const handleClose = useCallback(() => {
    setIsExpanded(false);
    setSearchTerm('');
    // Remettre le focus sur le bouton loupe
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 200);
  }, []);

  // Gérer les touches clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, handleClose]);

  // Gérer les clics extérieurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && 
          inputRef.current && 
          !inputRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, handleClose]);

  const handleSearchComplete = useCallback(() => {
    handleClose();
  }, [handleClose]);

  return (
    <div className={`relative flex items-center ${className}'}>
      {/* Container avec largeur animée */}
      <motion.div
        className="flex items-center overflow-hidden"
        animate={{ 
          width: isExpanded ? 360 : 40 // 40px pour le bouton, 360px pour l'input
        }}
        transition={{ 
          duration: 0.2, 
          ease: "easeInOut" 
        }}
      >
        {/* Bouton loupe */}
        <button
          ref={triggerRef}
          onClick={handleOpen}
          className={cn(
            "flex-shrink-0 p-2 rounded-full transition-all duration-300 hover:scale-105 z-10",
            "border border-transparent hover:border-primary/20 hover:bg-primary/10",
            "text-muted-foreground hover:text-primary",
            isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
          style={{
            transition: "opacity 0.2s ease-in-out"
          }}
          aria-label="Ouvrir la recherche"
          aria-expanded={isExpanded}
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Input de recherche extensible */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              ref={inputRef}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="absolute left-0 top-0 w-full h-full flex items-center"
              role="search"
            >
              <div className="relative w-full">
                {/* SearchBox avec toutes les fonctionnalités */}
                <SearchBox
                  placeholder="Rechercher un livre, un auteur..."
                  onSearchComplete={handleSearchComplete}
                  className="w-full pr-10"
                />
                
                {/* Bouton X pour fermer */}
                <button
                  onClick={handleClose}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                  aria-label="Fermer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Version mobile avec modal plein écran centré
export function ExpandableSearchMobile({ className="" }: ExpandableSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSearchComplete = useCallback(() => {
    handleClose();
  }, [handleClose]);

  return (
    <div className={className}>
      {/* Bouton trigger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className={cn(
          "p-2 rounded-full transition-all duration-200",
          "text-muted-foreground hover:text-primary",
          "hover:bg-primary/10 active:scale-95"
        )}
        aria-label="Ouvrir la recherche"
      >
        <Search className="w-5 h-5" />
      </Button>

      {/* Modal simple avec juste la SearchBox */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn(
            "max-w-2xl w-[95vw] p-6 bg-background/95 backdrop-blur-xl border border-border",
            "dark:bg-background/90 dark:border-border/50"
          )}
        >
          <div className="space-y-4">
            <DialogTitle className="text-xl font-semibold text-foreground mb-4">
              Rechercher
            </DialogTitle>

            <SearchBox
              className="w-full"
              placeholder="Rechercher un livre, un auteur..."
              onSearchComplete={handleSearchComplete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}