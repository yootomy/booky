'use client';

import React from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewCategoryPage() {
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
                Nouvelle Catégorie
              </h1>
              <p className="text-muted-foreground">
                Créez une nouvelle catégorie pour organiser vos livres
              </p>
            </div>
          </div>

          {/* Info */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Information</CardTitle>
              <CardDescription>
                La création de catégories se fait directement depuis la page de gestion des catégories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pour créer une nouvelle catégorie, utilisez le formulaire disponible sur la page principale de gestion des catégories.
                </p>
                <Button onClick={() => router.push('/admin/categories')}>
                  Aller à la gestion des catégories
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}