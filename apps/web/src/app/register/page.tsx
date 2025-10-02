'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';

function RegisterContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const message = searchParams?.get('message');

  // Redirection si déjà connecté
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Affichage du loading pendant la vérification de l'auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Vérification de l"authentification...' />
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
            className="text-3xl font-bold text-foreground"
            style={{
              fontFamily: 'Playfair Display, serif'
            }}
          >
            Inscription
          </h1>
          <p
            className="text-sm text-foreground/70"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Rejoignez la communauté des passionnés
          </p>
        </div>

        {/* Message d'information si présent */}
        {message && (
          <div
            className="p-4 rounded-xl text-sm bg-accent/5 text-accent border border-accent/10"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {message}
          </div>
        )}

        {/* Register form */}
        <RegisterForm
          onSuccess={() => {
            // La redirection est gérée par le hook useRegister
          }}
        />

        {/* Navigation vers login */}
        <div className="text-center space-y-4">
          <div className="h-px w-full bg-accent/20" />
          <p
            className="text-sm text-foreground/70"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Déjà un compte ?{' '}
            <button
              onClick={() => router.push('/login')}
              className="font-medium hover:underline transition-all duration-200 text-accent hover:text-accent/80"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Chargement..." />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}