"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type Theme = "light" | "dark" | "dark-romance" | "system";

export interface ThemeProviderProps extends Omit<React.ComponentProps<typeof NextThemesProvider>, 'themes'> {
  children: React.ReactNode;
  themes?: Theme[];
}

export function ThemeProvider({
  children,
  themes = ["light", "dark", "dark-romance", "system"],
  defaultTheme = "system",
  attribute = "class",
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      themes={themes}
      defaultTheme={defaultTheme}
      attribute={attribute}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
