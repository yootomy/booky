'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Library,
  List,
  Search,
  Grid3x3,
  LogIn,
  LayoutDashboard,
  Settings,
  LucideIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { ThemeToggle } from './ui/theme-toggle';

interface FooterLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export default function Footer() {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useRoleCheck();
  const currentYear = new Date().getFullYear();

  const navigationLinks: FooterLink[] = [
    { href: '/books', label: 'Catalogue', icon: Library },
    { href: '/lists', label: 'Collections', icon: List },
    { href: '/categories', label: 'Catégories', icon: Grid3x3 },
    { href: '/search', label: 'Recherche', icon: Search },
  ];

  const getAccountLinks = (): FooterLink[] => {
    if (isAuthenticated) {
      const links: FooterLink[] = [
        { href: '/dashboard', label: 'Mon Dashboard', icon: LayoutDashboard }
      ];
      if (isAdmin) {
        links.push({ href: '/admin/dashboard', label: 'Administration', icon: Settings });
      }
      return links;
    }
    return [
      { href: '/login', label: 'Connexion', icon: LogIn },
      { href: '/register', label: 'Inscription', icon: LogIn },
    ];
  };

  const accountLinks = getAccountLinks();

  return (
    <footer
      className="w-full border-t transition-colors duration-300"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
          {/* Brand Column */}
          <div className="space-y-2 sm:space-y-3">
            <Link href="/" className="inline-block group">
              <motion.span
                className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#8B1538] to-[#6B4C7B] bg-clip-text text-transparent"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  letterSpacing: '0.1em'
                }}
                whileHover={{ scale: 1.05 }}
              >
                Booky
              </motion.span>
            </Link>
            <p
              className="text-xs sm:text-sm opacity-75 max-w-xs hidden sm:block"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: 'var(--foreground)'
              }}
            >
              Ton sanctuaire de dark romance
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h3
              className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 uppercase tracking-wider"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#8B1538'
              }}
            >
              Navigation
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {navigationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href as any}
                      className="flex items-center gap-1.5 text-xs sm:text-sm hover:text-[#8B1538] transition-colors duration-200 opacity-75 hover:opacity-100"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: 'var(--foreground)'
                      }}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Account Column */}
          <div>
            <h3
              className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 uppercase tracking-wider"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#8B1538'
              }}
            >
              {isAuthenticated ? 'Compte' : 'Rejoindre'}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {accountLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href as any}
                      className="flex items-center gap-1.5 text-xs sm:text-sm hover:text-[#8B1538] transition-colors duration-200 opacity-75 hover:opacity-100"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: 'var(--foreground)'
                      }}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Theme Toggle - Below account links */}
            <div className="mt-3 flex items-center gap-2">
              <span
                className="text-xs sm:text-sm opacity-75"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--foreground)'
                }}
              >
                Thème
              </span>
              <ThemeToggle />
            </div>
          </div>

          {/* Preferences Column - Desktop only */}
          <div className="hidden lg:block">
            <h3
              className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 uppercase tracking-wider"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: '#8B1538'
              }}
            >
              Préférences
            </h3>
            <div className="flex items-center gap-2">
              <span
                className="text-sm opacity-75"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--foreground)'
                }}
              >
                Thème
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Bottom Bar - Compact on mobile */}
        <div
          className="pt-4 sm:pt-6 border-t flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4"
          style={{
            borderColor: 'var(--border)'
          }}
        >
          <p
            className="text-xs sm:text-sm opacity-60 text-center sm:text-left"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: 'var(--foreground)'
            }}
          >
            © {currentYear} Booky
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="text-xs sm:text-sm opacity-60 hover:opacity-100 hover:text-[#8B1538] transition-colors duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: 'var(--foreground)'
              }}
            >
              Accueil
            </Link>
            <span className="opacity-40 text-xs">•</span>
            <Link
              href="/books"
              className="text-xs sm:text-sm opacity-60 hover:opacity-100 hover:text-[#8B1538] transition-colors duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: 'var(--foreground)'
              }}
            >
              Catalogue
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
