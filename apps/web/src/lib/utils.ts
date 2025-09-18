import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// =============================================================================
// 📅 FORMATAGE DES DATES
// =============================================================================

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	
	if (isNaN(dateObj.getTime())) {
		return 'Date invalide';
	}
	
	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	};
	
	return dateObj.toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
}

export function formatRelativeTime(date: string | Date): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffInMs = now.getTime() - dateObj.getTime();
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
	
	if (diffInDays === 0) {
		return 'Aujourd\'hui';
	} else if (diffInDays === 1) {
		return 'Hier';
	} else if (diffInDays < 7) {
		return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
	} else if (diffInDays < 30) {
		const weeks = Math.floor(diffInDays / 7);
		return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
	} else if (diffInDays < 365) {
		const months = Math.floor(diffInDays / 30);
		return `Il y a ${months} mois`;
	} else {
		const years = Math.floor(diffInDays / 365);
		return `Il y a ${years} an${years > 1 ? 's' : ''}`;
	}
}

// =============================================================================
// 💾 FORMATAGE DES TAILLES DE FICHIERS
// =============================================================================

export function formatBytes(bytes: number, decimals: number = 2): string {
	if (bytes === 0) return '0 B';
	
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// =============================================================================
// 🔤 FORMATAGE DES CHAÎNES DE CARACTÈRES
// =============================================================================

export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
	if (str.length <= maxLength) return str;
	return str.slice(0, maxLength - suffix.length) + suffix;
}

export function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
		.replace(/[^a-z0-9 -]/g, '') // Supprimer les caractères spéciaux
		.replace(/\s+/g, '-') // Remplacer les espaces par des tirets
		.replace(/-+/g, '-') // Supprimer les tirets multiples
		.trim();
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// =============================================================================
// 🎨 UTILITAIRES POUR LES COULEURS
// =============================================================================

export function generateAvatarColor(name: string): string {
	const colors = [
		'bg-red-500',
		'bg-blue-500',
		'bg-green-500',
		'bg-yellow-500',
		'bg-purple-500',
		'bg-pink-500',
		'bg-indigo-500',
		'bg-teal-500',
		'bg-orange-500',
		'bg-cyan-500',
	];
	
	const hash = name.split('').reduce((acc, char) => {
		return char.charCodeAt(0) + ((acc << 5) - acc);
	}, 0);
	
	return colors[Math.abs(hash) % colors.length];
}

export function hexToRgba(hex: string, alpha: number = 1): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return `rgba(0, 0, 0, ${alpha})`;
	
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// =============================================================================
// 🔢 UTILITAIRES NUMÉRIQUES
// =============================================================================

export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
	return new Intl.NumberFormat('fr-FR', options).format(num);
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency,
	}).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
	return `${(value * 100).toFixed(decimals)}%`;
}

// =============================================================================
// 🌐 UTILITAIRES WEB
// =============================================================================

export function isValidUrl(string: string): boolean {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

export function getInitials(name: string): string {
	return name
		.split(' ')
		.map(part => part.charAt(0))
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

export function copyToClipboard(text: string): Promise<boolean> {
	if (navigator.clipboard && window.isSecureContext) {
		return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
	} else {
		// Fallback pour les environnements non sécurisés
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'absolute';
		textArea.style.left = '-999999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		
		try {
			document.execCommand('copy');
			document.body.removeChild(textArea);
			return Promise.resolve(true);
		} catch (error) {
			document.body.removeChild(textArea);
			return Promise.resolve(false);
		}
	}
}

// =============================================================================
// 📱 UTILITAIRES DE DÉTECTION
// =============================================================================

export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth < 768;
}

export function isTablet(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function isDesktop(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= 1024;
}

// =============================================================================
// 🎯 UTILITAIRES DE VALIDATION
// =============================================================================

export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function isValidISBN(isbn: string): boolean {
	const cleaned = isbn.replace(/[-\s]/g, '');
	
	if (cleaned.length === 10) {
		// ISBN-10
		let sum = 0;
		for (let i = 0; i < 9; i++) {
			sum += parseInt(cleaned[i]) * (10 - i);
		}
		const checkDigit = cleaned[9] === 'X' ? 10 : parseInt(cleaned[9]);
		return (sum + checkDigit) % 11 === 0;
	} else if (cleaned.length === 13) {
		// ISBN-13
		let sum = 0;
		for (let i = 0; i < 12; i++) {
			sum += parseInt(cleaned[i]) * (i % 2 === 0 ? 1 : 3);
		}
		const checkDigit = (10 - (sum % 10)) % 10;
		return checkDigit === parseInt(cleaned[12]);
	}
	
	return false;
}
