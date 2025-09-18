'use client';

import React, { useState, useEffect } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { BooksManager } from '@/components/admin/books-manager';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminBooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Invalider le cache à chaque fois qu'on revient sur cette page
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['admin-books'],
      exact: false
    });
  }, [queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['admin-books'],
      exact: false
    });
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Gestion des Livres
              </h1>
              <p className="text-muted-foreground">
                Gérez votre bibliothèque et vos critiques
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button
                onClick={() => router.push('/admin/books/new')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Livre
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre, auteur, ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                  </Button>
                  <Badge variant="secondary" className="px-3 py-1">
                    Tous les livres
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Books Management Component */}
          <BooksManager searchQuery={searchQuery} />
        </div>
      </div>
    </AdminGuard>
  );
}