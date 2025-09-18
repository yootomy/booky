'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';

function LoginContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectPath = searchParams?.get('redirect') || '/';
  const message = searchParams?.get('message');

  // Redirection si déjà connecté
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push(redirectPath as any);
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectPath]);

  // Affichage du loading pendant la vérification de l'auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Vérification de l'authentification..." />
      </div>
    );
  }

  // Si déjà connecté, ne pas afficher le formulaire
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Redirection en cours..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Message d'information si présent */}
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {/* Formulaire de connexion */}
        <LoginForm 
          redirectPath={redirectPath}
          onSuccess={() => {
            // La redirection est gérée par le hook useLogin
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Chargement..." />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
