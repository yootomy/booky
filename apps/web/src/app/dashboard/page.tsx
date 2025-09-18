"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, MessageCircle, Settings, LogOut, BarChart3, Heart } from "lucide-react";

export default function Dashboard() {
	const { user } = useAuth();
	const { isAdmin } = useRoleCheck();
	const router = useRouter();

	// Rediriger les admins vers leur dashboard dédié
	useEffect(() => {
		if (isAdmin) {
			router.push('/admin/dashboard');
		}
	}, [isAdmin, router]);

	// Hook pour récupérer les mini-stats pour les admins (optionnel)
	const { data: adminStats } = useQuery({
		queryKey: ['admin-mini-stats'],
		queryFn: async () => {
			if (!isAdmin) return null;
			const response = await fetch('/api/proxy/admin/stats', {
				credentials: 'include'
			});
			if (!response.ok) return { books: 0, pendingQuestions: 0, favorites: 0 };
			return response.json();
		},
		enabled: isAdmin,
		retry: false
	});

	// Générer les initiales de l'utilisateur
	const getUserInitials = (user: any) => {
		if (user?.nom_complet) {
			return user.nom_complet
				.split(' ')
				.map((name: string) => name[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		if (user?.username) {
			return user.username.slice(0, 2).toUpperCase();
		}
		return 'U';
	};

	// Ne pas afficher le dashboard si l'utilisateur est admin (redirection en cours)
	if (isAdmin) {
		return null;
	}

	return (
		<AuthGuard requireAuth={true}>
			<div className="min-h-screen" style={{backgroundColor: '#FAF8F5'}}>
				{/* Elegant background with subtle texture */}
				<div
					className="absolute inset-0 opacity-20 mix-blend-multiply"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
					}}
				/>
				<div className="relative z-10">
				<div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
					{/* Hero Section */}
					<div className="mb-16">
						<div className="flex items-center gap-8 mb-2">
							{/* Avatar utilisateur */}
							{user?.avatar ? (
								<img
									src={user.avatar}
									alt="Avatar"
									className="w-20 h-20 rounded-full object-cover shadow-lg"
									style={{
										border: '3px solid rgba(139, 21, 56, 0.2)',
										boxShadow: '0 8px 32px rgba(139, 21, 56, 0.15)'
									}}
								/>
							) : (
								<div
									className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl"
									style={{
										background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
										color: 'white',
										border: '3px solid rgba(255, 255, 255, 0.3)',
										boxShadow: '0 8px 32px rgba(139, 21, 56, 0.25)'
									}}
								>
									{getUserInitials(user)}
								</div>
							)}

							<div>
								<h1
									className="text-4xl font-bold mb-2"
									style={{
										fontFamily: 'Playfair Display, serif',
										background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
										WebkitBackgroundClip: 'text',
										WebkitTextFillColor: 'transparent',
										backgroundClip: 'text'
									}}
								>
									Bienvenue, {user?.nom_complet?.split(' ')[0] || user?.username || 'Lecteur'}
								</h1>
								<p
									className="text-lg"
									style={{
										fontFamily: 'Inter, sans-serif',
										color: '#6B4C7B',
										opacity: 0.8
									}}
								>
									{user?.email}
								</p>
							</div>
						</div>
					</div>

					{/* Cards Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
						{/* Card 1: Explorer les livres */}
						<Card
							className="h-full"
							style={{
								background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
								backdropFilter: 'blur(20px)',
								border: '1px solid rgba(139, 21, 56, 0.1)',
								borderRadius: '24px',
								boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
							}}
						>
							<CardHeader className="p-8 pb-6">
								<div className="flex items-start gap-5">
									<div
										className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
										style={{
											background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
											boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)'
										}}
									>
										<BookOpen size={24} className="text-white" />
									</div>
									<div className="flex-1">
										<CardTitle
											className="text-xl font-bold mb-2"
											style={{
												fontFamily: 'Playfair Display, serif',
												background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
												WebkitBackgroundClip: 'text',
												WebkitTextFillColor: 'transparent',
												backgroundClip: 'text'
											}}
										>
											Explorer les livres
										</CardTitle>
										<p
											className="text-base"
											style={{
												fontFamily: 'Inter, sans-serif',
												color: '#2C1810',
												opacity: 0.7,
												lineHeight: '1.5'
											}}
										>
											Découvrez notre collection de romance dark
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="p-8 pt-0">
								<Link href="/books">
									<button
										className="w-full py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2"
										style={{
											background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
											color: 'white',
											fontFamily: 'Inter, sans-serif',
											fontSize: '1rem',
											fontWeight: 600,
											boxShadow: '0 8px 25px rgba(139, 21, 56, 0.3)',
										}}
									>
										Parcourir le catalogue
									</button>
								</Link>
							</CardContent>
						</Card>

						{/* Card 2: Mes questions */}
						<Card
							className="h-full"
							style={{
								background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
								backdropFilter: 'blur(20px)',
								border: '1px solid rgba(139, 21, 56, 0.1)',
								borderRadius: '24px',
								boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
							}}
						>
							<CardHeader className="p-8 pb-6">
								<div className="flex items-start gap-5">
									<div
										className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
										style={{
											background: 'linear-gradient(135deg, #6B4C7B 0%, #8B1538 100%)',
											boxShadow: '0 8px 25px rgba(107, 76, 123, 0.3)'
										}}
									>
										<MessageCircle size={24} className="text-white" />
									</div>
									<div className="flex-1">
										<CardTitle
											className="text-xl font-bold mb-2"
											style={{
												fontFamily: 'Playfair Display, serif',
												background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
												WebkitBackgroundClip: 'text',
												WebkitTextFillColor: 'transparent',
												backgroundClip: 'text'
											}}
										>
											Mes questions
										</CardTitle>
										<p
											className="text-base"
											style={{
												fontFamily: 'Inter, sans-serif',
												color: '#2C1810',
												opacity: 0.7,
												lineHeight: '1.5'
											}}
										>
											Vos questions et réponses de Bruna
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="p-8 pt-0">
								<Link href="/dashboard/questions">
									<button
										className="w-full py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2"
										style={{
											background: 'linear-gradient(135deg, #6B4C7B 0%, #8B1538 100%)',
											color: 'white',
											fontFamily: 'Inter, sans-serif',
											fontSize: '1rem',
											fontWeight: 600,
											boxShadow: '0 8px 25px rgba(107, 76, 123, 0.3)',
										}}
									>
										Voir mes questions
									</button>
								</Link>
							</CardContent>
						</Card>

						{/* Card 3: Demandes de conseils */}
						<Card
							className="h-full"
							style={{
								background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
								backdropFilter: 'blur(20px)',
								border: '1px solid rgba(139, 21, 56, 0.1)',
								borderRadius: '24px',
								boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
							}}
						>
							<CardHeader className="p-8 pb-6">
								<div className="flex items-start gap-5">
									<div
										className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
										style={{
											background: 'linear-gradient(135deg, #B8860B 0%, #8B1538 100%)',
											boxShadow: '0 8px 25px rgba(184, 134, 11, 0.3)'
										}}
									>
										<Heart size={24} className="text-white" />
									</div>
									<div className="flex-1">
										<CardTitle
											className="text-xl font-bold mb-2"
											style={{
												fontFamily: 'Playfair Display, serif',
												background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
												WebkitBackgroundClip: 'text',
												WebkitTextFillColor: 'transparent',
												backgroundClip: 'text'
											}}
										>
											Demandes de conseils
										</CardTitle>
										<p
											className="text-base"
											style={{
												fontFamily: 'Inter, sans-serif',
												color: '#2C1810',
												opacity: 0.7,
												lineHeight: '1.5'
											}}
										>
											Vos échanges personnalisés avec Bruna
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="p-8 pt-0">
								<Link href="/dashboard/conseils">
									<button
										className="w-full py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2"
										style={{
											background: 'linear-gradient(135deg, #B8860B 0%, #8B1538 100%)',
											color: 'white',
											fontFamily: 'Inter, sans-serif',
											fontSize: '1rem',
											fontWeight: 600,
											boxShadow: '0 8px 25px rgba(184, 134, 11, 0.3)',
										}}
									>
										Voir mes demandes
									</button>
								</Link>
							</CardContent>
						</Card>

						{/* Card 3: Dashboard Admin (visible uniquement pour admin) */}
						{isAdmin && (
							<Card
								className="h-full"
								style={{
									background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
									backdropFilter: 'blur(20px)',
									border: '1px solid rgba(139, 21, 56, 0.1)',
									borderRadius: '24px',
									boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
								}}
							>
								<CardHeader className="p-8 pb-6">
									<div className="flex items-start gap-5">
										<div
											className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
											style={{
												background: 'linear-gradient(135deg, #B8860B 0%, #8B1538 100%)',
												boxShadow: '0 8px 25px rgba(184, 134, 11, 0.3)'
											}}
										>
											<BarChart3 size={24} className="text-white" />
										</div>
										<div className="flex-1">
											<CardTitle
												className="text-xl font-bold mb-2"
												style={{
													fontFamily: 'Playfair Display, serif',
													background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
													WebkitBackgroundClip: 'text',
													WebkitTextFillColor: 'transparent',
													backgroundClip: 'text'
												}}
											>
												Dashboard Admin
											</CardTitle>
											<p
												className="text-base"
												style={{
													fontFamily: 'Inter, sans-serif',
													color: '#2C1810',
													opacity: 0.7,
													lineHeight: '1.5'
												}}
											>
												Statistiques et gestion
											</p>
										</div>
									</div>
								</CardHeader>
								<CardContent className="p-8 pt-0">
									<Link href="/admin/dashboard">
										<button
											className="w-full py-4 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2"
											style={{
												background: 'linear-gradient(135deg, #B8860B 0%, #8B1538 100%)',
												color: 'white',
												fontFamily: 'Inter, sans-serif',
												fontSize: '1rem',
												fontWeight: 600,
												boxShadow: '0 8px 25px rgba(184, 134, 11, 0.3)',
											}}
										>
											Ouvrir le dashboard
										</button>
									</Link>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Mini-stats (optionnel, ADMIN uniquement) */}
					{isAdmin && adminStats && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
							<Card
								className="p-6"
								style={{
									background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.08) 0%, rgba(139, 21, 56, 0.03) 100%)',
									border: '1px solid rgba(139, 21, 56, 0.1)',
									borderRadius: '20px',
									boxShadow: '0 8px 25px rgba(139, 21, 56, 0.1)'
								}}
							>
								<div className="text-center">
									<div
										className="text-3xl font-bold mb-2"
										style={{
											fontFamily: 'Playfair Display, serif',
											color: '#8B1538'
										}}
									>
										{adminStats.books || 0}
									</div>
									<div
										className="text-sm flex items-center justify-center gap-2"
										style={{
											fontFamily: 'Inter, sans-serif',
											color: '#2C1810',
											opacity: 0.8
										}}
									>
										<BookOpen className="w-4 h-4" style={{color: '#8B1538'}} />
										<span>Livres total</span>
									</div>
								</div>
							</Card>

							<Card
								className="p-6"
								style={{
									background: 'linear-gradient(135deg, rgba(107, 76, 123, 0.08) 0%, rgba(107, 76, 123, 0.03) 100%)',
									border: '1px solid rgba(107, 76, 123, 0.1)',
									borderRadius: '20px',
									boxShadow: '0 8px 25px rgba(107, 76, 123, 0.1)'
								}}
							>
								<div className="text-center">
									<div
										className="text-3xl font-bold mb-2"
										style={{
											fontFamily: 'Playfair Display, serif',
											color: '#6B4C7B'
										}}
									>
										{adminStats.pendingQuestions || 0}
									</div>
									<div
										className="text-sm flex items-center justify-center gap-2"
										style={{
											fontFamily: 'Inter, sans-serif',
											color: '#2C1810',
											opacity: 0.8
										}}
									>
										<MessageCircle className="w-4 h-4" style={{color: '#6B4C7B'}} />
										<span>Questions en attente</span>
									</div>
								</div>
							</Card>

							<Card
								className="p-6"
								style={{
									background: 'linear-gradient(135deg, rgba(184, 134, 11, 0.08) 0%, rgba(184, 134, 11, 0.03) 100%)',
									border: '1px solid rgba(184, 134, 11, 0.1)',
									borderRadius: '20px',
									boxShadow: '0 8px 25px rgba(184, 134, 11, 0.1)'
								}}
							>
								<div className="text-center">
									<div
										className="text-3xl font-bold mb-2"
										style={{
											fontFamily: 'Playfair Display, serif',
											color: '#B8860B'
										}}
									>
										{adminStats.favorites || 0}
									</div>
									<div
										className="text-sm flex items-center justify-center gap-2"
										style={{
											fontFamily: 'Inter, sans-serif',
											color: '#2C1810',
											opacity: 0.8
										}}
									>
										<BarChart3 className="w-4 h-4" style={{color: '#B8860B'}} />
										<span>Favoris</span>
									</div>
								</div>
							</Card>
						</div>
					)}

					{/* Section Profil */}
					<Card
						className="overflow-hidden"
						style={{
							background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 248, 245, 0.9) 100%)',
							backdropFilter: 'blur(20px)',
							border: '1px solid rgba(139, 21, 56, 0.1)',
							borderRadius: '24px',
							boxShadow: '0 12px 40px rgba(139, 21, 56, 0.15)'
						}}
					>
						<CardHeader className="p-8 pb-6">
							<CardTitle
								className="text-2xl font-bold flex items-center gap-3"
								style={{
									fontFamily: 'Playfair Display, serif',
									background: 'linear-gradient(135deg, #2C1810 0%, #8B1538 100%)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
									backgroundClip: 'text'
								}}
							>
								<Settings size={28} style={{color: '#6B4C7B'}} />
								Mon profil
							</CardTitle>
						</CardHeader>
						<CardContent className="p-8 pt-0">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-6">
									{/* Avatar dans le profil */}
									{user?.avatar ? (
										<img
											src={user.avatar}
											alt="Avatar"
											className="w-16 h-16 rounded-full object-cover shadow-lg"
											style={{
												border: '3px solid rgba(139, 21, 56, 0.2)',
												boxShadow: '0 8px 32px rgba(139, 21, 56, 0.15)'
											}}
										/>
									) : (
										<div
											className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg"
											style={{
												background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
												color: 'white',
												border: '3px solid rgba(255, 255, 255, 0.3)',
												boxShadow: '0 8px 32px rgba(139, 21, 56, 0.25)'
											}}
										>
											{getUserInitials(user)}
										</div>
									)}

									<div>
										<h3
											className="text-2xl font-bold mb-2"
											style={{
												fontFamily: 'Inter, sans-serif',
												color: '#2C1810'
											}}
										>
											{user?.nom_complet || user?.username || 'Utilisateur'}
										</h3>
										<p
											className="text-base mb-3"
											style={{
												fontFamily: 'Inter, sans-serif',
												color: '#6B4C7B',
												opacity: 0.8
											}}
										>
											{user?.email}
										</p>
										<Badge
											className="px-4 py-2 text-sm font-medium gap-2"
											style={{
												background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.1) 0%, rgba(107, 76, 123, 0.05) 100%)',
												color: '#8B1538',
												border: '1px solid rgba(139, 21, 56, 0.2)',
												borderRadius: '12px',
												fontFamily: 'Inter, sans-serif'
											}}
										>
											<BookOpen className="w-4 h-4" />
											Lecteur
										</Badge>
									</div>
								</div>

								<div className="flex flex-col gap-4 sm:flex-row">
									<Link href="/dashboard/profile">
										<button
											className="px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2"
											style={{
												backgroundColor: 'rgba(255, 255, 255, 0.9)',
												backdropFilter: 'blur(10px)',
												border: '2px solid rgba(107, 76, 123, 0.3)',
												color: '#6B4C7B',
												fontFamily: 'Inter, sans-serif',
												fontSize: '0.95rem',
												fontWeight: 500,
												boxShadow: '0 4px 20px rgba(107, 76, 123, 0.15)',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.backgroundColor = 'rgba(107, 76, 123, 0.05)';
												e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.5)';
												e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
												e.currentTarget.style.borderColor = 'rgba(107, 76, 123, 0.3)';
												e.currentTarget.style.transform = 'none';
											}}
										>
											<Settings className="w-4 h-4" />
											Modifier mon profil
										</button>
									</Link>

									<button
										onClick={() => {
											// Supprimer les cookies d'auth
											document.cookie = 'booky_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
											document.cookie = 'booky_refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
											// Rediriger vers la page de connexion
											window.location.href = '/login';
										}}
										className="px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2"
										style={{
											backgroundColor: 'rgba(220, 38, 127, 0.1)',
											border: '2px solid rgba(220, 38, 127, 0.3)',
											color: '#DC267F',
											fontFamily: 'Inter, sans-serif',
											fontSize: '0.95rem',
											fontWeight: 500,
											boxShadow: '0 4px 20px rgba(220, 38, 127, 0.15)',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = 'rgba(220, 38, 127, 0.15)';
											e.currentTarget.style.borderColor = 'rgba(220, 38, 127, 0.5)';
											e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = 'rgba(220, 38, 127, 0.1)';
											e.currentTarget.style.borderColor = 'rgba(220, 38, 127, 0.3)';
											e.currentTarget.style.transform = 'none';
										}}
									>
										<LogOut className="w-4 h-4" />
										Se déconnecter
									</button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
				</div>
			</div>
		</AuthGuard>
	);
}