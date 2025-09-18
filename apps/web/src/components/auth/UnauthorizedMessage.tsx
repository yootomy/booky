'use client';

import React from 'react';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface UnauthorizedMessageProps {
  title?: string;
  message?: string;
  showLogin?: boolean;
  showRegister?: boolean;
}

export const UnauthorizedMessage: React.FC<UnauthorizedMessageProps> = ({
  title = 'Connexion Requise',
  message = 'Vous devez être connecté pour accéder à cette page.',
  showLogin = true,
  showRegister = true,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Lock className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold text-blue-800">
          {title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          {message}
        </p>
        
        <div className="space-y-2">
          {showLogin && (
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
          )}
          
          {showRegister && (
            <Button
              onClick={() => window.location.href = '/register'}
              variant="outline"
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              S'inscrire
            </Button>
          )}
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};