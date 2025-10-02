'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeColorUpdater() {
  const { theme, systemTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Couleurs exactes de votre thème (comme votre navbar)
  const COLOR_DARK = '#0A0A0B';   // Votre vraie couleur sombre
  const COLOR_LIGHT = '#ffffff';  // Blanc pur

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Trouver ou créer la balise meta theme-color
    let meta = document.querySelector<HTMLMetaElement>("meta[name="theme-color"]");

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }

    // Déterminer le thème actuel
    const currentTheme = (theme === 'system' ? systemTheme : resolvedTheme) ?? 'light';

    // Mettre à jour la couleur Safari
    meta.content = currentTheme === 'dark' ? COLOR_DARK : COLOR_LIGHT;

    // Renforcer le fond pour éviter l'effet 'gris' translucide de Safari
    const html = document.documentElement;
    const body = document.body;

    if (currentTheme === "dark") {
      html.style.backgroundColor = COLOR_DARK;
      body.style.backgroundColor = COLOR_DARK;
    } else {
      html.style.backgroundColor = COLOR_LIGHT;
      body.style.backgroundColor = COLOR_LIGHT;
    }

    console.log("Safari theme-color updated (real-time):", currentTheme, meta.content);
  }, [theme, systemTheme, resolvedTheme, mounted]);

  return null;
}