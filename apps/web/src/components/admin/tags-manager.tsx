'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '@/utils/orpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Tag as TagIcon, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  BookOpen,
  Hash,
  Plus,
  X,
  Save,
  Loader2,
  Star,
  StarOff,
  Palette
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Tag, TagUpdateInput } from '@/types/tag';
import type { TagType } from '@/types/api';

interface TagsManagerProps {
  searchQuery: string;
}

interface TagFormData {
  nom: string;
  type: TagType;
  couleur: string;
  est_favori: boolean;
}

const PREDEFINED_COLORS = [
  '#DC2626', '#EA580C', '#D97706', '#65A30D', '#16A34A', '#059669',
  '#0891B2', '#0284C7', '#2563EB', '#7C3AED', '#C026D3', '#E11D48'
];

const TAG_TYPE_LABELS = {
  'GENRE': 'Genre',
  'TROPE': 'Trope',
  'TRIGGER': 'Trigger',
  'PERSONNALISE': 'Personnalisé'
};

const TAG_TYPE_COLORS = {
  'GENRE': 'bg-blue-100 text-blue-800 border-blue-200',
  'TROPE': 'bg-green-100 text-green-800 border-green-200',
  'TRIGGER': 'bg-red-100 text-red-800 border-red-200',
  'PERSONNALISE': 'bg-purple-100 text-purple-800 border-purple-200'
};

