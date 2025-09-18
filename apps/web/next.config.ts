import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	images: {
		remotePatterns: [
			// Domaines pour les images de couverture de livres
			{
				protocol: 'https',
				hostname: 'example.com',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
			},
			// Google Books API
			{
				protocol: 'https',
				hostname: 'books.google.com',
			},
			{
				protocol: 'http',
				hostname: 'books.google.com',
			},
			{
				protocol: 'https',
				hostname: 'books.google.ch',
			},
			{
				protocol: 'http',
				hostname: 'books.google.ch',
			},
			// Google User Content (images)
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'lh4.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'lh5.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'lh6.googleusercontent.com',
			},
			// Open Library
			{
				protocol: 'https',
				hostname: 'covers.openlibrary.org',
			},
			// Amazon
			{
				protocol: 'https',
				hostname: 'images-na.ssl-images-amazon.com',
			},
			{
				protocol: 'https',
				hostname: 'm.media-amazon.com',
			},
			// Goodreads
			{
				protocol: 'https',
				hostname: 'i.gr-assets.com',
			},
			// Autres CDN d'images courantes
			{
				protocol: 'https',
				hostname: 'cdn.*.com',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			}
		],
		// Format d'images acceptés
		formats: ['image/webp', 'image/avif'],
		// Taille maximale
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
};

export default nextConfig;
