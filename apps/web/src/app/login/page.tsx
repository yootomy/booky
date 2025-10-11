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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background transition-colors duration-300">
      <div className="w-full max-w-md space-y-8">
        {/* Header simple */}
        <div className="text-center space-y-4">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
            style={{
              fontFamily: 'Playfair Display, serif'
            }}
          >
            Connexion
          </h1>
          <p
            className="text-sm text-foreground/70"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Reconnectez-vous à votre bibliothèque
          </p>
        </div>

        {/* Message d'information si présent */}
        {message && (
          <div
            className="p-4 rounded-xl text-sm bg-primary/5 text-primary border border-primary/10"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {message}
          </div>
        )}

        {/* Login form */}
        <LoginForm
          redirectPath={redirectPath}
          onSuccess={() => {
            // La redirection est gérée par le hook useLogin
          }}
        />

        {/* Navigation vers register */}
        <div className="text-center space-y-4">
          <div className="h-px w-full bg-primary/20" />
          <p
            className="text-sm text-foreground/70"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Pas encore de compte ?{' '}
            <button
              onClick={() => router.push('/register')}
              className="font-medium hover:underline transition-all duration-200 text-primary hover:text-primary/80"
            >
              Créer un compte
            </button>
          </p>
        </div>
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
