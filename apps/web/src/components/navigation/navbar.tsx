/**
 * Navbar - Navigation principale avec menu admin
 * Header responsive avec logo, navigation et actions utilisateur
 */

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Home,
  Search,
  Folder,
  Tag,
  Settings,
  User,
  Menu,
  X,
  Plus,
  Bell,
  Shield,
  LogOut,
  Moon,
  Sun,
  Heart,
  TrendingUp,
  BarChart3,
  Users,
  HelpCircle,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { SearchBox } from '@/components/search/search-box';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  adminOnly?: boolean;
  description?: string;
}

export interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'USER' | 'ADMIN';
  };
  onLogin?: () => void;
  onLogout?: () => void;
  onToggleTheme?: () => void;
  theme?: 'light' | 'dark' | 'system';
  className?: string;
  brandName?: string;
  brandLogo?: string;
  notifications?: number;
}

// Navigation items
const PUBLIC_NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Accueil',
    icon: Home,
    description: 'Page d\'accueil'
  },
  {
    href: '/books',
    label: 'Catalogue',
    icon: BookOpen,
    description: 'Catalogue des livres'
  },
  {
    href: '/categories',
    label: 'Catégories',
    icon: Folder,
    description: 'Explorez par genres'
  },
  {
    href: '/tags',
    label: 'Tags',
    icon: Tag,
    description: 'Tropes et avertissements'
  },
  {
    href: '/lists',
    label: 'Collections',
    icon: List,
    description: 'Collections de Bruna'
  },
  {
    href: '/search',
    label: 'Recherche',
    icon: Search,
    description: 'Recherche globale'
  },
  {
    href: '/lists',
    label: 'Listes',
    icon: List,
    description: 'Listes personnalisées de Bruna'
  }
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    adminOnly: true,
    description: 'Tableau de bord admin'
  },
  {
    href: '/admin/books',
    label: 'Gestion Livres',
    icon: BookOpen,
    adminOnly: true,
    description: 'Gestion des livres'
  },
  {
    href: '/admin/categories',
    label: 'Catégories',
    icon: Folder,
    adminOnly: true,
    description: 'Gestion des catégories'
  },
  {
    href: '/admin/tags',
    label: 'Tags',
    icon: Tag,
    adminOnly: true,
    description: 'Gestion des tags'
  },
  {
    href: '/admin/lists',
    label: 'Listes',
    icon: List,
    adminOnly: true,
    description: 'Gestion des listes personnalisées'
  },
  {
    href: '/admin/users',
    label: 'Utilisateurs',
    icon: Users,
    adminOnly: true,
    description: 'Gestion des utilisateurs'
  },
  {
    href: '/admin/settings',
    label: 'Paramètres',
    icon: Settings,
    adminOnly: true,
    description: 'Configuration du site'
  }
];

