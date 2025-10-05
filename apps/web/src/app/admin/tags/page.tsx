'use client';

import React, { useState } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Tag as TagIcon, 
  Plus, 
  Search, 
  Filter, 
  Hash,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Star
} from 'lucide-react';
import { TagsManager } from '@/components/admin/tags-manager';
import { useRouter } from 'next/navigation';

export default function AdminTagsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Gestion des Tags
              </h1>
              <p className="text-muted-foreground">
                Gérez les genres, tropes, triggers et tags personnalisés
              </p>
            </div>
            
            <Button
              onClick={() => router.push("/admin/tags/new")}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Tag
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, type, couleur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags Management Component */}
          <TagsManager searchQuery={searchQuery} />
        </div>
      </div>
    </AdminGuard>
  );
}