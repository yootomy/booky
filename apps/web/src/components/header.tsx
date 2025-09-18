"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "./auth/UserMenu";
import { Button } from "./ui/button";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { ExpandableSearch, ExpandableSearchMobile } from "./search/expandable-search";
import {
  BookOpen,
  Library,
  Menu,
  X,
  Plus,
  List
} from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useRoleCheck();
  const router = useRouter();
  const pathname = usePathname();

  const navigationLinks = [
    {
      to: "/",
      label: "Accueil",
      icon: BookOpen
    },
    {
      to: "/books",
      label: "Catalogue",
      icon: Library
    },
    {
      to: "/lists",
      label: "Collections",
      icon: List
    }
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <motion.header 
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 21, 56, 0.1)',
        boxShadow: '0 8px 32px rgba(139, 21, 56, 0.05)'
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full px-4 sm:px-8 lg:px-20">
        <div className="flex h-20 items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          
          {/* ZONE GAUCHE : Logo + Navigation groupés */}
          <div className="flex items-center space-x-6 flex-1">
            {/* Logo */}
            <Link href="/" className="group flex-shrink-0">
              <motion.span 
                className="font-bold group-hover:scale-105 transition-all duration-300"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '2.8rem',
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700,
                  letterSpacing: '0.1em'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Booky
              </motion.span>
            </Link>

            {/* Navigation principale - directement à côté du logo */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationLinks.map((link) => {
                const isActive = isActiveLink(link.to);
                return (
                  <Link key={link.to} href={link.to as any}>
                    <motion.div
                      className="flex items-center space-x-2 px-4 py-2 rounded-full text-base font-medium transition-all duration-300 relative group"
                      style={{
                        backgroundColor: isActive ? 'rgba(139, 21, 56, 0.08)' : 'transparent',
                        color: isActive ? '#8B1538' : '#2C1810',
                        fontWeight: isActive ? 600 : 500,
                        border: isActive ? '1px solid rgba(139, 21, 56, 0.2)' : '1px solid transparent'
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                          e.currentTarget.style.backdropFilter = 'blur(10px)';
                          e.currentTarget.style.border = '1px solid rgba(107, 76, 123, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.border = '1px solid transparent';
                        }
                      }}
                    >
                      <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>{link.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ZONE CENTRE : Recherche pour les grands écrans */}
          <div className="hidden xl:flex justify-center max-w-lg mx-8">
            <ExpandableSearch />
          </div>

          {/* ZONE DROITE : Actions utilisateur */}
          <div className="flex items-center space-x-4">
            
            {/* Recherche pour écrans moyens */}
            <div className="hidden lg:flex xl:hidden">
              <ExpandableSearch />
            </div>
            
            {/* Recherche mobile */}
            <div className="lg:hidden">
              <ExpandableSearchMobile />
            </div>

            {/* Actions admin */}
            {isAdmin && (
              <motion.button
                onClick={() => router.push("/admin/books/new")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  color: 'white',
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(139, 21, 56, 0.25)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Ajouter</span>
              </motion.button>
            )}

            {/* Menu utilisateur - toujours à droite */}
            <UserMenu />

            {/* Menu mobile hamburger */}
            <motion.button
              className="md:hidden p-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(107, 76, 123, 0.2)',
                color: '#2C1810'
              }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Menu mobile - Rédesigné */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden"
            style={{
              borderTop: '1px solid rgba(139, 21, 56, 0.1)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="px-6 py-6">
              {/* Navigation mobile */}
              <div className="space-y-2">
                {navigationLinks.map((link, index) => {
                  const isActive = isActiveLink(link.to);
                  return (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link 
                        href={link.to as any}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 group"
                        style={{
                          backgroundColor: isActive ? 'rgba(139, 21, 56, 0.08)' : 'transparent',
                          color: isActive ? '#8B1538' : '#2C1810',
                          border: isActive ? '1px solid rgba(139, 21, 56, 0.2)' : '1px solid transparent',
                          fontWeight: isActive ? 600 : 500
                        }}
                      >
                        <div 
                          className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
                          style={{
                            backgroundColor: isActive ? 'rgba(139, 21, 56, 0.1)' : 'rgba(107, 76, 123, 0.05)',
                            color: isActive ? '#8B1538' : '#6B4C7B'
                          }}
                        >
                          <link.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-base">{link.label}</div>
                          <div className="text-xs opacity-60 mt-0.5">Navigation principale</div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Actions admin mobile */}
              {isAdmin && (
                <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(139, 21, 56, 0.1)' }}>
                  <motion.button
                    onClick={() => {
                      router.push("/admin/books/new");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(139, 21, 56, 0.25)'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter un nouveau livre
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}