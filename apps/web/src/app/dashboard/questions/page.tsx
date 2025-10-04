"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  ArrowLeft,
  Search,
  Heart,
  MessageSquare,
  Calendar,
  Book,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Shield
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";

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

const statusConfig = {
  PENDING: { label: "En attente", color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: Clock },
  APPROVED: { label: "Approuvée", color: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: CheckCircle },
  REJECTED: { label: "Rejetée", color: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", icon: X }
};

export default function QuestionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const response = await apiClient.get('/api/questions?include=responses', {
        credentials: 'include'
      });
      if (!response.success) throw new Error(response.error || "Erreur lors du chargement");
      return response.data;
    },
    retry: false
  });

  const questionsArray: Question[] = Array.isArray(questions) ? questions : (questions?.data || []);

  const toggleQuestionExpansion = (questionId: string) => {
    console.log("toggleQuestionExpansion called for:", questionId);
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        console.log("Removing question from expanded set:", questionId);
        newSet.delete(questionId);
      } else {
        console.log("Adding question to expanded set:", questionId);
        newSet.add(questionId);
      }
      console.log("New expanded questions set:", Array.from(newSet));
      return newSet;
    });
  };

  // Filter questions by search term (client-side for better UX)
  const filteredQuestions = questionsArray.filter(question =>
    searchTerm === "" ||
    question.contenu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.book.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.book.auteur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const IconComponent = config.icon;
    return (
      <Badge className={'${config.color}text-xs font-medium gap-1'}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const ResponseItem = ({ response }: { response: Response }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-background/50 rounded-lg p-3 border border-border/30"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {response.author.avatar ? (
            <img
              src={response.author.avatar}
              alt={response.author.nom_complet}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
              {response.author.nom_complet}
            </span>
            {response.author.role === "ADMIN" && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(response.date_creation)}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
            {response.contenu}
          </p>
        </div>
      </div>
    </motion.div>
  );


  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background transition-colors duration-300">
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
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                Mes Questions
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                Gérez vos questions et suivez leurs réponses
              </p>
            </div>

            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
              <Link href="/books">
                <Plus className="w-4 h-4 mr-2" />
                Poser une question
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
                  placeholder="Rechercher dans vos questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-colors duration-200"
                />
              </div>


              {/* Results count */}
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                <strong className="text-foreground">{filteredQuestions.length}</strong> question{filteredQuestions.length > 1 ? 's' : ''}
                {searchTerm && ` trouvée${filteredQuestions.length > 1 ? 's' : ''}`}
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-card/90 backdrop-blur border border-border/50 animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-5 bg-muted rounded w-16"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-4/5"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-card/90 backdrop-blur border border-border/50 text-center py-12">
                <CardContent>
                  <MessageCircle className="w-16 h-16 text-destructive/60 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                    Erreur de chargement
                  </h3>
                  <p className="text-muted-foreground mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                    Impossible de charger vos questions.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredQuestions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-card/90 backdrop-blur border border-border/50 text-center py-16">
                <CardContent>
                  <MessageCircle className="w-20 h-20 text-muted-foreground/60 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-foreground mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
                    {searchTerm
                      ? "Aucune question trouvée"
                      : "Vous n'avez encore posé aucune question"
                    }
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                    {searchTerm
                      ? "Essayez de modifier vos critères de recherche."
                      : "Commencez à explorer notre bibliothèque et posez vos premières questions sur les livres qui vous intéressent."
                    }
                  </p>
                  {!searchTerm && (
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Link href="/books">
                        <Book className="w-4 h-4 mr-2" />
                        Explorer les livres
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Questions Grid */}
          {!isLoading && !error && filteredQuestions.length > 0 && (
            <div className="space-y-6">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start"
                style={{ gridAutoRows: "auto" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group w-full"
                    >
                      <Card className="bg-card/90 backdrop-blur border border-border/50 hover:border-primary/40 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-3">
                            <Link href={`/books/${question.book.id}`} className="flex items-center gap-3 flex-1 min-w-0 group-hover:text-primary transition-colors duration-200">
                              {/* Book cover */}
                              <div className="w-12 h-16 relative flex-shrink-0 rounded overflow-hidden">
                                {question.book.image_couverture ? (
                                  <Image
                                    src={question.book.image_couverture}
                                    alt={question.book.titre}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <Book className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                  {question.book.titre}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                  par {question.book.auteur}
                                </p>
                              </div>
                            </Link>

                            {getStatusBadge(question.status)}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {/* Question content */}
                            <div>
                              <p className="text-sm text-foreground line-clamp-3 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                {question.contenu}
                              </p>
                            </div>

                            {/* Responses section */}
                            {question.responses && question.responses.length > 0 && (
                              <div className="space-y-3">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Clicking responses for question:", question.id);
                                    console.log("Current expanded questions:", Array.from(expandedQuestions));
                                    console.log("Is question expanded?", expandedQuestions.has(question.id));
                                    toggleQuestionExpansion(question.id);
                                  }}
                                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 p-2 rounded-lg hover:bg-primary/10"
                                >
                                  {expandedQuestions.has(question.id) ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Masquer les réponses ({question.responses.length})
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      Voir les réponses ({question.responses.length})
                                    </>
                                  )}
                                </button>

                                {expandedQuestions.has(question.id) && (
                                  <motion.div
                                    key={'responses-${question.id}'}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="space-y-3 overflow-hidden"
                                  >
                                    {question.responses.map((response) => (
                                      <ResponseItem key={response.id} response={response} />
                                    ))}
                                  </motion.div>
                                )}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-border/30">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {question.stats.likes_count}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {question.stats.responses_count}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(question.date_creation)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}