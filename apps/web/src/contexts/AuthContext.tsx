'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode,
  useCallback 
} from 'react';
import { 
  AuthUser, 
  AuthState, 
  AuthContextType, 
  LoginCredentials, 
  RegisterCredentials,
  AuthResponse,
  UserRole 
} from '@/types/auth';

// Configuration - Utiliser l'URL du serveur API
const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
const TOKEN_STORAGE_KEY = 'booky_auth_token';
const USER_STORAGE_KEY = 'booky_auth_user';

// Contexte d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider d'authentification
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    isEmailVerified: false,
  });

  // Utilitaires de stockage
  const saveAuthData = useCallback((user: AuthUser, token: string, remember: boolean = false) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_STORAGE_KEY, token);
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const loadAuthData = useCallback(() => {
    // Essayer localStorage puis sessionStorage
    let token = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    let userStr = localStorage.getItem(USER_STORAGE_KEY) || sessionStorage.getItem(USER_STORAGE_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        return { user, token };
      } catch (error) {
        console.error("Error parsing stored auth data: ", error);
        clearAuthData();
      }
    }
    return null;
  }, [clearAuthData]);

  // Fonction pour mettre à jour l'état d'authentification
  const updateAuthState = useCallback((user: AuthUser | null, token: string | null) => {
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      isEmailVerified: user?.emailVerified || false,
    });
  }, []);

  // Fonction de connexion
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.remember,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const { user } = data;
        // Le token est dans les cookies, nous récupérons juste l'utilisateur
        saveAuthData(user, 'cookie-based', credentials.remember || false);
        updateAuthState(user, 'cookie-based');
        
        return {
          success: true,
          user,
          message: data.message,
        };
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error during login",
      };
    }
  }, [saveAuthData, updateAuthState]);

  // Fonction d'inscription
  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const { user } = data;
        // Auto-login après inscription réussie
        saveAuthData(user, 'cookie-based', false);
        updateAuthState(user, 'cookie-based');
        
        return {
          success: true,
          user,
          message: data.message,
        };
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: data.error || 'Registration failed',
        };
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Network error during registration",
      };
    }
  }, [saveAuthData, updateAuthState]);

  // Fonction de déconnexion
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Appeler l'API de déconnexion pour invalider le cookie
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Nettoyer les données locales dans tous les cas
      clearAuthData();
      updateAuthState(null, null);
    }
  }, [clearAuthData, updateAuthState]);

  // Fonction pour rafraîchir la session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const remember = !!localStorage.getItem(TOKEN_STORAGE_KEY);
          saveAuthData(data.user, 'cookie-based', remember);
          updateAuthState(data.user, 'cookie-based');
          return;
        }
      }

      // Session invalide, nettoyer
      clearAuthData();
      updateAuthState(null, null);
    } catch (error) {
      console.error('Session refresh error: ', error);
      clearAuthData();
      updateAuthState(null, null);
    }
  }, [saveAuthData, updateAuthState, clearAuthData]);

  // Fonction pour vérifier l'email
  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    if (!state.user) return false;
    
    try {
      await refreshSession();
      return state.user?.emailVerified || false;
    } catch (error) {
      console.error("Email verification check error: ", error);
      return false;
    }
  }, [state.user, refreshSession]);

  // Utilitaires de permissions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.user) return false;
    
    // Logique de permissions simple basée sur les rôles
    switch (permission) {
      case 'create_books':
      case 'edit_books':
      case 'delete_books':
      case 'answer_questions':
      case 'manage_users':
      case 'export_data':
        return state.user.role === 'ADMIN';
        
      case 'ask_questions':
      case 'like_questions':
      case 'view_books':
        return state.isAuthenticated;
        
      default:
        return false;
    }
  }, [state.user, state.isAuthenticated]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return state.user?.role === role;
  }, [state.user]);

  const isRole = useCallback((role: UserRole): boolean => {
    return state.user?.role === role;
  }, [state.user]);

  // Initialisation de l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      // Tenter de charger les données stockées
      const storedAuth = loadAuthData();
      
      if (storedAuth) {
        // Vérifier si la session est toujours valide
        await refreshSession();
      } else {
        // Pas de données stockées, vérifier s'il y a un cookie de session
        await refreshSession();
      }
    };

    initAuth();
  }, [loadAuthData, refreshSession]);

  // Auto-refresh de la session toutes les 30 minutes
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        refreshSession();
      }, 30 * 60 * 1000); // 30 minutes

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated, refreshSession]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshSession,
    checkEmailVerification,
    hasPermission,
    hasRole,
    isRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;