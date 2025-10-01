'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard,
  LogIn, 
  UserPlus,
  Crown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { LogoutButton } from './LogoutButton';
import { useRoleCheck } from '@/hooks/useRoleCheck';

export const UserMenu: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isAdmin } = useRoleCheck();

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-8 bg-muted rounded-full"></div>
      </div>
    );
  }

  // Si non connecté, afficher les boutons de connexion/inscription
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">
            <LogIn className="h-4 w-4 mr-2" />
            Connexion
          </Link>
        </Button>
        
        <Button variant="outline" size="sm" asChild>
          <Link href="/register">
            <UserPlus className="h-4 w-4 mr-2" />
            Inscription
          </Link>
        </Button>
      </div>
    );
  }

  // Menu pour utilisateur connecté
  const userInitials = user.nom_complet
    ? user.nom_complet.split(' ').map(n => n[0]).join('').substring(0, 2)
    : user.email.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center space-x-2">
      {/* Menu utilisateur */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.nom_complet || user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56 z-[150]" align="end" forceMount>
          {/* Info utilisateur */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.nom_complet || user.username || 'Utilisateur'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Actions communes */}
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          {/* Actions admin uniquement */}
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard">
                  <Crown className="mr-2 h-4 w-4" />
                  <span>Dashboard Admin</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Déconnexion */}
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            onSelect={(e) => e.preventDefault()}
          >
            <LogoutButton 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start p-0 h-auto text-red-600 hover:text-red-600 hover:bg-transparent"
              showConfirmation={false}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};