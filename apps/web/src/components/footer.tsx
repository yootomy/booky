'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ui/theme-toggle';

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/books', label: 'Catalogue' },
    { href: '/lists', label: 'Collections' },
    { href: '/search', label: 'Recherche' },
  ];

  const accountLinks = isAuthenticated
    ? [{ href: '/dashboard', label: 'Mon Dashboard' }]
    : [
        { href: '/login', label: 'Connexion' },
        { href: '/register', label: 'Inscription' },
      ];

  return (
    <footer className="w-full border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Main Content - Mobile centré, Desktop étalé */}
        <div className="space-y-10">

          {/* Top Section - Brand + Navigation */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">

            {/* Brand - Gauche sur desktop, centré sur mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <Link href="/" className="inline-block group">
                <h2 className="text-4xl md:text-5xl mb-3 bg-gradient-to-r from-[#8B1538] to-[#6B4C7B] bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                  Booky
                </h2>
              </Link>
              <p className="text-sm md:text-base text-muted-foreground italic max-w-xs">
                Bibliothèque des Tentations
              </p>
            </motion.div>

            {/* Navigation - Droite sur desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6 text-center md:text-right"
            >
              {/* Main Links */}
              <nav className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6">
                {mainLinks.map((link, index) => (
                  <React.Fragment key={link.href}>
                    <Link
                      href={link.href as any}
                      className="text-sm md:text-base text-foreground/70 hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                    {index < mainLinks.length - 1 && (
                      <span className="text-foreground/30 hidden md:inline">•</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* Account Links */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6">
                {accountLinks.map((link, index) => (
                  <React.Fragment key={link.href}>
                    <Link
                      href={link.href as any}
                      className="text-sm text-foreground/60 hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                    {index < accountLinks.length - 1 && (
                      <span className="text-foreground/30">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-center md:justify-end gap-2">
                <span className="text-sm text-foreground/60">Thème</span>
                <ThemeToggle />
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Bottom Section - Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left"
          >
            <p className="text-xs md:text-sm text-foreground/50 flex items-center justify-center md:justify-start gap-2">
              Créé avec <Heart className="w-3 h-3 text-primary fill-primary" /> par Bruna
            </p>
            <p className="text-xs text-foreground/40">
              © {currentYear} Booky — Tous droits réservés
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
