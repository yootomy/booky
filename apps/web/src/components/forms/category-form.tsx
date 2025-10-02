/**
 * CategoryForm - Formulaire de création/édition de catégorie
 * Supporte la sélection de couleur, icône, réorganisation
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { 
  Save, 
  X, 
  Palette, 
  Smile, 
  Eye, 
  EyeOff,
  RotateCcw,
  Hash,
  Move,
  Plus,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  type Category, 
  type CategoryCreateInput, 
  type CategoryUpdateInput,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  PREDEFINED_CATEGORIES
} from '@/types/category';
import { cn } from '@/lib/utils';

export interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: Category;
  onSubmit: (data: CategoryCreateInput | CategoryUpdateInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

interface FormData {
  nom: string;
  couleur: string;
  icone?: string;
  description?: string;
  ordre_affichage: number;
  est_actif: boolean;
}

// Composant sélecteur de couleur
function ColorPicker({ 
  value, 
  onChange, 
  className 
}: { 
  value: string; 
  onChange: (color: string) => void;
  className?: string;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const predefinedColors = Object.values(CATEGORY_COLORS);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Couleurs prédéfinies */}
      <div className="grid grid-cols-6 gap-2">
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
              value === color 
                ? 'border-foreground shadow-lg' 
                : "border-muted-foreground/20"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
      </div>

      {/* Couleur personnalisée */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="w-full"
        >
          <Palette className="w-4 h-4 mr-2" />
          Couleur personnalisée
        </Button>

        {showCustom && (
          <div className="flex gap-2">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-8 p-0 border-0"
            />
            <Input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#8B0000"
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => onChange(customColor)}
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Aperçu */}
      <div className="flex items-center gap-2 text-sm">
        <div 
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: value }}
        />
        <code className="text-muted-foreground">{value}</code>
      </div>
    </div>
  );
}

// Composant sélecteur d'icône
function IconPicker({ 
  value, 
  onChange, 
  className 
}: { 
  value?: string; 
  onChange: (icon: string | undefined) => void;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Icônes prédéfinies */}
      <div className="grid grid-cols-10 gap-2">
        <button
          type="button"
          className={cn(
            "w-8 h-8 rounded border-2 flex items-center justify-center text-lg transition-all hover:scale-110",
            !value 
              ? 'border-foreground bg-muted' 
              : "border-muted-foreground/20"
          )}
          onClick={() => onChange(undefined)}
          title="Aucune icône"
        >
          ×
        </button>
        
        {CATEGORY_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            className={cn(
              'w-8 h-8 rounded border-2 flex items-center justify-center text-lg transition-all hover:scale-110',
              value === icon 
                ? 'border-foreground bg-muted' 
                : "border-muted-foreground/20"
            )}
            onClick={() => onChange(icon)}
            title={icon}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Icône personnalisée */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="🔥 ou nom d"icône'
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="flex-1"
        />
      </div>
    </div>
  );
}

