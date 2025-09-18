'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export interface UseRoleCheckReturn {
  isAdmin: boolean;
  isUser: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  canCreateBooks: boolean;
  canEditBooks: boolean;
  canDeleteBooks: boolean;
  canAnswerQuestions: boolean;
  canManageUsers: boolean;
  canAskQuestions: boolean;
  canLikeQuestions: boolean;
  canViewBooks: boolean;
  canExportData: boolean;
}

export const useRoleCheck = (): UseRoleCheckReturn => {
  const { 
    user, 
    isAuthenticated,
    isAdmin: contextIsAdmin,
    hasRole: contextHasRole,
    hasPermission: contextHasPermission 
  } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    return contextHasRole(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const hasPermission = (permission: string): boolean => {
    return contextHasPermission(permission);
  };

  // Permissions spécifiques basées sur les rôles
  const canCreateBooks = hasPermission('create_books');
  const canEditBooks = hasPermission('edit_books');
  const canDeleteBooks = hasPermission('delete_books');
  const canAnswerQuestions = hasPermission('answer_questions');
  const canManageUsers = hasPermission('manage_users');
  const canExportData = hasPermission('export_data');
  
  const canAskQuestions = hasPermission('ask_questions');
  const canLikeQuestions = hasPermission('like_questions');
  const canViewBooks = hasPermission('view_books');

  return {
    isAdmin: contextIsAdmin,
    isUser: hasRole('USER'),
    hasRole,
    hasAnyRole,
    hasPermission,
    canCreateBooks,
    canEditBooks,
    canDeleteBooks,
    canAnswerQuestions,
    canManageUsers,
    canAskQuestions,
    canLikeQuestions,
    canViewBooks,
    canExportData,
  };
};