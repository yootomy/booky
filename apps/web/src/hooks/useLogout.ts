'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
}

export const useLogout = (): UseLogoutReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { logout: authLogout, user } = useAuth();
  const router = useRouter();

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      await authLogout();
      
      // Redirection différenciée selon le rôle précédent
      if (user?.role === 'ADMIN') {
        router.push('/login?message=Déconnexion admin réussie');
      } else {
        router.push('/?message=À bientôt !');
      }
    } catch (error) {
      console.error("Logout hook error: ", error);
      // Même en cas d'erreur, rediriger vers la page d'accueil
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [authLogout, user, router]);

  return {
    logout,
    isLoading,
  };
};