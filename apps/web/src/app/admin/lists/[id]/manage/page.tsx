'use client';

import React, { useEffect, useState, use } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, List, Loader2, Search, Plus, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { ListBooksManager } from '@/components/admin/list-books-manager';
import { AddBooksToListDialog } from '@/components/admin/add-books-to-list-dialog';

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

export default function ManageListPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [list, setList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addBooksDialogOpen, setAddBooksDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Unwrap params using React.use()
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/lists/${resolvedParams.id}`);

        if (!response.success) {
          throw new Error("Liste non trouvée");
        }

        const data = response.data;
        if (data.success) {
          setList(data.data);
        } else {
          throw new Error(data.error || 'Erreur lors du chargement');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
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

  const handleBookAdded = () => {
    // Rafraîchir la liste après ajout d'un livre
    setRefreshTrigger(prev => prev + 1);
    setAddBooksDialogOpen(false);

    // Mettre à jour le compteur de livres
    if (list) {
      setList(prev => prev ? {
        ...prev,
        _count: { list_books: prev._count.list_books + 1 }
      } : null);
    }
  };

  const handleBookRemoved = () => {
    // Rafraîchir la liste après suppression d'un livre
    setRefreshTrigger(prev => prev + 1);

    // Mettre à jour le compteur de livres
    if (list) {
      setList(prev => prev ? {
        ...prev,
        _count: { list_books: Math.max(0, prev._count.list_books - 1) }
      } : null);
    }
  };

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
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: list.couleur }}
                />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {list.nom}
                </h1>
                <Badge variant={list.est_publique ? "default" : "secondary"}>
                  {list.est_publique ? "Publique" : "Privée"}
                </Badge>
              </div>
              {list.description && (
                <p className="text-muted-foreground">{list.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{list._count.list_books} livre{list._count.list_books !== 1 ? 's' : ''}</span>
                </div>
                <span>•</span>
                <span>
                  Créée le {new Date(list.date_creation).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            <Button
              onClick={() => setAddBooksDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des livres
            </Button>
          </div>

          {/* Search and Actions */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans cette liste..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/lists/${list.id}/edit`)}
                  >
                    Modifier la liste
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/lists/${list.id}`)}
                  >
                    Voir publiquement
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Books Management */}
          <ListBooksManager
            listId={resolvedParams.id}
            searchQuery={searchQuery}
            refreshTrigger={refreshTrigger}
            onBookRemoved={handleBookRemoved}
          />

          {/* Add Books Dialog */}
          <AddBooksToListDialog
            open={addBooksDialogOpen}
            onOpenChange={setAddBooksDialogOpen}
            listId={resolvedParams.id}
            listName={list.nom}
            onBookAdded={handleBookAdded}
          />
        </div>
      </div>
    </AdminGuard>
  );
}