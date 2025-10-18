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
import { apiClient } from "@/lib/api-client";
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
      const response = await apiClient.get("/api/profile");

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch profile");
      }

      return response.data;
    },
    enabled: !!user
  });

  const profile: UserProfile = profileData;

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
      const response = await apiClient.put("/api/profile", data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      // Rafraîchir les données utilisateur
      window.location.reload();
    },
    onError: (error: any) => {
      // Gérer les erreurs spécifiques
      const errorMessage = error.message || "Erreur lors de la mise à jour";

      if (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('nom d\'utilisateur')) {
        toast.error("Ce nom d'utilisateur existe déjà");
      } else if (errorMessage.toLowerCase().includes('email')) {
        toast.error("Cet email existe déjà");
      } else {
        toast.error(errorMessage);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Email valide requis");
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: "2-digit"
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: "Administrateur", variant: "destructive" as const },
      MODERATOR: { label: "Modérateur", variant: "secondary" as const },
      USER: { label: "Utilisateur", variant: "outline" as const }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.USER;
    return (
      <Badge variant={config.variant} className="text-xs">
        <Shield className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background transition-colors duration-300">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <div className="space-y-6">
              <Card className="animate-pulse bg-card border">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (isError || !profile) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-background transition-colors duration-300">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <Card className="text-center py-12 bg-card border">
              <CardContent>
                <User className="w-16 h-16 text-destructive/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Erreur de chargement
                </h3>
                <p className="text-muted-foreground mb-4">
                  Impossible de charger votre profil.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          
          {/* Header */}
          <motion.div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button
              variant="outline"
              onClick={() => window.location.href="/dashboard"}
              className="bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 text-foreground transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                <User className="w-6 h-6 text-primary" />
                Mon Profil
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                Gérez vos informations personnelles
              </p>
            </div>

            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className={isEditing ? "bg-card/50 backdrop-blur border-border/50 hover:bg-card/70 text-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}
            >
              {isEditing ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Annuler
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier
                </>
              )}
            </Button>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Informations personnelles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-card/90 backdrop-blur border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                    <User className="w-5 h-5 text-primary" />
                    Informations personnelles
                  </CardTitle>
                  <CardDescription className="text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label htmlFor="username">Nom d"utilisateur</Label>
                          <Input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              username: e.target.value
                            }))}
                            placeholder="Votre nom d'utilisateur"
                            className="mt-1.5"
                          />
                        </div>
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
                          className="mt-1.5"
                        />
                      </div>

                      <Separator className="my-4" />

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateProfileMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="bg-card/50 border-border/50 hover:bg-card/70 text-foreground"
                        >
                          Annuler
                        </Button>
                      </div>
                    </motion.form>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom complet</Label>
                          <p className="text-base text-foreground font-medium">
                            {profile.nom_complet || "Non renseigné"}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom d"utilisateur</Label>
                          <p className="text-base text-foreground font-medium">
                            {profile.username || "Non renseigné"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <p className="text-base text-foreground font-medium">{profile.email}</p>
                          {profile.emailVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Vérifié
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Membre depuis</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="text-base text-foreground font-medium">
                            {new Date(profile.date_creation).toLocaleDateString("fr-FR", {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Mon activité */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-card/90 backdrop-blur border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground" style={{ fontFamily: "Playfair Display, serif" }}>
                    <Award className="w-5 h-5 text-primary" />
                    Mon activité
                  </CardTitle>
                  <CardDescription className="text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                    Vos interactions sur la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/30 transition-all duration-200">
                      <MessageCircle className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
                      <span className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                        {profile.stats.questions_count}
                      </span>
                      <p className="text-sm font-medium text-foreground text-center">Questions posées</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-950/30 transition-all duration-200">
                      <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400 mb-3" />
                      <span className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                        {profile.stats.likes_given_count}
                      </span>
                      <p className="text-sm font-medium text-foreground text-center">Likes donnés</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-all duration-200">
                      <Star className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-3" />
                      <span className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
                        {profile.stats.favorites_count}
                      </span>
                      <p className="text-sm font-medium text-foreground text-center">Favoris</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}