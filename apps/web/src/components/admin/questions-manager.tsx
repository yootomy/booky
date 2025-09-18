'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Send,
  User,
  BookOpen
} from 'lucide-react';
import { useAdminStats, AdminStats } from '@/hooks/use-admin-stats';
import { useToast } from '@/hooks/use-toast';

interface QuestionsManagerProps {
  stats?: AdminStats;
  onQuestionUpdated?: () => void;
}

export function QuestionsManager({ stats, onQuestionUpdated }: QuestionsManagerProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const handleSubmitResponse = async (questionId: string, action: 'ANSWERED' | 'REJECTED') => {
    setIsSubmitting(prev => ({ ...prev, [questionId]: true }));
    
    try {
      const response = responses[questionId];
      // Trouver la question pour récupérer l'ID du livre
      const question = stats?.recent_questions?.find(q => q.id === questionId);
      const bookId = question?.book_id || 'cmey654ee0010qtwccb4f20pl'; // Fallback vers l'ancien ID
      
      if (action === 'ANSWERED' && !response?.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir une réponse",
          variant: "destructive",
        });
        return;
      }
      
      if (action === 'ANSWERED' && response.trim().length < 10) {
        toast({
          title: "Erreur",
          description: "La réponse doit faire au moins 10 caractères",
          variant: "destructive",
        });
        return;
      }

      if (action === 'ANSWERED') {
        // Répondre à la question via le proxy (pour garder les cookies)
        const res = await fetch(`/api/proxy/books/${bookId}/questions/${questionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ reponse: response }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          
          // Extraire le message d'erreur de validation si disponible
          if (errorData.details && Array.isArray(errorData.details) && errorData.details[0]?.message) {
            throw new Error(errorData.details[0].message);
          } else if (errorData.error) {
            throw new Error(errorData.error);
          } else {
            throw new Error('Erreur lors de la réponse à la question');
          }
        }

        toast({
          title: "Réponse envoyée",
          description: "Votre réponse a été publiée avec succès",
        });
      } else {
        // Rejeter la question via le proxy (pour garder les cookies)
        const res = await fetch(`/api/proxy/books/${bookId}/questions/${questionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: 'REJECTED' }),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          
          // Extraire le message d'erreur si disponible
          if (errorData.error) {
            throw new Error(errorData.error);
          } else {
            throw new Error('Erreur lors du rejet de la question');
          }
        }

        toast({
          title: "Question rejetée",
          description: "La question a été rejetée",
        });
      }

      // Réinitialiser les états
      setResponses(prev => {
        const newResponses = { ...prev };
        delete newResponses[questionId];
        return newResponses;
      });
      
      setExpandedQuestions(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(questionId);
        return newExpanded;
      });

      // Notifier le parent pour rafraîchir les données
      onQuestionUpdated?.();

    } catch (error) {
      console.error('Error handling question:', error);
      
      let errorMessage = 'Une erreur est survenue lors du traitement de la question';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Gérer les erreurs API avec structure {success, error, statusCode}
        if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
          if ('statusCode' in error && error.statusCode === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          }
        } else if ('message' in error) {
          errorMessage = String(error.message);
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const pendingQuestions = stats?.recent_questions?.filter(q => q.status === 'PENDING') || [];

  if (pendingQuestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Questions en attente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune question en attente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Toutes les questions ont été traitées
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle size={20} className="text-violet-600" />
          Questions en attente
          <Badge variant="destructive" className="ml-2">
            {pendingQuestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {pendingQuestions.map((question) => (
          <div key={question.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <User size={16} />
                  <span className="font-medium text-gray-900">{question.user_name}</span>
                  <span>•</span>
                  <BookOpen size={16} />
                  <span>{question.book_title}</span>
                  <span>•</span>
                  <Clock size={16} />
                  <span>{new Date(question.date_question).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-gray-700 font-medium">{question.question}</p>
              </div>
              <Badge className="bg-red-50 text-red-700 border-red-200">
                <Clock className="h-3 w-3 mr-1" />
                En attente
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleQuestion(question.id)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 flex-1"
              >
                {expandedQuestions.has(question.id) ? 'Annuler' : 'Répondre'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSubmitResponse(question.id, 'REJECTED')}
                disabled={isSubmitting[question.id]}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            {/* Response Form */}
            {expandedQuestions.has(question.id) && (
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <Textarea
                  placeholder="Votre réponse..."
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  rows={4}
                  className="mb-3 border-gray-200 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleQuestion(question.id)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSubmitResponse(question.id, 'ANSWERED')}
                    disabled={!responses[question.id]?.trim() || isSubmitting[question.id]}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting[question.id] ? 'Envoi...' : 'Envoyer'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}