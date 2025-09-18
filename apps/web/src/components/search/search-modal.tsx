'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SearchBox } from './search-box';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [mounted, setMounted] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K pour ouvrir
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Ouvrir le modal
          document.dispatchEvent(new CustomEvent('open-search-modal'));
        }
      }
      
      // Échapper pour fermer
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleSearchComplete = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 max-w-2xl bg-background/95 backdrop-blur-lg border shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {/* Header avec titre */}
          <div className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Recherche Rapide
                </h2>
                <p className="text-sm text-muted-foreground">
                  Trouvez rapidement vos livres, auteurs et catégories
                </p>
              </div>
            </div>
            
            {/* SearchBox principal */}
            <SearchBox
              placeholder="Rechercher des livres, auteurs, genres..."
              onSearchComplete={handleSearchComplete}
              className="w-full"
            />
          </div>
          
          {/* Footer avec raccourcis et conseils */}
          <div className="px-6 py-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    ↑↓
                  </kbd>
                  <span>Navigation</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    ↵
                  </kbd>
                  <span>Sélection</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    Esc
                  </kbd>
                  <span>Fermer</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                    Tab
                  </kbd>
                  <span>Compléter</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Command className="h-3 w-3" />
                <span>Recherche intelligente</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Conseils de recherche :</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Tapez au moins 2 caractères</li>
                    <li>• Utilisez les accents ou non ("cafe" = "café")</li>
                    <li>• Les fautes de frappe sont tolérées</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Types de résultats :</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>📚 <span className="text-blue-600">Livres</span> → Page détail</li>
                    <li>👤 <span className="text-green-600">Auteurs</span> → Catalogue filtré</li>
                    <li>🏷️ <span className="text-orange-600">Tags</span> → Catalogue filtré</li>
                    <li>📁 <span className="text-purple-600">Catégories</span> → Catalogue filtré</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// Hook pour ouvrir le modal depuis n'importe où
export function useSearchModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenSearch = () => setIsOpen(true);
    document.addEventListener('open-search-modal', handleOpenSearch);
    return () => document.removeEventListener('open-search-modal', handleOpenSearch);
  }, []);

  return {
    isOpen,
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
  };
}