/**
 * ReviewForm - Formulaire de critique détaillée pour les livres
 * Inclut notes, citations, recommandations et sections spécialisées
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Save, 
  X, 
  Plus,
  Minus,
  Quote,
  Heart,
  HelpCircle,
  Users,
  Lightbulb,
  FileText,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarRating, SpicyRating, DarkRating, RomanceRating, RhythmSelector, type RhythmValue } from '@/components/ratings';
import { BookRhythm } from '@/types/api';
import { cn } from '@/lib/utils';

// Conversion functions between BookRhythm enum and RhythmValue
const bookRhythmToRhythmValue = (bookRhythm: BookRhythm): RhythmValue => {
  switch (bookRhythm) {
    case BookRhythm.SLOW_BURN:
      return 'slow';
    case BookRhythm.MEDIUM_BURN:
      return 'medium';
    case BookRhythm.FAST_PACE:
      return 'fast';
    case BookRhythm.INSTA_LOVE:
      return 'insta';
  }
};

const rhythmValueToBookRhythm = (rhythmValue: RhythmValue): BookRhythm => {
  switch (rhythmValue) {
    case 'slow':
      return BookRhythm.SLOW_BURN;
    case 'medium':
      return BookRhythm.MEDIUM_BURN;
    case 'fast':
      return BookRhythm.FAST_PACE;
    case 'insta':
      return BookRhythm.INSTA_LOVE;
  }
};

export interface ReviewFormData {
  // Critiques textuelles
  resume_personnel?: string;
  critique_detaillee?: string;
  citations_favorites?: string;
  pourquoi_aimer?: string;
  questions_sur_le_livre?: string;
  recommandation_personnalisee?: string;
  
  // Notations
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  intensite_emotionnelle: number;
  danger: number;
  violence: number;
  originalite: number;
  rythme: BookRhythm;
  
  // Sections structurées
  citations?: Array<{
    texte: string;
    page?: number;
    contexte?: string;
  }>;
  
  personnages_favoris?: Array<{
    nom: string;
    description: string;
  }>;
  
  moments_forts?: Array<{
    titre: string;
    description: string;
    chapitre?: string;
  }>;
}

export interface ReviewFormProps {
  initialData?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
  bookTitle?: string; // Pour le contexte
}

// Composant pour gérer les citations
function CitationsSection({ 
  citations, 
  onAdd, 
  onRemove, 
  onUpdate 
}: {
  citations: Array<{texte: string; page?: number; contexte?: string;}>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Quote className="w-4 h-4" />
          Citations favorites
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>
      
      {citations.map((citation, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Quote className="w-4 h-4 mt-1 text-muted-foreground" />
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Citation..."
                  value={citation.texte}
                  onChange={(e) => onUpdate(index, "texte", e.target.value)}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Page (optionnel)"
                    value={citation.page || ""}
                    onChange={(e) => onUpdate(index, 'page', parseInt(e.target.value) || 0)}
                  />
                  <Input
                    placeholder="Contexte (optionnel)"
                    value={citation.contexte || ""}
                    onChange={(e) => onUpdate(index, 'contexte', e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {citations.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Quote className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune citation ajoutée</p>
        </div>
      )}
    </div>
  );
}

// Composant pour les moments forts
function MomentsForts({ 
  moments, 
  onAdd, 
  onRemove, 
  onUpdate 
}: {
  moments: Array<{titre: string; description: string; chapitre?: string;}>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Moments forts
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter
        </Button>
      </div>
      
      {moments.map((moment, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-1 text-muted-foreground" />
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Titre du moment"
                    value={moment.titre}
                    onChange={(e) => onUpdate(index, "titre", e.target.value)}
                  />
                  <Input
                    placeholder="Chapitre (optionnel)"
                    value={moment.chapitre || ""}
                    onChange={(e) => onUpdate(index, 'chapitre', e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Description du moment..."
                  value={moment.description}
                  onChange={(e) => onUpdate(index, "description", e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {moments.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun moment fort ajouté</p>
        </div>
      )}
    </div>
  );
}

export function ReviewForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  className,
  bookTitle
}: ReviewFormProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [citations, setCitations] = useState(initialData?.citations || []);
  const [momentsForts, setMomentsForts] = useState(initialData?.moments_forts || []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset
  } = useForm<ReviewFormData>({
    defaultValues: {
      resume_personnel: initialData?.resume_personnel || "",
      critique_detaillee: initialData?.critique_detaillee || '',
      citations_favorites: initialData?.citations_favorites || '',
      pourquoi_aimer: initialData?.pourquoi_aimer || '',
      questions_sur_le_livre: initialData?.questions_sur_le_livre || '',
      recommandation_personnalisee: initialData?.recommandation_personnalisee || '',
      note_generale: initialData?.note_generale || 5,
      niveau_spicy: initialData?.niveau_spicy || 1,
      niveau_dark: initialData?.niveau_dark || 1,
      niveau_romance: initialData?.niveau_romance || 5,
      intensite_emotionnelle: initialData?.intensite_emotionnelle || 5,
      danger: initialData?.danger || 1,
      violence: initialData?.violence || 1,
      originalite: initialData?.originalite || 5,
      rythme: initialData?.rythme || BookRhythm.MEDIUM_BURN
    }
  });

  const watchedValues = watch();

  // Gestion des citations
  const addCitation = () => {
    setCitations(prev => [...prev, { texte: '', page: undefined, contexte: '' }]);
  };

  const removeCitation = (index: number) => {
    setCitations(prev => prev.filter((_, i) => i !== index));
  };

  const updateCitation = (index: number, field: string, value: string | number) => {
    setCitations(prev => prev.map((citation, i) => 
      i === index ? { ...citation, [field]: value } : citation
    ));
  };

  // Gestion des moments forts
  const addMoment = () => {
    setMomentsForts(prev => [...prev, { titre: '', description: '', chapitre: '' }]);
  };

  const removeMoment = (index: number) => {
    setMomentsForts(prev => prev.filter((_, i) => i !== index));
  };

  const updateMoment = (index: number, field: string, value: string) => {
    setMomentsForts(prev => prev.map((moment, i) => 
      i === index ? { ...moment, [field]: value } : moment
    ));
  };

  // Soumettre le formulaire
  const handleFormSubmit = async (data: ReviewFormData) => {
    try {
      // Combiner les données du formulaire avec les citations et moments
      const completeData = {
        ...data,
        citations: citations.filter(c => c.texte.trim()),
        moments_forts: momentsForts.filter(m => m.titre.trim() && m.description.trim())
      };
      
      await onSubmit(completeData);
    } catch (error) {
      console.error("Erreur lors de la soumission: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Critique détaillée</h2>
          {bookTitle && (
            <p className="text-sm text-muted-foreground">
              Pour le livre : <span className="font-medium">{bookTitle}</span>
            </p>
          )}
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
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => reset()}
            disabled={!isDirty}
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="critique" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="critique">Critique</TabsTrigger>
          <TabsTrigger value="notations">Notations</TabsTrigger>
          <TabsTrigger value="citations">Citations & Moments</TabsTrigger>
          <TabsTrigger value="recommandations">Recommandations</TabsTrigger>
        </TabsList>

        {/* Tab Critique */}
        <TabsContent value="critique" className="space-y-4">
          <div className="space-y-4">
            {/* Résumé personnel */}
            <div className="space-y-2">
              <Label htmlFor="resume_personnel">Résumé personnel</Label>
              <Textarea
                id="resume_personnel"
                {...register("resume_personnel")}
                placeholder="Votre résumé du livre en quelques mots..."
                rows={3}
              />
            </div>

            {/* Critique détaillée */}
            <div className="space-y-2">
              <Label htmlFor="critique_detaillee">Critique détaillée</Label>
              <Textarea
                id="critique_detaillee"
                {...register("critique_detaillee")}
                placeholder="Votre critique complète du livre..."
                rows={6}
              />
            </div>
          </div>
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

        {/* Tab Citations & Moments */}
        <TabsContent value="citations" className="space-y-6">
          <div className="grid gap-6">
            {/* Citations favorites */}
            <CitationsSection
              citations={citations}
              onAdd={addCitation}
              onRemove={removeCitation}
              onUpdate={updateCitation}
            />

            <Separator />

            {/* Moments forts */}
            <MomentsForts
              moments={momentsForts}
              onAdd={addMoment}
              onRemove={removeMoment}
              onUpdate={updateMoment}
            />
          </div>
        </TabsContent>

        {/* Tab Recommandations */}
        <TabsContent value="recommandations" className="space-y-4">
          <div className="space-y-4">
            {/* Pourquoi aimer */}
            <div className="space-y-2">
              <Label htmlFor="pourquoi_aimer" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Pourquoi vous devriez l'aimer
              </Label>
              <Textarea
                id="pourquoi_aimer"
                {...register("pourquoi_aimer")}
                placeholder="Les raisons qui rendent ce livre spécial..."
                rows={4}
              />
            </div>

            {/* Questions sur le livre */}
            <div className="space-y-2">
              <Label htmlFor="questions_sur_le_livre" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Questions fréquentes
              </Label>
              <Textarea
                id="questions_sur_le_livre"
                {...register("questions_sur_le_livre")}
                placeholder="Questions que les lecteurs peuvent se poser..."
                rows={4}
              />
            </div>

            {/* Recommandation personnalisée */}
            <div className="space-y-2">
              <Label htmlFor="recommandation_personnalisee" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                À qui le recommander
              </Label>
              <Textarea
                id="recommandation_personnalisee"
                {...register("recommandation_personnalisee")}
                placeholder="Type de lecteur qui appréciera ce livre..."
                rows={4}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Aperçu */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Aperçu de la critique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {/* Notes */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1">
                  ⭐ {watchedValues.note_generale}/10
                </div>
                <div className="flex items-center gap-1">
                  🌶️ {watchedValues.niveau_spicy}/10
                </div>
                <div className="flex items-center gap-1">
                  💀 {watchedValues.niveau_dark}/10
                </div>
                <div className="flex items-center gap-1">
                  ❤️ {watchedValues.niveau_romance}/10
                </div>
              </div>

              {/* Résumé */}
              {watchedValues.resume_personnel && (
                <div>
                  <h4 className="font-medium mb-1">Résumé</h4>
                  <p className="text-muted-foreground">{watchedValues.resume_personnel}</p>
                </div>
              )}

              {/* Critique */}
              {watchedValues.critique_detaillee && (
                <div>
                  <h4 className="font-medium mb-1">Critique</h4>
                  <p className="text-muted-foreground">{watchedValues.critique_detaillee}</p>
                </div>
              )}

              {/* Citations */}
              {citations.filter(c => c.texte.trim()).length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Citations favorites</h4>
                  <div className="space-y-2">
                    {citations.filter(c => c.texte.trim()).map((citation, index) => (
                      <blockquote key={index} className="border-l-4 border-muted pl-3 text-muted-foreground">
                        "{citation.texte}"
                        {citation.page && <span className="text-xs"> (p. {citation.page})</span>}
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}
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
            Sauvegarder la critique
          </Button>
        </div>
      </div>
    </form>
  );
}