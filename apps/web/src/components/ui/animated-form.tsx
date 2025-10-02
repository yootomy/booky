/**
 * AnimatedForm - Formulaires avec animations fluides
 * Composants de formulaire avec animations d'entrée et validation
 */

"use client";

import { ReactNode, useState } from "react";
import { AnimatedElement, StaggeredAnimation } from './animations';
import { cn } from '@/lib/utils';

// =============================================================================
// 🎯 TYPES ET INTERFACES
// =============================================================================

export interface AnimatedFormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export interface AnimatedFieldProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  error?: string;
  success?: boolean;
}

// =============================================================================
// 📝 COMPOSANT FORMULAIRE ANIMÉ
// =============================================================================

export function AnimatedForm({
  children,
  className,
  onSubmit,
  isSubmitting = false
}: AnimatedFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    onSubmit?.(e);
  };

  return (
    <AnimatedElement
      animation="fadeInUp"
      trigger="onMount"
      className={cn("w-full", className)}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "space-y-6",
          isSubmitting && "opacity-50 pointer-events-none",
          "transition-opacity duration-200"
        )}
      >
        {children}
      </form>
    </AnimatedElement>
  );
}

// =============================================================================
// 📋 COMPOSANT CHAMP ANIMÉ
// =============================================================================

export function AnimatedField({
  children,
  className,
  delay = 0,
  error,
  success = false
}: AnimatedFieldProps) {
  return (
    <AnimatedElement
      animation="slideInLeft"
      trigger="onMount"
      delay={delay}
      className={cn(
        "transition-all duration-200",
        error && "animate-shake",
        success && "animate-bounce-subtle",
        className
      )}
    >
      <div className="space-y-2">
        {children}
        
        {/* Animation d'erreur */}
        {error && (
          <AnimatedElement
            animation="slideInRight"
            trigger="onMount"
            className="text-sm text-destructive flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            {error}
          </AnimatedElement>
        )}
        
        {/* Animation de succès */}
        {success && (
          <AnimatedElement
            animation="slideInRight"
            trigger="onMount"
            className="text-sm text-green-600 flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Validé
          </AnimatedElement>
        )}
      </div>
    </AnimatedElement>
  );
}

// =============================================================================
// 🎪 COMPOSANT GROUPE DE CHAMPS AVEC STAGGER
// =============================================================================

export function AnimatedFieldGroup({
  children,
  className,
  staggerDelay = 100
}: {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <StaggeredAnimation
        staggerDelay={staggerDelay}
        animation="slideInLeft"
      >
        {children}
      </StaggeredAnimation>
    </div>
  );
}

// =============================================================================
// 🚀 BOUTON DE SOUMISSION ANIMÉ
// =============================================================================

export interface AnimatedSubmitButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function AnimatedSubmitButton({
  children,
  isLoading = false,
  isSuccess = false,
  isError = false,
  className,
  disabled = false,
  onClick
}: AnimatedSubmitButtonProps) {
  return (
    <AnimatedElement
      animation="scaleIn"
      trigger="onMount"
      delay={200}
      className={cn(
        "relative overflow-hidden",
        "transition-all duration-300",
        isSuccess && "bg-green-500 hover:bg-green-600",
        isError && "bg-red-500 hover:bg-red-600",
        className
      )}
    >
      <button
        type="submit"
        disabled={disabled || isLoading}
        onClick={onClick}
        className={cn(
          "relative w-full px-4 py-2 rounded-md",
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200",
          "flex items-center justify-center gap-2"
        )}
      >
        {/* Animation de loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-primary/20 animate-pulse" />
        )}
        
        {/* Icône de loading */}
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        
        {/* Icône de succès */}
        {isSuccess && !isLoading && (
          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
        )}
        
        {/* Icône d'erreur */}
        {isError && !isLoading && !isSuccess && (
          <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}
        
        {/* Texte du bouton */}
        <span className={cn(
          "transition-opacity duration-200",
          isLoading && "opacity-70"
        )}>
          {isLoading ? "Chargement..." : 
           isSuccess ? "Succès !" :
           isError ? "Erreur" : children}
        </span>
      </button>
    </AnimatedElement>
  );
}

// =============================================================================
// 📱 COMPOSANT MODAL AVEC FORMULAIRE ANIMÉ
// =============================================================================

export interface AnimatedFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function AnimatedFormModal({
  isOpen,
  onClose,
  title,
  children,
  className
}: AnimatedFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <AnimatedElement
        animation="scaleIn"
        trigger="onMount"
      >
        <div
          className={cn(
            "bg-background border rounded-lg shadow-xl max-w-md w-full mx-4",
            "max-h-[90vh] overflow-y-auto",
            className
          )}
          onClick={(e: any) => e.stopPropagation()}
        >
        <div className="p-6">
          {/* En-tête */}
          <AnimatedElement
            animation="fadeInDown"
            trigger="onMount"
            delay={100}
            className="mb-6"
          >
            <h2 className="text-xl font-semibold">{title}</h2>
          </AnimatedElement>
          
          {/* Contenu du formulaire */}
          <div className="space-y-4">
            {children}
          </div>
        </div>
        </div>
      </AnimatedElement>
    </div>
  );
}

// =============================================================================
// 🎨 STYLES CSS PERSONNALISÉS POUR LES ANIMATIONS
// =============================================================================

// Ces classes peuvent être ajoutées à votre fichier CSS global ou Tailwind config
export const formAnimationClasses="
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
  
  .animate-bounce-subtle {
    animation: bounce-subtle 0.6s ease-in-out;
  }
";

export default AnimatedForm;