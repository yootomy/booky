'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Trash2 } from 'lucide-react';
import { booksApi } from '@/utils/orpc';
import { AdminBookForm } from '@/components/forms/admin-book-form';
import { useToast } from '@/hooks/use-toast';

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookId = params.id as string;

  // Vérification basique de l'ID
  if (!bookId || typeof bookId !== 'string') {
    return (
      <AdminGuard>
        <div className='min-h-screen bg-gradient-to-br from-background to-muted'>
          <div className="container mx-auto py-8 px-4">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">ID de livre invalide</p>
                <Button 
                  onClick={() => router.push("/admin/books")} 
                  className="mt-4"
                  variant="outline"
                >
                  Retour aux livres
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminGuard>
    );
  }

  const { 
    data: bookResponse, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      console.log("🔍 Fetching book:", bookId);
      const response = await booksApi.getById(bookId);
      console.log("📚 Book response:", response);
      return response;
    },
    enabled: !!bookId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(200 * (2 ** attemptIndex), 2000),
    staleTime: 0, // Toujours considérer comme stale pour forcer le refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const book = bookResponse?.data;

  // Auto-retry si pas de données après 3 secondes
  useEffect(() => {
    if (!book && !isLoading && !error) {
      const timer = setTimeout(() => {
        console.log("🔄 Auto-retry: refetching book data...");
        refetch();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [book, isLoading, error, refetch]);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce livre définitivement ?")) {
      return;
    }

    try {
      await booksApi.delete(bookId);
      toast({
        title: "Livre supprimé",
        description: "Le livre a été supprimé avec succès",
      });
      router.push("/admin/books");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le livre",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto py-8 px-4">
            <Card className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminGuard>
    );
  }

  // Afficher l'erreur seulement si il y a une vraie erreur OU si le livre n'existe vraiment pas après plusieurs tentatives
  if (error && error.message && !error.message.includes('stale')) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto py-8 px-4">
            <Card className="border-destructive">
              <CardContent className="pt-6 space-y-4">
                <p className="text-destructive">Livre non trouvé ou erreur lors du chargement</p>
                <p className="text-sm text-muted-foreground">
                  Erreur: {error.message || "Impossible de charger le livre"}
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => refetch()} 
                    variant="default"
                    size="sm"
                  >
                    Réessayer
                  </Button>
                  <Button 
                    onClick={() => router.push("/admin/books")} 
                    variant="outline"
                    size="sm"
                  >
                    Retour aux livres
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminGuard>
    );
  }

  // Afficher le loading pendant que les données sont en train de se charger
  if (isLoading || !book) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          <div className="container mx-auto py-8 px-4">
            <Card className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
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
                  Modifier le Livre
                </h1>
                <p className="text-muted-foreground">
                  {book.titre} par {book.auteur}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/books/${bookId}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-4xl mx-auto">
            <AdminBookForm 
              book={book}
              onSuccess={() => {
                toast({
                  title: "Livre mis à jour",
                  description: "Les modifications ont été sauvegardées",
                });
              }}
              onCancel={() => router.back()}
            />
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}