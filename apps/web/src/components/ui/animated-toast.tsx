/**
 * AnimatedToast - Système de notifications animées
 * Toasts avec animations d'entrée/sortie fluides
 */

"use client";

import { useState, useEffect, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnimatedElement } from './animations';
import { Button } from './button';
import { cn } from '@/lib/utils';

// =============================================================================
// 🎯 TYPES ET INTERFACES
// =============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface AnimatedToastProps extends Toast {
  position?: ToastPosition;
  onClose: (id: string) => void;
}

// =============================================================================
// 🎨 CONFIGURATION DES STYLES ET ICÔNES
// =============================================================================

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-500'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-orange-50 border-orange-200 text-orange-800',
    iconClassName: 'text-orange-500'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-500'
  }
};

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
};

// =============================================================================
// 🍞 COMPOSANT TOAST INDIVIDUEL
// =============================================================================

export function AnimatedToast({
  id,
  type,
  title,
  description,
  duration = 5000,
  action,
  position = 'top-right',
  onClose
}: AnimatedToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const config = toastConfig[type];
  const Icon = config.icon;

  // Auto-close après la durée spécifiée
  useEffect(() => {
    if (duration > 0) {
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(progressTimer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(id);
    }, 200); // Attendre que l'animation de sortie se termine
  };

  return (
    <div className={cn(
      'fixed z-50 pointer-events-none',
      positionClasses[position]
    )}>
      <AnimatedElement
        animation="slideInRight"
        trigger="onMount"
        className={cn(
          'pointer-events-auto',
          'transition-all duration-200 ease-out',
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
        )}
      >
        <div className={cn(
          'relative min-w-80 max-w-md p-4 rounded-lg border shadow-lg',
          'backdrop-blur-sm bg-white/95 dark:bg-gray-900/95',
          config.className
        )}>
          {/* Barre de progression */}
          {duration > 0 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 rounded-t-lg overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all duration-100 ease-linear',
                  type === 'success' && 'bg-green-500',
                  type === 'error' && 'bg-red-500',
                  type === 'warning' && 'bg-orange-500',
                  type === 'info' && 'bg-blue-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex gap-3">
            {/* Icône */}
            <div className="flex-shrink-0 pt-0.5">
              <Icon className={cn('w-5 h-5', config.iconClassName)} />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium leading-5">
                    {title}
                  </h4>
                  {description && (
                    <p className="mt-1 text-sm opacity-80 leading-5">
                      {description}
                    </p>
                  )}
                </div>

                {/* Bouton de fermeture */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Action button */}
              {action && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 px-3 text-xs',
                      type === 'success' && 'border-green-300 hover:bg-green-100',
                      type === 'error' && 'border-red-300 hover:bg-red-100',
                      type === 'warning' && 'border-orange-300 hover:bg-orange-100',
                      type === 'info' && 'border-blue-300 hover:bg-blue-100'
                    )}
                    onClick={() => {
                      action.onClick();
                      handleClose();
                    }}
                  >
                    {action.label}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedElement>
    </div>
  );
}

// =============================================================================
// 📱 CONTENEUR DE TOASTS
// =============================================================================

export interface ToastContainerProps {
  toasts: Toast[];
  position?: ToastPosition;
  onClose: (id: string) => void;
  className?: string;
}

export function ToastContainer({
  toasts,
  position = 'top-right',
  onClose,
  className
}: ToastContainerProps) {
  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      <div className="relative w-full h-full">
        {toasts.map((toast) => (
          <AnimatedToast
            key={toast.id}
            {...toast}
            position={position}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// 🎪 HOOK POUR GÉRER LES TOASTS
// =============================================================================

export function useToasts(maxToasts = 5) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts(current => {
      const updated = [newToast, ...current];
      return updated.slice(0, maxToasts); // Limiter le nombre de toasts
    });

    return id;
  };

  const removeToast = (id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  // Fonctions helper pour différents types
  const success = (title: string, options?: Partial<Toast>) => 
    addToast({ type: 'success', title, ...options });

  const error = (title: string, options?: Partial<Toast>) => 
    addToast({ type: 'error', title, ...options });

  const warning = (title: string, options?: Partial<Toast>) => 
    addToast({ type: 'warning', title, ...options });

  const info = (title: string, options?: Partial<Toast>) => 
    addToast({ type: 'info', title, ...options });

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info
  };
}

// =============================================================================
// 🌈 COMPOSANTS DE TOASTS PRÉDÉFINIS
// =============================================================================

export const SuccessToast = ({ message, action }: { message: string; action?: Toast['action'] }) => (
  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium">{message}</p>
      {action && (
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto text-green-600 hover:text-green-700"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  </div>
);

export const ErrorToast = ({ message }: { message: string }) => (
  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export default AnimatedToast;