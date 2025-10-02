'use client';

import React from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminBookForm } from '@/components/forms/admin-book-form';

export default function NewBookPage() {
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
                Nouveau Livre
              </h1>
              <p className="text-muted-foreground">
                Ajoutez un nouveau livre à votre bibliothèque
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-4xl mx-auto">
            <AdminBookForm 
              onSuccess={(book) => {
                router.push('/admin/books/' + book.id + '/edit');
              }}
              onCancel={() => router.back()}
            />
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}