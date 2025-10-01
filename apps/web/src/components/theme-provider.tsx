"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type Theme = "light" | "dark" | "system";

export interface ThemeProviderProps extends Omit<React.ComponentProps<typeof NextThemesProvider>, 'themes'> {
  children: React.ReactNode;
  themes?: Theme[];
}

export function ThemeProvider({
  children,
  themes = ["light", "dark", "system"],
  defaultTheme = "light",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      themes={themes}
      defaultTheme={defaultTheme}
      attribute={attribute}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
