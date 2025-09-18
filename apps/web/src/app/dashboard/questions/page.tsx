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
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
}

const statusConfig = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  APPROVED: { label: "Approuvée", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  REJECTED: { label: "Rejetée", color: "bg-red-100 text-red-800 border-red-200", icon: X }
};

export default function QuestionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["user-questions", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12"
      });
      
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/proxy/questions?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non authentifié - veuillez vous connecter');
        }
        throw new Error(`Erreur ${response.status}: Impossible de charger les questions`);
      }
      
      return response.json();
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      // Ne pas retenter si c'est une erreur d'authentification
      if (error?.message?.includes('401') || error?.message?.includes('Non authentifié')) {
        return false;
      }
      // Retenter 2 fois maximum pour les autres erreurs
      return failureCount < 2;
    }
  });

  const questions: Question[] = questionsData?.data || [];
  const pagination = questionsData?.pagination || { page: 1, pages: 1, total: 0 };

  // Filter questions by search term (client-side for better UX)
  const filteredQuestions = questions.filter(question => 
    searchTerm === "" || 
    question.contenu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.book.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.book.auteur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
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
      <Badge className={`${config.color} text-xs font-medium gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };


  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4" />
                Retour au tableau de bord
              </Link>
            </Button>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-purple-600" />
                Mes Questions
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos questions et suivez leurs réponses
              </p>
            </div>

            <Button asChild className="gap-2">
              <Link href="/books">
                <Plus className="w-4 h-4" />
                Poser une question
              </Link>
            </Button>
          </div>


          {/* Filters Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher dans vos questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvées</SelectItem>
                  <SelectItem value="REJECTED">Rejetées</SelectItem>
                </SelectContent>
              </Select>

              {/* Results count */}
              <div className="text-sm text-gray-600">
                <strong>{filteredQuestions.length}</strong> question{filteredQuestions.length > 1 ? 's' : ''}
                {searchTerm && ` trouvée${filteredQuestions.length > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Card className="text-center py-12">
              <CardContent>
                <MessageCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-gray-600 mb-4">
                  Impossible de charger vos questions.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredQuestions.length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {searchTerm || statusFilter !== "ALL" 
                    ? "Aucune question trouvée" 
                    : "Vous n'avez encore posé aucune question"
                  }
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Essayez de modifier vos critères de recherche."
                    : "Commencez à explorer notre bibliothèque et posez vos premières questions sur les livres qui vous intéressent."
                  }
                </p>
                {(!searchTerm && statusFilter === "ALL") && (
                  <Button asChild className="gap-2">
                    <Link href="/books">
                      <Book className="w-4 h-4" />
                      Explorer les livres
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Questions Grid */}
          {!isLoading && !isError && filteredQuestions.length > 0 && (
            <div className="space-y-6">
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {filteredQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-purple-300 h-full">
                        <Link href={`/books/${question.book.id}`} className="block h-full">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
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
                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                      <Book className="w-4 h-4 text-purple-400" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                                    {question.book.titre}
                                  </h4>
                                  <p className="text-xs text-gray-600 line-clamp-1">
                                    par {question.book.auteur}
                                  </p>
                                </div>
                              </div>
                              
                              {getStatusBadge(question.status)}
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              {/* Question content */}
                              <div>
                                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                                  {question.contenu}
                                </p>
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Heart className="w-3 h-3" />
                                    {question.stats.likes_count}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {question.stats.responses_count}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(question.date_creation)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Link>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    Page {pagination.page} sur {pagination.pages}
                    ({pagination.total} question{pagination.total > 1 ? 's' : ''} au total)
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}