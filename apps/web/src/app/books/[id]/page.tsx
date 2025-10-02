'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Calendar,
  User,
  BookOpen,
  Globe,
  Hash,
  Heart,
  Share2,
  Quote,
  MessageCircle,
  ThumbsUp,
  ExternalLink,
  Tag,
  Send,
  Plus,
  Trash2,
  Edit,
  BarChart3,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileContext } from '@/contexts/MobileContext';
import { SagaInfo } from '@/components/ui/saga-info';
import { FloatingActionButtons } from '@/components/ui/floating-action-buttons';

interface Book {
  id: string;
  titre: string;
  auteur: string;
  isbn: string;
  image_couverture: string;
  resume_officiel: string;
  resume_personnel: string;
  critique_detaillee: string;
  citations_favorites: string;
  pourquoi_aimer: string;
  questions_sur_le_livre: string;
  recommandation_personnalisee: string;
  editeur: string;
  date_publication: string;
  nombre_pages: number;
  langue: string;
  date_lecture: string | null;
  statut: string;
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  intensite_emotionnelle: number;
  danger: number;
  violence: number;
  originalite: number;
  rythme: string;
  ajout_manuel: boolean;
  date_creation: string;
  sagaId?: string | null;
  sagaOrder?: number | null;
  saga?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    status: 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'UNKNOWN';
    createdAt: string;
    updatedAt: string;
  } | null;
  sagaNeighbors?: {
    previous?: {
      id: string;
      titre: string;
      sagaOrder: number;
      image_couverture?: string;
    } | null;
    next?: {
      id: string;
      titre: string;
      sagaOrder: number;
      image_couverture?: string;
    } | null;
  } | null;
  categories: Array<{
    category: {
      id: string;
      nom: string;
      couleur: string;
      icone: string;
      description: string;
    };
  }>;
  tags: Array<{
    tag: {
      id: string;
      nom: string;
      couleur: string;
      type: string;
    };
  }>;
  user: {
    nom_complet: string;
    avatar: string | null;
  };
}

