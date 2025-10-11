"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  ArrowLeft,
  Search,
  Heart,
  MessageSquare,
  Book,
  Plus,
  CheckCircle,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
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
      const response = await apiClient.get('/api/questions', {
        include: 'responses'
      });
      if (!response.success) throw new Error(response.error || "Erreur lors du chargement");
      return response.data;
    },
    retry: false
  });

  const questionsArray: Question[] = Array.isArray(questions) ? questions : (questions?.data || []);

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

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
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const IconComponent = config.icon;
    return (
      <Badge className={`${config.color} text-xs font-medium gap-1 px-2 py-0.5`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Link>
              </Button>
              <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2" style={{ fontFamily: "Playfair Display, serif" }}>
                <MessageCircle className="w-6 h-6 text-primary" />
                Mes Questions
              </h1>
            </div>

            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/books">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle question
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-14 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-destructive/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Impossible de charger les questions</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-muted-foreground/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                {searchTerm ? "Aucune question trouvée" : "Aucune question"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ? "Essayez une autre recherche" : "Vous n'avez pas encore posé de question"}
              </p>
              {!searchTerm && (
                <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/books">
                    <Book className="w-4 h-4 mr-2" />
                    Explorer les livres
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Questions List */}
          {!isLoading && !error && filteredQuestions.length > 0 && (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="bg-card/90 border border-border rounded-lg p-3 hover:border-primary/40 transition-colors"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    {/* Book Cover */}
                    <Link href={`/books/${question.book.id}`}>
                      <div className="w-10 h-14 relative flex-shrink-0 rounded overflow-hidden">
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
                    </Link>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <Link href={`/books/${question.book.id}`} className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors" style={{ fontFamily: "Playfair Display, serif" }}>
                            {question.book.titre}
                          </h3>
                          <p className="text-sm text-muted-foreground">{question.book.auteur}</p>
                        </Link>
                        {getStatusBadge(question.status)}
                      </div>

                      <p className="text-base text-foreground mb-2 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                        {question.contenu}
                      </p>

                      {/* Stats & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {question.stats.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {question.stats.responses_count}
                          </div>
                          <span>{formatDate(question.date_creation)}</span>
                        </div>

                        {question.responses && question.responses.length > 0 && (
                          <button
                            onClick={() => toggleQuestionExpansion(question.id)}
                            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/10"
                          >
                            {expandedQuestions.has(question.id) ? (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Masquer
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4" />
                                {question.responses.length} réponse{question.responses.length > 1 ? 's' : ''}
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Responses */}
                      <AnimatePresence>
                        {expandedQuestions.has(question.id) && question.responses && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-2 border-t border-border pt-3">
                              {question.responses.map((response) => (
                                <div key={response.id} className="flex gap-2.5 bg-muted/30 rounded p-2.5">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    {response.author.avatar ? (
                                      <img
                                        src={response.author.avatar}
                                        alt={response.author.nom_complet}
                                        className="w-7 h-7 rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className="w-3.5 h-3.5 text-primary" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                                        {response.author.nom_complet}
                                      </span>
                                      {response.author.role === "ADMIN" && (
                                        <Badge variant="secondary" className="text-xs py-0 h-4">
                                          <Shield className="w-2.5 h-2.5 mr-0.5" />
                                          Admin
                                        </Badge>
                                      )}
                                      <span className="text-sm text-muted-foreground">
                                        {formatDate(response.date_creation)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                                      {response.contenu}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}
