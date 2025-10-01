'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, CheckCircle } from 'lucide-react';
import { useRegister } from '@/hooks/useRegister';
import { RegisterCredentials } from '@/types/auth';

// Schéma de validation Zod
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'L\'email est requis')
      .email('Veuillez entrer un email valide'),
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
      ),
    confirmPassword: z
      .string()
      .min(1, 'Veuillez confirmer votre mot de passe'),
    nom_complet: z
      .string()
      .optional(),
    username: z
      .string()
      .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
      .max(20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
      )
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerUser,
    isLoading,
    error,
    successMessage,
    clearError,
    clearSuccess
  } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nom_complet: '',
      username: '',
    },
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    clearSuccess();

    const credentials: RegisterCredentials = {
      email: data.email,
      password: data.password,
      nom_complet: data.nom_complet || undefined,
      username: data.username || undefined,
    };

    const success = await registerUser(credentials);

    if (success && onSuccess) {
      onSuccess();
    }
  };

  // Affichage du message de succès
  if (successMessage) {
    return (
      <div className={`w-full text-center space-y-6 ${className || ''}'}>
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2
            className="text-2xl font-bold text-green-600"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Bienvenue dans le cercle !
          </h2>
        </div>

        <div className="p-6 rounded-xl border-l-4 bg-green-500/5 text-green-600 border-l-green-500" style={{ fontFamily: 'Inter, sans-serif' }}>
          {successMessage}
        </div>

        <div>
          <p className="text-sm text-foreground/70" style={{ fontFamily: 'Inter, sans-serif' }}>
            Vous allez être redirigé automatiquement vers votre nouvelle bibliothèque...
          </p>
          <div className="mt-3 flex justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className || ''}'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Affichage des erreurs */}
        {error && (
          <div
            className="p-4 rounded-lg text-sm border-l-4 bg-destructive/5 text-destructive border-l-destructive"
            style={{
              fontFamily: 'Inter, sans-serif'
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
            Adresse email <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
            <input
              {...register('email')}
              id="email"
              type="email"
              placeholder="votre@email.com"
              className="w-full pl-11 pr-4 py-4 rounded-xl border border-border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary bg-background dark:bg-card text-foreground shadow-md placeholder:text-muted-foreground"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px'
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

        {/* Champ Username */}
        <div className="space-y-3">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Nom d'utilisateur
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              {...register('username')}
              id="username"
              type="text"
              placeholder="votre_pseudo"
              className="w-full pl-11 pr-4 py-4 rounded-xl border border-border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary bg-background dark:bg-card text-foreground shadow-md placeholder:text-muted-foreground"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px'
              }}
              aria-invalid={!!errors.username}
            />
          </div>
          {errors.username && (
            <p
              className="text-sm text-destructive"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {errors.username.message}
            </p>
          )}
          <p
            className="text-xs text-muted-foreground"
            style={{
              fontFamily: 'Inter, sans-serif',
              opacity: 0.7
            }}
          >
            Optionnel - sera affiché publiquement sur vos questions
          </p>
        </div>

        {/* Champ Nom complet */}
        <div className="space-y-3">
          <label
            htmlFor="nom_complet"
            className="block text-sm font-medium text-foreground"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Nom complet
          </label>
          <input
            {...register('nom_complet')}
            id="nom_complet"
            type="text"
            placeholder="Votre nom complet"
            className="w-full px-4 py-4 rounded-xl border border-border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary bg-background dark:bg-card text-foreground shadow-md placeholder:text-muted-foreground"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px'
            }}
            aria-invalid={!!errors.nom_complet}
          />
          {errors.nom_complet && (
            <p
              className="text-sm text-destructive"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {errors.nom_complet.message}
            </p>
          )}
          <p
            className="text-xs text-muted-foreground"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Optionnel - utilisé pour personnaliser votre expérience
          </p>
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
            Mot de passe <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-4 rounded-xl border border-border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary bg-background dark:bg-card text-foreground shadow-md placeholder:text-muted-foreground"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px'
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

        {/* Champ Confirmation mot de passe */}
        <div className="space-y-3">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground"
            style={{
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Confirmer le mot de passe <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-4 rounded-xl border border-border outline-none transition-all duration-200 focus:ring-2 focus:ring-primary bg-background dark:bg-card text-foreground shadow-md placeholder:text-muted-foreground"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px'
              }}
              aria-invalid={!!errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 hover:opacity-80 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              className="text-sm text-destructive"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Force du mot de passe */}
        {password && (
          <div className="space-y-2">
            <div
              className="text-xs font-medium text-foreground"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Force du mot de passe:
            </div>
            <div className="flex space-x-1">
              <div
                className="h-2 flex-1 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: password.length >= 6 ? '#F59E0B' : 'hsl(var(--muted))'
                }}
              />
              <div
                className="h-2 flex-1 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: /[A-Z]/.test(password) ? '#F59E0B' : 'hsl(var(--muted))'
                }}
              />
              <div
                className="h-2 flex-1 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: /[a-z]/.test(password) ? '#F59E0B' : 'hsl(var(--muted))'
                }}
              />
              <div
                className="h-2 flex-1 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: /\d/.test(password) ? '#22C55E' : 'hsl(var(--muted))'
                }}
              />
            </div>
          </div>
        )}

        {/* Bouton d'inscription */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-primary to-accent shadow-xl"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div
                className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"
              />
              Inscription en cours...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <UserPlus className="h-5 w-5 mr-3" />
              Rejoindre le cercle
            </div>
          )}
        </button>
      </form>
    </div>
  );
};