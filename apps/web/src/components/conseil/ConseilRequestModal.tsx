'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { X, ChevronLeft, ChevronRight, Heart, Sparkles, BookOpen, Send, User } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ConseilRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  nom: string;
  couleur: string;
  description?: string;
}

interface Tag {
  id: string;
  nom: string;
  couleur: string;
  type: string;
}

const STEPS = {
  INTRO: 0,
  CATEGORIES: 1,
  TAGS: 2,
  NAME: 3,
  COMMENTS: 4,
  CONFIRMATION: 5
};

const STEP_TITLES = {
  [STEPS.INTRO]: "Recommandations Bruna",
  [STEPS.CATEGORIES]: "Vos genres préférés",
  [STEPS.TAGS]: "Vos tropes favoris",
  [STEPS.NAME]: "Comment vous appeler ?",
  [STEPS.COMMENTS]: "Dites-nous en plus",
  [STEPS.CONFIRMATION]: "Confirmer votre demande"
};

export function ConseilRequestModal({ isOpen, onClose }: ConseilRequestModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.INTRO);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(STEPS.INTRO);
      setSelectedCategories([]);
      setSelectedTags([]);
      setUserName(user?.nom_complet?.split(' ')[0] || '');
      setComments('');
      setIsSubmitting(false);
    }
  }, [isOpen, user]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/api/categories');
      if (!response.success) throw new Error(response.error || "Failed to fetch categories");
      return response.data;
    },
    enabled: isOpen
  });

  // Fetch tags - only romance/trope related
  const { data: tagsData } = useQuery({
    queryKey: ['tags-romance'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tags');
      if (!response.success) throw new Error(response.error || "Failed to fetch tags");
      const result = response.data;
      // Filter for romance-related tags
      return result?.data?.filter((tag: Tag) =>
        tag.type === 'TROPE' || tag.type === 'GENRE'
      ) || [];
    },
    enabled: isOpen
  });

  const categories = categoriesData?.data || [];
  const tags = tagsData || [];

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case STEPS.INTRO:
        return true; // Always can proceed from intro
      case STEPS.CATEGORIES:
        return selectedCategories.length > 0;
      case STEPS.TAGS:
        return selectedTags.length > 0;
      case STEPS.NAME:
        return userName.trim().length > 0;
      case STEPS.COMMENTS:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < STEPS.CONFIRMATION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > STEPS.INTRO) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const requestData = {
        nom_utilisateur: userName.trim(),
        categories: selectedCategories,
        tags: selectedTags,
        commentaires: comments.trim() || null,
        userId: user?.id || null
      };

      const response = await apiClient.post('/api/conseil-requests', requestData);

      if (!response.success) {
        throw new Error('Erreur lors de l\'envoi de la demande');
      }

      // Success! Close modal
      onClose();

      // Show success message (you could add a toast here)
      alert('Votre demande a été envoyée à Bruna ! Elle vous répondra bientôt avec ses recommandations. 📚✨');

    } catch (error) {
      console.error("Erreur envoi demande conseil: ", error);
      alert("Erreur lors de l\"envoi de votre demande. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.INTRO:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Recommandations par Bruna
              </h3>
              <p className="text-sm text-foreground/70 max-w-sm mx-auto">
                Bruna va analyser vos goûts pour vous recommander le livre parfait
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-card/60 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-sm">Personnalisé</span>
                </div>
                <p className="text-xs text-foreground/70">Selon vos préférences</p>
              </div>
              <div className="flex-1 p-3 bg-card/60 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-sm">Expert</span>
                </div>
                <p className="text-xs text-foreground/70">Par une passionnée</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-center">
              <p className="text-sm text-foreground/80">
                ⏱️ <strong>2 minutes</strong> pour vos recommandations !
              </p>
            </div>
          </div>
        );

      case STEPS.CATEGORIES:
        return (
          <div className="space-y-4">
            <p className="text-center text-sm text-foreground/80">
              Quels genres vous font vibrer ?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category: Category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedCategories.includes(category.id)
                        ? 'ring-2 ring-primary/50 bg-primary/10'
                        : 'bg-card/60'
                    } border border-border hover:bg-card/80`}
                    style={{ borderRadius: "12px" }}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <CardContent className="p-3 text-center">
                      <div
                        className="w-3 h-3 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: category.couleur }}
                      />
                      <h3 className="font-medium text-xs text-foreground">
                        {category.nom}
                      </h3>
                      {selectedCategories.includes(category.id) && (
                        <Heart className="w-3 h-3 mx-auto mt-1 text-red-500 fill-current" />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case STEPS.TAGS:
        return (
          <div className="space-y-4">
            <p className="text-center text-sm text-foreground/80">
              Quels tropes vous font fondre ?
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto overflow-x-hidden scrollbar-hide">
              {tags.map((tag: Tag) => (
                <motion.div
                  key={tag.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`cursor-pointer transition-all duration-300 p-2 text-center w-full rounded-lg border ${selectedTags.includes(tag.id) ? 'ring-1 ring-offset-0' : ''}`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id)
                        ? tag.couleur
                        : `${tag.couleur}20`,
                      color: selectedTags.includes(tag.id) ? 'white' : tag.couleur,
                      borderColor: tag.couleur,
                      fontSize: '0.7rem',
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <span className="truncate leading-tight" style={{ maxWidth: '100%' }}>
                      {tag.nom}
                      {selectedTags.includes(tag.id) && ' ✨'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case STEPS.NAME:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-foreground/80">
                Comment Bruna peut-elle vous appeler ?
              </p>
            </div>
            <div className="space-y-3">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Votre prénom..."
                className="text-center py-3 bg-background border-2 border-primary/20 text-foreground focus:border-primary/40"
                style={{
                  borderRadius: "12px"
                }}
              />
              <p className="text-xs text-center text-foreground/70">
                Pour personnaliser ses recommandations ✨
              </p>
            </div>
          </div>
        );

      case STEPS.COMMENTS:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-foreground/80">
                Quelque chose de spécial à ajouter ?
              </p>
              <p className="text-xs text-foreground/70 mt-1">
                Vos envies du moment (optionnel)
              </p>
            </div>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ex: Envie d'émotion, d'un anti-héros irrésistible..."
              className="min-h-24 bg-background border-2 border-primary/20 text-foreground focus:border-primary/40 text-sm"
              style={{
                borderRadius: "12px"
              }}
            />
          </div>
        );

      case STEPS.CONFIRMATION:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Send className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-lg font-bold mb-1 text-foreground">
                Prêt(e) pour vos recommandations ?
              </h3>
              <p className="text-xs text-foreground/70">
                Bruna va étudier vos goûts
              </p>
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div>
                <h4 className="font-medium text-xs text-foreground mb-1">Nom :</h4>
                <p className="text-sm text-foreground/80">{userName}</p>
              </div>
              <div>
                <h4 className="font-medium text-xs text-foreground mb-1">Genres :</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedCategories.slice(0, 3).map(catId => {
                    const cat = categories.find((c: Category) => c.id === catId);
                    return cat ? (
                      <Badge key={catId} style={{ backgroundColor: cat.couleur, color: 'white', fontSize: '0.6rem' }}>
                        {cat.nom}
                      </Badge>
                    ) : null;
                  })}
                  {selectedCategories.length > 3 && (
                    <Badge style={{ backgroundColor: '#6B4C7B', color: 'white', fontSize: '0.6rem' }}>
                      +{selectedCategories.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-xs text-foreground mb-1">Tropes :</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.slice(0, 3).map(tagId => {
                    const tag = tags.find((t: Tag) => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} style={{ backgroundColor: tag.couleur, color: 'white', fontSize: '0.6rem' }}>
                        {tag.nom}
                      </Badge>
                    ) : null;
                  })}
                  {selectedTags.length > 3 && (
                    <Badge style={{ backgroundColor: '#6B4C7B', color: 'white', fontSize: '0.6rem' }}>
                      +{selectedTags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              {comments && (
                <div>
                  <h4 className="font-medium text-xs text-foreground mb-1">Commentaires :</h4>
                  <p className="text-xs text-foreground/80 truncate">{comments}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[85vh] bg-card/95 backdrop-blur-xl border border-border shadow-2xl"
          style={{
            borderRadius: "16px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground truncate">
                {STEP_TITLES[currentStep]}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-muted rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: '${(currentStep / STEPS.CONFIRMATION) * 100}%',
                      background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                    }}
                  />
                </div>
                <span className="text-xs text-foreground/60 whitespace-nowrap">
                  {currentStep}/{STEPS.CONFIRMATION}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full w-8 h-8 p-0 hover:bg-primary/10 ml-2"
            >
              <X className="w-4 h-4 text-primary" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[55vh] scrollbar-hide">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === STEPS.INTRO}
              className="flex items-center gap-2 px-6 border-primary/30 text-primary hover:bg-primary/10"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>

            {currentStep === STEPS.CONFIRMATION ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  color: 'white'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer ma demande
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2 px-6"
                style={{
                  background: canProceedToNext()
                    ? "linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)" : "#ccc",
                  color: 'white'
                }}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}