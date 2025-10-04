'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchTriggerProps {
  onClick: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function SearchTrigger({ onClick, variant = 'default', className = '' }: SearchTriggerProps) {
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={`p-2 h-9 w-9 text-gray-600 hover:text-purple-700 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        aria-label="Ouvrir la recherche"
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`p-2 text-gray-600 hover:text-purple-700 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Ouvrir la recherche"
    >
      <Search className="w-5 h-5" />
    </motion.button>
  );
}