export function CategoryForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  className
}: CategoryFormProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset
  } = useForm<FormData>({
    defaultValues: {
      nom: initialData?.nom || '',
      couleur: initialData?.couleur || CATEGORY_COLORS.DARK_RED,
      icone: initialData?.icone || undefined,
      description: initialData?.description || '',
      ordre_affichage: initialData?.ordre_affichage || 0,
      est_actif: initialData?.est_actif ?? true
    }
  });

  // Surveiller les valeurs pour l'aperçu
  const watchedValues = watch();

  // Appliquer un preset de catégorie
  const applyPreset = (preset: typeof PREDEFINED_CATEGORIES[0]) => {
    setValue('nom', preset.nom);
    setValue('couleur', preset.couleur);
    setValue('icone', preset.icone);
    setValue('description', preset.description);
    setValue('ordre_affichage', preset.ordre_affichage);
    setSelectedPreset(preset.nom);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    if (mode === 'create') {
      reset({
        nom: '',
        couleur: CATEGORY_COLORS.DARK_RED,
        icone: undefined,
        description: '',
        ordre_affichage: 0,
        est_actif: true
      });
    } else {
      reset();
    }
    setSelectedPreset(null);
  };

  // Soumettre le formulaire
  const handleFormSubmit = async (data: FormData) => {
    try {
      if (mode === 'create') {
        await onSubmit(data);
      } else {
        await onSubmit({ ...data, id: initialData!.id });
      }
    } catch (error) {
      console.error("Erreur lors de la soumission: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      {/* Header avec actions rapides */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            {mode === "create" ? 'Nouvelle catégorie' : "Modifier la catégorie"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "create" 
              ? 'Créer une nouvelle catégorie pour organiser vos livres'
              : "Modifier les informations de la catégorie"
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

      {/* Presets de catégories (mode création uniquement) */}
      {mode === "create" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Catégories prédéfinies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREDEFINED_CATEGORIES.map((preset) => (
                <Button
                  key={preset.nom}
                  type="button"
                  variant="outline"
                  className={cn(
                    'justify-start h-auto p-3',
                    selectedPreset === preset.nom && 'border-primary bg-primary/5'
                  )}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.couleur }}
                      />
                      <span className="text-lg">{preset.icone}</span>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{preset.nom}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {preset.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulaire principal */}
        <div className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom" className="required">
              Nom de la catégorie
            </Label>
            <Input
              id="nom"
              {...register("nom", { 
                required: 'Le nom est obligatoire',
                minLength: { value: 1, message: 'Le nom ne peut pas être vide' },
                maxLength: { value: 100, message: "Le nom ne peut pas dépasser 100 caractères" }
              })}
              placeholder="ex: Dark Romance"
              className={errors.nom ? 'border-destructive' : ''}
            />
            {errors.nom && (
              <p className="text-xs text-destructive">{errors.nom.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', {
                maxLength: { value: 500, message: "La description ne peut pas dépasser 500 caractères" }
              })}
              placeholder="Description de la catégorie..."
              rows={3}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Ordre d'affichage */}
          <div className="space-y-2">
            <Label htmlFor="ordre_affichage" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Ordre d'affichage
            </Label>
            <Input
              id="ordre_affichage"
              type="number"
              min="0"
              max="999"
              {...register('ordre_affichage', {
                valueAsNumber: true,
                min: { value: 0, message: 'L\'ordre doit être positif' },
                max: { value: 999, message: 'L\'ordre ne peut pas dépasser 999' }
              })}
              className={errors.ordre_affichage ? 'border-destructive' : ''}
            />
            {errors.ordre_affichage && (
              <p className="text-xs text-destructive">{errors.ordre_affichage.message}</p>
            )}
          </div>

          {/* État actif */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="est_actif"
              {...register('est_actif')}
              defaultChecked={watchedValues.est_actif}
              onCheckedChange={(checked) => setValue('est_actif', checked as boolean)}
            />
            <Label htmlFor="est_actif">
              Catégorie active
            </Label>
          </div>
        </div>

        {/* Apparence */}
        <div className="space-y-4">
          {/* Couleur */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <ColorPicker
              value={watchedValues.couleur}
              onChange={(color) => setValue("couleur", color)}
            />
          </div>

          <Separator />

          {/* Icône */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <IconPicker
              value={watchedValues.icone}
              onChange={(icon) => setValue("icone", icon)}
            />
          </div>
        </div>
      </div>

      {/* Aperçu */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Aperçu de la catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Badge de catégorie */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="px-3 py-1"
                  style={{
                    backgroundColor: "${watchedValues.couleur}20',
                    color: watchedValues.couleur,
                    borderColor: watchedValues.couleur
                  }}
                >
                  {watchedValues.icone && (
                    <span className="mr-1">{watchedValues.icone}</span>
                  )}
                  {watchedValues.nom || "Nom de la catégorie"}
                </Badge>
                
                {!watchedValues.est_actif && (
                  <Badge variant="outline" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>

              {/* Description */}
              {watchedValues.description && (
                <p className="text-sm text-muted-foreground">
                  {watchedValues.description}
                </p>
              )}

              {/* Métadonnées */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Ordre: {watchedValues.ordre_affichage}
                </div>
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: watchedValues.couleur }}
                  title={watchedValues.couleur}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          {isDirty && "• Modifications non sauvegardées"}
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
            disabled={loading || !isDirty}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {mode === "create" ? "Créer" : "Sauvegarder"}
          </Button>
        </div>
      </div>
    </form>
  );
}