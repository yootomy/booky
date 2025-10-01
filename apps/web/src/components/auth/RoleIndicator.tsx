'use client';

import React from 'react';
import { Shield, User, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export interface RoleIndicatorProps {
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  showIcon?: boolean;
  className?: string;
}

export const RoleIndicator: React.FC<RoleIndicatorProps> = ({
  role,
  size = 'md',
  variant = 'default',
  showIcon = true,
  className,
}) => {
  const { user } = useAuth();
  const displayRole = role || user?.role;

  if (!displayRole) {
    return null;
  }

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Administrateur',
          icon: Crown,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
      case 'USER':
        return {
          label: 'Utilisateur',
          icon: User,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        };
      default:
        return {
          label: 'Inconnu',
          icon: Shield,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        };
    }
  };

  const config = getRoleConfig(displayRole);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant={variant as any}
      className={`${config.color} ${className || ''}'}
    >
      {showIcon && (
        <Icon className={'${sizeClasses[size]} mr-1'} />
      )}
      {config.label}
    </Badge>
  );
};