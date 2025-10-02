'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export interface AuthGuardOptions {
  requireAuth?: boolean;
  requiredRole?: UserRole;
  requireEmailVerification?: boolean;
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

export const useAuthGuard = (options: AuthGuardOptions = {}) => {
  const {
    requireAuth = false,
    requiredRole,
    requireEmailVerification = false,
    redirectTo,
    allowedRoles = [],
  } = options;

  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    isEmailVerified,
    hasRole 
  } = useAuth();
  
  const router = useRouter();

  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (isLoading) return;

    // Vérifier l'authentification
    if (requireAuth && !isAuthenticated) {
      const loginUrl = redirectTo || '/login';
      const currentPath = window.location.pathname;
      router.push(`${loginUrl}?redirect=${encodeURIComponent(currentPath)}` as any);
      return;
    }

    // Vérifier le rôle spécifique
    if (requiredRole && !hasRole(requiredRole)) {
      if (!isAuthenticated) {
        router.push(`/login` as any);
      } else {
        // Utilisateur connecté mais pas le bon rôle
        router.push(`/unauthorized` as any);
      }
      return;
    }

    // Vérifier les rôles autorisés
    if (allowedRoles.length > 0 && isAuthenticated) {
      const hasAllowedRole = allowedRoles.some(role => hasRole(role));
      if (!hasAllowedRole) {
        router.push('/unauthorized' as any);
        return;
      }
    }

    // Vérifier la vérification email
    if (requireEmailVerification && isAuthenticated && !isEmailVerified) {
      router.push('/verify-email' as any);
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    isEmailVerified,
    user,
    requireAuth,
    requiredRole,
    requireEmailVerification,
    redirectTo,
    allowedRoles,
    hasRole,
    router,
  ]);

  return {
    isLoading,
    isAuthenticated,
    user,
    isAuthorized: isAuthenticated && (
      !requiredRole || hasRole(requiredRole)
    ) && (
      allowedRoles.length === 0 || allowedRoles.some(role => hasRole(role))
    ) && (
      !requireEmailVerification || isEmailVerified
    ),
  };
};