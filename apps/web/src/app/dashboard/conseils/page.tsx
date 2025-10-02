'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Clock,
  CheckCircle,
  MessageCircle,
  BookOpen,
  Sparkles,
  User,
  Calendar,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Tag,
  Eye,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Fetch user's conseil requests
  const { data: conseilsData, isLoading, error } = useQuery({
    queryKey: ['conseil-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };

      const response = await apiClient.get('/api/conseil-requests?userId=${user.id}");
      if (!response.ok) throw new Error("Failed to fetch conseil requests");
      return response.json();
    },
    enabled: !!user?.id
  });

  // Fetch categories and tags for display
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiClient.get('/api/categories');
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    }
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await apiClient.get('/api/tags');
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    }
  });

  // Fetch books for recommendations
  const { data: booksData } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const response = await apiClient.get('/api/books');
      if (!response.ok) throw new Error("Failed to fetch books");
      return response.json();
    }
  });

  const conseils = conseilsData?.data || [];
  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];
  const books = booksData?.data || [];

  // Filtrage des conseils
  const filteredConseils = conseils.filter((conseil: ConseilRequest) => {
    const matchesSearch = searchTerm === '' ||
      conseil.nom_utilisateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conseil.commentaires?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conseil.reponse_bruna?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || conseil.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const toggleCardExpansion = (conseilId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conseilId)) {
        newSet.delete(conseilId);
      } else {
        newSet.add(conseilId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return <Clock className="w-4 h-4" style={{ color: "#F59E0B' }} />;
      case 'TRAITE":
        return <CheckCircle className="w-4 h-4" style={{ color: "#10B981' }} />;
      case 'REJETE":
        return <MessageCircle className="w-4 h-4" style={{ color: "#EF4444" }} />;
      default:
        return <Clock className="w-4 h-4" style={{ color: "#6B7280" }} />;
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
        <div className="min-h-screen bg-background transition-colors duration-300 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-lg font-medium text-foreground/80" style={{ fontFamily: "Inter, sans-serif" }}>
              Chargement de vos demandes de conseils...
            </p>
          </motion.div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background transition-colors duration-300 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
              Erreur de chargement
            </h3>
            <p className="text-foreground/70 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              Impossible de charger vos demandes de conseils. Veuillez réessayer.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Réessayer
            </Button>
          </motion.div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background transition-colors duration-300">

        <div className="relative z-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

            {/* Header */}
            <motion.div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Button
                variant="outline"
                asChild
                className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 text-foreground order-first sm:order-none"
              >
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Link>
              </Button>

              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  Mes Conseils
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                  Vos échanges personnalisés avec Bruna
                </p>
              </div>

              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                <Link href="/">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle demande
                </Link>
              </Button>
            </motion.div>

            {/* Filters Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card/90 backdrop-blur border border-border/50 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 w-full sm:min-w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher dans vos conseils..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-colors duration-200"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/50 border-border/50">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                    <SelectItem value="TRAITE">Répondu</SelectItem>
                    <SelectItem value="REJETE">Rejeté</SelectItem>
                  </SelectContent>
                </Select>

                {/* Results count */}
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  <strong className="text-foreground">{filteredConseils.length}</strong> conseil{filteredConseils.length > 1 ? "s" : "'}
                  {searchTerm && ' trouvé${filteredConseils.length > 1 ? 's' : ''}'}
                </div>
              </div>
            </motion.div>

            {/* Empty State */}
            {filteredConseils.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-card/90 backdrop-blur border border-border/50 text-center py-16">
                  <CardContent>
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
                      {searchTerm || statusFilter !== 'all'
                        ? "Aucun conseil trouvé"
                        : "Aucune demande de conseil"
                      }
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                      {searchTerm || statusFilter !== 'all'
                        ? "Essayez de modifier vos critères de recherche."
                        : "Vous n"avez pas encore fait de demande de conseil à Bruna. Laissez-la vous surprendre !'
                      }
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href="/">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Faire une demande
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredConseils.map((conseil: ConseilRequest, index: number) => (
                    <motion.div
                      key={conseil.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative group"
                    >
                      <Card className="bg-card/90 backdrop-blur border border-border/50 hover:border-primary/40 overflow-hidden hover:shadow-xl transition-colors transition-shadow duration-300 group">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground line-clamp-1 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                                  Demande de {conseil.nom_utilisateur}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(conseil.date_creation).toLocaleDateString("fr-FR")}
                                </div>
                              </div>
                            </div>
                            <Badge className={cn(
                              "flex items-center gap-1 px-2 py-1 text-xs font-medium border",
                              conseil.status === "EN_ATTENTE" && "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                              conseil.status === "TRAITE" && "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                              conseil.status === "REJETE" && "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                            )}>
                              {getStatusIcon(conseil.status)}
                              {getStatusLabel(conseil.status)}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0 space-y-4">
                          {/* Categories Section */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Tag className="w-4 h-4 text-muted-foreground" />
                              <h4 className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                                Genres
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {conseil.categories.slice(0, 4).map((categoryId) => (
                                <Badge
                                  key={categoryId}
                                  variant="secondary"
                                  className="bg-primary/10 text-primary border-primary/20 text-xs"
                                >
                                  {getCategoryName(categoryId)}
                                </Badge>
                              ))}
                              {conseil.categories.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{conseil.categories.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Tags Section */}
                          {conseil.tags.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Star className="w-4 h-4 text-muted-foreground" />
                                <h4 className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                                  Tropes
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {conseil.tags.slice(0, 6).map((tagId) => (
                                  <Badge
                                    key={tagId}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {getTagName(tagId)}
                                  </Badge>
                                ))}
                                {conseil.tags.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{conseil.tags.length - 6}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Comments Section - Preview */}
                          {conseil.commentaires && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                <h4 className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                                  Votre message
                                </h4>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm text-foreground/80 line-clamp-2" style={{ fontFamily: "Inter, sans-serif" }}>
                                  "{conseil.commentaires}"
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Expand Button */}
                          <div className="pt-3 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCardExpansion(conseil.id)}
                              className="w-full justify-between hover:bg-primary/5"
                            >
                              <span className="text-sm font-medium">
                                {expandedCards.has(conseil.id) ? "Voir moins" : "Voir les détails"}
                              </span>
                              {expandedCards.has(conseil.id) ?
                                <ChevronUp className="w-4 h-4" /> :
                                <ChevronDown className="w-4 h-4" />
                              }
                            </Button>
                          </div>

                          {/* Expandable Content */}
                          {expandedCards.has(conseil.id) && (
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                {/* Full Categories List */}
                                {conseil.categories.length > 4 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                                      Tous les genres sélectionnés
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {conseil.categories.map((categoryId) => (
                                        <Badge
                                          key={categoryId}
                                          variant="secondary"
                                          className="bg-primary/10 text-primary border-primary/20 text-xs"
                                        >
                                          {getCategoryName(categoryId)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Full Tags List */}
                                {conseil.tags.length > 6 && (
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                                      Tous les tropes préférés
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {conseil.tags.map((tagId) => (
                                        <Badge
                                          key={tagId}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {getTagName(tagId)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Full Comments */}
                                {conseil.commentaires && (
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                                      Votre message complet
                                    </h4>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                      <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                        "{conseil.commentaires}"
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Bruna's Response */}
                                {conseil.status === 'TRAITE' && conseil.reponse_bruna && (
                                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                                      <h4 className="font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                                        Réponse de Bruna
                                      </h4>
                                      {conseil.date_reponse && (
                                        <span className="text-xs text-muted-foreground ml-auto">
                                          {new Date(conseil.date_reponse).toLocaleDateString("fr-FR")}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                                      {conseil.reponse_bruna}
                                    </p>

                                    {/* Recommended Books */}
                                    {conseil.livres_recommandes.length > 0 && (
                                      <div>
                                        <h5 className="font-medium text-sm mb-3 text-foreground">
                                          Livres recommandés
                                        </h5>
                                        <div className="space-y-2">
                                          {conseil.livres_recommandes.map((bookId) => (
                                            <div
                                              key={bookId}
                                              className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border border-border/50"
                                            >
                                              <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                                              <span className="text-sm text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                                                {getBookTitle(bookId)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}