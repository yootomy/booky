import type { Metadata } from "next";
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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${playfair.variable} antialiased`}
				style={{ backgroundColor: '#FAF8F5', minHeight: '100vh' }}
			>
				<Providers>
					<div className="grid grid-rows-[auto_1fr] min-h-svh" style={{ backgroundColor: '#FAF8F5' }}>
						<Header />
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
