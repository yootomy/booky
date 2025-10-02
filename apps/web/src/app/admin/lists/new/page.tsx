'use client';

import React from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ListForm } from '@/components/forms/list-form';

export default function NewListPage() {
  const router = useRouter();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center mb-8 space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Nouvelle Liste
              </h1>
              <p className="text-muted-foreground">
                Créez une nouvelle liste personnalisée de livres
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <List className="h-5 w-5 text-primary" />
                <span>Informations de la liste</span>
              </CardTitle>
              <CardDescription>
                Remplissez les informations de votre nouvelle liste personnalisée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListForm
                onSuccess={() => router.push("/admin/lists")}
                onCancel={() => router.back()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}