/**
 * Gestionnaire d'erreurs global pour l'application
 * Centralise la gestion des erreurs API, réseau et validation
 */

import { toast } from "sonner";
import type { ApiError } from "../types/api";

// ===== TYPES D'ERREURS =====

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorLog extends ErrorContext {
  error: ApiError | Error;
  level: "error" | "warning" | "info";
  handled: boolean;
}

// ===== CONFIGURATION =====

const ERROR_CONFIG = {
  // Activer les logs en production
  enableLogging: process.env.NODE_ENV !== "production",
  
  // Erreurs à ne pas afficher à l'utilisateur
  silentErrorCodes: ["NETWORK_ERROR", "ABORT_ERROR"],
  
  // Erreurs nécessitant une reconnexion
  authErrorCodes: ["INVALID_TOKEN", "SESSION_EXPIRED", "UNAUTHORIZED"],
  
  // Délai avant retry automatique (ms)
  retryDelay: 1000,
  
  // Nombre maximum de tentatives
  maxRetries: 3,
} as const;

// ===== STOCKAGE DES ERREURS =====

let errorLogs: ErrorLog[] = [];
const maxLogSize = 100;

function addErrorLog(log: ErrorLog) {
  errorLogs.unshift(log);
  if (errorLogs.length > maxLogSize) {
    errorLogs = errorLogs.slice(0, maxLogSize);
  }
}

// ===== CLASSIFICATION DES ERREURS =====

export function classifyError(error: unknown): {
  type: "api" | "network" | "validation" | "auth" | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  recoverable: boolean;
} {
  if (isApiError(error)) {
    const status = error.statusCode;
    
    if (status === 401 || status === 403) {
      return { type: "auth", severity: "high", recoverable: false };
    }
    
    if (status >= 400 && status < 500) {
      return { type: "validation", severity: "medium", recoverable: true };
    }
    
    if (status >= 500) {
      return { type: "api", severity: "high", recoverable: true };
    }
  }
  
  if (error instanceof TypeError || (error as any)?.name === "NetworkError") {
    return { type: "network", severity: "medium", recoverable: true };
  }
  
  return { type: "unknown", severity: "medium", recoverable: false };
}

// ===== VÉRIFICATION DE TYPE =====

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "success" in error &&
    error.success === false &&
    "error" in error
  );
}

// ===== FORMATAGE DES MESSAGES =====

export function getErrorMessage(error: unknown, context?: ErrorContext): string {
  if (isApiError(error)) {
    // Messages spécifiques par code d'erreur
    if (error.statusCode === 401) {
      return "Votre session a expiré. Veuillez vous reconnecter.";
    }
    
    if (error.statusCode === 403) {
      return "Vous n"avez pas les permissions nécessaires pour cette action.';
    }
    
    if (error.statusCode === 404) {
      const resource = context?.action?.includes("book") ? "livre" : "ressource";
      return `${resource}`introuvable.";
    }
    
    if (error.statusCode === 422) {
      return "Données invalides. Veuillez vérifier vos informations.";
    }
    
    if (error.statusCode >= 500) {
      return "Erreur serveur temporaire. Veuillez réessayer.";
    }
    
    // Message de l'API ou message générique
    return error.error || "Une erreur inattendue s"est produite.';
  }
  
  if (error instanceof Error) {
    // Erreurs réseau
    if (error.name === "NetworkError" || !navigator.onLine) {
      return "Erreur de connexion. Vérifiez votre connexion internet.";
    }
    
    if (error.name === "AbortError") {
      return "Opération annulée.";
    }
    
    if (error.name === "TimeoutError") {
      return "La requête a pris trop de temps. Veuillez réessayer.";
    }
    
    return error.message;
  }
  
  return "Une erreur inattendue s"est produite.';
}

export function getErrorTitle(error: unknown, context?: ErrorContext): string {
  const classification = classifyError(error);
  
  switch (classification.type) {
    case "auth":
      return "Problème d"authentification';
    case "network":
      return "Problème de connexion";
    case "validation":
      return "Données incorrectes";
    case "api":
      return `Erreur du serveur`;
    default:
      return context?.action 
        ? `Erreur lors de ${context.action}`
        : "Erreur";
  }
}

// ===== ACTIONS DE RÉCUPÉRATION =====

