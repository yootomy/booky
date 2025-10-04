'use client';

import React from 'react';
import { UnauthorizedMessage } from '@/components/auth/UnauthorizedMessage';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <UnauthorizedMessage
        title="Accès Non Autorisé"
        message="Vous n'avez pas les permissions nécessaires pour accéder à cette page."
        showLogin={false}
        showRegister={false}
      />
    </div>
  );
}