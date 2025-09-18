'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const rememberValue = watch('remember');

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
    <Card className={`w-full max-w-md mx-auto ${className || ''}`}>
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <LogIn className="h-6 w-6 text-primary" />
          Connexion
        </CardTitle>
        <CardDescription>
          Connectez-vous à votre compte Booky
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
            <Label htmlFor="email">Email</Label>
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

          {/* Champ Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
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

          {/* Se souvenir de moi */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberValue}
              onCheckedChange={(checked) => setValue('remember', !!checked)}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Se souvenir de moi
            </Label>
          </div>

          {/* Bouton de connexion */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Connexion...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter
              </>
            )}
          </Button>
        </form>

        {/* Liens additionnels */}
        <div className="mt-6 space-y-2 text-center">
          <div className="text-sm">
            <a
              href={"/forgot-password" as any}
              className="text-primary hover:underline font-medium"
            >
              Mot de passe oublié ?
            </a>
          </div>
          <div className="text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <a
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              S'inscrire
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};