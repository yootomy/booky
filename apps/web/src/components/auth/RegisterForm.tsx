'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold text-green-800">
            Inscription réussie !
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Vous allez être redirigé automatiquement...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          Inscription
        </CardTitle>
        <CardDescription>
          Créez votre compte pour rejoindre la communauté Booky
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Affichage des erreurs */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Champ Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="votre@email.com"
                className="pl-10"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Champ Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('username')}
                id="username"
                type="text"
                placeholder="votre_pseudo"
                className="pl-10"
                aria-invalid={!!errors.username}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optionnel - sera affiché publiquement sur vos questions
            </p>
          </div>

          {/* Champ Nom complet */}
          <div className="space-y-2">
            <Label htmlFor="nom_complet">Nom complet</Label>
            <Input
              {...register('nom_complet')}
              id="nom_complet"
              type="text"
              placeholder="Votre nom complet"
              aria-invalid={!!errors.nom_complet}
            />
            {errors.nom_complet && (
              <p className="text-sm text-destructive">{errors.nom_complet.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Optionnel - utilisé pour personnaliser votre expérience
            </p>
          </div>

          {/* Champ Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Mot de passe <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Champ Confirmation mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirmer le mot de passe <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                aria-invalid={!!errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Force du mot de passe */}
          {password && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Force du mot de passe:</div>
              <div className="flex space-x-1">
                <div className={`h-1 w-1/4 rounded ${password.length >= 6 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                <div className={`h-1 w-1/4 rounded ${/[A-Z]/.test(password) ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                <div className={`h-1 w-1/4 rounded ${/[a-z]/.test(password) ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                <div className={`h-1 w-1/4 rounded ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
              </div>
            </div>
          )}

          {/* Bouton d'inscription */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Inscription...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                S'inscrire
              </>
            )}
          </Button>
        </form>

        {/* Lien de connexion */}
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <a
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Se connecter
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};