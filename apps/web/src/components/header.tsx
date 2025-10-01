"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "./auth/UserMenu";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogoutButton } from "./auth/LogoutButton";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useAuth } from "@/contexts/AuthContext";
import { ExpandableSearch, ExpandableSearchMobile } from "./search/expandable-search";
import { ThemeToggle } from "./ui/theme-toggle";
import { ConseilRequestModal } from "./conseil/ConseilRequestModal";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import {
  BookOpen,
  Library,
  Menu,
  X,
  Plus,
  List,
  ChevronRight,
  LogIn,
  UserPlus,
  User,
  LayoutDashboard,
  Crown,
  LogOut
} from "lucide-react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showConseilModal, setShowConseilModal] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const { isAdmin } = useRoleCheck();
  const { user, isAuthenticated } = useAuth();
  const { isVisible } = useScrollDirection();
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
      className="fixed top-0 z-[100] w-full transition-all duration-300 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm overflow-hidden"
      initial={{ y: -100 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.08, ease: "easeOut" }}
      style={{
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div className="w-full px-3 sm:px-4 lg:px-8 xl:px-20">
        <div className="flex h-16 sm:h-20 items-center justify-between" style={{ fontFamily: 'Inter, sans-serif' }}>
          
          {/* ZONE GAUCHE : Logo + Navigation groupés */}
          <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
            {/* Logo */}
            <Link href="/" className="group flex-shrink-0">
              <motion.span
                className="font-bold group-hover:scale-105 transition-all duration-300 text-2xl sm:text-3xl lg:text-4xl bg-gradient-to-r from-[#8B1538] to-[#6B4C7B] bg-clip-text text-transparent text-primary"
                style={{
                  fontFamily: 'Playfair Display, serif',
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
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-full text-base font-medium transition-all duration-300 relative group",
                        isActive
                          ? "bg-primary/15 text-primary border-2 border-primary/40 font-semibold shadow-sm dark:bg-primary/20 dark:text-primary dark:border-primary/30"
                          : "text-foreground hover:bg-card/70 hover:backdrop-blur-lg border border-transparent hover:border-accent/20"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
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
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            
            {/* Recherche pour écrans moyens */}
            <div className="hidden lg:flex xl:hidden">
              <ExpandableSearch />
            </div>
            
            {/* Recherche mobile */}
            <div className="lg:hidden">
              <ExpandableSearchMobile />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

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

            {/* Menu utilisateur - masqué sur mobile */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Avatar mobile - visible uniquement si connecté */}
            {isAuthenticated && user && (
              <div className="md:hidden">
                <Popover open={mobileUserMenuOpen} onOpenChange={setMobileUserMenuOpen}>
                  <PopoverTrigger asChild>
                    <motion.button
                      className="p-1.5 rounded-full transition-all duration-300 bg-primary/10 backdrop-blur-lg border border-primary/20 hover:bg-primary/20"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.avatar} alt={user.nom_complet || user.email} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.nom_complet
                            ? user.nom_complet.split(' ').map(n => n[0]).join('').substring(0, 2)
                            : user.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-64 p-0 mr-4 z-[150]"
                    align="end"
                    side="bottom"
                    sideOffset={8}
                  >
                    <div className="p-4">
                      {/* Info utilisateur */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.nom_complet || user.email} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.nom_complet
                              ? user.nom_complet.split(' ').map(n => n[0]).join('').substring(0, 2)
                              : user.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.nom_complet || user.username || 'Utilisateur'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-10"
                          onClick={() => {
                            setMobileUserMenuOpen(false);
                            router.push('/dashboard');
                          }}
                        >
                          <LayoutDashboard className="mr-3 h-4 w-4" />
                          Dashboard
                        </Button>

                        {isAdmin && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-10"
                            onClick={() => {
                              setMobileUserMenuOpen(false);
                              router.push('/admin/dashboard');
                            }}
                          >
                            <Crown className="mr-3 h-4 w-4" />
                            Dashboard Admin
                          </Button>
                        )}

                        <div className="pt-2 border-t">
                          <LogoutButton
                            variant="ghost"
                            className="w-full justify-start h-10 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            showConfirmation={false}
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Menu mobile hamburger */}
            <motion.button
              className="md:hidden p-2 rounded-full transition-all duration-300 bg-card/70 backdrop-blur-lg border border-accent/20 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Menu mobile - Dropdown du haut vers le bas */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-background border-b border-border shadow-xl"
          >
            <div className="px-6 py-6">
              {/* Navigation principale */}
              <div className="space-y-3 mb-6">
                {navigationLinks.map((link, index) => {
                  const isActive = isActiveLink(link.to);
                  return (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Link
                        href={link.to as any}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 group",
                          isActive
                            ? "bg-primary/15 text-primary border-2 border-primary/40 font-semibold shadow-sm"
                            : "text-foreground hover:bg-card border border-transparent font-medium hover:shadow-sm"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            isActive
                              ? "bg-primary/20 text-primary"
                              : "bg-card text-accent group-hover:bg-primary/10 group-hover:text-primary"
                          )}
                        >
                          <link.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{link.label}</div>
                          <div className="text-sm opacity-60 mt-0.5">
                            {link.to === "/" ? "Page d'accueil" :
                             link.to === "/books" ? "Explorez nos livres" :
                             "Sélections spéciales"}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground/30" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>


              {/* Actions utilisateur mobile */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="space-y-3 mb-6"
                >
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 group text-foreground hover:bg-card border border-transparent font-medium hover:shadow-sm"
                  >
                    <div className="p-2 rounded-lg bg-card text-primary group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Connexion</div>
                      <div className="text-sm opacity-60 mt-0.5">Accédez à votre compte</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30" />
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 group text-foreground hover:bg-card border border-transparent font-medium hover:shadow-sm"
                  >
                    <div className="p-2 rounded-lg bg-card text-primary group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Inscription</div>
                      <div className="text-sm opacity-60 mt-0.5">Créez votre compte</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30" />
                  </Link>
                </motion.div>
              )}


              {/* Footer actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="border-t border-border pt-6 mt-6"
              >
                {/* Theme Toggle simplifié */}
                <div className="flex items-center justify-center">
                  <ThemeToggle />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conseil Request Modal */}
      <ConseilRequestModal
        isOpen={showConseilModal}
        onClose={() => setShowConseilModal(false)}
      />
    </motion.header>
  );
}