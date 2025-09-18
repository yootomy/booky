"use client";

// =============================================================================
// 🔍 COMPOSANT DE RECHERCHE RAPIDE POUR NAVIGATION
// =============================================================================
// Barre de recherche compacte intégrée dans la navigation principale
// avec modal de recherche avancée et raccourcis clavier

import { useState, useEffect } from "react";
import { SearchIcon, CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

import { IntelligentSearch } from "@/components/search/intelligent-search";

// =============================================================================
// 🎨 INTERFACES ET TYPES
// =============================================================================

interface QuickSearchProps {
  className?: string;
  variant?: "compact" | "full";
  showShortcut?: boolean;
}

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL
// =============================================================================

export function QuickSearch({ 
  className, 
  variant = "compact",
  showShortcut = true 
}: QuickSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Gérer les raccourcis clavier globaux
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K pour ouvrir la recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Échapper pour fermer
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Version compacte (pour mobile et espaces restreints)
  if (variant === "compact") {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={cn("p-2", className)}
          aria-label="Rechercher"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>

        <SearchModal 
          open={isOpen} 
          onOpenChange={setIsOpen} 
        />
      </>
    );
  }

  // Version complète (pour desktop)
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-64 justify-between text-muted-foreground hover:text-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4" />
          <span>Rechercher...</span>
        </div>
        
        {showShortcut && (
          <div className="flex items-center gap-1">
            <Kbd>⌘K</Kbd>
          </div>
        )}
      </Button>

      <SearchModal 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
}

// =============================================================================
// 🎯 MODAL DE RECHERCHE
// =============================================================================

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SearchModal({ open, onOpenChange }: SearchModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-background border shadow-2xl">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SearchIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Recherche intelligente</h2>
              <p className="text-sm text-muted-foreground">
                Trouvez rapidement vos livres, auteurs et catégories
              </p>
            </div>
          </div>
          
          <IntelligentSearch
            placeholder="Rechercher des livres, auteurs, genres..."
            onResultSelect={() => onOpenChange(false)}
            className="w-full"
          />
        </div>
        
        {/* Footer avec raccourcis */}
        <div className="border-t bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Kbd size="sm">↑↓</Kbd>
                <span>Navigation</span>
              </div>
              <div className="flex items-center gap-1">
                <Kbd size="sm">↵</Kbd>
                <span>Sélection</span>
              </div>
              <div className="flex items-center gap-1">
                <Kbd size="sm">Esc</Kbd>
                <span>Fermer</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <CommandIcon className="h-3 w-3" />
              <span>Recherche alimentée par l'IA</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickSearch;