'use client';

import React, { useEffect, useState, use } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, List, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ListForm } from '@/components/forms/list-form';
import { useToast } from '@/hooks/use-toast';

interface CustomList {
  id: string;
  nom: string;
  description?: string;
  couleur: string;
  icone?: string;
  ordre_affichage: number;
  est_publique: boolean;
  date_creation: string;
  date_modification: string;
  _count: {
    list_books: number;
  };
}

export default function EditListPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [list, setList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/lists/${resolvedParams.id}');

        if (!response.ok) {
          throw new Error("Liste non trouvée");
        }

        const data = await response.json();
        if (data.success) {
          setList(data.data);
        } else {
          throw new Error(data.error || 'Erreur lors du chargement');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [resolvedParams.id, toast]);

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement de la liste...</p>
              </div>
            </div>
          </div>
        </div>
      </AdminGuard>
    );
  }

  if (error || !list) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <p className="text-destructive">Erreur: {error}</p>
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AdminGuard>
    );
  }

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
                Modifier la liste
              </h1>
              <p className="text-muted-foreground">
                Modifiez les informations de "{list.nom}"
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
                Modifiez les informations de votre liste personnalisée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListForm
                initialData={list}
                onSuccess={() => router.push("/admin/lists")}
                onCancel={() => router.back()}
                isEditing={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}