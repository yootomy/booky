'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-105 border border-transparent hover:border-accent/20 hover:bg-accent/10"
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-foreground transition-all duration-300" />
      ) : (
        <Sun className="h-4 w-4 text-foreground transition-all duration-300" />
      )}
      <span className="sr-only">Basculer le thème</span>
    </Button>
  );
}