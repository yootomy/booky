'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Feather,
  Sparkles,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { booksApi } from '@/utils/orpc';
import { useAuth } from '@/contexts/AuthContext';
import { SagaInfo } from '@/components/ui/saga-info';

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

  // Ajout de styles CSS pour masquer les scrollbars et assurer le scroll
  useEffect(() => {
    const styleId = 'book-detail-styles';

    // Éviter les duplications
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      html, body {
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');

  // Cleanup sur unmount pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      // Nettoyage des timers et animations
      if (typeof window !== 'undefined') {
        window.cancelAnimationFrame = window.cancelAnimationFrame || function(id) { clearTimeout(id); };
      }
    };
  }, []);

  const { user: currentUser, isAuthenticated } = useAuth();

  const bookQuery = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const response = await booksApi.getById(bookId);
      return response.data;
    },
    enabled: !!bookId,
    staleTime: 1000,
    refetchOnWindowFocus: true,
  });

  const questionsQuery = useQuery({
    queryKey: ['book-questions', bookId],
    queryFn: async (): Promise<BookQuestion[]> => {
      const response = await booksApi.getQuestions(bookId);
      return (response.data || []) as BookQuestion[];
    },
    enabled: !!bookId
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await booksApi.createQuestion(bookId, question);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-questions', bookId] });
      setNewQuestion('');
      toast.success('Votre question a été soumise ! Bruna y répondra bientôt.');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Erreur lors de l\'envoi de votre question. Veuillez réessayer.');
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await booksApi.toggleQuestionLike(bookId, questionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-questions', bookId] });
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Erreur lors du like. Veuillez réessayer.');
    }
  });

  const book = bookQuery.data;
  const questions = questionsQuery.data || [];

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      toast.error('Veuillez saisir votre question');
      return;
    }
    if (newQuestion.trim().length < 10) {
      toast.error('Votre question doit contenir au moins 10 caractères');
      return;
    }
    if (newQuestion.trim().length > 1000) {
      toast.error('Votre question ne peut pas dépasser 1000 caractères');
      return;
    }
    if (!currentUser) {
      toast.error('Vous devez être connecté pour poser une question');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      await addQuestionMutation.mutateAsync(newQuestion.trim());
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      LU: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', text: '📖 Lu' },
      EN_COURS: { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', text: '📚 En cours' },
      A_LIRE: { bg: 'rgba(139, 21, 56, 0.1)', color: '#8B1538', text: '📋 À lire' }
    };
    const config = statusConfig[statut as keyof typeof statusConfig] || { bg: '#f3f4f6', color: '#6B7280', text: statut };
    return (
      <span
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.color}40`
        }}
        className="px-3 py-1 rounded-full text-sm font-medium"
      >
        {config.text}
      </span>
    );
  };

  const getRythmeBadge = (rythme: string) => {
    const rhythmConfig = {
      SLOW_BURN: { emoji: '🐌', text: 'Slow Burn' },
      MEDIUM_BURN: { emoji: '🔥', text: 'Medium Burn' },
      FAST_PACE: { emoji: '⚡', text: 'Fast Pace' },
      INSTA_LOVE: { emoji: '💕', text: 'Insta Love' }
    };
    const config = rhythmConfig[rythme as keyof typeof rhythmConfig] || { emoji: '', text: rythme };
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium border border-gray-200">
        <span>{config.emoji}</span>
        {config.text}
      </span>
    );
  };

  if (bookQuery.isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookQuery.isError || !book) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Livre non trouvé</h1>
            <p className="text-gray-600 mb-6">Ce livre n'existe pas ou n'est plus disponible.</p>
            <Button onClick={() => router.push('/books')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au catalogue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'resume', label: 'Résumé & Critique', icon: FileText, count: null },
    { id: 'stats', label: 'Évaluations', icon: BarChart3, count: null },
    { id: 'tags', label: 'Genres & Tags', icon: Tag, count: (book?.categories?.length || 0) + (book?.tags?.length || 0) },
    { id: 'faq', label: 'Questions', icon: MessageCircle, count: questions.length },
    { id: 'reco', label: 'Similaires', icon: Users, count: null }
  ];

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Background avec texture romantique */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Floating romantic elements - optimized */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{
            y: [0, -15, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 0.5
          }}
          className="absolute top-20 left-10"
        >
          <Heart className="w-5 h-5" style={{color: '#8B1538', strokeWidth: 1.5}} />
        </motion.div>

        <motion.div
          animate={{
            rotate: [0, 360],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 1
          }}
          className="absolute top-40 right-16"
        >
          <Sparkles className="w-4 h-4" style={{color: '#B8860B'}} />
        </motion.div>

        <motion.div
          animate={{
            x: [0, 8, 0],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 0.8
          }}
          className="absolute bottom-40 left-20"
        >
          <Feather className="w-6 h-6" style={{color: '#6B4C7B', strokeWidth: 1.5}} />
        </motion.div>

        <motion.div
          animate={{
            y: [0, -12, 0],
            opacity: [0.25, 0.4, 0.25]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
            repeatDelay: 1.2
          }}
          className="absolute top-60 right-40"
        >
          <Crown className="w-5 h-5" style={{color: '#8B1538'}} />
        </motion.div>
      </div>

      {/* Navigation header élégante */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-md border-b shadow-sm"
        style={{
          backgroundColor: 'rgba(250, 248, 245, 0.95)',
          borderColor: 'rgba(107, 76, 123, 0.1)'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/books')}
              className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105"
              style={{
                color: '#6B4C7B',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(107, 76, 123, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.2)';
              }}
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                Retour au catalogue
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Lien copié !');
                }}
                className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105"
                style={{
                  color: '#8B1538',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(139, 21, 56, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(139, 21, 56, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.2)';
                }}
              >
                <Share2 className="w-4 h-4" />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 500 }}>
                  Partager
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Hero Section avec layout asymétrique */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="relative">
            {/* Background card avec effet de profondeur */}
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(107, 76, 123, 0.1)'
              }}
            >
              {/* Gradient d'accentuation */}
              <div
                className="absolute top-0 left-0 w-full h-2"
                style={{
                  background: 'linear-gradient(90deg, #8B1538 0%, #6B4C7B 50%, #B8860B 100%)'
                }}
              />

              <div className="p-8 lg:p-12">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                  {/* Couverture avec effet 3D */}
                  <div className="lg:col-span-4">
                    <motion.div
                      whileHover={{
                        scale: 1.05,
                        rotateY: -5,
                        rotateX: 5
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative group"
                      style={{ perspective: '1000px' }}
                    >
                      <div
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl"
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {book.image_couverture ? (
                          <Image
                            src={book.image_couverture}
                            alt={book.titre}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            priority
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)'
                            }}
                          >
                            <BookOpen className="w-16 h-16 text-white opacity-70" />
                          </div>
                        )}

                        {/* Overlay gradient au hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: 'linear-gradient(45deg, rgba(139, 21, 56, 0.2) 0%, rgba(107, 76, 123, 0.2) 100%)'
                          }}
                        />

                        {/* Status badge flottant */}
                        <div className="absolute -top-2 -right-2 z-10">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                          >
                            {getStatusBadge(book.statut)}
                          </motion.div>
                        </div>

                        {/* Note flottante */}
                        {book.note_generale > 0 && (
                          <div className="absolute -bottom-3 -left-3">
                            <motion.div
                              initial={{ scale: 0, y: 20 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                              className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(184, 134, 11, 0.3)'
                              }}
                            >
                              <Star className="w-4 h-4 fill-current" style={{ color: '#B8860B' }} />
                              <span
                                style={{
                                  fontSize: '1.1rem',
                                  fontWeight: 700,
                                  color: '#2C1810',
                                  fontFamily: 'Inter, sans-serif'
                                }}
                              >
                                {book.note_generale}/10
                              </span>
                            </motion.div>
                          </div>
                        )}
                      </div>

                      {/* Ombre portée dramatique */}
                      <div
                        className="absolute inset-0 -z-10 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.3) 0%, rgba(107, 76, 123, 0.3) 100%)',
                          filter: 'blur(20px)',
                          transform: 'translateY(10px) scale(0.95)'
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Informations principales */}
                  <div className="lg:col-span-8 space-y-8">
                    <div>
                      <motion.h1
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: 'clamp(2rem, 4vw, 3rem)',
                          lineHeight: '1.1',
                          fontWeight: 700,
                          color: '#2C1810',
                          marginBottom: '1rem'
                        }}
                      >
                        {book.titre}
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="flex items-center gap-3 text-xl mb-6"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          color: '#6B4C7B',
                          fontWeight: 500
                        }}
                      >
                        <User className="w-5 h-5" />
                        par {book.auteur}
                      </motion.p>
                    </div>

                    {/* Metrics romantiques en grille asymétrique */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {[
                        { label: '🌶️ Spicy', value: book.niveau_spicy, color: '#F59E0B' },
                        { label: '🖤 Dark', value: book.niveau_dark, color: '#374151' },
                        { label: '💕 Romance', value: book.niveau_romance, color: '#8B1538' },
                        { label: '✨ Émotions', value: book.intensite_emotionnelle, color: '#6B4C7B' }
                      ].map((metric, index) => (
                        <motion.div
                          key={metric.label}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className="text-center p-4 rounded-2xl shadow-lg"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                          }}
                        >
                          <div
                            className="text-2xl font-bold mb-1"
                            style={{ color: metric.color, fontFamily: 'Inter, sans-serif' }}
                          >
                            {metric.value}/10
                          </div>
                          <div
                            className="text-xs opacity-80"
                            style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}
                          >
                            {metric.label}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Informations complémentaires en ligne fluide */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="flex flex-wrap items-center gap-4"
                    >
                      {book.rythme && getRythmeBadge(book.rythme)}

                      {book.date_lecture && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full text-sm border border-gray-200">
                          <Calendar className="w-4 h-4" style={{ color: '#6B4C7B' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', color: '#2C1810' }}>
                            Lu le {new Date(book.date_lecture).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full text-sm border border-gray-200">
                        <Globe className="w-4 h-4" style={{ color: '#6B4C7B' }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', color: '#2C1810' }}>
                          {book.langue === 'FR' ? 'Français 🇫🇷' : 'Anglais 🇺🇸'}
                        </span>
                      </div>

                      {book.nombre_pages && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full text-sm border border-gray-200">
                          <BookOpen className="w-4 h-4" style={{ color: '#6B4C7B' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', color: '#2C1810' }}>
                            {book.nombre_pages} pages
                          </span>
                        </div>
                      )}
                    </motion.div>

                    {/* Métadonnées éditeur */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="pt-6 border-t"
                      style={{ borderColor: 'rgba(107, 76, 123, 0.1)' }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {book.editeur && (
                          <div style={{ fontFamily: 'Inter, sans-serif', color: '#6B4C7B' }}>
                            <span className="font-medium">Éditeur:</span>
                            <span className="ml-1" style={{ color: '#2C1810' }}>{book.editeur}</span>
                          </div>
                        )}
                        {book.date_publication && (
                          <div style={{ fontFamily: 'Inter, sans-serif', color: '#6B4C7B' }}>
                            <span className="font-medium">Publication:</span>
                            <span className="ml-1" style={{ color: '#2C1810' }}>
                              {new Date(book.date_publication).getFullYear()}
                            </span>
                          </div>
                        )}
                        <div style={{ fontFamily: 'Inter, sans-serif', color: '#6B4C7B' }}>
                          <span className="font-medium">Ajouté par:</span>
                          <span className="ml-1" style={{ color: '#2C1810' }}>
                            {book.user?.nom_complet || 'Bruna'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Saga */}
        {book.saga && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mb-8"
          >
            <SagaInfo
              saga={book.saga}
              sagaOrder={book.sagaOrder || 1}
              sagaNeighbors={book.sagaNeighbors}
            />
          </motion.div>
        )}

        {/* Navigation par onglets avec style romantique */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-8"
        >
          <div
            className="rounded-2xl overflow-hidden shadow-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(107, 76, 123, 0.1)'
            }}
          >
            <nav className="flex overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-3 transition-all duration-300 whitespace-nowrap flex-shrink-0
                    ${activeTab === tab.id
                      ? 'border-b-3 shadow-sm'
                      : 'border-transparent hover:bg-white/50'
                    }
                  `}
                  style={{
                    borderBottomColor: activeTab === tab.id ? '#8B1538' : 'transparent',
                    backgroundColor: activeTab === tab.id ? 'rgba(139, 21, 56, 0.05)' : 'transparent',
                    color: activeTab === tab.id ? '#8B1538' : '#6B4C7B',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <tab.icon className={`w-4 h-4 transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: activeTab === tab.id ? 'rgba(139, 21, 56, 0.1)' : 'rgba(107, 76, 123, 0.1)',
                        color: activeTab === tab.id ? '#8B1538' : '#6B4C7B'
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Contenu des onglets avec animations */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8 pb-16"
        >

          {/* Onglet Résumé & Critique */}
          {activeTab === 'resume' && (
            <div className="space-y-8">

              {/* Résumé officiel avec design épuré */}
              {book.resume_officiel && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(107, 76, 123, 0.1)'
                  }}
                >
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                      >
                        <BookOpen className="w-6 h-6" style={{ color: '#6B4C7B' }} />
                      </div>
                      <h2
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#2C1810'
                        }}
                      >
                        Résumé officiel
                      </h2>
                    </div>

                    <div
                      className="prose prose-lg max-w-none leading-relaxed"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#2C1810',
                        lineHeight: '1.7'
                      }}
                      dangerouslySetInnerHTML={{ __html: book.resume_officiel }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Critique de Bruna avec accent coloré */}
              {book.critique_detaillee && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '2px solid rgba(139, 21, 56, 0.2)'
                  }}
                >
                  <div
                    className="h-1"
                    style={{
                      background: 'linear-gradient(90deg, #8B1538 0%, #6B4C7B 100%)'
                    }}
                  />

                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(139, 21, 56, 0.1)' }}
                      >
                        <Heart className="w-6 h-6" style={{ color: '#8B1538' }} />
                      </div>
                      <h2
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#8B1538'
                        }}
                      >
                        Critique de {book.user?.nom_complet || 'Bruna'}
                      </h2>
                    </div>

                    <p
                      className="leading-relaxed whitespace-pre-line mb-6"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '1.1rem',
                        color: '#2C1810',
                        lineHeight: '1.7'
                      }}
                    >
                      {book.critique_detaillee}
                    </p>

                    {/* Avis personnel en encart */}
                    {book.resume_personnel && (
                      <div
                        className="mt-8 p-6 rounded-xl"
                        style={{
                          backgroundColor: 'rgba(139, 21, 56, 0.05)',
                          border: '1px solid rgba(139, 21, 56, 0.1)'
                        }}
                      >
                        <h4
                          className="flex items-center gap-3 mb-3"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#8B1538'
                          }}
                        >
                          <span className="text-lg">💝</span>
                          Avis personnel
                        </h4>
                        <p
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            color: '#2C1810',
                            lineHeight: '1.6'
                          }}
                        >
                          {book.resume_personnel}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Citations favorites avec style poétique */}
              {book.citations_favorites && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl overflow-hidden shadow-lg text-center py-12"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(184, 134, 11, 0.2)'
                  }}
                >
                  <div className="px-8">
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(184, 134, 11, 0.1)' }}
                      >
                        <Quote className="w-6 h-6" style={{ color: '#B8860B' }} />
                      </div>
                      <h2
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#B8860B'
                        }}
                      >
                        Citations favorites
                      </h2>
                    </div>

                    <blockquote
                      className="relative max-w-3xl mx-auto"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.3rem',
                        fontStyle: 'italic',
                        color: '#2C1810',
                        lineHeight: '1.6'
                      }}
                    >
                      <div
                        className="absolute -top-4 -left-4 text-4xl opacity-30"
                        style={{ color: '#B8860B', fontFamily: 'serif' }}
                      >
                        "
                      </div>
                      <div
                        className="absolute -bottom-4 -right-4 text-4xl opacity-30"
                        style={{ color: '#B8860B', fontFamily: 'serif' }}
                      >
                        "
                      </div>
                      {book.citations_favorites}
                    </blockquote>
                  </div>
                </motion.div>
              )}

              {/* Pourquoi vous allez l'aimer */}
              {book.pourquoi_aimer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                      >
                        <ThumbsUp className="w-6 h-6" style={{ color: '#10B981' }} />
                      </div>
                      <h2
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#10B981'
                        }}
                      >
                        Pourquoi vous allez l'aimer
                      </h2>
                    </div>

                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                      >
                        <span className="text-xl">❤️</span>
                      </div>
                      <p
                        className="leading-relaxed"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '1.1rem',
                          color: '#2C1810',
                          lineHeight: '1.7'
                        }}
                      >
                        {book.pourquoi_aimer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Onglet Évaluations avec design circulaire */}
          {activeTab === 'stats' && (
            <motion.div
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(107, 76, 123, 0.1)'
              }}
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                  >
                    <BarChart3 className="w-6 h-6" style={{ color: '#6B4C7B' }} />
                  </div>
                  <h2
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#2C1810'
                    }}
                  >
                    Évaluations détaillées
                  </h2>
                </div>

                <div className="space-y-12">
                  {/* Note générale mise en avant */}
                  <div className="text-center py-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
                      className="inline-flex items-baseline gap-2 mb-6"
                    >
                      <span
                        className="text-6xl font-bold"
                        style={{ color: '#8B1538', fontFamily: 'Inter, sans-serif' }}
                      >
                        {book.note_generale}
                      </span>
                      <span
                        className="text-2xl opacity-60"
                        style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}
                      >
                        /10
                      </span>
                    </motion.div>

                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                        >
                          <Star
                            className={`w-6 h-6 ${
                              i < Math.round(book.note_generale / 2)
                                ? 'fill-current text-yellow-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <p
                      className="font-medium"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#6B4C7B',
                        fontSize: '1.1rem'
                      }}
                    >
                      Note générale
                    </p>
                  </div>

                  {/* Grille des évaluations */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Métriques positives */}
                    <div className="space-y-6">
                      <h3
                        className="text-center mb-8"
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '1.3rem',
                          fontWeight: 600,
                          color: '#2C1810'
                        }}
                      >
                        Émotions & Qualités
                      </h3>
                      {[
                        { label: 'Romance', value: book.niveau_romance, icon: '❤️', color: '#8B1538' },
                        { label: 'Intensité émotionnelle', value: book.intensite_emotionnelle, icon: '💫', color: '#6B4C7B' },
                        { label: 'Originalité', value: book.originalite, icon: '✨', color: '#B8860B' },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${item.color}20` }}
                              >
                                <span className="text-lg">{item.icon}</span>
                              </div>
                              <span
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontWeight: 500,
                                  color: '#2C1810'
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                            <span
                              className="text-xl font-bold"
                              style={{
                                color: item.color,
                                fontFamily: 'Inter, sans-serif'
                              }}
                            >
                              {item.value}
                              <span className="text-sm opacity-60 ml-1">/10</span>
                            </span>
                          </div>
                          <div
                            className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.value / 10) * 100}%` }}
                              transition={{
                                duration: 1,
                                delay: 0.7 + index * 0.1,
                                ease: 'easeOut'
                              }}
                              className="h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Métriques d'intensité */}
                    <div className="space-y-6">
                      <h3
                        className="text-center mb-8"
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '1.3rem',
                          fontWeight: 600,
                          color: '#2C1810'
                        }}
                      >
                        Intensité & Contenu
                      </h3>
                      {[
                        { label: 'Niveau Spicy', value: book.niveau_spicy, icon: '🌶️', color: '#F59E0B' },
                        { label: 'Danger', value: book.danger, icon: '⚠️', color: '#EF4444' },
                        { label: 'Violence', value: book.violence, icon: '⚔️', color: '#DC2626' },
                        { label: 'Dark', value: book.niveau_dark, icon: '🌒', color: '#374151' },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${item.color}20` }}
                              >
                                <span className="text-lg">{item.icon}</span>
                              </div>
                              <span
                                style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontWeight: 500,
                                  color: '#2C1810'
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                            <span
                              className="text-xl font-bold"
                              style={{
                                color: item.color,
                                fontFamily: 'Inter, sans-serif'
                              }}
                            >
                              {item.value}
                              <span className="text-sm opacity-60 ml-1">/10</span>
                            </span>
                          </div>
                          <div
                            className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.value / 10) * 100}%` }}
                              transition={{
                                duration: 1,
                                delay: 0.7 + index * 0.1,
                                ease: 'easeOut'
                              }}
                              className="h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Onglet Tags & Genres avec style coloré */}
          {activeTab === 'tags' && (
            <motion.div
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(107, 76, 123, 0.1)'
              }}
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                  >
                    <Tag className="w-6 h-6" style={{ color: '#6B4C7B' }} />
                  </div>
                  <h2
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#2C1810'
                    }}
                  >
                    Genres & Tags
                  </h2>
                </div>

                <div className="space-y-8">
                  {/* Catégories */}
                  {book.categories && book.categories.length > 0 && (
                    <div>
                      <h3
                        className="flex items-center gap-3 mb-6"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2C1810',
                          fontSize: '1.1rem'
                        }}
                      >
                        <span className="text-xl">🎭</span>
                        Genres littéraires
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {book.categories.map((cat, index) => (
                          <motion.div
                            key={cat.category.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Link href={`/books?category=${cat.category.id}`}>
                              <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium shadow-sm cursor-pointer"
                                style={{
                                  backgroundColor: `${cat.category.couleur}15`,
                                  color: cat.category.couleur,
                                  border: `1px solid ${cat.category.couleur}30`,
                                  fontFamily: 'Inter, sans-serif'
                                }}
                              >
                                <span>{cat.category.icone}</span>
                                {cat.category.nom}
                              </motion.div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {book.tags && book.tags.length > 0 && (
                    <div>
                      <h3
                        className="flex items-center gap-3 mb-6"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2C1810',
                          fontSize: '1.1rem'
                        }}
                      >
                        <span className="text-xl">🏷️</span>
                        Tags thématiques
                      </h3>

                      {(() => {
                        const tagsByType = book.tags.reduce((acc: any, tag) => {
                          const type = tag.tag.type;
                          if (!acc[type]) acc[type] = [];
                          acc[type].push(tag);
                          return acc;
                        }, {});

                        return Object.entries(tagsByType).map(([type, typeTags]: [string, any]) => (
                          <div key={type} className="mb-6">
                            <div
                              className="flex items-center gap-2 mb-4"
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#6B4C7B',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              <span>
                                {type === 'TROPE' ? '💫' : type === 'GENRE' ? '📚' : '⚠️'}
                              </span>
                              {type}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {typeTags.map((tag: any, index: number) => (
                                <motion.div
                                  key={tag.tag.id}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Link href={`/books?tag=${tag.tag.id}`}>
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer"
                                      style={{
                                        backgroundColor: `${tag.tag.couleur}10`,
                                        color: tag.tag.couleur,
                                        border: `1px solid ${tag.tag.couleur}30`,
                                        fontFamily: 'Inter, sans-serif'
                                      }}
                                    >
                                      {tag.tag.nom}
                                    </motion.div>
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  {/* Message si vide */}
                  {(!book.categories || book.categories.length === 0) && (!book.tags || book.tags.length === 0) && (
                    <div className="text-center py-16">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                      >
                        <Tag className="w-8 h-8 opacity-50" style={{ color: '#6B4C7B' }} />
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', color: '#6B4C7B' }}>
                        Aucun genre ou tag assigné pour le moment
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Onglet Questions FAQ avec design moderne */}
          {activeTab === 'faq' && (
            <motion.div
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(107, 76, 123, 0.1)'
              }}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                    >
                      <MessageCircle className="w-6 h-6" style={{ color: '#6B4C7B' }} />
                    </div>
                    <h2
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#2C1810'
                      }}
                    >
                      Questions & Réponses
                    </h2>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {questions.filter(q => q.status === 'ANSWERED').length} répondu{questions.filter(q => q.status === 'ANSWERED').length !== 1 ? 's' : ''}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#D97706',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {questions.filter(q => q.status === 'PENDING').length} en attente
                    </span>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Réflexions de Bruna */}
                  {book.questions_sur_le_livre && (
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        backgroundColor: 'rgba(107, 76, 123, 0.05)',
                        border: '1px solid rgba(107, 76, 123, 0.1)'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                        >
                          <span className="text-lg">💭</span>
                        </div>
                        <div>
                          <h4
                            className="mb-3"
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              color: '#2C1810'
                            }}
                          >
                            Réflexions de Bruna
                          </h4>
                          <p
                            className="leading-relaxed"
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              color: '#2C1810',
                              lineHeight: '1.6'
                            }}
                          >
                            {book.questions_sur_le_livre}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone de saisie nouvelle question */}
                  {currentUser ? (
                    <div
                      className="p-6 rounded-xl shadow-sm"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(107, 76, 123, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                        >
                          <MessageCircle className="w-5 h-5" style={{ color: '#6B4C7B' }} />
                        </div>
                        <div>
                          <h3
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 600,
                              color: '#2C1810'
                            }}
                          >
                            Poser une question
                          </h3>
                          <p
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '0.9rem',
                              color: '#6B4C7B'
                            }}
                          >
                            Bruna vous répondra personnellement
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleSubmitQuestion} className="space-y-4">
                        <div className="relative">
                          <Textarea
                            placeholder="Que souhaitez-vous savoir sur ce livre ?"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            className="min-h-[120px] resize-none rounded-xl focus:ring-2 transition-all"
                            style={{
                              backgroundColor: 'rgba(250, 248, 245, 0.8)',
                              border: '1px solid rgba(107, 76, 123, 0.2)',
                              fontFamily: 'Inter, sans-serif'
                            }}
                            disabled={isSubmittingQuestion}
                          />
                          <div
                            className="absolute bottom-3 right-3 text-xs"
                            style={{ color: '#6B4C7B', opacity: 0.7 }}
                          >
                            {newQuestion.length}/1000
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm" style={{ color: '#6B4C7B' }}>
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: '#10B981' }}
                            />
                            Réponse sous 24h en moyenne
                          </div>
                          <motion.button
                            type="submit"
                            disabled={!newQuestion.trim() || newQuestion.trim().length < 10 || newQuestion.trim().length > 1000 || isSubmittingQuestion}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                              color: 'white',
                              fontFamily: 'Inter, sans-serif',
                              boxShadow: '0 4px 15px rgba(139, 21, 56, 0.3)'
                            }}
                          >
                            {isSubmittingQuestion ? (
                              'Envoi en cours...'
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Envoyer ma question
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div
                      className="p-8 rounded-xl text-center"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(107, 76, 123, 0.1)'
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                      >
                        <MessageCircle className="w-8 h-8" style={{ color: '#6B4C7B' }} />
                      </div>
                      <h3
                        className="mb-2"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          color: '#2C1810'
                        }}
                      >
                        Posez votre question à Bruna
                      </h3>
                      <p
                        className="mb-6"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          color: '#6B4C7B'
                        }}
                      >
                        Connectez-vous pour obtenir des réponses personnalisées
                      </p>
                      <motion.button
                        onClick={() => router.push('/login')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 rounded-xl font-medium"
                        style={{
                          background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                          color: 'white',
                          fontFamily: 'Inter, sans-serif',
                          boxShadow: '0 4px 15px rgba(139, 21, 56, 0.3)'
                        }}
                      >
                        Se connecter
                      </motion.button>
                    </div>
                  )}

                  {/* Questions & Réponses */}
                  <div className="space-y-6">
                    {questions.length === 0 ? (
                      <div className="text-center py-16">
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                          style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                        >
                          <MessageCircle className="w-10 h-10" style={{ color: '#6B4C7B', opacity: 0.5 }} />
                        </div>
                        <h3
                          className="text-xl mb-2"
                          style={{
                            fontFamily: 'Playfair Display, serif',
                            fontWeight: 600,
                            color: '#2C1810'
                          }}
                        >
                          Aucune question pour le moment
                        </h3>
                        <p style={{ fontFamily: 'Inter, sans-serif', color: '#6B4C7B' }}>
                          Soyez le premier à poser une question sur ce livre !
                        </p>
                      </div>
                    ) : (
                      questions.map((question, index) => (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(107, 76, 123, 0.1)'
                          }}
                        >

                          {/* Question */}
                          <div className="p-6">
                            <div className="flex items-start gap-4">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                              >
                                <MessageCircle className="w-5 h-5" style={{ color: '#6B4C7B' }} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span
                                    style={{
                                      fontFamily: 'Inter, sans-serif',
                                      fontWeight: 600,
                                      color: '#2C1810'
                                    }}
                                  >
                                    {question.user.nom_complet}
                                  </span>
                                  <span
                                    style={{
                                      fontFamily: 'Inter, sans-serif',
                                      fontSize: '0.8rem',
                                      color: '#6B4C7B'
                                    }}
                                  >
                                    {formatDate(question.date_question)}
                                  </span>
                                </div>
                                <p
                                  className="leading-relaxed"
                                  style={{
                                    fontFamily: 'Inter, sans-serif',
                                    color: '#2C1810',
                                    lineHeight: '1.6'
                                  }}
                                >
                                  {question.question}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Réponse ou état d'attente */}
                          {question.reponse ? (
                            <div
                              className="border-t p-6"
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                borderColor: 'rgba(16, 185, 129, 0.1)'
                              }}
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                                >
                                  <span
                                    className="font-bold text-sm"
                                    style={{ color: '#059669' }}
                                  >
                                    ✓
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <span
                                      style={{
                                        fontFamily: 'Inter, sans-serif',
                                        fontWeight: 600,
                                        color: '#059669'
                                      }}
                                    >
                                      {question.answeredBy?.nom_complet || 'Bruna'}
                                    </span>
                                    <span
                                      className="px-2 py-1 rounded-full text-xs font-medium"
                                      style={{
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#059669',
                                        fontFamily: 'Inter, sans-serif'
                                      }}
                                    >
                                      Admin
                                    </span>
                                    {question.date_reponse && (
                                      <span
                                        style={{
                                          fontFamily: 'Inter, sans-serif',
                                          fontSize: '0.8rem',
                                          color: '#059669'
                                        }}
                                      >
                                        {formatDate(question.date_reponse)}
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className="leading-relaxed"
                                    style={{
                                      fontFamily: 'Inter, sans-serif',
                                      color: '#059669',
                                      lineHeight: '1.6'
                                    }}
                                  >
                                    {question.reponse}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="border-t p-6"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                                borderColor: 'rgba(245, 158, 11, 0.1)'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-2xl flex items-center justify-center"
                                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                                >
                                  <span style={{ color: '#D97706' }}>⏳</span>
                                </div>
                                <span
                                  style={{
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    color: '#D97706'
                                  }}
                                >
                                  En attente d'une réponse de l'admin
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div
                            className="px-6 py-3 border-t"
                            style={{
                              backgroundColor: 'rgba(250, 248, 245, 0.5)',
                              borderColor: 'rgba(107, 76, 123, 0.05)'
                            }}
                          >
                            <motion.button
                              disabled={!currentUser || toggleLikeMutation.isPending}
                              onClick={() => currentUser && toggleLikeMutation.mutate(question.id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                ${question.is_liked
                                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                                  : 'text-gray-600 hover:bg-gray-50'
                                }
                                ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              <ThumbsUp className={`w-4 h-4 ${question.is_liked ? 'fill-current' : ''}`} />
                              {question.likes_count || 0} J'aime
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Onglet Recommandations */}
          {activeTab === 'reco' && (
            <motion.div
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(107, 76, 123, 0.1)'
              }}
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                  >
                    <Users className="w-6 h-6" style={{ color: '#6B4C7B' }} />
                  </div>
                  <h2
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#2C1810'
                    }}
                  >
                    Livres similaires
                  </h2>
                </div>

                {book.recommandation_personnalisee ? (
                  <div
                    className="p-8 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.05) 0%, rgba(107, 76, 123, 0.05) 100%)',
                      border: '1px solid rgba(139, 21, 56, 0.1)'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(139, 21, 56, 0.1)' }}
                      >
                        <span className="text-xl">💭</span>
                      </div>
                      <div>
                        <h4
                          className="mb-3"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#2C1810'
                          }}
                        >
                          Recommandations personnalisées de Bruna
                        </h4>
                        <p
                          className="leading-relaxed"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            color: '#2C1810',
                            lineHeight: '1.7'
                          }}
                        >
                          {book.recommandation_personnalisee}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)' }}
                    >
                      <Users className="w-10 h-10" style={{ color: '#6B4C7B', opacity: 0.5 }} />
                    </div>
                    <h3
                      className="text-xl mb-2"
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontWeight: 600,
                        color: '#2C1810'
                      }}
                    >
                      Fonctionnalité à venir
                    </h3>
                    <p style={{ fontFamily: 'Inter, sans-serif', color: '#6B4C7B' }}>
                      Les recommandations automatiques arriveront prochainement
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}