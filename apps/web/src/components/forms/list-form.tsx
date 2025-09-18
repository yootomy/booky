'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette, Search, BookOpen, X } from 'lucide-react';

// Schéma de validation
const listSchema = z.object({
  nom: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .optional(),
  couleur: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Format de couleur invalide'),
  icone: z
    .string()
    .optional(),
  ordre_affichage: z
    .number()
    .int()
    .min(0, 'L\'ordre doit être positif'),
  est_publique: z
    .boolean(),
  selectedBooks: z
    .array(z.string())
    .optional(),
});

type ListFormData = z.infer<typeof listSchema>;

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
}

interface ListFormProps {
  initialData?: Partial<ListFormData> & { id?: string };
  onSuccess: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

// Couleurs prédéfinies thématiques dark romance
const PRESET_COLORS = [
  '#DC143C', // Crimson (défaut)
  '#8B0000', // Dark Red
  '#B22222', // Fire Brick
  '#CD5C5C', // Indian Red
  '#4B0082', // Indigo
  '#2E0854', // Dark Purple
  '#6A0DAD', // Purple
  '#800080', // Purple
  '#0A0A0A', // Almost Black
  '#1A1A1A', // Dark Gray
  '#2C2C2C', // Charcoal
  '#FF69B4', // Hot Pink
];

export function ListForm({ initialData, onSuccess, onCancel, isEditing = false }: ListFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  const form = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      nom: initialData?.nom || '',
      description: initialData?.description || '',
      couleur: initialData?.couleur || '#DC143C',
      icone: initialData?.icone || '',
      ordre_affichage: initialData?.ordre_affichage || 0,
      est_publique: initialData?.est_publique ?? true,
      selectedBooks: [],
    },
  });

  // Charger tous les livres disponibles
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoadingBooks(true);
        const response = await fetch('/api/proxy/books?limit=100');
        const result = await response.json();

        if (result.success) {
          setBooks(result.data || []);
        } else {
          throw new Error(result.error || 'Erreur lors du chargement des livres');
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des livres",
          variant: "destructive",
        });
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [toast]);

  // Charger les livres existants de la liste lors de l'édition
  useEffect(() => {
    const fetchExistingBooks = async () => {
      if (!isEditing || !initialData?.id) {
        return;
      }

      try {
        const response = await fetch(`/api/proxy/lists/${initialData.id}/books`);
        const result = await response.json();

        if (result.success && result.data) {
          // Vérifier si result.data est un tableau ou s'il faut accéder à une propriété
          let booksArray = result.data;

          // Si result.data est un objet avec une propriété books, l'utiliser
          if (!Array.isArray(result.data) && result.data.books) {
            booksArray = result.data.books;
          }
          // Si result.data est un objet avec une propriété list_books, l'utiliser
          else if (!Array.isArray(result.data) && result.data.list_books) {
            booksArray = result.data.list_books;
          }

          if (Array.isArray(booksArray)) {
            const existingBookIds = booksArray.map((book: any) => book.id || book.book_id);
            setSelectedBookIds(existingBookIds);
            form.setValue('selectedBooks', existingBookIds);
          }
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les livres de la liste",
          variant: "destructive",
        });
      }
    };

    fetchExistingBooks();
  }, [isEditing, initialData?.id, form, toast]);

  const onSubmit = async (data: ListFormData) => {
    try {
      setLoading(true);

      const url = isEditing && initialData?.id
        ? `/api/proxy/lists/${initialData.id}`
        : '/api/proxy/lists';

      const method = isEditing ? 'PUT' : 'POST';

      // Séparer les données de la liste et les livres sélectionnés
      const { selectedBooks, ...listData } = data;


      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...listData,
          books: selectedBookIds, // Utiliser selectedBookIds au lieu de selectedBooks
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Succès",
          description: isEditing
            ? "Liste mise à jour avec succès"
            : "Liste créée avec succès",
        });
        onSuccess();
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour la sélection des livres
  const filteredBooks = books.filter(book =>
    book.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.auteur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBookSelection = (bookId: string) => {
    const newSelectedBooks = selectedBookIds.includes(bookId)
      ? selectedBookIds.filter(id => id !== bookId)
      : [...selectedBookIds, bookId];

    setSelectedBookIds(newSelectedBooks);
    form.setValue('selectedBooks', newSelectedBooks);
  };

  const removeSelectedBook = (bookId: string) => {
    const newSelectedBooks = selectedBookIds.filter(id => id !== bookId);
    setSelectedBookIds(newSelectedBooks);
    form.setValue('selectedBooks', newSelectedBooks);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nom de la liste */}
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la liste *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Mes coups de cœur dark romance"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Le nom de votre liste tel qu'il apparaîtra aux visiteurs
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optionnelle)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre liste et ce qui la rend spéciale..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Une description pour expliquer le thème ou le contenu de votre liste
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Couleur */}
        <FormField
          control={form.control}
          name="couleur"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Couleur de la liste</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {/* Couleur actuelle et input */}
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-md border-2 border-border"
                      style={{ backgroundColor: field.value }}
                    />
                    <Input
                      type="color"
                      className="w-20 h-10 p-1 border rounded-md"
                      {...field}
                    />
                    <Input
                      placeholder="#DC143C"
                      className="flex-1"
                      {...field}
                    />
                  </div>

                  {/* Couleurs prédéfinies */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground flex items-center">
                      <Palette className="h-4 w-4 mr-1" />
                      Couleurs suggérées
                    </Label>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                            field.value === color
                              ? 'border-primary ring-2 ring-primary/50'
                              : 'border-border hover:border-primary'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Choisissez une couleur qui représente l'ambiance de votre liste
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ordre d'affichage */}
        <FormField
          control={form.control}
          name="ordre_affichage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ordre d'affichage</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Numéro déterminant l'ordre d'affichage (0 = en premier)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Visibilité publique */}
        <FormField
          control={form.control}
          name="est_publique"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Liste publique
                </FormLabel>
                <FormDescription>
                  Rendre cette liste visible aux visiteurs du site
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Sélection des livres */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Livres de la liste (optionnel)
            </Label>
            <p className="text-sm text-muted-foreground">
              Sélectionnez les livres que vous souhaitez inclure dans cette liste
            </p>
          </div>

          {/* Livres sélectionnés */}
          {selectedBookIds.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Livres sélectionnés ({selectedBookIds.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedBookIds.map((bookId) => {
                  const book = books.find(b => b.id === bookId);
                  if (!book) return null;
                  return (
                    <Badge
                      key={bookId}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {book.titre}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeSelectedBook(bookId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recherche de livres */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un livre par titre ou auteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Liste des livres disponibles */}
            <div className="border rounded-md">
              <ScrollArea className="h-64">
                {loadingBooks ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Chargement des livres...
                  </div>
                ) : filteredBooks.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? 'Aucun livre trouvé' : 'Aucun livre disponible'}
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredBooks.map((book) => {
                      const isSelected = selectedBookIds.includes(book.id);
                      return (
                        <div
                          key={book.id}
                          className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleBookSelection(book.id)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-gray-300 hover:border-primary'
                          }`}>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {book.titre}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {book.auteur}
                            </p>
                            <div className="flex items-center mt-1">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-xs ${
                                      star <= book.note_generale
                                        ? 'text-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({book.note_generale}/10)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Mettre à jour' : 'Créer la liste'}
          </Button>
        </div>
      </form>
    </Form>
  );
}