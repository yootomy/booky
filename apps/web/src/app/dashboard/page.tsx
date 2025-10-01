"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from '@/lib/api-client';
import {
  BookOpen,
  MessageCircle,
  Settings,
  Heart,
  BarChart3,
  User,
  Crown,
  ChevronRight,
  Sparkles,
  Calendar,
  Activity,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();
  const router = useRouter();

  // Rediriger les admins vers leur dashboard dédié
  useEffect(() => {
    if (isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [isAdmin, router]);

  // Hook pour récupérer les stats utilisateur
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/stats/user', {
        credentials: 'include'
      });
      if (!response.ok) return { favoriteBooks: 0, questionsCount: 0, conseilsCount: 0 };
      return response.json();
    },
    retry: false
  });

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

  // Ne pas afficher le dashboard si l'utilisateur est admin (redirection en cours)
  if (isAdmin) {
    return null;
  }

  // Cards de navigation principales
  const navigationCards = [
    {
      id: 'questions',
      title: 'Mes questions',
      description: 'Questions et réponses de Bruna',
      icon: MessageCircle,
      href: '/dashboard/questions',
      color: 'from-purple-600 to-purple-700',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      count: userStats?.questionsCount || 0,
      countLabel: 'questions'
    },
    {
      id: 'conseils',
      title: 'Demandes de conseils',
      description: 'Échanges personnalisés avec Bruna',
      icon: Heart,
      href: '/dashboard/conseils',
      color: 'from-pink-600 to-rose-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
      count: userStats?.conseilsCount || 0,
      countLabel: 'demandes'
    }
  ];


  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Container principal avec padding responsive */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">

          {/* Header Section - Hero moderne */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-12"
          >
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Avatar et greeting */}
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
                    Que souhaitez-vous explorer aujourd'hui ?
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
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {user?.nom_complet || user?.username || 'Utilisateur'}
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

          {/* Questions et Conseils - Liste compacte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="space-y-3 mb-6"
          >
            {navigationCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                className="group"
              >
                <Link href={card.href as any}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-card/70 transition-all duration-200 cursor-pointer">
                    <div className={'p-2 rounded-lg ${card.bgColor} flex-shrink-0'}>
                      <card.icon className="w-4 h-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {card.title}
                        </h3>
                        {!statsLoading && card.count > 0 && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {card.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {card.description}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </AuthGuard>
  );
}