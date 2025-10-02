'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface FloatingActionButtonsProps {
  onBack: () => void;
  onShare?: () => void;
  /** Element to observe for visibility - when this element is not visible, buttons show */
  triggerRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
}

export function FloatingActionButtons({
  onBack,
  onShare,
  triggerRef
}: FloatingActionButtonsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!triggerRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show floating buttons when the trigger element is NOT visible
        setIsVisible(!entry.isIntersecting);
      },
      {
        // Trigger when the element is completely out of view
        threshold: 0,
        // Add some margin to trigger a bit earlier
        rootMargin: '-50px 0px 0px 0px'
      }
    );

    observer.observe(triggerRef.current);

    return () => observer.disconnect();
  }, [triggerRef]);

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-lg border border-border rounded-full shadow-xl"
          style={{
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)"
          }}
        >
          {/* Bouton Retour */}
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour au catalogue</span>
            <span className="sm:hidden">Retour</span>
          </motion.button>

          {/* Séparateur */}
          <div className="w-px h-6 bg-border"></div>

          {/* Bouton Partager */}
          <motion.button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-card hover:bg-muted text-foreground border border-border transition-colors"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Partager</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}