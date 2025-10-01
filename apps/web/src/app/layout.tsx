import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../index.css";
import "../styles/dark-romance.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const playfair = Playfair_Display({
	variable: "--font-playfair",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "booky",
	description: "booky",
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* Meta tags pour Safari theme-color */}
				<meta name="theme-color" content="#0A0A0B" />
				<meta name="color-scheme" content="light dark" />

				<script
					dangerouslySetInnerHTML={{
						__html: `
						(function(){
							var wanted = "width=device-width, initial-scale=1, viewport-fit=cover";
							function fixViewport() {
								var m = document.querySelector('meta[name=viewport]');
								if (!m) {
									m = document.createElement('meta');
									m.name='viewport';
									document.head.appendChild(m);
								}
								if (m.content !== wanted) m.content = wanted;
							}
							fixViewport();
							if (typeof window !== 'undefined') {
								window.addEventListener('load', fixViewport);
								setTimeout(fixViewport, 1000);
							}
						})();
						',
					}}
				/>
			</head>
			<body
				className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground' }
			>
				<Providers>
					<div className="min-h-svh bg-background transition-colors duration-300 w-full overflow-x-hidden">
						<Header />
						<div className="w-full overflow-x-hidden pt-16 sm:pt-20">
							{children}
						</div>
					</div>
				</Providers>
			</body>
		</html>
	);
}
