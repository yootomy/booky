'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useLogin } from '@/hooks/useLogin';
import { LoginCredentials } from '@/types/auth';

// Schéma de validation Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Veuillez entrer un email valide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectPath,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    mode: 'onChange',
  });

  const rememberValue = watch(`remember`);

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    
    const credentials: LoginCredentials = {
      email: data.email,
      password: data.password,
      remember: data.remember || false,
    };

    const success = await login(credentials);
    
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className={`w-full space-y-6 ${className || ""}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Affichage des erreurs */}
        {error && (
          <div
            className="p-4 rounded-lg text-sm border-l-4 bg-destructive/5 text-destructive border-l-destructive"
            style={{
              fontFamily: "Inter, sans-serif"
            }}
          >
            {error}
          </div>
        )}

        {/* Champ Email */}
        <div className="space-y-3">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Adresse email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              {...register("email")}
              id="email"
              type="email"
              placeholder="votre@email.com"
              className="w-full pl-11 pr-4 py-4 rounded-xl border border-border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary bg-background dark:bg-card text-foreground shadow-md placeholder:text-muted-foreground"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: "16px"
              }}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && (
            <p
              className="text-sm text-destructive"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Champ Mot de passe */}
        <div className="space-y-3">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-4 rounded-xl border border-border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary bg-background dark:bg-card text-foreground shadow-md placeholder:text-muted-foreground"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: "16px"
              }}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:opacity-80 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              className="text-sm text-destructive"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Se souvenir de moi */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="remember"
            checked={rememberValue}
            onChange={(e) => setValue("remember", e.target.checked)}
            className="w-4 h-4 rounded border-0 focus:ring-2 focus:ring-offset-0 accent-primary bg-card"
          />
          <label
            htmlFor="remember"
            className="text-sm font-medium cursor-pointer text-foreground/70"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Se souvenir de moi
          </label>
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-primary to-accent shadow-xl"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: "16px"
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div
                className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"
              />
              Connexion en cours...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <LogIn className="h-5 w-5 mr-3" />
              Se connecter
            </div>
          )}
        </button>
      </form>

      {/* Lien mot de passe oublié */}
      <div className="text-center">
        <a
          href="/forgot-password"
          className="text-sm font-medium hover:underline transition-all duration-200 text-foreground/60 hover:text-primary"
          style={{
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Mot de passe oublié ?
        </a>
      </div>
    </div>
  );
};

export default LoginForm;
