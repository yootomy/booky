'use client';

import React, { useEffect } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Heart, Clock, CheckCircle, ArrowRight, List, Plus } from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { useToast } from '@/hooks/use-toast';
import { StatsCards } from '@/components/admin/stats-cards';
import { QuestionsManager } from '@/components/admin/questions-manager';
import { RecentActivity } from '@/components/admin/recent-activity';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { stats, isLoading, error, refetch } = useAdminStats();
  const { toast } = useToast();

  // Fetch conseil requests stats
  const { data: conseilsData } = useQuery({
    queryKey: ['admin-conseil-requests-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/conseil-requests?isAdmin=true');
      if (!response.success) return { data: [] };
      return response.data;
    }
  });

  // Fetch lists stats
  const { data: listsData } = useQuery({
    queryKey: ['admin-lists-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/lists?limit=50');
      if (!response.success) return { data: [] };
      return response.data;
    }
  });

  const conseils = conseilsData?.data || [];
  const pendingConseils = conseils.filter((c: any) => c.status === 'EN_ATTENTE');
  const treatedConseils = conseils.filter((c: any) => c.status === 'TRAITE');

  const lists = listsData?.data || [];
  const publicLists = lists.filter((l: any) => l.est_publique);
  const privateLists = lists.filter((l: any) => !l.est_publique);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Données rafraîchies",
        description: "Les statistiques ont été mises à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir les données",
        variant: "destructive",
      });
    }
  };

  const handleQuestionUpdated = () => {
    refetch();
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Dashboard Administrateur
              </h1>
              <p className="text-sm text-gray-500">
                Bienvenue, {user?.nom_complet?.split(" ")[0] || user?.email}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 mt-4 sm:mt-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser (r)
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <StatsCards
              stats={stats}
              isLoading={isLoading}
              listsCount={lists.length}
              publicListsCount={publicLists.length}
            />
          </div>

          {/* Questions Management Section */}
          {(stats?.pending_questions || 0) > 0 && (
            <div id="questions-section" className="mb-8">
              <QuestionsManager stats={stats} onQuestionUpdated={handleQuestionUpdated} />
            </div>
          )}


          {/* Recent Activity */}
          <RecentActivity stats={stats} />
        </div>
      </div>
    </AdminGuard>
  );
}