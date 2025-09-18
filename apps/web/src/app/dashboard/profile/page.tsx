"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Shield, 
  BookOpen, 
  MessageCircle, 
  Heart, 
  Star, 
  Save,
  Eye,
  EyeOff,
  Settings,
  Award
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  nom_complet: string;
  username: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  derniere_connexion: string;
  date_creation: string;
  stats: {
    books_count: number;
    questions_count: number;
    likes_given_count: number;
    favorites_count: number;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom_complet: "",
    username: "",
    email: ""
  });

  // Récupérer les données complètes du profil
  const {
    data: profileData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/auth/profile", {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      return response.json();
    },
    enabled: !!user
  });

  const profile: UserProfile = profileData?.data;

  // Initialiser le formulaire avec les données du profil
  React.useEffect(() => {
    if (profile) {
      setFormData({
        nom_complet: profile.nom_complet || "",
        username: profile.username || "",
        email: profile.email || ""
      });
    }
  }, [profile]);

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { nom_complet: string; username: string; email: string }) => {
      const response = await fetch("/api/proxy/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      // Rafraîchir les données utilisateur
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.email.includes('@')) {
      toast.error("Email valide requis");
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: "Administrateur", color: "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200" },
      MODERATOR: { label: "Modérateur", color: "bg-gradient-to-r from-violet-50 to-violet-100 text-violet-800 border-violet-200" },
      USER: { label: "Utilisateur", color: "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200" }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.USER;
    return (
      <Badge
        className={`${config.color} text-sm font-medium gap-2 px-3 py-2`}
        style={{
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <Shield className="w-4 h-4" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen" style={{backgroundColor: '#FAF8F5'}}>
          {/* Elegant background with subtle texture */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />
          <div className="relative z-10">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <div className="space-y-6">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </div>
      </AuthGuard>
    );
  }

  if (isError || !profile) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen" style={{backgroundColor: '#FAF8F5'}}>
          {/* Elegant background with subtle texture */}
          <div
            className="absolute inset-0 opacity-20 mix-blend-multiply"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />
          <div className="relative z-10">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <Card className="text-center py-12">
              <CardContent>
                <User className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-gray-600 mb-4">
                  Impossible de charger votre profil.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen" style={{backgroundColor: '#FAF8F5'}}>
        {/* Elegant background with subtle texture */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
        <div className="relative z-10">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          
          {/* Header */}
          <div className="flex items-center gap-6 mb-10">
            <button
              className="group px-4 py-3 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(107, 76, 123, 0.3)',
                color: '#6B4C7B',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                boxShadow: '0 4px 20px rgba(107, 76, 123, 0.15)',
              }}
              onClick={() => window.location.href = '/dashboard'}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <ArrowLeft className="w-4 h-4" style={{strokeWidth: 1.5}} />
              Retour au tableau de bord
            </button>

            <div className="flex-1">
              <h1
                className="text-4xl font-bold mb-2 flex items-center gap-4"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                <User className="w-10 h-10" style={{color: '#6B4C7B'}} />
                Mon Profil
              </h1>
              <p
                className="text-lg"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: '#2C1810',
                  opacity: 0.8,
                  lineHeight: '1.6'
                }}
              >
                Gérez vos informations personnelles et consultez vos statistiques
              </p>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="group px-6 py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-3"
              style={{
                background: isEditing
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                backdropFilter: 'blur(10px)',
                border: isEditing ? '2px solid rgba(107, 76, 123, 0.3)' : 'none',
                color: isEditing ? '#6B4C7B' : 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: isEditing
                  ? '0 4px 20px rgba(107, 76, 123, 0.15)'
                  : '0 8px 25px rgba(139, 21, 56, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (isEditing) {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (isEditing) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {isEditing ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Annuler
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  Modifier
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profil principal */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Informations personnelles */}
              <Card
                className="shadow-xl border-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
                }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-3 text-xl font-bold"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    <User className="w-6 h-6" style={{color: '#6B4C7B'}} />
                    Informations personnelles
                  </CardTitle>
                  <CardDescription
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#2C1810',
                      opacity: 0.7,
                      fontSize: '1rem'
                    }}
                  >
                    {isEditing ? "Modifiez vos informations" : "Vos informations de profil"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <motion.form 
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="nom_complet">Nom complet</Label>
                        <Input
                          id="nom_complet"
                          type="text"
                          value={formData.nom_complet}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            nom_complet: e.target.value
                          }))}
                          placeholder="Votre nom complet"
                        />
                      </div>

                      <div>
                        <Label htmlFor="username">Nom d'utilisateur</Label>
                        <Input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            username: e.target.value
                          }))}
                          placeholder="Votre nom d'utilisateur"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>

                      <div className="flex gap-4 pt-6">
                        <button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="group px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                            color: 'white',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)',
                          }}
                        >
                          <Save className="w-4 h-4" />
                          {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="group px-6 py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '2px solid rgba(107, 76, 123, 0.3)',
                            color: '#6B4C7B',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            boxShadow: '0 4px 20px rgba(107, 76, 123, 0.15)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.5)';
                            e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Nom complet</Label>
                          <p className="text-sm text-gray-900 mt-1">
                            {profile.nom_complet || "Non renseigné"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Nom d'utilisateur</Label>
                          <p className="text-sm text-gray-900 mt-1">
                            {profile.username || "Non renseigné"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">{profile.email}</p>
                          {profile.emailVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Vérifié
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations du compte */}
              <Card
                className="shadow-xl border-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
                }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-3 text-xl font-bold"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    <Shield className="w-6 h-6" style={{color: '#6B4C7B'}} />
                    Informations du compte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Rôle</Label>
                        <div className="mt-1">
                          {getRoleBadge(profile.role)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">ID Utilisateur</Label>
                        <p className="text-sm text-gray-500 mt-1 font-mono">
                          {profile.id}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Membre depuis</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-900">
                            {formatDate(profile.date_creation)}
                          </p>
                        </div>
                      </div>
                      {profile.derniere_connexion && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Dernière connexion</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {formatDate(profile.derniere_connexion)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistiques */}
            <div className="space-y-6">
              
              {/* Stats principales */}
              <Card
                className="shadow-xl border-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
                }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-3 text-xl font-bold"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    <Award className="w-6 h-6" style={{color: '#6B4C7B'}} />
                    Mes statistiques
                  </CardTitle>
                  <CardDescription
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      color: '#2C1810',
                      opacity: 0.7,
                      fontSize: '1rem'
                    }}
                  >
                    Votre activité sur la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.08) 0%, rgba(139, 21, 56, 0.03) 100%)',
                        border: '1px solid rgba(139, 21, 56, 0.1)',
                        boxShadow: '0 4px 20px rgba(139, 21, 56, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <BookOpen className="w-6 h-6" style={{color: '#8B1538'}} />
                        <div>
                          <p
                            className="text-base font-semibold"
                            style={{fontFamily: 'Inter, sans-serif', color: '#2C1810'}}
                          >
                            Livres ajoutés
                          </p>
                          <p
                            className="text-sm"
                            style={{fontFamily: 'Inter, sans-serif', color: '#8B1538', opacity: 0.8}}
                          >
                            Contributions
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-2xl font-bold"
                        style={{fontFamily: 'Playfair Display, serif', color: '#8B1538'}}
                      >
                        {profile.stats.books_count}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(107, 76, 123, 0.08) 0%, rgba(107, 76, 123, 0.03) 100%)',
                        border: '1px solid rgba(107, 76, 123, 0.1)',
                        boxShadow: '0 4px 20px rgba(107, 76, 123, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <MessageCircle className="w-6 h-6" style={{color: '#6B4C7B'}} />
                        <div>
                          <p
                            className="text-base font-semibold"
                            style={{fontFamily: 'Inter, sans-serif', color: '#2C1810'}}
                          >
                            Questions posées
                          </p>
                          <p
                            className="text-sm"
                            style={{fontFamily: 'Inter, sans-serif', color: '#6B4C7B', opacity: 0.8}}
                          >
                            Interactions
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-2xl font-bold"
                        style={{fontFamily: 'Playfair Display, serif', color: '#6B4C7B'}}
                      >
                        {profile.stats.questions_count}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(220, 38, 127, 0.08) 0%, rgba(220, 38, 127, 0.03) 100%)',
                        border: '1px solid rgba(220, 38, 127, 0.1)',
                        boxShadow: '0 4px 20px rgba(220, 38, 127, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Heart className="w-6 h-6" style={{color: '#DC267F'}} />
                        <div>
                          <p
                            className="text-base font-semibold"
                            style={{fontFamily: 'Inter, sans-serif', color: '#2C1810'}}
                          >
                            Likes donnés
                          </p>
                          <p
                            className="text-sm"
                            style={{fontFamily: 'Inter, sans-serif', color: '#DC267F', opacity: 0.8}}
                          >
                            Appréciations
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-2xl font-bold"
                        style={{fontFamily: 'Playfair Display, serif', color: '#DC267F'}}
                      >
                        {profile.stats.likes_given_count}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.08) 0%, rgba(184, 134, 11, 0.03) 100%)',
                        border: '1px solid rgba(184, 134, 11, 0.1)',
                        boxShadow: '0 4px 20px rgba(184, 134, 11, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Star className="w-6 h-6" style={{color: '#B8860B'}} />
                        <div>
                          <p
                            className="text-base font-semibold"
                            style={{fontFamily: 'Inter, sans-serif', color: '#2C1810'}}
                          >
                            Favoris
                          </p>
                          <p
                            className="text-sm"
                            style={{fontFamily: 'Inter, sans-serif', color: '#B8860B', opacity: 0.8}}
                          >
                            Sélections
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-2xl font-bold"
                        style={{fontFamily: 'Playfair Display, serif', color: '#B8860B'}}
                      >
                        {profile.stats.favorites_count}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card
                className="shadow-xl border-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
                }}
              >
                <CardHeader>
                  <CardTitle
                    className="text-xl font-bold"
                    style={{
                      fontFamily: 'Playfair Display, serif',
                      background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Link
                      href="/dashboard/questions"
                      className="group w-full px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-3 text-left"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(107, 76, 123, 0.3)',
                        color: '#6B4C7B',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        boxShadow: '0 4px 20px rgba(107, 76, 123, 0.15)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.5)';
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <MessageCircle className="w-5 h-5" style={{strokeWidth: 1.5}} />
                      Mes questions
                    </Link>

                    <Link
                      href="/books"
                      className="group w-full px-6 py-4 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-3 text-left"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(107, 76, 123, 0.3)',
                        color: '#6B4C7B',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        boxShadow: '0 4px 20px rgba(107, 76, 123, 0.15)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.5)';
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <BookOpen className="w-5 h-5" style={{strokeWidth: 1.5}} />
                      Explorer les livres
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AuthGuard>
  );
}