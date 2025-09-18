/**
 * Variantes de composants pour les différents thèmes
 * Spécialement conçu pour le thème Dark Romance
 */

import { type VariantProps, cva } from "class-variance-authority";

// ===== VARIANTES BOUTONS =====

export const buttonDarkRomanceVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Variantes spécifiques Dark Romance
        "blood-red": "bg-[var(--color-blood-red)] text-white hover:bg-[var(--color-crimson)] transition-colors",
        "deep-purple": "bg-[var(--color-deep-purple)] text-white hover:bg-[var(--color-royal-purple)] transition-colors",
        "gradient-blood": "bg-gradient-to-r from-[var(--color-blood-red)] to-[var(--color-crimson)] text-white hover:opacity-90 transition-opacity",
        "gradient-royal": "bg-gradient-to-r from-[var(--color-deep-purple)] to-[var(--color-royal-purple)] text-white hover:opacity-90 transition-opacity",
        "gradient-dark-romance": "bg-gradient-to-r from-[var(--color-blood-red)] via-[var(--color-deep-purple)] to-[var(--color-deep-black)] text-white hover:opacity-90 transition-opacity",
        "outline-crimson": "border-2 border-[var(--color-crimson)] text-[var(--color-crimson)] hover:bg-[var(--color-crimson)] hover:text-white transition-colors",
        "outline-purple": "border-2 border-[var(--color-royal-purple)] text-[var(--color-royal-purple)] hover:bg-[var(--color-royal-purple)] hover:text-white transition-colors",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonDarkRomanceVariants = VariantProps<typeof buttonDarkRomanceVariants>;

// ===== VARIANTES CARTES =====

export const cardDarkRomanceVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-lg",
        outlined: "border-2",
        // Variantes Dark Romance
        "blood-glow": "border-[var(--color-crimson)] shadow-lg shadow-[var(--color-blood-red)]/20",
        "purple-glow": "border-[var(--color-royal-purple)] shadow-lg shadow-[var(--color-deep-purple)]/20",
        "dark-romance": "bg-gradient-to-br from-[var(--color-charcoal)] to-[var(--color-deep-black)] border-[var(--color-crimson)]/20 shadow-xl",
        "book-card": "hover:shadow-lg hover:shadow-[var(--color-crimson)]/10 transition-all duration-300 hover:-translate-y-1 border-[var(--color-deep-purple)]/30",
        "romance-gradient": "bg-gradient-to-br from-[var(--color-deep-purple)]/10 via-transparent to-[var(--color-blood-red)]/10 border-[var(--color-crimson)]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type CardDarkRomanceVariants = VariantProps<typeof cardDarkRomanceVariants>;

// ===== VARIANTES BADGES =====

export const badgeDarkRomanceVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Variantes spécifiques pour les genres de livres
        "spicy": "bg-[var(--color-crimson)] text-white border-[var(--color-blood-red)]",
        "dark": "bg-[var(--color-deep-black)] text-white border-[var(--color-charcoal)]",
        "romance": "bg-[var(--color-royal-purple)] text-white border-[var(--color-deep-purple)]",
        "trigger": "bg-[var(--color-blood-red)] text-white border-[var(--color-crimson)]",
        "trope": "bg-[var(--color-indigo)] text-white border-[var(--color-deep-purple)]",
        "genre": "bg-gradient-to-r from-[var(--color-deep-purple)] to-[var(--color-royal-purple)] text-white",
        // Statuts de lecture
        "read": "bg-[var(--color-crimson)] text-white",
        "reading": "bg-[var(--color-royal-purple)] text-white",
        "to-read": "bg-[var(--color-deep-purple)] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeDarkRomanceVariants = VariantProps<typeof badgeDarkRomanceVariants>;

// ===== VARIANTES D'ANIMATIONS =====

export const animationDarkRomanceVariants = {
  // Animations de hover pour les cartes de livres
  bookHover: "transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-crimson)]/20 hover:-translate-y-1 hover:scale-[1.02]",
  
  // Animation de glow pour les éléments importants
  glowEffect: "transition-all duration-500 hover:shadow-lg hover:shadow-[var(--color-crimson)]/30",
  
  // Animation de pulsation pour les notifications
  pulseRomance: "animate-pulse [animation-duration:2s] shadow-[var(--color-blood-red)]/50",
  
  // Animation de slide pour les éléments qui apparaissent
  slideInLeft: "animate-in slide-in-from-left-6 duration-300",
  slideInRight: "animate-in slide-in-from-right-6 duration-300",
  slideInUp: "animate-in slide-in-from-bottom-6 duration-300",
  
  // Animation de fadein pour les éléments subtils
  fadeIn: "animate-in fade-in duration-500",
  fadeInSlow: "animate-in fade-in duration-1000",
};

// ===== UTILITAIRES POUR LES GRADIENTS =====

export const gradientDarkRomance = {
  blood: "bg-gradient-to-r from-[var(--color-blood-red)] to-[var(--color-crimson)]",
  night: "bg-gradient-to-r from-[var(--color-deep-black)] to-[var(--color-charcoal)]",
  royal: "bg-gradient-to-r from-[var(--color-deep-purple)] to-[var(--color-royal-purple)]",
  darkRomance: "bg-gradient-to-r from-[var(--color-blood-red)] via-[var(--color-deep-purple)] to-[var(--color-deep-black)]",
  // Gradients subtils pour les backgrounds
  subtleBlood: "bg-gradient-to-br from-[var(--color-blood-red)]/10 to-transparent",
  subtlePurple: "bg-gradient-to-br from-[var(--color-royal-purple)]/10 to-transparent",
  subtleDark: "bg-gradient-to-br from-[var(--color-deep-black)]/20 to-transparent",
};

// ===== COULEURS UTILITAIRES =====

export const colorsDarkRomance = {
  bloodRed: "var(--color-blood-red)",
  crimson: "var(--color-crimson)",
  deepBlack: "var(--color-deep-black)",
  charcoal: "var(--color-charcoal)",
  indigo: "var(--color-indigo)",
  deepPurple: "var(--color-deep-purple)",
  royalPurple: "var(--color-royal-purple)",
} as const;

// ===== STYLES POUR LES RATINGS =====

export const ratingDarkRomanceStyles = {
  // Styles pour les étoiles de notation générale
  starRating: "text-[var(--color-crimson)] hover:text-[var(--color-blood-red)] transition-colors cursor-pointer",
  starFilled: "text-[var(--color-crimson)]",
  starEmpty: "text-gray-300 dark:text-gray-600",
  
  // Styles pour les niveaux spicy (piments)
  spicyRating: "text-[var(--color-blood-red)] hover:text-[var(--color-crimson)] transition-colors cursor-pointer",
  spicyFilled: "text-[var(--color-blood-red)]",
  
  // Styles pour les niveaux dark (crânes) 
  darkRating: "text-[var(--color-deep-black)] dark:text-white hover:text-[var(--color-charcoal)] transition-colors cursor-pointer",
  darkFilled: "text-[var(--color-deep-black)] dark:text-white",
  
  // Styles pour les niveaux romance (coeurs)
  romanceRating: "text-[var(--color-royal-purple)] hover:text-[var(--color-deep-purple)] transition-colors cursor-pointer",
  romanceFilled: "text-[var(--color-royal-purple)]",
};