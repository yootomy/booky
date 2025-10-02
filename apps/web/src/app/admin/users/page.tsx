'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter,
  User,
  Mail,
  Calendar,
  BookOpen,
  MessageCircle,
  Heart,
  Shield,
  UserCheck,
  Clock
} from 'lucide-react';
import { usersApi } from '@/utils/orpc';

interface User {
  id: string;
  email: string;
  nom_complet: string | null;
  username: string | null;
  avatar: string | null;
  role: 'ADMIN' | 'USER';
  emailVerified: boolean;
  derniere_connexion: string | null;
  date_creation: string;
  stats: {
    books_count: number;
    questions_count: number;
    likes_count: number;
  };
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const limit = 20;

  // Récupérer les utilisateurs
  const usersQuery = useQuery({
    queryKey: ['users', page, searchQuery, roleFilter],
    queryFn: async () => {
      const filters: any = { page, limit };
      if (searchQuery) filters.search = searchQuery;
      if (roleFilter) filters.role = roleFilter;
      
      const response = await usersApi.getAll(filters);
      return response;
    },
  });

  const users = usersQuery.data?.data || [];
  const pagination = usersQuery.data?.pagination;

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
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "USER":
        return <Badge className="bg-blue-100 text-blue-800"><User className="w-3 h-3 mr-1" />Utilisateur</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getInitials = (nom: string | null, email: string) => {
    if (nom) {
      return nom.split(" ").map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset à la première page lors d'une recherche
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Gestion des Utilisateurs
              </h1>
              <p className="text-muted-foreground">
                Visualisez et gérez les utilisateurs de la plateforme
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="px-3 py-1">
                <Users className="w-4 h-4 mr-1" />
                {pagination?.totalCount || 0} utilisateurs
              </Badge>
            </div>
          </div>

          {/* Filtres et recherche */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, email ou username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter || "all"} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="USER">Utilisateurs</SelectItem>
                    <SelectItem value="ADMIN">Administrateurs</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{pagination?.totalCount || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-red-600">
                      {users.filter((u: User) => u.role === "ADMIN").length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {users.filter((u: User) => u.role === "USER").length}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email vérifié</p>
                    <p className="text-2xl font-bold text-green-600">
                      {users.filter((u: User) => u.emailVerified).length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Utilisateurs</CardTitle>
              <CardDescription>
                Informations détaillées sur tous les utilisateurs de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersQuery.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-500 mt-2">Chargement des utilisateurs...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun utilisateur trouvé
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || roleFilter 
                      ? "Essayez de modifier vos filtres de recherche" : "Il n\'y a pas encore d\'utilisateurs dans le système'
                    }
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statistiques</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead>Inscription</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar || ""} alt={user.nom_complet || user.email} />
                                <AvatarFallback>
                                  {getInitials(user.nom_complet, user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.nom_complet || user.username || "Sans nom"}</p>
                                {user.username && user.nom_complet && (
                                  <p className="text-sm text-gray-500">@{user.username}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{user.email}</span>
                              {user.emailVerified && (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.role)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {user.stats.books_count}
                              </span>
                              <span className="flex items-center">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {user.stats.questions_count}
                              </span>
                              <span className="flex items-center">
                                <Heart className="h-4 w-4 mr-1" />
                                {user.stats.likes_count}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.derniere_connexion ? (
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(user.derniere_connexion)}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Jamais</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(user.date_creation)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Page {pagination.page} sur {pagination.totalPages} ({pagination.totalCount} utilisateurs)
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page <= 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}