'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Tag, Star, MessageCircle, CheckCircle, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
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

interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
}

interface ConseilDetailsModalProps {
  conseil: ConseilRequest | null;
  isOpen: boolean;
  onClose: () => void;
  getCategoryName?: (id: string) => string;
  getTagName?: (id: string) => string;
  books?: Book[];
}

export function ConseilDetailsModal({
  conseil,
  isOpen,
  onClose,
  getCategoryName = (id: string) => id,
  getTagName = (id: string) => id,
  books = []
}: ConseilDetailsModalProps) {
  if (!conseil) return null;

  const getBookById = (bookId: string) => {
    return books.find(b => b.id === bookId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'TRAITE':
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case 'REJETE':
        return <MessageCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-border"
            >
              {/* Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-foreground text-lg" style={{ fontFamily: "Playfair Display, serif" }}>
                      Demande de {conseil.nom_utilisateur}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(conseil.date_creation).toLocaleDateString("fr-FR", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <Badge className={
                    conseil.status === "EN_ATTENTE" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                    conseil.status === "TRAITE" ? "bg-primary/10 text-primary border-primary/20" :
                    "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                  }>
                    {getStatusIcon(conseil.status)}
                    <span className="ml-1">{getStatusLabel(conseil.status)}</span>
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-2 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-6 py-6 space-y-6">
                {/* Categories Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                      Genres recherchés
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {conseil.categories.map((categoryId) => (
                      <Badge
                        key={categoryId}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        {getCategoryName(categoryId)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags Section */}
                {conseil.tags.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                        Tropes préférés
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {conseil.tags.map((tagId) => (
                        <Badge
                          key={tagId}
                          variant="outline"
                        >
                          {getTagName(tagId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                {conseil.commentaires && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                        Votre message
                      </h3>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                      <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                        "{conseil.commentaires}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Bruna's Response */}
                {conseil.status === 'TRAITE' && conseil.reponse_bruna && (
                  <div className="bg-card/90 backdrop-blur-lg border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Réponse de Bruna
                      </h3>
                      {conseil.date_reponse && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(conseil.date_reponse).toLocaleDateString("fr-FR", {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                      {conseil.reponse_bruna}
                    </p>

                    {/* Recommended Books */}
                    {conseil.livres_recommandes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-4 text-foreground flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Livres recommandés
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {conseil.livres_recommandes.map((bookId) => {
                            const book = getBookById(bookId);
                            if (!book) return null;

                            return (
                              <Link
                                key={bookId}
                                href={`/books/${bookId}`}
                                className="group flex items-center gap-3 p-3 bg-background rounded-lg border border-border/50 hover:border-primary/60 hover:shadow-md transition-all duration-300"
                              >
                                {/* Book Cover */}
                                <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                                  {book.image_couverture ? (
                                    <Image
                                      src={book.image_couverture}
                                      alt={book.titre}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      sizes="64px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                                      <BookOpen className="w-6 h-6 text-primary/60" />
                                    </div>
                                  )}
                                </div>

                                {/* Book Info */}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: "Playfair Display, serif" }}>
                                    {book.titre}
                                  </h5>
                                  <p className="text-xs text-muted-foreground line-clamp-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {book.auteur}
                                  </p>
                                </div>

                                {/* Arrow Icon */}
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
