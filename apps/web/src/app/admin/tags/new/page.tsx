'use client';

import React from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewTagPage() {
  const router = useRouter();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Nouveau Tag
              </h1>
              <p className="text-muted-foreground">
                Créez un nouveau tag pour étiqueter vos livres
              </p>
            </div>
          </div>

          {/* Info */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Information</CardTitle>
              <CardDescription>
                La création de tags se fait directement depuis la page de gestion des tags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pour créer un nouveau tag, utilisez le formulaire disponible sur la page principale de gestion des tags.
                </p>
                <Button onClick={() => router.push('/admin/tags')}>
                  Aller à la gestion des tags
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}