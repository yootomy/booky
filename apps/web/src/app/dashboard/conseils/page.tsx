'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Heart,
  Clock,
  CheckCircle,
  MessageCircle,
  BookOpen,
  Sparkles,
  User,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface ConseilRequest {
  id: string;
  nom_utilisateur: string;
  categories: string[];
  tags: string[];
  commentaires?: string;
  status: 'EN_ATTENTE' | 'TRAITE' | 'REJETE';
  date_creation: string;
  date_reponse?: string;
  reponse_bruna?: string;
  livres_recommandes: string[];
}

export default function ConseilsPage() {
  const { user } = useAuth();

  // Fetch user's conseil requests
  const { data: conseilsData, isLoading, error } = useQuery({
    queryKey: ['conseil-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };

      const response = await fetch(`/api/proxy/conseil-requests?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch conseil requests');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Fetch categories and tags for display
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/proxy/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/proxy/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    }
  });

  // Fetch books for recommendations
  const { data: booksData } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const response = await fetch('/api/proxy/books');
      if (!response.ok) throw new Error('Failed to fetch books');
      return response.json();
    }
  });

  const conseils = conseilsData?.data || [];
  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];
  const books = booksData?.data || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return <Clock className="w-4 h-4" style={{ color: '#F59E0B' }} />;
      case 'TRAITE':
        return <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />;
      case 'REJETE':
        return <MessageCircle className="w-4 h-4" style={{ color: '#EF4444' }} />;
      default:
        return <Clock className="w-4 h-4" style={{ color: '#6B7280' }} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'TRAITE':
        return 'Répondu';
      case 'REJETE':
        return 'Rejeté';
      default:
        return 'Inconnu';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200';
      case 'TRAITE':
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200';
      case 'REJETE':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category?.nom || categoryId;
  };

  const getTagName = (tagId: string) => {
    const tag = tags.find((t: any) => t.id === tagId);
    return tag?.nom || tagId;
  };

  const getBookTitle = (bookId: string) => {
    const book = books.find((b: any) => b.id === bookId);
    return book?.titre || 'Livre non trouvé';
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4" style={{ color: '#8B1538' }}></div>
            <p style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}>Chargement de vos demandes...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
          <div className="text-center">
            <p style={{ color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>Erreur lors du chargement de vos demandes</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        <div className="relative z-10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
            {/* Header */}
            <div className="mb-12">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="mb-6 flex items-center gap-2"
                  style={{ color: '#6B4C7B' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour au dashboard
                </Button>
              </Link>

              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                    boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)'
                  }}
                >
                  <Heart size={24} className="text-white" />
                </div>
                <div>
                  <h1
                    className="text-3xl font-bold"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Mes demandes de conseils
                  </h1>
                  <p
                    className="text-lg"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#6B4C7B',
                      opacity: 0.8
                    }}
                  >
                    Vos échanges avec Bruna
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            {conseils.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.1) 0%, rgba(107, 76, 123, 0.05) 100%)',
                    border: '2px solid rgba(139, 21, 56, 0.2)'
                  }}
                >
                  <Sparkles size={32} style={{ color: '#8B1538' }} />
                </div>
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    color: '#2C1810'
                  }}
                >
                  Aucune demande de conseil
                </h3>
                <p
                  className="text-lg mb-8 max-w-md mx-auto"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    color: '#6B4C7B',
                    opacity: 0.8
                  }}
                >
                  Vous n'avez pas encore fait de demande de conseil à Bruna. Laissez-la vous surprendre !
                </p>
                <Link href="/">
                  <Button
                    className="px-8 py-4"
                    style={{
                      background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                      color: 'white',
                      borderRadius: '24px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Faire une demande
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {conseils.map((conseil: ConseilRequest, index: number) => (
                  <motion.div
                    key={conseil.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      className="overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(139, 21, 56, 0.1)',
                        borderRadius: '24px',
                        boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
                      }}
                    >
                      <CardHeader className="p-8 pb-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                                boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)'
                              }}
                            >
                              <User size={20} className="text-white" />
                            </div>
                            <div>
                              <CardTitle
                                className="text-xl font-bold mb-2"
                                style={{
                                  fontFamily: 'Playfair Display, serif',
                                  color: '#2C1810'
                                }}
                              >
                                Demande de {conseil.nom_utilisateur}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm" style={{ color: '#6B4C7B' }}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(conseil.date_creation).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium ${getStatusStyle(conseil.status)}`}
                            style={{ borderRadius: '12px' }}
                          >
                            {getStatusIcon(conseil.status)}
                            {getStatusLabel(conseil.status)}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-8 pt-0 space-y-6">
                        {/* Categories */}
                        <div>
                          <h4 className="font-semibold text-sm mb-3" style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}>
                            Genres sélectionnés :
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {conseil.categories.map((categoryId) => (
                              <Badge
                                key={categoryId}
                                style={{
                                  backgroundColor: 'rgba(139, 21, 56, 0.1)',
                                  color: '#8B1538',
                                  border: '1px solid rgba(139, 21, 56, 0.2)',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {getCategoryName(categoryId)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <h4 className="font-semibold text-sm mb-3" style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}>
                            Tropes préférés :
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {conseil.tags.slice(0, 8).map((tagId) => (
                              <Badge
                                key={tagId}
                                style={{
                                  backgroundColor: 'rgba(107, 76, 123, 0.1)',
                                  color: '#6B4C7B',
                                  border: '1px solid rgba(107, 76, 123, 0.2)',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {getTagName(tagId)}
                              </Badge>
                            ))}
                            {conseil.tags.length > 8 && (
                              <Badge
                                style={{
                                  backgroundColor: 'rgba(107, 76, 123, 0.1)',
                                  color: '#6B4C7B',
                                  border: '1px solid rgba(107, 76, 123, 0.2)',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                +{conseil.tags.length - 8} autres
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Comments */}
                        {conseil.commentaires && (
                          <div>
                            <h4 className="font-semibold text-sm mb-3" style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}>
                              Vos commentaires :
                            </h4>
                            <p
                              className="text-sm leading-relaxed p-4 rounded-xl"
                              style={{
                                backgroundColor: 'rgba(139, 21, 56, 0.05)',
                                color: '#2C1810',
                                fontFamily: 'Inter, sans-serif'
                              }}
                            >
                              "{conseil.commentaires}"
                            </p>
                          </div>
                        )}

                        {/* Bruna's Response */}
                        {conseil.status === 'TRAITE' && conseil.reponse_bruna && (
                          <div
                            className="p-6 rounded-xl border-l-4"
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.05)',
                              borderColor: '#10B981'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />
                              <h4 className="font-semibold" style={{ color: '#2C1810', fontFamily: 'Playfair Display, serif' }}>
                                Réponse de Bruna
                              </h4>
                              {conseil.date_reponse && (
                                <span className="text-xs" style={{ color: '#6B4C7B' }}>
                                  • {new Date(conseil.date_reponse).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-sm leading-relaxed mb-4"
                              style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}
                            >
                              {conseil.reponse_bruna}
                            </p>

                            {/* Recommended Books */}
                            {conseil.livres_recommandes.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-sm mb-3" style={{ color: '#2C1810' }}>
                                  Livres recommandés :
                                </h5>
                                <div className="space-y-2">
                                  {conseil.livres_recommandes.map((bookId) => (
                                    <div
                                      key={bookId}
                                      className="flex items-center gap-2 p-3 rounded-lg"
                                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                                    >
                                      <BookOpen className="w-4 h-4" style={{ color: '#8B1538' }} />
                                      <span className="text-sm" style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}>
                                        {getBookTitle(bookId)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}