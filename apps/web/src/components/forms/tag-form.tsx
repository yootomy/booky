/**
 * TagForm - Formulaire de création/édition de tag
 * Supporte les types (Genre, Trope, Trigger, Custom), couleurs et favoris
 */

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  X, 
  Palette, 
  Star, 
  StarOff,
  Eye, 
  EyeOff,
  RotateCcw,
  Plus,
  Check,
  Zap,
  Hash,
  Tag as TagIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  type Tag, 
  type TagCreateInput, 
  type TagUpdateInput,
  TAG_COLORS,
  PREDEFINED_TAGS,
  TAG_TYPE_LABELS,
  TAG_TYPE_ICONS,
  TAG_TYPE_COLORS
} from '@/types/tag';
import { TagType } from '@/types/api';
import { cn } from '@/lib/utils';

export interface TagFormProps {
  mode: 'create' | 'edit';
  initialData?: Tag;
  onSubmit: (data: TagCreateInput | TagUpdateInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
  suggestedTags?: string[]; // Suggestions basées sur les livres existants
}

interface FormData {
  nom: string;
  couleur: string;
  type: TagType;
  est_favori: boolean;
}

// Composant sélecteur de couleur pour tags
function TagColorPicker({ 
  value, 
  onChange, 
  type,
  className 
}: { 
  value: string; 
  onChange: (color: string) => void;
  type: TagType;
  className?: string;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  // Couleurs prédéfinies selon le type
  const getTypeColors = () => {
    switch (type) {
      case TagType.GENRE:
        return [TAG_COLORS.GENRE_BLUE, TAG_COLORS.GENRE_PURPLE, TAG_COLORS.GENRE_TEAL];
      case TagType.TROPE:
        return [TAG_COLORS.TROPE_RED, TAG_COLORS.TROPE_CRIMSON, TAG_COLORS.TROPE_BURGUNDY];
      case TagType.TRIGGER:
        return [TAG_COLORS.TRIGGER_ORANGE, TAG_COLORS.TRIGGER_DARK_RED, TAG_COLORS.TRIGGER_PURPLE];
      case TagType.PERSONNALISE:
        return [TAG_COLORS.CUSTOM_GRAY, TAG_COLORS.CUSTOM_DARK, TAG_COLORS.CUSTOM_BLUE];
      default:
        return Object.values(TAG_COLORS);
    }
  };

  const typeColors = getTypeColors();

  return (
    <div className={cn('space-y-3', className)}>
      {/* Couleurs du type */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Couleurs recommandées pour {TAG_TYPE_LABELS[type]}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {typeColors.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                'w-full h-8 rounded border-2 transition-all hover:scale-105',
                value === color 
                  ? 'border-foreground shadow-lg' 
                  : 'border-muted-foreground/20'
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Autres couleurs */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Autres couleurs
        </Label>
        <div className="grid grid-cols-6 gap-2">
          {Object.values(TAG_COLORS)
            .filter(color => !typeColors.includes(color))
            .map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                  value === color 
                    ? 'border-foreground shadow-lg' 
                    : 'border-muted-foreground/20'
                )}
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
                title={color}
              />
            ))}
        </div>
      </div>

      {/* Couleur personnalisée */}
      <div>
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
          <div className="flex gap-2 mt-2">
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

// Composant sélecteur de type
function TypeSelector({ 
  value, 
  onChange,
  className 
}: { 
  value: TagType; 
  onChange: (type: TagType) => void;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {Object.values(TagType).map((type) => (
        <Button
          key={type}
          type="button"
          variant={value === type ? "default" : "outline"}
          className="h-auto p-3 justify-start"
          onClick={() => onChange(type)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{TAG_TYPE_ICONS[type]}</span>
            <div className="text-left">
              <div className="font-medium">{TAG_TYPE_LABELS[type]}</div>
              <div className="text-xs text-muted-foreground">
                {type === TagType.GENRE && "Catégories littéraires"}
                {type === TagType.TROPE && "Éléments narratifs"}
                {type === TagType.TRIGGER && "Avertissements"}
                {type === TagType.PERSONNALISE && "Tags personnalisés"}
              </div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}

export function TagForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  className,
  suggestedTags = []
}: TagFormProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

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
      couleur: initialData?.couleur || TAG_TYPE_COLORS[TagType.TROPE],
      type: initialData?.type || TagType.TROPE,
      est_favori: initialData?.est_favori || false
    }
  });

  const watchedValues = watch();

  // Appliquer un preset de tag
  const applyPreset = (preset: typeof PREDEFINED_TAGS[0]) => {
    setValue('nom', preset.nom);
    setValue('couleur', preset.couleur);
    setValue('type', preset.type);
    setValue('est_favori', preset.est_favori);
    setSelectedPreset(preset.nom);
  };

  // Appliquer une suggestion
  const applySuggestion = (suggestion: string) => {
    setValue('nom', suggestion);
    // Garder le type et la couleur actuels
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    if (mode === 'create') {
      reset({
        nom: '',
        couleur: TAG_TYPE_COLORS[TagType.TROPE],
        type: TagType.TROPE,
        est_favori: false
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
      console.error('Erreur lors de la soumission:', error);
    }
  };

  // Filtrer les presets par type
  const presetsByType = PREDEFINED_TAGS.reduce((acc, preset) => {
    if (!acc[preset.type]) acc[preset.type] = [];
    acc[preset.type].push(preset);
    return acc;
  }, {} as Record<TagType, typeof PREDEFINED_TAGS>);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-6', className)}>
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Nouveau tag' : 'Modifier le tag'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === 'create' 
              ? 'Créer un nouveau tag pour étiqueter vos livres'
              : 'Modifier les informations du tag'
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
          
          {mode === 'create' && (
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulaire principal */}
        <div className="space-y-4">
          {/* Nom du tag */}
          <div className="space-y-2">
            <Label htmlFor="nom" className="required">
              Nom du tag
            </Label>
            <Input
              id="nom"
              {...register('nom', { 
                required: 'Le nom est obligatoire',
                minLength: { value: 1, message: 'Le nom ne peut pas être vide' },
                maxLength: { value: 50, message: 'Le nom ne peut pas dépasser 50 caractères' }
              })}
              placeholder="ex: Enemies to Lovers"
              className={errors.nom ? 'border-destructive' : ''}
            />
            {errors.nom && (
              <p className="text-xs text-destructive">{errors.nom.message}</p>
            )}
          </div>

          {/* Type de tag */}
          <div className="space-y-2">
            <Label className="required">Type de tag</Label>
            <TypeSelector
              value={watchedValues.type}
              onChange={(type) => {
                setValue('type', type);
                // Adapter la couleur au nouveau type
                setValue('couleur', TAG_TYPE_COLORS[type]);
              }}
            />
          </div>

          {/* Favori */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="est_favori"
              checked={watchedValues.est_favori}
              onCheckedChange={(checked) => setValue('est_favori', checked as boolean)}
            />
            <Label htmlFor="est_favori" className="flex items-center gap-2">
              {watchedValues.est_favori ? (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              ) : (
                <StarOff className="w-4 h-4" />
              )}
              Tag favori
            </Label>
          </div>
        </div>

        {/* Couleur */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Couleur du tag</Label>
            <TagColorPicker
              value={watchedValues.couleur}
              onChange={(color) => setValue('couleur', color)}
              type={watchedValues.type}
            />
          </div>
        </div>
      </div>

      {/* Presets et suggestions */}
      {mode === 'create' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Suggestions et presets
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="presets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="presets">Tags prédéfinis</TabsTrigger>
                <TabsTrigger value="suggestions" disabled={suggestedTags.length === 0}>
                  Suggestions ({suggestedTags.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="presets" className="space-y-4 mt-4">
                {Object.entries(presetsByType).map(([type, tags]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{TAG_TYPE_ICONS[type as TagType]}</span>
                      <Label className="text-sm font-medium">
                        {TAG_TYPE_LABELS[type as TagType]}
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {tags.map((preset) => (
                        <Button
                          key={preset.nom}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'justify-start h-auto p-2',
                            selectedPreset === preset.nom && 'border-primary bg-primary/5'
                          )}
                          onClick={() => applyPreset(preset)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: preset.couleur }}
                            />
                            <span className="text-xs truncate">{preset.nom}</span>
                            {preset.est_favori && (
                              <Star className="w-3 h-3 text-yellow-500 fill-current ml-auto" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="suggestions" className="space-y-2 mt-4">
                {suggestedTags.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedTags.map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        <Zap className="w-3 h-3 mr-2" />
                        <span className="text-xs truncate">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune suggestion disponible
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Aperçu */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Aperçu du tag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Badge du tag */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="px-2 py-1"
                  style={{
                    backgroundColor: `${watchedValues.couleur}20`,
                    color: watchedValues.couleur,
                    borderColor: watchedValues.couleur
                  }}
                >
                  <span className="mr-1">{TAG_TYPE_ICONS[watchedValues.type]}</span>
                  {watchedValues.nom || 'Nom du tag'}
                </Badge>
                
                {watchedValues.est_favori && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>

              {/* Type et couleur */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  {TAG_TYPE_LABELS[watchedValues.type]}
                </div>
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: watchedValues.couleur }}
                  title={watchedValues.couleur}
                />
                <code>{watchedValues.couleur}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          {isDirty && '• Modifications non sauvegardées'}
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
            {mode === 'create' ? 'Créer' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </form>
  );
}