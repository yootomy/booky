"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import {
  BookOpen,
  MessageCircle,
  Settings,
  Heart,
  User,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquare,
  Book,
  CheckCircle,
  Clock,
  Shield,
  Sparkles,
  Calendar
} from "lucide-react";
import { ConseilDetailsModal } from "@/components/conseil/ConseilDetailsModal";

// Types
interface Response {
  id: string;
  contenu: string;
  date_creation: string;
  author: {
    nom_complet: string;
    username: string;
    avatar?: string;
    role?: string;
  };
}

interface Question {
  id: string;
  contenu: string;
  status: string;
  date_creation: string;
  book: {
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
  };
  author: {
    nom_complet: string;
    username: string;
    avatar?: string;
  };
  stats: {
    likes_count: number;
    responses_count: number;
  };
  responses?: Response[];
}

interface Conseil {
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

type TabType = 'questions' | 'conseils';

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('questions');
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [selectedConseil, setSelectedConseil] = useState<Conseil | null>(null);

  // Rediriger les admins vers leur dashboard dédié
  useEffect(() => {
    if (isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAdmin, router]);

  // Hook pour récupérer les questions
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/questions', {
        include: 'responses'
      });
      if (!response.success) throw new Error(response.error || "Erreur lors du chargement");
      return response.data;
    },
    retry: false
  });

  const questions: Question[] = Array.isArray(questionsData) ? questionsData : (questionsData?.data || []);

  // Hook pour récupérer les conseils
  const { data: conseilsData, isLoading: conseilsLoading } = useQuery({
    queryKey: ['conseil-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      const response = await apiClient.get('/api/conseil-requests');
      if (!response.success) throw new Error(response.error || "Failed to fetch conseil requests");
      return response.data;
    },
    enabled: !!user?.id,
    retry: false
  });

  const conseils = conseilsData || [];

  // Hook pour récupérer les livres (pour les recommandations)
  const { data: booksData } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const response = await apiClient.get('/api/books');
      if (!response.success) throw new Error(response.error || "Failed to fetch books");
      return response.data;
    }
  });

  const books = booksData || [];

  // Générer les initiales de l'utilisateur
  const getUserInitials = (user: any) => {
    if (user?.nom_complet) {
      return user.nom_complet
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'ANSWERED':
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />Répondue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConseilStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'TRAITE':
      case 'REPONDU':
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" />Répondu</Badge>;
      case 'REJETE':
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((q: Question) =>
    q.contenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.book.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter conseils
  const filteredConseils = conseils.filter((c: Conseil) =>
    c.commentaires?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.reponse_bruna?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nom_utilisateur?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ne pas afficher le dashboard si l'utilisateur est admin (redirection en cours)
  if (isAdmin) {
    return null;
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-12"
          >
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="flex flex-col items-center space-y-4">
                {user?.avatar ? (
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    src={user.avatar}
                    alt="Avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary/20 shadow-xl"
                  />
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl sm:text-3xl border-4 border-primary/20 shadow-xl"
                  >
                    {getUserInitials(user)}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Bienvenue, {user?.nom_complet?.split(' ')[0] || user?.username || 'Lecteur'} !
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-sm sm:text-base text-muted-foreground"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Gérez vos questions et demandes de conseils
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-6"
          >
            <Card className="bg-card/90 backdrop-blur-lg border-border shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle
                  className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  <User className="w-5 h-5 text-primary" />
                  Mon compte
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {getUserInitials(user)}
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3
                        className="font-semibold text-foreground"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {user?.nom_complet || user?.username || "Utilisateur"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Lecteur
                      </Badge>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-xs px-3 py-1"
                  >
                    <Link href="/dashboard/profile">
                      <Settings className="w-3 h-3 mr-1" />
                      Gérer mon profil
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-6"
          >
            <Card className="bg-card/90 backdrop-blur-lg border-border shadow-lg">
              <CardContent className="p-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                      activeTab === 'questions'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-transparent text-foreground hover:bg-muted'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-semibold">Mes questions</span>
                    <Badge variant={activeTab === 'questions' ? 'secondary' : 'outline'} className="ml-2">
                      {questions.length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setActiveTab('conseils')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                      activeTab === 'conseils'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-transparent text-foreground hover:bg-muted'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span className="font-semibold">Demandes de conseils</span>
                    <Badge variant={activeTab === 'conseils' ? 'secondary' : 'outline'} className="ml-2">
                      {conseils.length}
                    </Badge>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={activeTab === 'questions' ? "Rechercher une question..." : "Rechercher une demande..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card/90 backdrop-blur-lg border-border"
              />
            </div>
          </motion.div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {activeTab === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {questionsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement de vos questions...</p>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <Card className="bg-card/90 backdrop-blur-lg border-border">
                    <CardContent className="py-12 text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Aucune question</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Aucune question ne correspond à votre recherche" : "Vous n'avez pas encore posé de questions"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((question: Question) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="bg-card/90 backdrop-blur-lg border border-border hover:border-primary/40 transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Book Cover */}
                              <Link href={`/books/${question.book.id}`} className="flex-shrink-0">
                                <div className="w-12 h-16 relative rounded overflow-hidden bg-muted">
                                  {question.book.image_couverture ? (
                                    <Image
                                      src={question.book.image_couverture}
                                      alt={question.book.titre}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                                      <Book className="w-6 h-6 text-primary" />
                                    </div>
                                  )}
                                </div>
                              </Link>

                              {/* Question Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1">
                                    <Link
                                      href={`/books/${question.book.id}`}
                                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                    >
                                      {question.book.titre}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">{question.book.auteur}</p>
                                  </div>
                                  {getStatusBadge(question.status)}
                                </div>

                                <p className="text-base text-foreground mb-2 leading-relaxed">
                                  {question.contenu}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(question.date_creation).toLocaleDateString('fr-FR')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {question.stats.responses_count} réponse{question.stats.responses_count > 1 ? 's' : ''}
                                  </span>
                                </div>

                                {/* Responses Toggle */}
                                {question.stats.responses_count > 0 && (
                                  <button
                                    onClick={() => toggleQuestionExpansion(question.id)}
                                    className="mt-3 flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                                  >
                                    {expandedQuestions.has(question.id) ? (
                                      <>
                                        <ChevronDown className="w-4 h-4" />
                                        Masquer les réponses
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="w-4 h-4" />
                                        Voir les réponses
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* Expanded Responses */}
                                <AnimatePresence>
                                  {expandedQuestions.has(question.id) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="mt-3 space-y-3 border-t border-border pt-3"
                                    >
                                      {(question.responses || []).map((response: Response) => (
                                        <div
                                          key={response.id}
                                          className="bg-muted/50 rounded-lg p-3"
                                        >
                                          <div className="flex items-start gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                              {response.author.avatar ? (
                                                <img
                                                  src={response.author.avatar}
                                                  alt={response.author.nom_complet}
                                                  className="w-6 h-6 rounded-full"
                                                />
                                              ) : (
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                  <User className="w-3 h-3 text-primary" />
                                                </div>
                                              )}
                                              <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                                                {response.author.nom_complet || response.author.username}
                                                {response.author.role === 'ADMIN' && (
                                                  <Shield className="w-3 h-3 text-primary" />
                                                )}
                                              </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                              {new Date(response.date_creation).toLocaleDateString('fr-FR')}
                                            </span>
                                          </div>
                                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                            {response.contenu}
                                          </p>
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'conseils' && (
              <motion.div
                key="conseils"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {conseilsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement de vos demandes...</p>
                  </div>
                ) : filteredConseils.length === 0 ? (
                  <Card className="bg-card/90 backdrop-blur-lg border-border">
                    <CardContent className="py-12 text-center">
                      <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Aucune demande ne correspond à votre recherche" : "Vous n'avez pas encore fait de demande de conseil"}
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/conseils">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Faire une demande
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredConseils.map((conseil: Conseil) => (
                      <motion.div
                        key={conseil.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="bg-card/90 backdrop-blur-lg border border-border hover:border-primary/40 transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Heart className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="text-base font-semibold text-foreground">
                                    Demande de conseil
                                  </h3>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(conseil.date_creation).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              {getConseilStatusBadge(conseil.status)}
                            </div>

                            {conseil.commentaires && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {conseil.commentaires}
                              </p>
                            )}

                            {(conseil.status === 'REPONDU' || conseil.status === 'TRAITE') && (
                              <Button
                                onClick={() => setSelectedConseil(conseil)}
                                variant="outline"
                                size="sm"
                                className="w-full mt-2"
                              >
                                Voir les détails
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Conseil Details Modal */}
      {selectedConseil && (
        <ConseilDetailsModal
          conseil={selectedConseil}
          isOpen={!!selectedConseil}
          onClose={() => setSelectedConseil(null)}
          books={books}
        />
      )}
    </AuthGuard>
  );
}
