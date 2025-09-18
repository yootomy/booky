"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/utils/orpc";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { FiltersProvider } from "@/providers/filters-provider";
import { Toaster } from "./ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
  syncFiltersWithUrl?: boolean;
}

export default function Providers({ children, syncFiltersWithUrl = false }: ProvidersProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<AuthProvider>
				<QueryClientProvider client={queryClient}>
					<FiltersProvider syncWithUrl={syncFiltersWithUrl}>
						{children}
						<ReactQueryDevtools />
					</FiltersProvider>
				</QueryClientProvider>
			</AuthProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