export function getRecoveryActions(error: unknown, context?: ErrorContext) {
  const classification = classifyError(error);
  const actions: Array<{ label: string; action: () => void }> = [];
  
  if (classification.type === "network") {
    actions.push({
      label: "Réessayer",
      action: () => {
        // Relancer la dernière action si possible
        if (context?.metadata?.retry) {
          (context.metadata.retry as () => void)();
        } else {
          window.location.reload();
        }
      }
    });
  }
  
  if (classification.type === "auth") {
    actions.push({
      label: "Se reconnecter",
      action: () => {
        window.location.href="/login";
      }
    });
  }
  
  if (classification.severity === "high" || classification.severity === "critical") {
    actions.push({
      label: "Signaler le problème",
      action: () => {
        // Ouvrir un modal de rapport d'erreur ou rediriger vers support
        console.log("Report error:", { error, context });
      }
    });
  }
  
  return actions;
}

// ===== GESTION PRINCIPALE DES ERREURS =====

export function handleError(
  error: unknown,
  context?: ErrorContext,
  options?: {
    showToast?: boolean;
    logError?: boolean;
    throwAfterHandle?: boolean;
  }
) {
  const {
    showToast = true,
    logError = ERROR_CONFIG.enableLogging,
    throwAfterHandle = false
  } = options || {};
  
  const classification = classifyError(error);
  const errorMessage = getErrorMessage(error, context);
  const errorTitle = getErrorTitle(error, context);
  const recoveryActions = getRecoveryActions(error, context);
  
  // Log de l'erreur
  if (logError) {
    const errorLog: ErrorLog = {
      error: isApiError(error) ? error : error instanceof Error ? error : new Error(String(error)),
      level: classification.severity === "critical" ? "error" : 
             classification.severity === "high" ? "error" : "warning",
      handled: true,
      timestamp: new Date().toISOString(),
      ...context
    };
    
    addErrorLog(errorLog);
    console.error("[ERROR HANDLER]", {
      error,
      context,
      classification,
      recoveryActions
    });
  }
  
  // Affichage du toast
  if (showToast && !ERROR_CONFIG.silentErrorCodes.some(code => 
    isApiError(error) && error.error?.includes(code)
  )) {
    const toastAction = recoveryActions[0];
    
    if (classification.severity === "critical" || classification.severity === "high") {
      toast.error(errorTitle, {
        description: errorMessage,
        duration: 8000,
        action: toastAction ? {
          label: toastAction.label,
          onClick: toastAction.action
        } : undefined
      });
    } else if (classification.severity === "medium") {
      toast.warning(errorTitle, {
        description: errorMessage,
        duration: 5000,
        action: toastAction ? {
          label: toastAction.label,
          onClick: toastAction.action
        } : undefined
      });
    } else {
      toast.info(errorTitle, {
        description: errorMessage,
        duration: 3000
      });
    }
  }
  
  // Actions automatiques selon le type d'erreur
  if (classification.type === "auth" && isApiError(error)) {
    // Nettoyer les tokens et rediriger
    if (typeof window !== "undefined") {
      localStorage.clear();
      setTimeout(() => {
        window.location.href="/login";
      }, 1000);
    }
  }
  
  if (throwAfterHandle) {
    throw error;
  }
  
  return {
    handled: true,
    classification,
    message: errorMessage,
    title: errorTitle,
    recoveryActions
  };
}

// ===== WRAPPER POUR FONCTIONS ASYNC =====

export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext,
  options?: { showToast?: boolean; logError?: boolean }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, options);
      throw error; // Re-throw pour permettre à l'appelant de gérer
    }
  }) as T;
}

// ===== RETRY AUTOMATIQUE =====

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: unknown) => void;
  }
): Promise<T> {
  const {
    maxRetries = ERROR_CONFIG.maxRetries,
    delay = ERROR_CONFIG.retryDelay,
    shouldRetry = (error: unknown) => classifyError(error).recoverable,
    onRetry
  } = options || {};
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      onRetry?.(attempt, error);
      
      // Délai exponentiel
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

// ===== MONITORING ET REPORTING =====

export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs];
}

export function clearErrorLogs() {
  errorLogs = [];
}

export function getErrorStats() {
  const now = Date.now();
  const last24h = errorLogs.filter(
    log => now - new Date(log.timestamp || 0).getTime() < 24 * 60 * 60 * 1000
  );
  
  return {
    total: errorLogs.length,
    last24h: last24h.length,
    byLevel: errorLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byComponent: errorLogs.reduce((acc, log) => {
      const component = log.component || "unknown";
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
}