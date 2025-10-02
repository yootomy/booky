/**
 * BookForm - Formulaire complet d'ajout/édition de livre
 * Intègre tous les champs, ratings, categories, tags, couverture et critique
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { 
  Save, 
  X, 
  Search,
  BookOpen,
  Image as ImageIcon,
  Tag as TagIcon,
  Folder,
  Calendar,
  User,
  Hash,
  Globe,
  FileText,
  Star,
  Heart,
  Flame,
  Skull,
  Eye,
  EyeOff,
  RotateCcw,
  Plus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StarRating, SpicyRating, DarkRating, RomanceRating, RhythmSelector, type RhythmValue } from '@/components/ratings';
import { BookStatus } from '@/components/books/book-status';
import { ImageUpload } from './image-upload';
import { ReviewForm, type ReviewFormData } from './review-form';
import { 
  type BookCreateInput, 
  type BookUpdateInput, 
  type Book,
  BOOK_STATUS_LABELS,
  BOOK_RHYTHM_LABELS
} from '@/types/book';
import { type Category } from '@/types/category';
import { type Tag } from '@/types/tag';
import { SagaSection } from './saga-section';
import { cn } from '@/lib/utils';

// Conversion functions between BookRhythm enum and RhythmValue
const bookRhythmToRhythmValue = (bookRhythm: 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE'): RhythmValue => {
  switch (bookRhythm) {
    case 'SLOW_BURN':
      return 'slow';
    case 'MEDIUM_BURN':
      return 'medium';
    case 'FAST_PACE':
      return 'fast';
    case 'INSTA_LOVE':
      return 'insta';
  }
};

const rhythmValueToBookRhythm = (rhythmValue: RhythmValue): 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE' => {
  switch (rhythmValue) {
    case 'slow':
      return 'SLOW_BURN';
    case 'medium':
      return 'MEDIUM_BURN';
    case 'fast':
      return 'FAST_PACE';
    case 'insta':
      return 'INSTA_LOVE';
  }
};

export interface BookFormProps {
  mode: 'create' | 'edit';
  initialData?: Book;
  onSubmit: (data: BookCreateInput | BookUpdateInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
  
  // Données externes
  availableCategories?: Category[];
  availableTags?: Tag[];
  onSearchExternal?: (query: string) => Promise<ExternalBookResult[]>;
  
  // Props saga optionnelles
  sagaId?: string;
  sagaOrder?: number;
  onSagaIdChange?: (sagaId: string | undefined) => void;
  onSagaOrderChange?: (order: number | undefined) => void;
  sagaErrors?: {sagaId?: string; sagaOrder?: string};
  excludeBookId?: string; // Pour l'édition, éviter conflit avec soi-même
}

export interface ExternalBookResult {
  id: string;
  source: 'google_books' | 'open_library';
  titre: string;
  auteur: string;
  isbn?: string;
  image_couverture?: string;
  resume_officiel?: string;
  editeur?: string;
  date_publication?: string;
  nombre_pages?: number;
  langue?: string;
}

interface FormData {
  // Champs de base
  titre: string;
  auteur: string;
  isbn?: string;
  image_couverture?: string;
  
  // Métadonnées
  resume_officiel?: string;
  editeur?: string;
  date_publication?: string;
  nombre_pages?: number;
  langue?: string;
  
  // Lecture
  date_lecture?: string;
  statut: 'LU' | 'EN_COURS' | 'A_LIRE';
  
  // Notations (intégrées du ReviewForm)
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  intensite_emotionnelle: number;
  danger: number;
  violence: number;
  originalite: number;
  rythme: 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';
  
  // Critiques
  resume_personnel?: string;
  critique_detaillee?: string;
  citations_favorites?: string;
  pourquoi_aimer?: string;
  questions_sur_le_livre?: string;
  recommandation_personnalisee?: string;
  
  // Relations
  categories?: string[];
  tags?: string[];
  
  // Flags
  ajout_manuel: boolean;
}

export function BookForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  className,
  availableCategories = [],
  availableTags = [],
  onSearchExternal,
  // Props saga
  sagaId,
  sagaOrder,
  onSagaIdChange,
  onSagaOrderChange,
  sagaErrors,
  excludeBookId
}: BookFormProps) {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [searchingExternal, setSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<ExternalBookResult[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categories?.map(c => c.category.id) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags?.map(t => t.tag.id) || []
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Mettre à jour les catégories et tags sélectionnés quand initialData change
  useEffect(() => {
    if (initialData) {
      setSelectedCategories(initialData.categories?.map(c => c.category.id) || []);
      setSelectedTags(initialData.tags?.map(t => t.tag.id) || []);
    }
  }, [initialData]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset
  } = useForm<FormData>({
    defaultValues: {
      titre: initialData?.titre || '',
      auteur: initialData?.auteur || '',
      isbn: initialData?.isbn || '',
      image_couverture: initialData?.image_couverture || '',
      resume_officiel: initialData?.resume_officiel || '',
      editeur: initialData?.editeur || '',
      date_publication: initialData?.date_publication || '',
      nombre_pages: initialData?.nombre_pages || undefined,
      langue: initialData?.langue || '',
      date_lecture: initialData?.date_lecture || '',
      statut: initialData?.statut || 'A_LIRE',
      note_generale: initialData?.note_generale || 5,
      niveau_spicy: initialData?.niveau_spicy || 1,
      niveau_dark: initialData?.niveau_dark || 1,
      niveau_romance: initialData?.niveau_romance || 5,
      intensite_emotionnelle: initialData?.intensite_emotionnelle || 5,
      danger: initialData?.danger || 1,
      violence: initialData?.violence || 1,
      originalite: initialData?.originalite || 5,
      rythme: initialData?.rythme || 'MEDIUM_BURN',
      resume_personnel: initialData?.resume_personnel || '',
      critique_detaillee: initialData?.critique_detaillee || '',
      citations_favorites: initialData?.citations_favorites || '',
      pourquoi_aimer: initialData?.pourquoi_aimer || '',
      questions_sur_le_livre: initialData?.questions_sur_le_livre || '',
      recommandation_personnalisee: initialData?.recommandation_personnalisee || '',
      ajout_manuel: initialData?.ajout_manuel ?? true
    }
  });

  const watchedValues = watch();

  // Réinitialiser le formulaire quand initialData change (pour l'import externe)
  useEffect(() => {
    if (initialData) {
      reset({
        titre: initialData?.titre || '',
        auteur: initialData?.auteur || '',
        isbn: initialData?.isbn || '',
        image_couverture: initialData?.image_couverture || '',
        resume_officiel: initialData?.resume_officiel || '',
        editeur: initialData?.editeur || '',
        date_publication: initialData?.date_publication || '',
        nombre_pages: initialData?.nombre_pages || undefined,
        langue: initialData?.langue || '',
        date_lecture: initialData?.date_lecture || '',
        statut: initialData?.statut || 'A_LIRE',
        note_generale: initialData?.note_generale || 5,
        niveau_spicy: initialData?.niveau_spicy || 1,
        niveau_dark: initialData?.niveau_dark || 1,
        niveau_romance: initialData?.niveau_romance || 5,
        intensite_emotionnelle: initialData?.intensite_emotionnelle || 5,
        danger: initialData?.danger || 1,
        violence: initialData?.violence || 1,
        originalite: initialData?.originalite || 5,
        rythme: initialData?.rythme || 'MEDIUM_BURN',
        resume_personnel: initialData?.resume_personnel || '',
        critique_detaillee: initialData?.critique_detaillee || '',
        citations_favorites: initialData?.citations_favorites || '',
        pourquoi_aimer: initialData?.pourquoi_aimer || '',
        questions_sur_le_livre: initialData?.questions_sur_le_livre || '',
        recommandation_personnalisee: initialData?.recommandation_personnalisee || '',
        ajout_manuel: initialData?.ajout_manuel ?? false // Les données importées ne sont pas manuelles
      });

      // Mettre à jour les catégories et tags sélectionnés
      if (initialData?.categories) {
        setSelectedCategories(initialData.categories.map(c => c.category.id));
      }
      if (initialData?.tags) {
        setSelectedTags(initialData.tags.map(t => t.tag.id));
      }
    }
  }, [initialData, reset]);

  // Recherche externe
  const handleExternalSearch = async () => {
    if (!onSearchExternal || !watchedValues.titre) return;
    
    setSearchingExternal(true);
    try {
      const results = await onSearchExternal(watchedValues.titre);
      setExternalResults(results);
    } catch (error) {
      console.error("Erreur lors de la recherche externe: ", error);
    } finally {
      setSearchingExternal(false);
    }
  };

  // Appliquer un résultat externe
  const applyExternalResult = (result: ExternalBookResult) => {
    setValue("titre", result.titre);
    setValue('auteur', result.auteur);
    setValue('isbn', result.isbn || '');
    setValue('resume_officiel', result.resume_officiel || '');
    setValue('editeur', result.editeur || '');
    setValue('date_publication', result.date_publication || '');
    setValue('nombre_pages', result.nombre_pages || undefined);
    setValue('langue', result.langue || '');
    setValue('image_couverture', result.image_couverture || '');
    setValue('ajout_manuel', false);
    setExternalResults([]);
  };

  // Gestion des catégories
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Gestion des tags
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Soumettre le formulaire
  const handleFormSubmit = async (data: FormData) => {
    try {
      const submitData = {
        ...data,
        categories: selectedCategories,
        tags: selectedTags,
        // Convertir les dates au bon format si nécessaire
        date_lecture: data.date_lecture || undefined,
        date_publication: data.date_publication || undefined
      };


      if (mode === 'create') {
        await onSubmit(submitData);
      } else {
        await onSubmit({ ...submitData, id: initialData!.id });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message :
                           typeof error === 'string' ? error :
                           'Erreur inconnue lors de la soumission';

      console.error("Erreur lors de la soumission: ", {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Afficher l'erreur à l'utilisateur
      toast({
        title: "Erreur",
        description: `Erreur lors de la soumission: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    reset();
    setSelectedCategories([]);
    setSelectedTags([]);
    setCoverFile(null);
    setExternalResults([]);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            {mode === "create" ? 'Ajouter un livre' : "Modifier le livre"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "create" 
              ? 'Ajoutez un nouveau livre à votre bibliothèque'
              : "Modifiez les informations du livre"
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Aperçu
          </Button>
          
          {mode === "create" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              disabled={!isDirty}
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="couverture">Couverture</TabsTrigger>
          <TabsTrigger value="notations">Notations</TabsTrigger>
          <TabsTrigger value="critique">Critique</TabsTrigger>
          <TabsTrigger value="organisation">Organisation</TabsTrigger>
        </TabsList>

        {/* Tab Informations de base */}
        <TabsContent value="informations" className="space-y-6">
          {/* Recherche externe */}
          {mode === "create" && onSearchExternal && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Recherche automatique
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Tapez le titre du livre..."
                    value={watchedValues.titre}
                    onChange={(e) => setValue("titre", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleExternalSearch}
                    disabled={!watchedValues.titre || searchingExternal}
                  >
                    {searchingExternal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Rechercher
                  </Button>
                </div>
                
                {externalResults.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Résultats trouvés :</Label>
                    {externalResults.map((result) => (
                      <Card key={result.id} className="p-3">
                        <div className="flex items-start gap-3">
                          {result.image_couverture && (
                            <img
                              src={result.image_couverture}
                              alt={result.titre}
                              className="w-12 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-1">{result.titre}</h4>
                            <p className="text-sm text-muted-foreground">{result.auteur}</p>
                            {result.editeur && (
                              <p className="text-xs text-muted-foreground">{result.editeur}</p>
                            )}
                            <Badge variant="outline" className="text-xs mt-1">
                              {result.source === "google_books" ? 'Google Books' : "Open Library"}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => applyExternalResult(result)}
                          >
                            Utiliser
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informations principales */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="titre" className="required">Titre</Label>
                <Input
                  id="titre"
                  {...register('titre', { 
                    required: 'Le titre est obligatoire',
                    minLength: { value: 1, message: 'Le titre ne peut pas être vide' }
                  })}
                  className={errors.titre ? 'border-destructive' : ''}
                />
                {errors.titre && (
                  <p className="text-xs text-destructive">{errors.titre.message}</p>
                )}
              </div>

              {/* Auteur */}
              <div className="space-y-2">
                <Label htmlFor="auteur" className="required">Auteur</Label>
                <Input
                  id="auteur"
                  {...register('auteur', { 
                    required: 'L\'auteur est obligatoire',
                    minLength: { value: 1, message: 'L\'auteur ne peut pas être vide' }
                  })}
                  className={errors.auteur ? 'border-destructive' : ''}
                />
                {errors.auteur && (
                  <p className="text-xs text-destructive">{errors.auteur.message}</p>
                )}
              </div>

              {/* ISBN */}
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  {...register("isbn")}
                  placeholder="978-2-123456-78-9"
                />
              </div>

              {/* Nombre de pages */}
              <div className="space-y-2">
                <Label htmlFor="nombre_pages">Nombre de pages</Label>
                <Input
                  id="nombre_pages"
                  type="number"
                  min="1"
                  {...register("nombre_pages", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Éditeur */}
              <div className="space-y-2">
                <Label htmlFor="editeur">Éditeur</Label>
                <Input id="editeur" {...register("editeur")} />
              </div>

              {/* Date de publication */}
              <div className="space-y-2">
                <Label htmlFor="date_publication">Date de publication</Label>
                <Input
                  id="date_publication"
                  type="date"
                  {...register("date_publication")}
                />
              </div>

              {/* Langue */}
              <div className="space-y-2">
                <Label htmlFor="langue">Langue</Label>
                <Input
                  id="langue"
                  {...register("langue")}
                  placeholder="Français, English, etc."
                />
              </div>

              {/* Statut de lecture */}
              <div className="space-y-2">
                <Label htmlFor="statut">Statut de lecture</Label>
                <select
                  id="statut"
                  {...register("statut")}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  {Object.entries(BOOK_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Date de lecture */}
              {watchedValues.statut === "LU" && (
                <div className="space-y-2">
                  <Label htmlFor="date_lecture">Date de fin de lecture</Label>
                  <Input
                    id="date_lecture"
                    type="date"
                    {...register("date_lecture")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Résumé officiel */}
          <div className="space-y-2">
            <Label htmlFor="resume_officiel">Résumé officiel</Label>
            <Textarea
              id="resume_officiel"
              {...register("resume_officiel")}
              rows={4}
              placeholder="Résumé du livre ou description officielle..."
            />
          </div>
        </TabsContent>

        {/* Tab Couverture */}
        <TabsContent value="couverture" className="space-y-4">
          <ImageUpload
            value={coverFile || watchedValues.image_couverture}
            onChange={(file) => {
              setCoverFile(file);
              if (file) {
                setValue("image_couverture", URL.createObjectURL(file));
              }
            }}
            aspectRatio={2/3}
            maxSize={5}
            placeholder="Télécharger la couverture du livre"
          />
        </TabsContent>

        {/* Tab Notations */}
        <TabsContent value="notations" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Note générale */}
              <div className="space-y-2">
                <Label>Note générale</Label>
                <StarRating
                  value={watchedValues.note_generale}
                  onChange={(value) => setValue("note_generale", value)}
                  size="lg"
                />
              </div>

              {/* Niveau spicy */}
              <div className="space-y-2">
                <Label>Niveau Spicy 🌶️</Label>
                <SpicyRating
                  value={watchedValues.niveau_spicy}
                  onChange={(value) => setValue("niveau_spicy", value)}
                  size="lg"
                />
              </div>

              {/* Niveau dark */}
              <div className="space-y-2">
                <Label>Niveau Dark 💀</Label>
                <DarkRating
                  value={watchedValues.niveau_dark}
                  onChange={(value) => setValue("niveau_dark", value)}
                  size="lg"
                />
              </div>

              {/* Niveau romance */}
              <div className="space-y-2">
                <Label>Niveau Romance ❤️</Label>
                <RomanceRating
                  value={watchedValues.niveau_romance}
                  onChange={(value) => setValue("niveau_romance", value)}
                  size="lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Intensité émotionnelle */}
              <div className="space-y-2">
                <Label>Intensité émotionnelle</Label>
                <StarRating
                  value={watchedValues.intensite_emotionnelle}
                  onChange={(value) => setValue("intensite_emotionnelle", value)}
                  size="lg"
                />
              </div>

              {/* Danger */}
              <div className="space-y-2">
                <Label>Niveau de danger</Label>
                <StarRating
                  value={watchedValues.danger}
                  onChange={(value) => setValue("danger", value)}
                  size="lg"
                />
              </div>

              {/* Violence */}
              <div className="space-y-2">
                <Label>Niveau de violence</Label>
                <StarRating
                  value={watchedValues.violence}
                  onChange={(value) => setValue("violence", value)}
                  size="lg"
                />
              </div>

              {/* Originalité */}
              <div className="space-y-2">
                <Label>Originalité</Label>
                <StarRating
                  value={watchedValues.originalite}
                  onChange={(value) => setValue("originalite", value)}
                  size="lg"
                />
              </div>

              {/* Rythme */}
              <div className="space-y-2">
                <Label>Rythme de lecture</Label>
                <RhythmSelector
                  value={bookRhythmToRhythmValue(watchedValues.rythme)}
                  onChange={(value) => setValue("rythme", rhythmValueToBookRhythm(value))}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab Critique */}
        <TabsContent value="critique" className="space-y-4">
          <div className="space-y-4">
            {/* Résumé personnel */}
            <div className="space-y-2">
              <Label htmlFor="resume_personnel">Résumé personnel</Label>
              <Textarea
                id="resume_personnel"
                {...register("resume_personnel")}
                rows={3}
                placeholder="Votre résumé du livre..."
              />
            </div>

            {/* Critique détaillée */}
            <div className="space-y-2">
              <Label htmlFor="critique_detaillee">Critique détaillée</Label>
              <Textarea
                id="critique_detaillee"
                {...register("critique_detaillee")}
                rows={6}
                placeholder="Votre critique complète..."
              />
            </div>

            {/* Citations favorites */}
            <div className="space-y-2">
              <Label htmlFor="citations_favorites">Citations favorites</Label>
              <Textarea
                id="citations_favorites"
                {...register("citations_favorites")}
                rows={4}
                placeholder="Vos citations préférées du livre..."
              />
            </div>

            {/* Pourquoi aimer */}
            <div className="space-y-2">
              <Label htmlFor="pourquoi_aimer">Pourquoi vous devriez l"aimer</Label>
              <Textarea
                id="pourquoi_aimer"
                {...register("pourquoi_aimer")}
                rows={3}
                placeholder="Les raisons qui rendent ce livre spécial..."
              />
            </div>

            {/* Questions fréquentes */}
            <div className="space-y-2">
              <Label htmlFor="questions_sur_le_livre">Questions fréquentes</Label>
              <Textarea
                id="questions_sur_le_livre"
                {...register("questions_sur_le_livre")}
                rows={3}
                placeholder="Questions que les lecteurs pourraient se poser..."
              />
            </div>

            {/* Recommandation personnalisée */}
            <div className="space-y-2">
              <Label htmlFor="recommandation_personnalisee">À qui le recommander</Label>
              <Textarea
                id="recommandation_personnalisee"
                {...register("recommandation_personnalisee")}
                rows={3}
                placeholder="Type de lecteur qui appréciera ce livre..."
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab Organisation */}
        <TabsContent value="organisation" className="space-y-6">
          {/* Section Saga - conditionnelle basée sur les props */}
          {(sagaId !== undefined || onSagaIdChange) && (
            <>
              <SagaSection
                sagaId={sagaId}
                sagaOrder={sagaOrder}
                onSagaIdChange={onSagaIdChange || (() => {})}
                onSagaOrderChange={onSagaOrderChange || (() => {})}
                disabled={loading}
                errors={sagaErrors}
                excludeBookId={excludeBookId}
              />
              <Separator />
            </>
          )}
          
          {/* Catégories */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Catégories
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableCategories.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                  size="sm"
                  className="justify-start h-auto p-2"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.couleur }}
                    />
                    <span className="text-xs truncate">{category.nom}</span>
                    {category.icone && <span>{category.icone}</span>}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  size="sm"
                  className="justify-start h-auto p-2"
                  onClick={() => toggleTag(tag.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.couleur }}
                    />
                    <span className="text-xs truncate">{tag.nom}</span>
                    {tag.est_favori && (
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Ajout manuel */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ajout_manuel"
              checked={watchedValues.ajout_manuel}
              onCheckedChange={(checked) => setValue("ajout_manuel", checked as boolean)}
            />
            <Label htmlFor="ajout_manuel">
              Ajout manuel (non importé depuis une source externe)
            </Label>
          </div>
        </TabsContent>
      </Tabs>

      {/* Aperçu */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Aperçu du livre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {/* Couverture */}
              <div className="w-24 h-36 bg-muted rounded flex items-center justify-center">
                {watchedValues.image_couverture ? (
                  <img 
                    src={watchedValues.image_couverture} 
                    alt="Couverture" 
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                )}
              </div>

              {/* Informations */}
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-semibold">{watchedValues.titre || "Titre du livre"}</h3>
                  <p className="text-sm text-muted-foreground">{watchedValues.auteur || "Auteur"}</p>
                </div>

                {/* Statut et notes */}
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">
                    {BOOK_STATUS_LABELS[watchedValues.statut]}
                  </Badge>
                  <div className="flex items-center gap-1">
                    ⭐ {watchedValues.note_generale}/10
                  </div>
                  <div className="flex items-center gap-1">
                    🌶️ {watchedValues.niveau_spicy}/10
                  </div>
                  <div className="flex items-center gap-1">
                    💀 {watchedValues.niveau_dark}/10
                  </div>
                </div>

                {/* Catégories sélectionnées */}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((categoryId) => {
                      const category = availableCategories.find(c => c.id === categoryId);
                      return category ? (
                        <Badge
                          key={categoryId}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: category.couleur + '20',
                            color: category.couleur
                          }}
                        >
                          {category.nom}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Résumé */}
                {watchedValues.resume_personnel && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {watchedValues.resume_personnel}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          {isDirty && "• Modifications non sauvegardées"}
          {selectedCategories.length > 0 && (
            <span className="ml-2">{selectedCategories.length} catégorie(s) sélectionnée(s)</span>
          )}
          {selectedTags.length > 0 && (
            <span className="ml-2">{selectedTags.length} tag(s) sélectionné(s)</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {mode === "create" ? "Ajouter le livre" : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </form>
  );
}