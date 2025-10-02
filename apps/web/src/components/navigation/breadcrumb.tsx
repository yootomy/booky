/**
 * Breadcrumb - Fil d'Ariane pour la navigation
 * Navigation hiérarchique avec support des icônes et actions
 */

"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { 
  ChevronRight, 
  Home, 
  BookOpen, 
  Folder, 
  Tag, 
  Settings,
  Search,
  User,
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  href?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  badge?: string | number;
  children?: BreadcrumbItem[];
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  className?: string;
  showHome?: boolean;
  autoGenerate?: boolean;
}

// Mapping des paths vers des configurations de breadcrumb
const PATH_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  '': { icon: Home, label: 'Accueil' },
  'books': { icon: BookOpen, label: 'Catalogue' },
  'categories': { icon: Folder, label: 'Catégories' },
  'tags': { icon: Tag, label: 'Tags' },
  'search': { icon: Search, label: 'Recherche' },
  'profile': { icon: User, label: 'Profil' },
  'admin': { icon: Shield, label: 'Administration' },
  'settings': { icon: Settings, label: 'Paramètres' },
  'new': { icon: MoreHorizontal, label: 'Nouveau' },
  'edit': { icon: MoreHorizontal, label: 'Modifier' }
};

// Génération automatique des breadcrumbs depuis l'URL
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  let currentPath = ';
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += "/${segment}';
    
    const config = PATH_CONFIG[segment];
    const isLast = i === segments.length - 1;
    
    // Traitement spécial pour les IDs (UUID ou slugs)
    const isId = /^[a-f\d-]{36}$/i.test(segment) || (!config && segment.length > 10);
    
    if (isId) {
      // Pour les IDs, on essaie de récupérer le contexte
      const parentSegment = i > 0 ? segments[i - 1] : ';
      let label = 'Détails';
      
      if (parentSegment === 'books') label = 'Livre';
      else if (parentSegment === 'categories') label = 'Catégorie';
      else if (parentSegment === 'tags') label = 'Tag';
      else if (parentSegment === 'admin') label = 'Élément';
      
      items.push({
        href: isLast ? undefined : currentPath,
        label,
        icon: MoreHorizontal,
        isActive: isLast
      });
    } else {
      items.push({
        href: isLast ? undefined : currentPath,
        label: config?.label || segment.charAt(0).toUpperCase() + segment.slice(1),
        icon: config?.icon || MoreHorizontal,
        isActive: isLast
      });
    }
  }
  
  return items;
}

// Composant item de breadcrumb
function BreadcrumbItemComponent({ 
  item, 
  isLast, 
  separator 
}: { 
  item: BreadcrumbItem; 
  isLast: boolean;
  separator: React.ReactNode;
}) {
  const content = (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
      item.href && !isLast && 'hover:bg-muted cursor-pointer',
      item.isActive && 'bg-primary/10 text-primary font-medium'
    )}>
      {item.icon && (
        <item.icon className={cn(
          'h-4 w-4',
          item.isActive ? "text-primary" : "text-muted-foreground"
        )} />
      )}
      <span className={cn(
        "text-sm truncate",
        isLast && 'font-medium',
        !item.href && 'text-muted-foreground'
      )}>
        {item.label}
      </span>
      {item.badge && (
        <Badge variant="secondary" className="ml-1 text-xs">
          {item.badge}
        </Badge>
      )}
    </div>
  );

  return (
    <div className="flex items-center">
      {item.href && !isLast ? (
        <Link href={item.href as any}>
          {content}
        </Link>
      ) : (
        content
      )}
      
      {!isLast && (
        <div className="mx-2 text-muted-foreground">
          {separator}
        </div>
      )}
    </div>
  );
}

// Composant pour les items collapsés
function CollapsedItems({ items }: { items: BreadcrumbItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item, index) => (
          <DropdownMenuItem key={index} asChild>
            {item.href ? (
              <Link href={item.href as any} className="flex items-center gap-2">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-2 cursor-default">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Breadcrumb({
  items: providedItems,
  separator = <ChevronRight className="h-4 w-4" />,
  maxItems = 4,
  className,
  showHome = true,
  autoGenerate = true
}: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Générer les items automatiquement ou utiliser ceux fournis
  let breadcrumbItems: BreadcrumbItem[] = [];
  
  if (providedItems) {
    breadcrumbItems = providedItems;
  } else if (autoGenerate) {
    breadcrumbItems = generateBreadcrumbsFromPath(pathname);
  }
  
  // Ajouter l'accueil au début si demandé et pas déjà présent
  if (showHome && breadcrumbItems.length > 0 && breadcrumbItems[0].label !== 'Accueil') {
    breadcrumbItems.unshift({
      href: '/',
      label: 'Accueil',
      icon: Home
    });
  }
  
  if (breadcrumbItems.length === 0) return null;
  
  // Gérer la collapse si trop d'items
  let displayItems = breadcrumbItems;
  let collapsedItems: BreadcrumbItem[] = [];
  
  if (breadcrumbItems.length > maxItems) {
    // Garder le premier, les derniers, et collaper le milieu
    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-2);
    collapsedItems = breadcrumbItems.slice(1, -2);
    
    displayItems = [firstItem, ...lastItems];
  }
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 overflow-hidden", className)}
    >
      <div className="flex items-center min-w-0">
        {displayItems.map((item, index) => {
          // Insérer les items collapsés après le premier item
          if (index === 1 && collapsedItems.length > 0) {
            return (
              <div key="collapsed" className="flex items-center">
                <CollapsedItems items={collapsedItems} />
                <div className="mx-2 text-muted-foreground">
                  {separator}
                </div>
                <BreadcrumbItemComponent
                  item={item}
                  isLast={index === displayItems.length - 1}
                  separator={separator}
                />
              </div>
            );
          }
          
          return (
            <BreadcrumbItemComponent
              key={index}
              item={item}
              isLast={index === displayItems.length - 1}
              separator={separator}
            />
          );
        })}
      </div>
    </nav>
  );
}

// Hook pour utiliser les breadcrumbs avec des données dynamiques
export function useBreadcrumb() {
  const pathname = usePathname();
  
  const setBreadcrumb = (items: BreadcrumbItem[]) => {
    // Cette fonction peut être utilisée pour définir des breadcrumbs personnalisés
    // dans un contexte global si nécessaire
    return items;
  };
  
  const addBreadcrumbItem = (item: BreadcrumbItem) => {
    // Ajouter un item aux breadcrumbs existants
    return item;
  };
  
  return {
    pathname,
    setBreadcrumb,
    addBreadcrumbItem
  };
}

// Variantes de breadcrumb spécialisées
export function AdminBreadcrumb({ className }: { className?: string }) {
  return (
    <Breadcrumb
      className={className}
      autoGenerate
      showHome
      maxItems={5}
      separator={<ChevronRight className="h-3 w-3" />}
    />
  );
}

export function PublicBreadcrumb({ className }: { className?: string }) {
  return (
    <Breadcrumb
      className={className}
      autoGenerate
      showHome
      maxItems={4}
      separator={<ChevronRight className="h-4 w-4" />}
    />
  );
}

// Composant breadcrumb compact
export function CompactBreadcrumb({ 
  items, 
  className 
}: { 
  items?: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <Breadcrumb
      items={items}
      className={cn("text-sm", className)}
      maxItems={3}
      separator={<ChevronRight className="h-3 w-3" />}
      showHome={false}
    />
  );
}