interface BookQuestion {
  id: string;
  question: string;
  reponse: string | null;
  date_question: string;
  date_reponse: string | null;
  status: 'PENDING' | 'ANSWERED' | 'REJECTED';
  user: {
    nom_complet: string;
    avatar: string | null;
  };
  answeredBy?: {
    nom_complet: string;
    avatar: string | null;
  } | null;
  likes_count: number;
  is_liked: boolean;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookId = params.id as string;
  const { isMobile } = useMobileContext();

  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['resume_officiel']));

  // Ref pour observer la section sticky et afficher les boutons flottants
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  const { user: currentUser, isAuthenticated } = useAuth();

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // API Calls
  const bookQuery = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const response = await apiClient.get('/api/books/${bookId}');
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      const data = await response.json();
      return data.data as Book;
    },
    enabled: !!bookId
  });

  const questionsQuery = useQuery({
    queryKey: ['questions', bookId],
    queryFn: async () => {
      const response = await apiClient.get('/api/books/${bookId}/questions');
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      const data = await response.json();
      return (data.data || []) as BookQuestion[];
    },
    enabled: !!bookId
  });

  const submitQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiClient.get('/api/books/${bookId}/questions', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      const data = await response.json();
      if (!data.data) throw new Error('Erreur lors de l\'envoi');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', bookId] });
      setNewQuestion('');
      toast.success("Question envoyée !");
    },
    onError: () => {
      toast.error("Erreur lors de l\'envoi de la question');
    },
    onSettled: () => {
      setIsSubmittingQuestion(false);
    }
  });

  const likeQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await apiClient.get('/api/books/${bookId}/questions/${questionId}/like', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('HTTP error! status: ${response.status}');
      }
      return response.json();
    },
    onMutate: async (questionId: string) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ['questions', bookId] });

      // Sauvegarder les données actuelles pour le rollback
      const previousQuestions = queryClient.getQueryData(['questions', bookId]);

      // Mise à jour optimiste
      queryClient.setQueryData(['questions', bookId], (old: any) => {
        if (!old) return old;

        return old.map((question: any) => {
          if (question.id === questionId) {
            const isCurrentlyLiked = question.is_liked;
            return {
              ...question,
              is_liked: !isCurrentlyLiked,
              likes_count: isCurrentlyLiked
                ? question.likes_count - 1
                : question.likes_count + 1
            };
          }
          return question;
        });
      });

      // Retourner le contexte pour le rollback
      return { previousQuestions };
    },
    onError: (err, questionId, context) => {
      // Rollback en cas d'erreur
      if (context?.previousQuestions) {
        queryClient.setQueryData(['questions', bookId], context.previousQuestions);
      }
      toast.error("Erreur lors du like");
    },
    onSettled: () => {
      // Synchroniser avec le serveur après l'opération
      queryClient.invalidateQueries({ queryKey: ['questions', bookId] });
    }
  });

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || isSubmittingQuestion) return;
    setIsSubmittingQuestion(true);
    submitQuestionMutation.mutate(newQuestion.trim());
  };

  const handleLikeQuestion = (questionId: string) => {
    likeQuestionMutation.mutate(questionId);
  };

  const book = bookQuery.data;
  const questions = questionsQuery.data || [];

  // Helper functions
  const getStatusConfig = (statut: string) => {
    const statusConfig = {
      'LU': { bg: '#10B981', color: 'white', text: '📖 Lu' },
      'EN_COURS': { bg: '#F59E0B', color: 'white', text: '📚 En cours' },
      'A_LIRE': { bg: '#8B1538', color: 'white', text: '📋 À lire' }
    };
    const config = statusConfig[statut as keyof typeof statusConfig] || { bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', text: statut };
    return (
      <span
        style={{
          backgroundColor: config.bg,
          color: config.color,
          padding: '0.375rem 0.75rem',
          borderRadius: '9999px',
          fontSize: "0.75rem",
          fontWeight: 600
        }}
      >
        {config.text}
      </span>
    );
  };

  const getRythmeConfig = (rythme: string) => {
    const rhythmConfig = {
      'SLOW_BURN': { emoji: '🐌', text: 'Slow Burn' },
      'MEDIUM_BURN': { emoji: '🔥', text: 'Medium Burn' },
      'FAST_PACE': { emoji: '⚡', text: 'Fast Pace' },
      'INSTA_LOVE' : { emoji: '💕', text: 'Insta Love' }
    };
    const config = rhythmConfig[rythme as keyof typeof rhythmConfig] || { emoji: "", text: rythme };
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm font-medium border border-border">
        <span>{config.emoji}</span>
        {config.text}
      </span>
    );
  };

  // Loading state
  if (bookQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-8 min-h-screen">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="aspect-square bg-muted rounded-lg" style={{ aspectRatio: "3/4" }}></div>
              <div className="md:col-span-2 space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (bookQuery.isError || !book) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-8 min-h-screen">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Livre non trouvé</h1>
            <p className="text-foreground/70 mb-6">Ce livre n"existe pas ou n'est plus disponible.</p>
            <Button onClick={() => router.push('/books')} variant="default">
              Retour au catalogue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tabs configuration
  const tabs = [
    { id: "resume", label: "Résumé', icon: BookOpen, count: null },
    { id: 'stats', label: 'Notes', icon: BarChart3, count: null },
    { id: 'genres', label: 'Genres & Tropes', icon: Tag, count: null },
    { id: 'info', label: 'Infos', icon: FileText, count: null },
    { id: 'faq', label: 'Questions', icon: MessageCircle, count: questions.length }
  ];

  return (
    <>
      {/* Sticky Navigation header - Completely outside page structure */}
      <div ref={stickyHeaderRef} className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/books")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-card hover:bg-muted text-foreground border border-border shadow-sm transition-colors"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour au catalogue</span>
              <span className="sm:hidden">Retour</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Lien copié !");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-card hover:bg-muted text-foreground border border-border shadow-sm transition-colors"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partager</span>
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-8">

          {/* Hero Section */}
          <div className="mb-4 sm:mb-6 md:mb-8 rounded-3xl overflow-hidden shadow-xl bg-card/95 backdrop-blur-xl border border-border"
          >
            <div className="p-3 sm:p-4 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">

                {/* Couverture */}
                <div className="lg:col-span-1 flex justify-center lg:justify-start">
                  <div className="relative inline-block">
                    {book.image_couverture ? (
                      <div className="relative">
                        <img
                          src={book.image_couverture}
                          alt={book.titre}
                          className="w-48 sm:w-56 md:w-64 lg:w-full h-auto object-contain rounded-2xl shadow-2xl"
                        />

                        {/* Status badge */}
                        <div className="absolute top-2 right-2 z-10">
                          {getStatusConfig(book.statut)}
                        </div>

                        {/* Note */}
                        {book.note_generale > 0 && (
                          <div className="absolute bottom-2 left-2 z-10">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg bg-card/95 backdrop-blur-lg border border-yellow-300"
                            >
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold text-sm text-yellow-700 dark:text-yellow-300">
                                {book.note_generale}/10
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-44 md:w-52 flex items-center justify-center rounded-2xl shadow-2xl relative bg-gradient-to-br from-primary to-primary/80"
                        style={{
                          aspectRatio: "2/3"
                        }}
                      >
                        <BookOpen className="w-16 h-16 text-white opacity-70" />

                        {/* Status badge pour placeholder */}
                        <div className="absolute top-2 right-2 z-10">
                          {getStatusConfig(book.statut)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations */}
                <div className="lg:col-span-3 space-y-3 sm:space-y-4 md:space-y-6">
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 text-foreground"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        lineHeight: "1.2"
                      }}
                    >
                      {book.titre}
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-3 sm:mb-4 md:mb-6 text-foreground/80"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400
                      }}
                    >
                      par {book.auteur}
                    </p>
                  </div>

                  {/* Métriques avec barres de progression - Masqué sur mobile */}
                  <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[
                      { label: "🌶️ Spicy", value: book.niveau_spicy, colorClass: "text-orange-600 dark:text-orange-400', bgClass: 'from-orange-500 to-red-500' },
                      { label: '💕 Romance', value: book.niveau_romance, colorClass: 'text-primary', bgClass: 'from-pink-500 to-rose-500' },
                      { label: '🖤 Dark', value: book.niveau_dark, colorClass: 'text-gray-700 dark:text-gray-300', bgClass: 'from-gray-500 to-gray-700' },
                      { label: '✨ Émotions', value: book.intensite_emotionnelle, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'from-purple-500 to-indigo-500' }
                    ].map((metric, index) => (
                      <div key={index} className="p-4 sm:p-5 rounded-xl bg-card/50 border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className='text-sm sm:text-base font-medium text-foreground'
                            style={{
                              fontFamily: 'Inter, sans-serif'
                            }}
                          >
                            {metric.label}
                          </span>
                          <span className={'text-2xl font-bold ${metric.colorClass}'}
                            style={{
                              fontFamily: 'Playfair Display, serif'
                            }}
                          >
                            {metric.value}/10
                          </span>
                        </div>
                        <div className='w-full rounded-full h-3 bg-muted'>
                          <div
                            className={'h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${metric.bgClass}'}
                            style={{
                              width: '${(metric.value / 10) * 100}%'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Saga Section */}
          {book.saga && (
            <SagaInfo
              saga={book.saga}
              sagaOrder={book.sagaOrder || 0}
              sagaNeighbors={book.sagaNeighbors}
            />
          )}

          {/* Navigation des onglets avec style cohérent */}
          <div className="mb-3 sm:mb-4 md:mb-8 rounded-2xl overflow-hidden shadow-lg bg-card/95 backdrop-blur-xl border border-border"
          >
            <div className="p-2 sm:p-3 md:p-6">
              <nav className="flex flex-wrap gap-1 sm:gap-2 md:gap-3'>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={'flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer border-2 relative ${
                      activeTab === tab.id
                        ? 'text-primary-foreground shadow-lg border-primary/30 bg-gradient-to-r from-primary via-primary to-primary/90"
                        : 'hover:bg-muted/50 border-transparent hover:border-border text-muted-foreground hover:text-foreground'
                    }'}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      ...(activeTab === tab.id
                        ? {
                            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)',
                            color: 'hsl(var(--primary-foreground))'
                          }
                        : {})
                    }}
                  >
                    <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline sm:inline'>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={'px-2 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-foreground/20 text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                      }'}>
                        {tab.count}
                      </span>
                    )}
                    {/* Indicateur actif */}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-primary-foreground rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenu des onglets avec style cohérent */}
          <div className="rounded-3xl overflow-hidden shadow-xl bg-card/95 backdrop-blur-xl border border-border mb-24 sm:mb-32"
          >
            <div className="p-3 sm:p-4 md:p-6 lg:p-12">

            {/* Onglet Résumé */}
            {activeTab === "resume" && (
              <div className="space-y-4">
                {/* Résumé officiel */}
                {book.resume_officiel && (
                  <div className="border border-border rounded-xl bg-card">
                    <button
                      onClick={() => toggleSection("resume_officiel")}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                          Résumé officiel
                        </h3>
                      </div>
                      {expandedSections.has('resume_officiel') ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedSections.has("resume_officiel") && (
                      <div className="px-4 pb-4">
                        <div
                          className="prose prose-sm max-w-none leading-relaxed dark:prose-invert text-foreground/80"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                          dangerouslySetInnerHTML={{ __html: book.resume_officiel }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Critique de Bruna */}
                {book.critique_detaillee && (
                  <div className="border border-border rounded-xl bg-card">
                    <button
                      onClick={() => toggleSection("critique_detaillee")}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                          Critique de {book.user?.nom_complet || 'Bruna'}
                        </h3>
                      </div>
                      {expandedSections.has('critique_detaillee') ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedSections.has("critique_detaillee") && (
                      <div className="px-4 pb-4">
                        <p className="leading-relaxed whitespace-pre-line text-foreground/80" style={{ fontFamily: "Inter, sans-serif" }}>
                          {book.critique_detaillee}
                        </p>
                        {book.resume_personnel && (
                          <div className="mt-4 p-4 rounded-lg bg-muted/50">
                            <h4 className="font-semibold mb-2 text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                              💝 Avis personnel
                            </h4>
                            <p className="text-foreground/80" style={{ fontFamily: "Inter, sans-serif" }}>
                              {book.resume_personnel}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Citations favorites */}
                {book.citations_favorites && (
                  <div className="border border-border rounded-xl bg-card">
                    <button
                      onClick={() => toggleSection("citations_favorites")}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Quote className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                          Citations favorites
                        </h3>
                      </div>
                      {expandedSections.has('citations_favorites') ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedSections.has("citations_favorites") && (
                      <div className="px-4 pb-4">
                        <blockquote className="italic leading-relaxed text-foreground/80 border-l-4 border-primary pl-4" style={{ fontFamily: "Playfair Display, serif" }}>
                          {book.citations_favorites}
                        </blockquote>
                      </div>
                    )}
                  </div>
                )}

                {/* Pourquoi vous allez l'aimer */}
                {book.pourquoi_aimer && (
                  <div className="border border-border rounded-xl bg-card">
                    <button
                      onClick={() => toggleSection("pourquoi_aimer")}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-xl"
                    >
                      <div className="flex items-center gap-3">
                        <ThumbsUp className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                          Pourquoi vous allez l'aimer
                        </h3>
                      </div>
                      {expandedSections.has('pourquoi_aimer') ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    {expandedSections.has("pourquoi_aimer") && (
                      <div className="px-4 pb-4">
                        <p className="leading-relaxed text-foreground/80" style={{ fontFamily: "Inter, sans-serif" }}>
                          {book.pourquoi_aimer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Onglet Statistiques */}
            {activeTab === 'stats' && (
              <div className="space-y-4 md:space-y-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-8 flex items-center gap-2 md:gap-3 text-foreground"
                  style={{
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  Évaluations détaillées
                </h3>

                {/* Note générale - Version compacte mobile */}
                <div className="text-center py-3 md:py-8 rounded-xl md:rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                    border: "2px solid rgba(212, 175, 55, 0.2)"
                  }}
                >
                  <div className="text-xl md:text-4xl font-bold mb-2 md:mb-3 text-yellow-700 dark:text-yellow-300"
                    style={{
                      fontFamily: "Playfair Display, serif'
                    }}
                  >
                    {book.note_generale}/10
                  </div>

                  {/* Affichage correct: 10 étoiles pour /10 */}
                  <div className='flex justify-center gap-0.5 md:gap-1 mb-2 md:mb-3'>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Star
                        key={i}
                        className={'w-2.5 h-2.5 md:w-5 md:h-5 ${
                          i < book.note_generale
                            ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'
                        }'}
                      />
                    ))}
                  </div>

                  <p className="text-xs md:text-base text-yellow-700 dark:text-yellow-300 font-medium"
                    style={{
                      fontFamily: "Inter, sans-serif"
                    }}
                  >
                    Note générale
                  </p>
                </div>

                {/* Grille des métriques - Version compacte mobile */}
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
                  {[
                    { label: "🌶️ Spicy", value: book.niveau_spicy, colorClass: "text-orange-600 dark:text-orange-400', bgClass: 'from-orange-600 to-orange-500' },
                    { label: '💕 Romance', value: book.niveau_romance, colorClass: 'text-primary', bgClass: 'from-primary to-primary/80' },
                    { label: '🖤 Dark', value: book.niveau_dark, colorClass: 'text-gray-700 dark:text-gray-300', bgClass: 'from-gray-600 to-gray-500' },
                    { label: '✨ Émotions', value: book.intensite_emotionnelle, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'from-purple-600 to-purple-500' },
                    { label: '⚠️ Danger', value: book.danger, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'from-red-600 to-red-500' },
                    { label: '🔥 Violence', value: book.violence, colorClass: 'text-red-700 dark:text-red-300', bgClass: 'from-red-700 to-red-600' },
                    { label: '🌟 Originalité', value: book.originalite, colorClass: 'text-yellow-700 dark:text-yellow-300', bgClass: 'from-yellow-600 to-yellow-500' }
                  ].map((metric, index) => (
                    <div key={index} className="p-3 md:p-6 rounded-xl md:rounded-2xl bg-card/90 backdrop-blur-lg border border-border shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                        <span className='text-sm md:text-lg font-medium'
                          style={{
                              fontFamily: 'Inter, sans-serif'
                          }}
                        >
                          {metric.label}
                        </span>
                        <span className={'text-lg md:text-2xl font-bold ${metric.colorClass}'}
                          style={{
                            fontFamily: 'Playfair Display, serif'
                          }}
                        >
                          {metric.value}/10
                        </span>
                      </div>
                      <div className='w-full rounded-full h-2 md:h-3 bg-muted'>
                        <div
                          className={'h-2 md:h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${metric.bgClass}'}
                          style={{
                            width: '${(metric.value / 10) * 100}%'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onglet Genres & Tropes */}
            {activeTab === 'genres" && (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3 text-foreground"
                  style={{
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  <Tag className="w-6 h-6 text-primary" />
                  Genres & Tropes
                </h3>

                <div className="space-y-6">
                  {/* Rythme de lecture */}
                  {book.rythme && (
                    <div className="p-4 sm:p-6 rounded-xl bg-card/90 backdrop-blur-lg border border-border shadow-lg">
                      <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"
                        style={{
                          fontFamily: 'Playfair Display, serif'
                        }}
                      >
                        🔥 Rythme de lecture
                      </h4>
                      <span className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-base font-medium bg-primary/10 border border-primary/20 text-primary"
                        style={{
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        {(() => {
                          const rhythmConfig = {
                            'SLOW_BURN': { emoji: '🐌', text: 'Slow Burn' },
                            'MEDIUM_BURN': { emoji: '🔥', text: 'Medium Burn' },
                            'FAST_PACE': { emoji: '⚡', text: 'Fast Pace' },
                            'INSTA_LOVE': { emoji: '💕', text: 'Insta Love' }
                          };
                          const config = rhythmConfig[book.rythme as keyof typeof rhythmConfig] || { emoji: "", text: book.rythme };
                          return (
                            <>
                              <span>{config.emoji}</span>
                              {config.text}
                            </>
                          );
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Genres et Tropes - Section compacte */}
                  {(book.categories.length > 0 || book.tags.length > 0) && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      {/* Genres */}
                      {book.categories.length > 0 && (
                        <div className="mb-4 last:mb-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📚</span>
                            <h4 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                              Genres
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {book.categories.map((item) => (
                              <Badge
                                key={item.category.id}
                                className="px-3 py-1 text-sm font-medium"
                                style={{
                                  backgroundColor: item.category.couleur,
                                  color: 'white',
                                  border: "none"
                                }}
                              >
                                {item.category.icone} {item.category.nom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Separator */}
                      {book.categories.length > 0 && book.tags.length > 0 && (
                        <div className="border-t border-border/50 my-4" />
                      )}

                      {/* Tropes */}
                      {book.tags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🏷️</span>
                            <h4 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                              Tropes & Thèmes
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {book.tags.map((item) => (
                              <Badge
                                key={item.tag.id}
                                variant="outline"
                                className="px-3 py-1 text-sm font-medium border"
                                style={{
                                  borderColor: item.tag.couleur,
                                  color: item.tag.couleur,
                                  backgroundColor: 'transparent'
                                }}
                              >
                                {item.tag.nom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Informations */}
            {activeTab === "info" && (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3 text-foreground"
                  style={{
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  <FileText className="w-6 h-6 text-primary" />
                  Informations détaillées
                </h3>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Auteur", value: book.auteur, icon: "👤' },
                      { label: 'ISBN', value: book.isbn, icon: '📊' },
                      { label: 'Éditeur', value: book.editeur, icon: '🏢' },
                      { label: 'Date de publication', value: book.date_publication ? new Date(book.date_publication).toLocaleDateString('fr-FR') : null, icon: '📅' },
                      { label: 'Nombre de pages', value: book.nombre_pages, icon: '📄' },
                      { label: 'Langue', value: book.langue === 'FR' ? 'Français 🇫🇷' : 'Anglais 🇺🇸', icon: '🌍' },
                      { label: 'Date de lecture', value: book.date_lecture ? new Date(book.date_lecture).toLocaleDateString('fr-FR') : null, icon: '📖' },
                      {
                        label: 'Statut',
                        value: book.statut === 'A_LIRE' ? 'À lire' :
                               book.statut === 'EN_COURS' ? 'En cours' :
                               book.statut === 'LU' ? 'Lu' :
                               book.statut === 'ABANDONNE' ? 'Abandonné' : book.statut,
                        icon: "📋"
                      }
                    ].filter(item => item.value).map((item, index) => (
                      <div key={index} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {item.label}
                          </div>
                          <div className="text-base font-semibold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                            {item.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Onglet Questions */}
            {activeTab === 'faq' && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 text-foreground"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                    }}
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Questions sur le livre
                  </h3>
                  <span className="text-sm sm:text-lg font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary"
                    style={{
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {questions.length} question{questions.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Formulaire pour poser une question */}
                {isAuthenticated ? (
                  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20"
                  >
                    <h4 className="font-bold mb-3 sm:mb-4 text-lg sm:text-xl text-foreground"
                      style={{
                          fontFamily: 'Playfair Display, serif'
                      }}
                    >
                      Poser une question
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      <Textarea
                        placeholder="Votre question sur ce livre..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="resize-none border rounded-xl p-3 sm:p-4 text-sm sm:text-base bg-background"
                        style={{
                          fontFamily: 'Inter, sans-serif'
                        }}
                        rows={4}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitQuestion}
                          disabled={!newQuestion.trim() || isSubmittingQuestion}
                          className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-white shadow-lg bg-gradient-to-br from-primary to-primary/90"
                        >
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          {isSubmittingQuestion ? "Envoi..." : "Envoyer"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center bg-primary/10 border border-primary/20"
                  >
                    <p className="mb-3 sm:mb-4 text-base sm:text-lg text-foreground/80"
                      style={{
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      Connectez-vous pour poser une question sur ce livre
                    </p>
                    <Button
                      onClick={() => router.push('/login')}
                      variant="outline"
                      className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium border"
                    >
                      Se connecter
                    </Button>
                  </div>
                )}

                {/* Liste des questions */}
                <div className="space-y-6">
                  {questions.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl bg-card/90 backdrop-blur-lg border border-border"
                    >
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <p className="text-xl mb-2"
                        style={{
                          fontFamily: 'Playfair Display, serif'
                        }}
                      >
                        Aucune question pour le moment
                      </p>
                      <p className="text-base"
                        style={{
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        Soyez le premier à poser une question !
                      </p>
                    </div>
                  ) : (
                    questions.map((question) => (
                      <div key={question.id} className="bg-card/90 backdrop-blur-lg border border-border/50 rounded-2xl overflow-hidden shadow-lg"
                      >
                        {/* Header with user info and like button */}
                        <div className="flex items-center justify-between p-4 border-b border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80"
                            >
                              <User className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground"
                                style={{
                                  fontFamily: 'Playfair Display, serif'
                                }}
                              >
                                {question.user.nom_complet}
                              </h4>
                              <p className='text-xs text-muted-foreground'
                                style={{
                                  fontFamily: 'Inter, sans-serif'
                                }}
                              >
                                {new Date(question.date_question).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          {/* Like button */}
                          <button
                            onClick={() => handleLikeQuestion(question.id)}
                            className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 active:scale-95 ${
                              question.is_liked
                                ? '}bg-primary/15 text-primary border border-primary/20' : 'bg-background/50 text-muted-foreground border border-border/30 hover:bg-primary/10 hover:text-primary hover:border-primary/20'
                            }'}
                          >
                            <ThumbsUp className={'w-3.5 h-3.5 transition-all duration-200 ${
                              question.is_liked ? 'fill-current' : ""
                            }'} />
                            <span className="font-medium">{question.likes_count}</span>
                          </button>
                        </div>

                        {/* Question content */}
                        <div className="p-4">
                          <div className="p-4 rounded-xl bg-background/40 border border-border/30">
                            <p className="text-sm sm:text-base leading-relaxed text-foreground break-words overflow-wrap-anywhere hyphens-auto"
                              style={{
                                fontFamily: "Inter, sans-serif"
                              }}
                            >
                              {question.question}
                            </p>
                          </div>

                          {/* Response section */}
                          {question.status === 'ANSWERED' && question.reponse && (
                            <div className="mt-4 p-4 rounded-xl bg-green-50/80 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/30"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-sm text-green-800 dark:text-green-200"
                                  style={{
                                    fontFamily: 'Playfair Display, serif'
                                  }}
                                >
                                  Réponse de {question.answeredBy?.nom_complet || 'Bruna'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-200/80 dark:bg-green-800/50 text-green-700 dark:text-green-300"
                                  style={{
                                    fontFamily: 'Inter, sans-serif'
                                  }}
                                >
                                  {question.date_reponse && new Date(question.date_reponse).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed text-green-800 dark:text-green-200 break-words overflow-wrap-anywhere hyphens-auto"
                                style={{
                                  fontFamily: 'Inter, sans-serif'
                                }}
                              >
                                {question.reponse}
                              </p>
                            </div>
                          )}

                          {/* Pending status */}
                          {question.status === 'PENDING' && (
                            <div className="mt-4 p-3 rounded-xl bg-yellow-50/80 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/30"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200"
                                  style={{
                                    fontFamily: 'Inter, sans-serif'
                                  }}
                                >
                                  En attente de réponse
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Message pour les autres onglets */}
            {!('resume,stats,genres,info,faq'.split(',').includes(activeTab)) && (
              <div className="text-center py-16">
                <div className="mb-6">
                  <MessageCircle className="w-20 h-20 mx-auto mb-6 text-primary/50"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground"
                  style={{
                    fontFamily: 'Playfair Display, serif'
                  }}
                >
                  Contenu à venir
                </h3>
                <p className="text-lg"
                  style={{
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Cette section sera bientôt disponible avec encore plus de fonctionnalités.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Boutons flottants qui apparaissent quand la section sticky n'est plus visible */}
    <FloatingActionButtons
      onBack={() => router.push('/books')}
      triggerRef={stickyHeaderRef}
    />
    </>
  );
}