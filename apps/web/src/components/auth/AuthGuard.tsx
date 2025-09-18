'use client';

import React, { type ReactNode } from 'react';
import { useAuthGuard, type AuthGuardOptions } from '@/hooks/useAuthGuard';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';
import { UnauthorizedMessage } from '@/components/auth/UnauthorizedMessage';

export interface AuthGuardProps extends AuthGuardOptions {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  loadingComponent,
  ...guardOptions
}) => {
  const { isLoading, isAuthorized, user } = useAuthGuard(guardOptions);

  // Affichage du loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  // Affichage si non autorisé
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {fallback || <UnauthorizedMessage />}
      </div>
    );
  }

  // Affichage du contenu autorisé
  return <>{children}</>;
};