'use client';

import React from 'react';
import { HeroSection } from '@/components/home/hero-section';
import { AboutBruna } from '@/components/home/about-bruna';
import { RecentBooks } from '@/components/home/recent-books';
import { SpotlightBook } from '@/components/home/spotlight-book';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Hero Section */}
      <HeroSection />

      {/* À propos de Bruna */}
      <AboutBruna />

      {/* Derniers livres ajoutés */}
      <RecentBooks />

      {/* Spotlight Book - Livre coup de cœur */}
      <SpotlightBook />
    </div>
  );
}