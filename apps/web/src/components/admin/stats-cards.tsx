'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  AlertCircle,
  List
} from 'lucide-react';
import { useAdminStats, AdminStats } from '@/hooks/use-admin-stats';

interface StatsCardsProps {
  stats?: AdminStats;
  isLoading?: boolean;
  listsCount?: number;
  publicListsCount?: number;
}

export function StatsCards({ stats, isLoading, listsCount = 0, publicListsCount = 0 }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">Erreur de chargement</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateTrend = (current: number, base: number = 10): string => {
    if (base === 0) return '+0%';
    const trend = Math.round(((current - base) / base) * 100);
    return trend > 0 ? `+${trend}%` : `${trend}%`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
      {/* Total Books */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-9 w-9 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <TrendingUp size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">
            {stats.total_books}
          </div>
          <div className="text-sm text-gray-500 mb-2">Livres</div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
              {stats.books_by_status.LU} lus
            </Badge>
            <Badge variant="outline" className="text-xs border-gray-200">
              {stats.books_by_status.A_LIRE} à lire
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-9 w-9 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <TrendingUp size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">
            {stats.total_users}
          </div>
          <div className="text-sm text-gray-500">Utilisateurs</div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-9 w-9 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
            {stats.pending_questions > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.pending_questions}
              </Badge>
            )}
          </div>
          <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">
            {stats.total_questions}
          </div>
          <div className="text-sm text-gray-500">Questions</div>
        </CardContent>
      </Card>

      {/* Note Moyenne */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-9 w-9 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
              <Star size={18} />
            </div>
            <TrendingUp size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">
            {stats.recent_books.length > 0
              ? (stats.recent_books.reduce((acc, book) => acc + (book.note_generale || 0), 0) / stats.recent_books.length).toFixed(1)
              : '0.0'
            }
          </div>
          <div className="text-sm text-gray-500">Note moyenne</div>
        </CardContent>
      </Card>

      {/* Listes personnalisées */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-9 w-9 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
              <List size={18} />
            </div>
            <TrendingUp size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl md:text-4xl font-semibold text-gray-900 mb-1">
            {listsCount}
          </div>
          <div className="text-sm text-gray-500 mb-2">Listes</div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
              {publicListsCount} publiques
            </Badge>
            <Badge variant="outline" className="text-xs border-gray-200">
              {listsCount - publicListsCount} privées
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}