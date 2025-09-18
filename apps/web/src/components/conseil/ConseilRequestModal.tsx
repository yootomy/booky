'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { X, ChevronLeft, ChevronRight, Heart, Sparkles, BookOpen, Send, User } from 'lucide-react';
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
  CATEGORIES: 1,
  TAGS: 2,
  NAME: 3,
  COMMENTS: 4,
  CONFIRMATION: 5
};

const STEP_TITLES = {
  [STEPS.CATEGORIES]: "Vos genres préférés",
  [STEPS.TAGS]: "Vos tropes favoris",
  [STEPS.NAME]: "Comment vous appeler ?",
  [STEPS.COMMENTS]: "Dites-nous en plus",
  [STEPS.CONFIRMATION]: "Confirmer votre demande"
};

export function ConseilRequestModal({ isOpen, onClose }: ConseilRequestModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(STEPS.CATEGORIES);
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
      const response = await fetch('/api/proxy/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    enabled: isOpen
  });

  // Fetch tags - only romance/trope related
  const { data: tagsData } = useQuery({
    queryKey: ['tags-romance'],
    queryFn: async () => {
      const response = await fetch('/api/proxy/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const result = await response.json();
      // Filter for romance-related tags
      return {
        ...result,
        data: result.data?.filter((tag: Tag) =>
          tag.type === 'TROPE' || tag.type === 'GENRE'
        ) || []
      };
    },
    enabled: isOpen
  });

  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];

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
    if (currentStep > STEPS.CATEGORIES) {
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

      const response = await fetch('/api/proxy/conseil-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la demande');
      }

      // Success! Close modal
      onClose();

      // Show success message (you could add a toast here)
      alert('Votre demande a été envoyée à Bruna ! Elle vous répondra bientôt avec ses recommandations. 📚✨');

    } catch (error) {
      console.error('Erreur envoi demande conseil:', error);
      alert('Erreur lors de l\'envoi de votre demande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.CATEGORIES:
        return (
          <div className="space-y-6">
            <p className="text-center text-lg" style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}>
              Quels genres de dark romance vous font vibrer ?
            </p>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category: Category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedCategories.includes(category.id)
                        ? 'ring-2 ring-opacity-50'
                        : ''
                    }`}
                    style={{
                      background: selectedCategories.includes(category.id)
                        ? 'linear-gradient(135deg, rgba(139, 21, 56, 0.1) 0%, rgba(107, 76, 123, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                      border: selectedCategories.includes(category.id)
                        ? '2px solid rgba(139, 21, 56, 0.3)'
                        : '1px solid rgba(139, 21, 56, 0.1)',
                      borderRadius: '16px'
                    }}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div
                        className="w-3 h-3 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: category.couleur }}
                      />
                      <h3 className="font-semibold text-sm" style={{ fontFamily: 'Inter, sans-serif', color: '#2C1810' }}>
                        {category.nom}
                      </h3>
                      {category.description && (
                        <p className="text-xs mt-1 opacity-70" style={{ color: '#6B4C7B' }}>
                          {category.description}
                        </p>
                      )}
                      {selectedCategories.includes(category.id) && (
                        <Heart className="w-4 h-4 mx-auto mt-2 text-red-500 fill-current" />
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
          <div className="space-y-6">
            <p className="text-center text-lg" style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}>
              Quels tropes vous font fondre ?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {tags.map((tag: Tag) => (
                <motion.div
                  key={tag.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    className={`cursor-pointer transition-all duration-300 p-3 text-center w-full ${
                      selectedTags.includes(tag.id) ? 'ring-2 ring-offset-1' : ''
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tag.id)
                        ? tag.couleur
                        : `${tag.couleur}20`,
                      color: selectedTags.includes(tag.id) ? 'white' : tag.couleur,
                      border: `1px solid ${tag.couleur}`,
                      borderRadius: '12px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.8rem'
                    }}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.nom}
                    {selectedTags.includes(tag.id) && (
                      <Sparkles className="w-3 h-3 ml-1 inline" />
                    )}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case STEPS.NAME:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-4" style={{ color: '#6B4C7B' }} />
              <p className="text-lg" style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}>
                Comment Bruna peut-elle vous appeler ?
              </p>
            </div>
            <div className="space-y-4">
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Votre prénom..."
                className="text-center text-lg py-4"
                style={{
                  borderRadius: '16px',
                  border: '2px solid rgba(139, 21, 56, 0.2)',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <p className="text-sm text-center opacity-70" style={{ color: '#6B4C7B' }}>
                Juste votre prénom suffit pour personnaliser ses recommandations ✨
              </p>
            </div>
          </div>
        );

      case STEPS.COMMENTS:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: '#6B4C7B' }} />
              <p className="text-lg" style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}>
                Quelque chose de spécial à ajouter ?
              </p>
              <p className="text-sm opacity-70 mt-2" style={{ color: '#6B4C7B' }}>
                Parlez-nous de vos envies du moment (optionnel)
              </p>
            </div>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Ex: Je cherche quelque chose avec beaucoup d'émotion, ou alors un livre qui me fera pleurer, ou encore une histoire avec un anti-héros irrésistible..."
              className="min-h-32"
              style={{
                borderRadius: '16px',
                border: '2px solid rgba(139, 21, 56, 0.2)',
                fontFamily: 'Inter, sans-serif'
              }}
            />
          </div>
        );

      case STEPS.CONFIRMATION:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Send className="w-12 h-12 mx-auto mb-4" style={{ color: '#6B4C7B' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: '#2C1810', fontFamily: 'Playfair Display, serif' }}>
                Prêt(e) à recevoir vos recommandations ?
              </h3>
              <p className="text-sm opacity-70" style={{ color: '#6B4C7B' }}>
                Bruna va étudier vos goûts et vous proposer ses meilleurs conseils
              </p>
            </div>

            <div className="space-y-4 p-4 rounded-xl" style={{ background: 'rgba(139, 21, 56, 0.05)' }}>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: '#2C1810' }}>Nom :</h4>
                <p style={{ color: '#6B4C7B' }}>{userName}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: '#2C1810' }}>Genres sélectionnés :</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedCategories.map(catId => {
                    const cat = categories.find((c: Category) => c.id === catId);
                    return cat ? (
                      <Badge key={catId} style={{ backgroundColor: cat.couleur, color: 'white', fontSize: '0.7rem' }}>
                        {cat.nom}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: '#2C1810' }}>Tropes sélectionnés :</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTags.slice(0, 5).map(tagId => {
                    const tag = tags.find((t: Tag) => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} style={{ backgroundColor: tag.couleur, color: 'white', fontSize: '0.7rem' }}>
                        {tag.nom}
                      </Badge>
                    ) : null;
                  })}
                  {selectedTags.length > 5 && (
                    <Badge style={{ backgroundColor: '#6B4C7B', color: 'white', fontSize: '0.7rem' }}>
                      +{selectedTags.length - 5} autres
                    </Badge>
                  )}
                </div>
              </div>
              {comments && (
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: '#2C1810' }}>Commentaires :</h4>
                  <p className="text-sm" style={{ color: '#6B4C7B' }}>{comments}</p>
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
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 248, 245, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 21, 56, 0.1)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(139, 21, 56, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-opacity-20" style={{ borderColor: '#8B1538' }}>
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#2C1810' }}>
                {STEP_TITLES[currentStep]}
              </h2>
              <p className="text-sm opacity-70" style={{ color: '#6B4C7B' }}>
                Étape {currentStep} sur {STEPS.CONFIRMATION}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full w-10 h-10 p-0 hover:bg-red-50"
            >
              <X className="w-5 h-5" style={{ color: '#8B1538' }} />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="px-6 pt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(currentStep / STEPS.CONFIRMATION) * 100}%`,
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
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
          <div className="flex items-center justify-between p-6 border-t border-opacity-20" style={{ borderColor: '#8B1538' }}>
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === STEPS.CATEGORIES}
              className="flex items-center gap-2 px-6"
              style={{
                borderColor: '#6B4C7B',
                color: '#6B4C7B'
              }}
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
                    ? 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                    : '#ccc',
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