'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/utils/orpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Folder, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  BookOpen,
  Palette,
  Plus,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/types/category';

interface CategoriesManagerProps {
  searchQuery: string;
}

interface CategoryFormData {
  nom: string;
  couleur: string;
  icone?: string;
  description?: string;
}

const PREDEFINED_COLORS = [
  '#DC2626', // Red
  '#EA580C', // Orange
  '#D97706', // Amber
  '#65A30D', // Lime
  '#16A34A', // Green
  '#059669', // Emerald
  '#0891B2', // Cyan
  '#0284C7', // Blue
  '#2563EB', // Indigo
  '#7C3AED', // Violet
  '#C026D3', // Fuchsia
  '#E11D48', // Rose
];

export function CategoriesManager({ searchQuery }: CategoriesManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    nom: '',
    couleur: PREDEFINED_COLORS[0],
    icone: '',
    description: ''
  });

  const { 
    data: categoriesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesApi.getAll({
        include_book_count: true
      });
      return response;
    },
    refetchInterval: 30000
  });

  const categories = categoriesResponse?.data || [];

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Catégorie créée",
        description: "La catégorie a été créée avec succès",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: { id: string } & CategoryFormData) => 
      categoriesApi.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Catégorie mise à jour",
        description: "Les modifications ont été sauvegardées",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la catégorie",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    },
  });

  const filteredCategories = useMemo(() => {
    if (!categories || !searchQuery) return categories || [];
    
    const query = searchQuery.toLowerCase();
    return categories.filter(category => 
      category.nom.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query) ||
      category.couleur.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const resetForm = () => {
    setFormData({
      nom: '',
      couleur: PREDEFINED_COLORS[0],
      icone: '',
      description: ''
    });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nom: category.nom,
      couleur: category.couleur,
      icone: category.icone || '',
      description: category.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: typeof error === "object" && error && "message" in error
          ? (error as any).message
          : "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          ...formData
        });
      } else {
        await createCategoryMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast({
        title: "Erreur",
        description: typeof error === "object" && error && "message" in error
          ? (error as any).message
          : "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Erreur lors du chargement des catégories</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {categories?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total catégories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {categories?.filter(cat => cat.book_count && cat.book_count > 0).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Avec livres</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {categories?.filter(cat => !cat.book_count || cat.book_count === 0).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Vides</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Modifiez les informations de la catégorie'
                    : "Créez une nouvelle catégorie pour organiser vos livres"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de la catégorie</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder="Ex: Dark Romance, Fantastique, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="couleur">Couleur</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="couleur"
                      type="color"
                      value={formData.couleur}
                      onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <div className="flex flex-wrap gap-1">
                      {PREDEFINED_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                          style={{ 
                            backgroundColor: color,
                            borderColor: formData.couleur === color ? "#000" : "transparent"
                          }}
                          onClick={() => setFormData(prev => ({ ...prev, couleur: color }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icone">Icône (optionnel)</Label>
                  <Input
                    id="icone"
                    value={formData.icone}
                    onChange={(e) => setFormData(prev => ({ ...prev, icone: e.target.value }))}
                    placeholder="📚 🔥 💀 ❤️"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description de la catégorie..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.nom.trim()}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {editingCategory ? "Sauvegarder" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="transition-all hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: category.couleur }}
                  >
                    {category.icone || <Folder className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg leading-tight mb-1">
                      {category.nom}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(category)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/categories/${category.id}' as any)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les livres
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: '${category.couleur}20',
                    color: category.couleur
                  }}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  {category.book_count || 0} livre{(category.book_count || 0) > 1 ? "s" : ""}
                </Badge>
                
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Palette className="h-3 w-3" />
                  <span>{category.couleur}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune catégorie trouvée</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Aucune catégorie ne correspond à votre recherche ${searchQuery}'
                : "Commencez par créer votre première catégorie"
              }
            </p>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une catégorie
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground text-center">
          {filteredCategories.length} catégorie{filteredCategories.length > 1 ? "s" : ''} trouvée{filteredCategories.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}