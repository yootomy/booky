"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/utils/orpc";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { MobileProvider } from "@/contexts/MobileContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { FiltersProvider } from "@/providers/filters-provider";
import { Toaster } from "./ui/sonner";
import ThemeColorUpdater from "./theme-color-updater";

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
			{/* Composant qui synchronise Safari avec le thème */}
			<ThemeColorUpdater />

			<AuthProvider>
				<MobileProvider>
					<ViewModeProvider>
						<QueryClientProvider client={queryClient}>
							<FiltersProvider syncWithUrl={syncFiltersWithUrl}>
								{children}
								<ReactQueryDevtools />
							</FiltersProvider>
						</QueryClientProvider>
					</ViewModeProvider>
				</MobileProvider>
			</AuthProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
