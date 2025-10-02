'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import {
  Heart,
  Clock,
  CheckCircle,
  MessageCircle,
  BookOpen,
  User,
  Calendar,
  Send,
  X,
  Eye,
  Sparkles
} from 'lucide-react';

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
  user?: {
    id: string;
    nom_complet?: string;
    email: string;
  };
}

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
}

export default function AdminConseilsPage() {
  const [selectedRequest, setSelectedRequest] = useState<ConseilRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const queryClient = useQueryClient();

  // Fetch conseil requests
  const { data: conseilsData, isLoading } = useQuery({
    queryKey: ['admin-conseil-requests'],
    queryFn: async () => {
      const response = await apiClient.get('/api/conseil-requests?isAdmin=true');
      if (!response.ok) throw new Error("Failed to fetch conseil requests");
      return response.json();
    }
  });

  // Fetch categories and tags for display
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
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
      const response = await apiClient.get('/api/books`);
      if (!response.ok) throw new Error("Failed to fetch books");
      return response.json();
    }
  });

  // Mutation to respond to a conseil request
  const respondMutation = useMutation({
    mutationFn: async ({ id, reponse_bruna, livres_recommandes, status }: {
      id: string;
      reponse_bruna: string;
      livres_recommandes: string[];
      status: string;
    }) => {
      const response = await apiClient.get(`/api/conseil-requests/${id}`, {
        method: `PATCH`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponse_bruna, livres_recommandes, status })
      });
      if (!response.ok) throw new Error("Failed to respond");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-conseil-requests'] });
      setSelectedRequest(null);
      setResponseText('');
      setSelectedBooks([]);
      setIsResponding(false);
    }
  });

  const conseils = conseilsData?.data || [];
  const categories = categoriesData?.data || [];
  const tags = tagsData?.data || [];
  const books = booksData?.data || [];

  const pendingConseils = conseils.filter((c: ConseilRequest) => c.status === 'EN_ATTENTE');
  const treatedConseils = conseils.filter((c: ConseilRequest) => c.status === 'TRAITE');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return <Clock className="w-4 h-4" style={{ color: "#F59E0B' }} />;
      case 'TRAITE":
        return <CheckCircle className="w-4 h-4" style={{ color: "#10B981" }} />;
      default:
        return <Clock className="w-4 h-4" style={{ color: "#6B7280" }} />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200';
      case 'TRAITE':
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200';
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

  const handleBookToggle = (bookId: string) => {
    setSelectedBooks(prev =>
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleRespond = () => {
    if (!selectedRequest || !responseText.trim()) return;

    respondMutation.mutate({
      id: selectedRequest.id,
      reponse_bruna: responseText.trim(),
      livres_recommandes: selectedBooks,
      status: 'TRAITE'
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;

    respondMutation.mutate({
      id: selectedRequest.id,
      reponse_bruna: 'Demande rejetée',
      livres_recommandes: [],
      status: "REJETE"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4" style={{ color: "#8B1538' }}></div>
          <p style={{ color: "#6B4C7B', fontFamily: 'Inter, sans-serif' }}>Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF8F5" }}>
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: "url("data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\'http://www.w3.org/2000/svg\"%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")"
        }}
      />

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  boxShadow: "0 8px 25px rgba(139, 21, 56, 0.3)"
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
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent',
                    backgroundClip: "text"
                  }}
                >
                  Gestion des demandes de conseils
                </h1>
                <p
                  className="text-lg"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    color: '#6B4C7B',
                    opacity: 0.8
                  }}
                >
                  {pendingConseils.length} demande(s) en attente • {treatedConseils.length} traitée(s)
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Requests */}
            <div>
              <h2
                className="text-xl font-bold mb-6"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  color: '#2C1810'
                }}
              >
                Demandes en attente ({pendingConseils.length})
              </h2>

              <div className=`space-y-4`>
                {pendingConseils.map((conseil: ConseilRequest) => (
                  <motion.div
                    key={conseil.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        selectedRequest?.id === conseil.id ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                      }`}
                      style={{
                        background: selectedRequest?.id === conseil.id
                          ? `linear-gradient(135deg, rgba(139, 21, 56, 0.1) 0%, rgba(107, 76, 123, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(139, 21, 56, 0.1)',
                        borderRadius: '16px',
                        boxShadow: "0 8px 25px rgba(139, 21, 56, 0.1)"
                      }}
                      onClick={() => setSelectedRequest(conseil)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg" style={{ color: '#2C1810', fontFamily: 'Inter, sans-serif' }}>
                              {conseil.nom_utilisateur}
                            </h3>
                            <div className="flex items-center gap-2 text-sm" style={{ color: "#6B4C7B` }}>
                              <Calendar className=`w-4 h-4` />
                              {new Date(conseil.date_creation).toLocaleDateString(`fr-FR`)}
                            </div>
                          </div>
                          <Badge
                            className={`flex items-center gap-1 px-3 py-1 text-xs ${getStatusStyle(conseil.status)}`}
                            style={{ borderRadius: `12px` }}
                          >
                            {getStatusIcon(conseil.status)}
                            En attente
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: "#6B4C7B" }}>Genres :</p>
                            <div className="flex flex-wrap gap-1">
                              {conseil.categories.slice(0, 3).map(catId => (
                                <Badge
                                  key={catId}
                                  style={{
                                    backgroundColor: 'rgba(139, 21, 56, 0.1)',
                                    color: '#8B1538',
                                    fontSize: "0.7rem",
                                    padding: "2px 6px'
                                  }}
                                >
                                  {getCategoryName(catId)}
                                </Badge>
                              ))}
                              {conseil.categories.length > 3 && (
                                <Badge style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                                  +{conseil.categories.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {conseil.tags && conseil.tags.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: '#6B4C7B' }}>Tropes :</p>
                              <div className="flex flex-wrap gap-1">
                                {conseil.tags.slice(0, 3).map(tagId => (
                                  <Badge
                                    key={tagId}
                                    style={{
                                      backgroundColor: 'rgba(107, 76, 123, 0.1)',
                                      color: '#6B4C7B',
                                      fontSize: "0.7rem",
                                      padding: "2px 6px'
                                    }}
                                  >
                                    {getTagName(tagId)}
                                  </Badge>
                                ))}
                                {conseil.tags.length > 3 && (
                                  <Badge style={{ fontSize: "0.7rem", padding: "2px 6px" }}>
                                    +{conseil.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {conseil.commentaires && (
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: '#6B4C7B' }}>Commentaires :</p>
                              <p className="text-xs line-clamp-2" style={{ color: "#2C1810" }}>
                                "{conseil.commentaires}"
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            style={{ borderColor: '#8B1538', color: '#8B1538' }}
                          >
                            <Eye className="w-3 h-3" />
                            Voir détails
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {pendingConseils.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: "#8B1538" }} />
                    <p style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}>
                      Aucune demande en attente
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Response Panel */}
            <div>
              {selectedRequest ? (
                <Card
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(139, 21, 56, 0.1)',
                    borderRadius: '16px',
                    boxShadow: "0 8px 25px rgba(139, 21, 56, 0.15)"
                  }}
                >
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle style={{ fontFamily: 'Playfair Display, serif', color: '#2C1810' }}>
                        Répondre à {selectedRequest.nom_utilisateur}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRequest(null)}
                        className="rounded-full w-8 h-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-6">
                    {/* Request Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2" style={{ color: "#2C1810" }}>Genres sélectionnés :</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.categories.map(catId => (
                            <Badge key={catId} style={{ backgroundColor: 'rgba(139, 21, 56, 0.1)', color: '#8B1538', fontSize: '0.8rem' }}>
                              {getCategoryName(catId)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2" style={{ color: "#2C1810" }}>Tropes préférés :</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.tags.slice(0, 6).map(tagId => (
                            <Badge key={tagId} style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)', color: '#6B4C7B', fontSize: '0.8rem' }}>
                              {getTagName(tagId)}
                            </Badge>
                          ))}
                          {selectedRequest.tags.length > 6 && (
                            <Badge style={{ backgroundColor: 'rgba(107, 76, 123, 0.1)', color: '#6B4C7B', fontSize: '0.8rem' }}>
                              +{selectedRequest.tags.length - 6} autres
                            </Badge>
                          )}
                        </div>
                      </div>

                      {selectedRequest.commentaires && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2" style={{ color: "#2C1810" }}>Commentaires :</h4>
                          <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: "rgba(139, 21, 56, 0.05)', color: '#2C1810" }}>
                            "{selectedRequest.commentaires}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Response Form */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2" style={{ color: "#2C1810" }}>Votre réponse :</h4>
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Chère [nom], voici mes recommandations personnalisées pour vous..."
                          className="min-h-32"
                          style={{ borderRadius: "12px", fontFamily: "Inter, sans-serif` }}
                        />
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2" style={{ color: "#2C1810` }}>Livres recommandés (optionnel) :</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {books.slice(0, 20).map((book: Book) => (
                            <div
                              key={book.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                selectedBooks.includes(book.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleBookToggle(book.id)}
                            >
                              <input
                                type=`checkbox"
                                checked={selectedBooks.includes(book.id)}
                                onChange={() => handleBookToggle(book.id)}
                                className="rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: "#2C1810" }}>{book.titre}</p>
                                <p className="text-xs" style={{ color: "#6B4C7B" }}>{book.auteur}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleRespond}
                        disabled={!responseText.trim() || respondMutation.isPending}
                        className="flex-1"
                        style={{
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          color: 'white'
                        }}
                      >
                        {respondMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Envoyer la réponse
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={respondMutation.isPending}
                        style={{ borderColor: '#EF4444', color: '#EF4444' }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-20">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#8B1538" }} />
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#2C1810' }}>
                    Sélectionnez une demande
                  </h3>
                  <p style={{ color: '#6B4C7B', fontFamily: 'Inter, sans-serif' }}>
                    Choisissez une demande à gauche pour y répondre
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}