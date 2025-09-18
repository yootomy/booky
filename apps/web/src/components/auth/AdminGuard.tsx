'use client';

import React, { type ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AdminUnauthorizedMessage: React.FC = () => (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader className="text-center space-y-2">
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <CardTitle className="text-xl font-bold text-red-800">
        Accès Administrateur Requis
      </CardTitle>
    </CardHeader>
    
    <CardContent className="text-center space-y-4">
      <p className="text-muted-foreground">
        Cette page est réservée aux administrateurs. Vous n'avez pas les permissions nécessaires pour accéder à ce contenu.
      </p>
      
      <div className="space-y-2">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="w-full"
        >
          Retour
        </Button>
        
        <Button
          onClick={() => window.location.href = '/'}
          className="w-full"
        >
          Accueil
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
}) => {
  return (
    <AuthGuard
      requireAuth={true}
      requiredRole="ADMIN"
      fallback={fallback || <AdminUnauthorizedMessage />}
    >
      {children}
    </AuthGuard>
  );
};