export function TagsManager({ searchQuery }: TagsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TagType | 'ALL'>('ALL');
  const [formData, setFormData] = useState<TagFormData>({
    nom: '',
    type: 'PERSONNALISE' as TagType,
    couleur: PREDEFINED_COLORS[0],
    est_favori: false
  });

  const { 
    data: tagsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await tagsApi.getAll();
      return response;
    },
    refetchInterval: 30000
  });

  const tags = tagsResponse?.data || [];

  const createTagMutation = useMutation({
    mutationFn: (data: TagFormData) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: "Tag créé",
        description: "Le tag a été créé avec succès",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le tag",
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: (data: { id: string } & TagFormData) => 
      tagsApi.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: "Tag mis à jour",
        description: "Les modifications ont été sauvegardées",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le tag",
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: "Tag supprimé",
        description: "Le tag a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le tag",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (data: { id: string; est_favori: boolean }) => 
      tagsApi.update(data.id, { id: data.id, est_favori: data.est_favori }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const filteredAndCategorizedTags = useMemo(() => {
    if (!tags) return { all: [], filtered: [] };
    
    // Filter by search query
    let filtered = tags;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = tags.filter(tag => 
        tag.nom.toLowerCase().includes(query) ||
        tag.type.toLowerCase().includes(query) ||
        tag.couleur.toLowerCase().includes(query)
      );
    }

    // Filter by active tab
    if (activeTab !== 'ALL') {
      filtered = filtered.filter(tag => tag.type === activeTab);
    }

    return { all: tags, filtered };
  }, [tags, searchQuery, activeTab]);

  const resetForm = () => {
    setFormData({
      nom: '',
      type: 'PERSONNALISE' as TagType,
      couleur: PREDEFINED_COLORS[0],
      est_favori: false
    });
    setEditingTag(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      nom: tag.nom,
      type: tag.type,
      couleur: tag.couleur,
      est_favori: tag.est_favori
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) return;

    try {
      await deleteTagMutation.mutateAsync(tagId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: typeof error === 'object' && error && 'message' in error
          ? (error as any).message
          : "Impossible de supprimer le tag",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (tag: Tag) => {
    try {
      await toggleFavoriteMutation.mutateAsync({
        id: tag.id,
        est_favori: !tag.est_favori
      });
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
      toast({
        title: "Erreur",
        description: typeof error === 'object' && error && 'message' in error
          ? (error as any).message
          : "Impossible de modifier le tag",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTag) {
        await updateTagMutation.mutateAsync({
          id: editingTag.id,
          ...formData
        });
      } else {
        await createTagMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: typeof error === 'object' && error && 'message' in error
          ? (error as any).message
          : "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createTagMutation.isPending || updateTagMutation.isPending;

  const tagsByType = useMemo(() => {
    if (!tags) return {};
    
    return tags.reduce((acc, tag) => {
      if (!acc[tag.type]) acc[tag.type] = [];
      acc[tag.type].push(tag);
      return acc;
    }, {} as Record<TagType, Tag[]>);
  }, [tags]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
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
          <p className="text-destructive">Erreur lors du chargement des tags</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {filteredAndCategorizedTags.all.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total tags</div>
            </div>
            {Object.entries(TAG_TYPE_LABELS).map(([type, label]) => (
              <div key={type}>
                <div className="text-2xl font-bold text-blue-600">
                  {(tagsByType as any)[type]?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for tag types */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TagType | 'ALL')}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-5">
            <TabsTrigger value="ALL">Tous</TabsTrigger>
            <TabsTrigger value="GENRE">Genres</TabsTrigger>
            <TabsTrigger value="TROPE">Tropes</TabsTrigger>
            <TabsTrigger value="TRIGGER">Triggers</TabsTrigger>
            <TabsTrigger value="PERSONNALISE">Custom</TabsTrigger>
          </TabsList>

          {/* Add Tag Button */}
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
                Nouveau Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTag 
                      ? 'Modifiez les informations du tag'
                      : 'Créez un nouveau tag pour étiqueter vos livres'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom du tag</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Ex: Enemies to Lovers, TW Violence, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TagType }))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      required
                    >
                      {Object.entries(TAG_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
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
                              borderColor: formData.couleur === color ? '#000' : 'transparent'
                            }}
                            onClick={() => setFormData(prev => ({ ...prev, couleur: color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>


                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="est_favori"
                      checked={formData.est_favori}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, est_favori: checked as boolean }))}
                    />
                    <Label htmlFor="est_favori" className="flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>Tag favori</span>
                    </Label>
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
                    {editingTag ? 'Sauvegarder' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tags Grid */}
        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredAndCategorizedTags.filtered.map((tag) => (
              <Card key={tag.id} className="transition-all hover:shadow-md">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.couleur }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight truncate">
                          {tag.nom}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${TAG_TYPE_COLORS[tag.type]} mt-1' }
                        >
                          {TAG_TYPE_LABELS[tag.type]}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {tag.est_favori && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(tag)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleFavorite(tag)}
                          >
                            {tag.est_favori ? (
                              <StarOff className="h-4 w-4 mr-2" />
                            ) : (
                              <Star className="h-4 w-4 mr-2" />
                            )}
                            {tag.est_favori ? 'Retirer favori' : 'Marquer favori'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push('/tags/${tag.id}" as any)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les livres
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(tag.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>


                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <span>{tag._count?.books || 0} livre{(tag._count?.books || 0) > 1 ? 's' : '' }</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Palette className="h-3 w-3" />
                      <span>{tag.couleur}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAndCategorizedTags.filtered.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun tag trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Aucun tag ne correspond à votre recherche"
                    : activeTab === 'ALL'
                      ? "Commencez par créer votre premier tag"
                      : "Aucun tag de ce type trouvé"
                  }
                </p>
                <Button 
                  onClick={() => {
                    if (activeTab !== 'ALL') {
                      setFormData(prev => ({ ...prev, type: activeTab as TagType }));
                    }
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un tag
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results count */}
          {searchQuery && filteredAndCategorizedTags.filtered.length > 0 && (
            <div className="text-sm text-muted-foreground text-center mt-4">
              {filteredAndCategorizedTags.filtered.length} tag{filteredAndCategorizedTags.filtered.length > 1 ? 's' : ''} trouvé{filteredAndCategorizedTags.filtered.length > 1 ? 's' : ''}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TagsManager;

