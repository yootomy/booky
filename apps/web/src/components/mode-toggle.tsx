"use client";

import * as React from "react";
import { Moon, Sun, Heart, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Theme } from "./theme-provider";

export function ModeToggle() {
	const { setTheme, theme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	// Éviter l'erreur d'hydratation en attendant que le composant soit monté côté client
	React.useEffect(() => {
		setMounted(true);
	}, []);

	const getThemeIcon = (currentTheme: string | undefined) => {
		switch (currentTheme) {
			case "light":
				return <Sun className="h-[1.2rem] w-[1.2rem]" />;
			case "dark":
				return <Moon className="h-[1.2rem] w-[1.2rem]" />;
			case "dark-romance":
				return <Heart className="h-[1.2rem] w-[1.2rem]" />;
			default:
				return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
		}
	};

	// Éviter le mismatch d'hydratation en affichant une icône neutre avant le montage
	if (!mounted) {
		return (
			<Button variant="outline" size="icon" className="relative">
				<Monitor className="h-[1.2rem] w-[1.2rem]" />
				<span className="sr-only">Toggle theme</span>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" className="relative">
					{getThemeIcon(theme)}
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2">
					<Sun className="h-4 w-4" />
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2">
					<Moon className="h-4 w-4" />
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark-romance")} className="flex items-center gap-2">
					<Heart className="h-4 w-4" />
					Dark Romance
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2">
					<Monitor className="h-4 w-4" />
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
