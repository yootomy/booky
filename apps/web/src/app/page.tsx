'use client';

import React from 'react';
import { HeroSection } from '@/components/home/hero-section';
import { RecentBooks } from '@/components/home/recent-books';
import { SpotlightBook } from '@/components/home/spotlight-book';
import { EncoreEnvieFooter } from '@/components/home/encore-envie-footer';

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Hero Section */}
      <HeroSection />

      {/* Derniers livres ajoutés */}
      <RecentBooks />

      {/* Spotlight Book - Livre coup de cœur */}
      <SpotlightBook />

      {/* Pre-footer navigation */}
      <EncoreEnvieFooter />
    </div>
  );
}