'use client';

import React, { useState } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  BookOpen, 
  MessageCircle, 
  User,
  Star,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useAdminStats } from '@/hooks/use-admin-stats';
import Link from 'next/link';

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

function getActivityBadgeVariant(type: string): 'default' | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "book": return 'default';
    case 'question': return 'secondary';
    case 'user': return 'outline';
    case 'rating': return 'default';
    default: return 'secondary';
  }
}

export default function AdminActivity() {
  const { stats, isLoading, refetch } = useAdminStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Générer l'activité récente étendue
  const generateAllActivity = () => {
    const activities: any[] = [];

    // Ajouter les questions récentes
    if (stats?.recent_questions) {
      stats.recent_questions.forEach((question) => {
        activities.push({
          id: question.id,
          type: 'question',
          title: "Nouvelle question posée",
          description: question.question.substring(0, 100) + '... sur ' + question.book_title,
          user: question.user_name,
          time: new Date(question.date_question).toLocaleString('fr-FR'),
          timestamp: new Date(question.date_question),
          status: question.status,
          bookId: question.book_id
        });
      });
    }

    // Ajouter les livres récents
    if (stats?.recent_books) {
      stats.recent_books.forEach((book) => {
        activities.push({
          id: book.id,
          type: 'book',
          title: "Livre ajouté",
          description: book.titre + ' par ' + book.auteur,
          user: 'Admin',
          time: new Date(book.date_creation).toLocaleString('fr-FR'),
          timestamp: new Date(book.date_creation),
          rating: book.note_generale
        });
      });
    }

    // Ajouter des activités d'exemple pour les notes
    if (stats?.recent_books) {
      stats.recent_books.filter(book => book.note_generale && book.note_generale > 0).forEach((book) => {
        activities.push({
          id: 'rating_' + book.id,
          type: 'rating',
          title: 'Note attribuée',
          description: 'Note de ' + book.note_generale + '/10 pour ' + book.titre,
          user: 'Admin',
          time: new Date(book.date_creation).toLocaleString('fr-FR'),
          timestamp: new Date(book.date_creation),
          rating: book.note_generale
        });
      });
    }

    // Trier par timestamp (plus récent en premier)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const allActivities = generateAllActivity();
  
  // Filtrer les activités selon les critères
  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || activity.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const activityTypeStats = {
    book: allActivities.filter(a => a.type === 'book').length,
    question: allActivities.filter(a => a.type === 'question').length,
    rating: allActivities.filter(a => a.type === 'rating').length,
  };

  return (
    <AdminGuard>
      <div className='min-h-screen bg-gradient-to-br from-background to-muted'>
        <div className='container mx-auto py-8 px-4'>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Journal d'Activité
              </h1>
              <p className="text-muted-foreground">
                Toutes les actions et événements de votre bibliothèque
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Actualiser
              </Button>
              
              <Link href="/admin/dashboard">
                <Button variant="outline">
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total activités</p>
                    <p className="text-2xl font-bold">{allActivities.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Livres ajoutés</p>
                    <p className="text-2xl font-bold text-blue-600">{activityTypeStats.book}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Questions</p>
                    <p className="text-2xl font-bold text-orange-600">{activityTypeStats.question}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes données</p>
                    <p className="text-2xl font-bold text-purple-600">{activityTypeStats.rating}</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtres</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans l'activité..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterType === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("all")}
                  >
                    Toutes ({allActivities.length})
                  </Button>
                  <Button
                    variant={filterType === 'book' ? 'default' : "outline"}
                    size="sm"
                    onClick={() => setFilterType("book")}
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Livres ({activityTypeStats.book})
                  </Button>
                  <Button
                    variant={filterType === "question" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("question")}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Questions ({activityTypeStats.question})
                  </Button>
                  <Button
                    variant={filterType === "rating" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("rating")}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Notes ({activityTypeStats.rating})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste d'activités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activités Récentes</span>
                </div>
                <Badge variant="outline">
                  {filteredActivities.length} résultat(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Aucune activité trouvée</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "Essayez de modifier votre recherche" : "Aucune activité récente"}
                    </p>
                  </div>
                ) : (
                  filteredActivities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="relative">
                        <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className={`w-3 h-3 rounded-full mt-2 ${getActivityColor(activity.type)}`}></div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <p className="font-medium">{activity.title}</p>
                                <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                                  {activity.type}
                                </Badge>
                                {activity.status && activity.status === "LEGACY" && (
                                  <Badge variant="outline" className="text-xs">
                                    Question existante
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {activity.time}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {activity.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {activity.user}
                                </Badge>
                                {activity.rating && (
                                  <Badge variant="outline" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    {activity.rating}/10
                                  </Badge>
                                )}
                              </div>
                              
                              {activity.bookId && (
                                <Link href={`/books/${activity.bookId}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Voir
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {index < filteredActivities.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}