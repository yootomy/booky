'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  BookOpen,
  MessageCircle,
  User,
  Star,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Download,
  Hash,
  BarChart3,
  Heart,
  List
} from 'lucide-react';
import { useAdminStats, AdminStats } from '@/hooks/use-admin-stats';
import Link from 'next/link';

interface RecentActivityProps {
  stats?: AdminStats;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'book': return BookOpen;
    case 'question': return MessageCircle;
    case 'user': return User;
    case 'rating': return Star;
    default: return Activity;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'book': return 'bg-blue-500';
    case 'question': return 'bg-orange-500';
    case 'user': return 'bg-green-500';
    case 'rating': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
}

export function RecentActivity({ stats }: RecentActivityProps) {
  // Générer l'activité récente basée sur les données réelles
  const generateRecentActivity = () => {
    const activities: any[] = [];

    // Ajouter les questions récentes
    if (stats?.recent_questions) {
      stats.recent_questions.forEach((question) => {
        activities.push({
          id: question.id,
          type: 'question',
          title: 'Nouvelle question posée`,
          description: `"${question.question.substring(0, 50)}..." sur ${question.book_title}`,
          user: question.user_name,
          time: new Date(question.date_question).toLocaleString('fr-FR'),
          timestamp: new Date(question.date_question)
        });
      });
    }

    // Ajouter les livres récents
    if (stats?.recent_books) {
      stats.recent_books.slice(0, 3).forEach((book) => {
        activities.push({
          id: book.id,
          type: 'book',
          title: 'Livre ajouté`,
          description: `"${book.titre}" par ${book.auteur}`,
          user: 'Admin',
          time: new Date(book.date_creation).toLocaleString('fr-FR'),
          timestamp: new Date(book.date_creation),
          rating: book.note_generale
        });
      });
    }

    // Trier par timestamp (plus récent en premier)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
  };

  const activities = generateRecentActivity();

  const quickActions = [
    {
      title: 'Ajouter un livre',
      description: 'Nouveau livre au catalogue',
      icon: Plus,
      href: '/admin/books/new'
    },
    {
      title: 'Gérer les livres',
      description: 'Voir et modifier les livres',
      icon: BookOpen,
      href: '/admin/books'
    },
    {
      title: 'Gérer les catégories',
      description: 'Catégories de livres',
      icon: TrendingUp,
      href: '/admin/categories'
    },
    {
      title: 'Gérer les tags',
      description: 'Tags et étiquettes',
      icon: Hash,
      href: '/admin/tags'
    },
    {
      title: 'Gérer les listes',
      description: 'Listes personnalisées',
      icon: List,
      href: '/admin/lists'
    },
    {
      title: 'Demandes de conseils',
      description: 'Recommandations de Bruna',
      icon: Heart,
      href: '/admin/conseils'
    },
    {
      title: 'Gérer les utilisateurs',
      description: 'Permissions et rôles',
      icon: User,
      href: '/admin/users'
    },
    {
      title: 'Exporter les données',
      description: 'Backup et export',
      icon: Download,
      href: '/admin/export'
    },
    {
      title: 'Activité système',
      description: 'Logs et historique',
      icon: BarChart3,
      href: '/admin/activity'
    },
    {
      title: 'Paramètres',
      description: 'Configuration système',
      icon: Activity,
      href: '/admin/settings'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quick Actions */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus size={20} className="text-violet-600" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href as any}>
                <Card className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-150 h-full cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                      <action.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {action.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {action.description}
                      </div>
                      <ArrowRight size={16} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-violet-600" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune activité récente</p>
              </div>
            ) : (
              <>
                <div className="text-xs font-medium text-gray-500 mb-3">Aujourd'hui</div>
                {activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors cursor-pointer">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                          <Icon size={16} />
                        </div>
                        {index < activities.length - 1 && (
                          <div className="absolute left-1/2 top-8 w-0.5 h-6 bg-gray-200 transform -translate-x-1/2" />
                        )}
                      </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {activity.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {activity.description}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          {activity.user}
                        </Badge>
                        {activity.rating && (
                          <Badge variant="outline" className="text-xs border-gray-200">
                            <Star className="h-3 w-3 mr-1" />
                            {activity.rating}/10
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        il y a {activity.time}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}