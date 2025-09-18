'use client';

import React, { useState } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  Users,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Server,
  Heart,
  Search,
  BookOpen,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // States for featured book management
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [featuredBookLoading, setFeaturedBookLoading] = useState(false);
  
  // États pour les différentes configurations
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Booky',
    siteDescription: 'Votre bibliothèque personnelle',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newBookNotifications: true,
    questionNotifications: true,
    weeklyReports: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '24',
    maxLoginAttempts: '5',
    requireStrongPasswords: true,
    enableTwoFactor: false,
  });

  // Queries for featured book management
  const { data: currentFeaturedBook, isLoading: featuredBookQueryLoading } = useQuery({
    queryKey: ['featured-book'],
    queryFn: async () => {
      const response = await fetch('/api/proxy/featured-book');
      if (!response.ok) throw new Error('Failed to fetch featured book');
      return response.json();
    }
  });

  const { data: searchResults } = useQuery({
    queryKey: ['book-search', bookSearchQuery],
    queryFn: async () => {
      if (!bookSearchQuery || bookSearchQuery.length < 2) return { data: [] };
      const response = await fetch(`/api/proxy/books?search=${encodeURIComponent(bookSearchQuery)}&limit=10`);
      if (!response.ok) throw new Error('Failed to search books');
      return response.json();
    },
    enabled: bookSearchQuery.length >= 2
  });

  // Functions for featured book management
  const setFeaturedBook = async (bookId: string) => {
    try {
      setFeaturedBookLoading(true);
      const response = await fetch('/api/proxy/featured-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set featured book');
      }

      toast({
        title: "Livre coup de cœur défini",
        description: "Le livre coup de cœur a été mis à jour avec succès",
      });

      // Refresh the featured book data
      queryClient.invalidateQueries({ queryKey: ['featured-book'] });
      queryClient.invalidateQueries({ queryKey: ['spotlight-book'] });
      setShowBookSearch(false);
      setBookSearchQuery('');

    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de définir le livre coup de cœur",
        variant: "destructive",
      });
    } finally {
      setFeaturedBookLoading(false);
    }
  };

  const clearFeaturedBook = async () => {
    try {
      setFeaturedBookLoading(true);
      const response = await fetch('/api/proxy/featured-book', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear featured book');
      }

      toast({
        title: "Livre coup de cœur réinitialisé",
        description: "Le système affichera maintenant le livre le mieux noté",
      });

      // Refresh the featured book data
      queryClient.invalidateQueries({ queryKey: ['featured-book'] });
      queryClient.invalidateQueries({ queryKey: ['spotlight-book'] });

    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de réinitialiser le livre coup de cœur",
        variant: "destructive",
      });
    } finally {
      setFeaturedBookLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Tous les paramètres ont été mis à jour avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Paramètres du Site
              </h1>
              <p className="text-muted-foreground">
                Configurez les paramètres généraux de votre application Booky
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
              
              <Link href="/admin/dashboard">
                <Button variant="outline">
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Livre Coup de Cœur */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Livre Coup de Cœur du Moment</span>
                </CardTitle>
                <CardDescription>
                  Choisissez le livre qui sera mis en avant sur la page d'accueil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Featured Book */}
                {featuredBookQueryLoading ? (
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted animate-pulse">
                    <div className="w-16 h-20 bg-gray-300 rounded"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : currentFeaturedBook?.data ? (
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
                    <div className="w-16 h-20 relative rounded overflow-hidden flex-shrink-0">
                      {currentFeaturedBook.data.image_couverture ? (
                        <img
                          src={currentFeaturedBook.data.image_couverture}
                          alt={currentFeaturedBook.data.titre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold text-gray-900">{currentFeaturedBook.data.titre}</h4>
                      <p className="text-sm text-gray-600">par {currentFeaturedBook.data.auteur}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          ⭐ {currentFeaturedBook.data.note_generale}/10
                        </Badge>
                        {currentFeaturedBook.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Par défaut (livre le mieux noté)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBookSearch(true)}
                        disabled={featuredBookLoading}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Changer
                      </Button>
                      {!currentFeaturedBook.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFeaturedBook}
                          disabled={featuredBookLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Réinitialiser
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Heart className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Aucun livre coup de cœur défini</p>
                    <Button onClick={() => setShowBookSearch(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Choisir un livre
                    </Button>
                  </div>
                )}

                {/* Book Search Interface */}
                {showBookSearch && (
                  <div className="space-y-4 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Rechercher un livre</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowBookSearch(false);
                          setBookSearchQuery('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tapez le titre ou l'auteur du livre..."
                        value={bookSearchQuery}
                        onChange={(e) => setBookSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Search Results */}
                    {searchResults?.data && searchResults.data.length > 0 && (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {searchResults.data.map((book: any) => (
                          <div
                            key={book.id}
                            className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-red-300 cursor-pointer transition-colors"
                            onClick={() => setFeaturedBook(book.id)}
                          >
                            <div className="w-12 h-16 relative rounded overflow-hidden flex-shrink-0">
                              {book.image_couverture ? (
                                <img
                                  src={book.image_couverture}
                                  alt={book.titre}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <h5 className="font-medium text-sm">{book.titre}</h5>
                              <p className="text-xs text-gray-600">par {book.auteur}</p>
                              <Badge variant="outline" className="text-xs">
                                ⭐ {book.note_generale}/10
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {bookSearchQuery.length >= 2 && (!searchResults?.data || searchResults.data.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun livre trouvé pour "{bookSearchQuery}"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Paramètres généraux */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Paramètres Généraux</span>
                </CardTitle>
                <CardDescription>
                  Configuration de base du site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nom du site</Label>
                  <Input
                    id="siteName"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings(prev => ({...prev, siteName: e.target.value}))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Description du site</Label>
                  <Textarea
                    id="siteDescription"
                    value={siteSettings.siteDescription}
                    onChange={(e) => setSiteSettings(prev => ({...prev, siteDescription: e.target.value}))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Désactiver temporairement le site
                    </p>
                  </div>
                  <Switch
                    checked={siteSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSiteSettings(prev => ({...prev, maintenanceMode: checked}))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Paramètres utilisateurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Gestion des Utilisateurs</span>
                </CardTitle>
                <CardDescription>
                  Contrôle des inscriptions et permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inscriptions ouvertes</Label>
                    <p className="text-sm text-muted-foreground">
                      Autoriser les nouvelles inscriptions
                    </p>
                  </div>
                  <Switch
                    checked={siteSettings.allowRegistrations}
                    onCheckedChange={(checked) => setSiteSettings(prev => ({...prev, allowRegistrations: checked}))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Vérification email</Label>
                    <p className="text-sm text-muted-foreground">
                      Exiger la vérification par email
                    </p>
                  </div>
                  <Switch
                    checked={siteSettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSiteSettings(prev => ({...prev, requireEmailVerification: checked}))}
                  />
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">2</div>
                    <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">1</div>
                    <p className="text-sm text-muted-foreground">Administrateurs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paramètres de sécurité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Sécurité</span>
                </CardTitle>
                <CardDescription>
                  Configuration de la sécurité et authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de session (heures)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({...prev, sessionTimeout: e.target.value}))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Tentatives de connexion max</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({...prev, maxLoginAttempts: e.target.value}))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mots de passe forts</Label>
                    <p className="text-sm text-muted-foreground">
                      Exiger des mots de passe complexes
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireStrongPasswords}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, requireStrongPasswords: checked}))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Authentification à 2 facteurs</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer 2FA pour tous les utilisateurs
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableTwoFactor}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({...prev, enableTwoFactor: checked}))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>
                  Gestion des notifications et alertes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer les notifications par email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, emailNotifications: checked}))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nouveaux livres</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifier l'ajout de nouveaux livres
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.newBookNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, newBookNotifications: checked}))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Questions en attente</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifier les nouvelles questions
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.questionNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, questionNotifications: checked}))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rapports hebdomadaires</Label>
                    <p className="text-sm text-muted-foreground">
                      Envoyer un résumé chaque semaine
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, weeklyReports: checked}))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations système */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Informations Système</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">Version</Badge>
                  <p className="font-mono text-sm">v1.0.0</p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">Base de données</Badge>
                  <p className="font-mono text-sm">PostgreSQL</p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">Environnement</Badge>
                  <p className="font-mono text-sm">Développement</p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">Uptime</Badge>
                  <p className="font-mono text-sm">2h 15m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}