'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterCredentials } from '@/types/auth';

export interface UseRegisterReturn {
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearError: () => void;
  clearSuccess: () => void;
}

export const useRegister = (): UseRegisterReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register: authRegister } = useAuth();
  const router = useRouter();

  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const result = await authRegister(credentials);

      if (result.success && result.user) {
        setSuccessMessage(
          result.user.emailVerified 
            ? 'Inscription réussie ! Bienvenue sur Booky.'
            : 'Inscription réussie ! Vérifiez votre email pour activer votre compte.'
        );
        
        // Redirection vers la page d'accueil pour les nouveaux utilisateurs
        setTimeout(() => {
          router.push('/');
        }, 2000);
        
        return true;
      } else {
        setError(result.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error("Registration hook error: ", error);
      setError("Une erreur inattendue s\"est produite');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authRegister, router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    register,
    isLoading,
    error,
    successMessage,
    clearError,
    clearSuccess,
  };
};