// Composant lien de navigation
function NavLink({ 
  item, 
  pathname, 
  onClick 
}: { 
  item: NavItem; 
  pathname: string;
  onClick?: () => void;
}) {
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
  
  return (
    <Link
      href={item.href as any}
      onClick={onClick}
      className="group flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md relative"
      style={{
        backgroundColor: isActive ? 'rgba(139, 21, 56, 0.08)' : 'transparent',
        color: isActive ? '#8B1538' : '#2C1810',
        fontFamily: 'Inter, sans-serif',
        fontWeight: isActive ? 600 : 500,
        border: isActive ? '1px solid rgba(139, 21, 56, 0.2)' : '1px solid transparent'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
          e.currentTarget.style.backdropFilter = 'blur(10px)';
          e.currentTarget.style.border = '1px solid rgba(107, 76, 123, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.border = '1px solid transparent';
        }
      }}
    >
      <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
      <span>{item.label}</span>
      {item.badge && (
        <Badge 
          variant="secondary" 
          className="ml-auto"
          style={{
            backgroundColor: 'rgba(139, 21, 56, 0.1)',
            color: '#8B1538',
            border: '1px solid rgba(139, 21, 56, 0.2)'
          }}
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

// Menu mobile
function MobileMenu({ 
  user, 
  navItems, 
  pathname,
  onLogout 
}: {
  user?: NavbarProps['user'];
  navItems: NavItem[];
  pathname: string;
  onLogout?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Booky
          </SheetTitle>
          <SheetDescription>
            Votre bibliothèque Dark Romance
          </SheetDescription>
        </SheetHeader>
        
        {/* Recherche mobile */}
        <div className="mt-6">
          <SearchBox 
            className="w-full" 
            placeholder="Rechercher..."
            variant="compact"
          />
        </div>
        
        <div className="mt-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onClick={() => setOpen(false)}
            />
          ))}
        </div>

        {user && (
          <>
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <Link
                href={"/profile" as any}
                className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
              
              <button
                onClick={() => {
                  onLogout?.();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Menu utilisateur desktop
function UserMenu({ 
  user, 
  onLogout, 
  onToggleTheme, 
  theme,
  notifications 
}: {
  user: NavbarProps['user'];
  onLogout?: () => void;
  onToggleTheme?: () => void;
  theme?: 'light' | 'dark' | 'system';
  notifications?: number;
}) {
  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Notifications */}
      {notifications && notifications > 0 && (
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {notifications > 99 ? '99+' : notifications}
            </Badge>
          )}
        </Button>
      )}

      {/* Toggle theme */}
      <Button variant="ghost" size="icon" onClick={onToggleTheme}>
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                {user?.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
              {user?.role === 'ADMIN' && (
                <Badge variant="secondary" className="w-fit mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href={"/profile" as any}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={"/dashboard" as any}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href={"/help" as any}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Aide</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={"/settings" as any}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-destructive cursor-pointer"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Se déconnecter</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Navbar({
  user,
  onLogin,
  onLogout,
  onToggleTheme,
  theme = 'system',
  className,
  brandName = 'Booky',
  brandLogo,
  notifications = 0
}: NavbarProps) {
  const pathname = usePathname();

  // Déterminer les éléments de navigation à afficher
  const navItems = [
    ...PUBLIC_NAV_ITEMS,
    ...(user?.role === 'ADMIN' ? ADMIN_NAV_ITEMS : [])
  ];

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full transition-all duration-300',
      className
    )}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 21, 56, 0.1)',
        boxShadow: '0 8px 32px rgba(139, 21, 56, 0.05)'
      }}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Logo et navigation mobile */}
          <div className="flex items-center gap-4">
            <MobileMenu 
              user={user}
              navItems={navItems}
              pathname={pathname}
              onLogout={onLogout}
            />
            
            {/* Logo */}
            <Link href={"/" as any} className="flex items-center gap-2 group transition-all duration-300">
              {brandLogo ? (
                <img src={brandLogo} alt={brandName} className="h-8 w-8" />
              ) : (
                <BookOpen className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" 
                  style={{ color: '#8B1538' }} />
              )}
              <span 
                className="font-bold text-xl transition-all duration-300 group-hover:scale-105"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {brandName}
              </span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
              />
            ))}
            
            {user?.role === 'ADMIN' && (
              <>
                <div className="mx-2 h-4 w-px bg-border" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Administration</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ADMIN_NAV_ITEMS.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href as any} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </nav>

          {/* Barre de recherche */}
          <div className="hidden lg:flex flex-1 justify-center px-4">
            <SearchBox 
              className="max-w-md" 
              placeholder="Rechercher un livre, un auteur..."
            />
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center gap-2">
            {/* Icône recherche pour tablettes */}
            <div className="flex lg:hidden">
              <SearchBox 
                variant="compact"
                placeholder="Rechercher..."
              />
            </div>
            {/* Bouton d'ajout rapide */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="hidden sm:flex">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ajouter</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={"/admin/books/new" as any}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Nouveau livre
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={"/admin/categories/new" as any}>
                      <Folder className="mr-2 h-4 w-4" />
                      Nouvelle catégorie
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={"/admin/tags/new" as any}>
                      <Tag className="mr-2 h-4 w-4" />
                      Nouveau tag
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {user ? (
              <UserMenu
                user={user}
                onLogout={onLogout}
                onToggleTheme={onToggleTheme}
                theme={theme}
                notifications={notifications}
              />
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <button 
                  onClick={onToggleTheme}
                  className="p-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-md"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(107, 76, 123, 0.2)',
                    color: '#6B4C7B'
                  }}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
                <button 
                  onClick={onLogin}
                  className="px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)'
                  }}
                >
                  Se connecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}