import { NextRequest } from "next/server";
import { randomBytes, createHash } from "crypto";

/**
 * Protection CSRF pour les routes d'authentification
 * Utilise le pattern Double Submit Cookie
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "booky_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Générer un token CSRF sécurisé
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Créer un hash du token CSRF pour le stockage sécurisé
 */
export function hashCSRFToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Vérifier la validité d'un token CSRF
 */
export function verifyCSRFToken(request: NextRequest): boolean {
  try {
    // Récupérer le token depuis le header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    
    // Récupérer le token depuis le cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    
    if (!headerToken || !cookieToken) {
      return false;
    }

    // Vérifier que les tokens correspondent (Double Submit Cookie Pattern)
    return headerToken === cookieToken;

  } catch (error) {
    console.error("CSRF token verification error:", error);
    return false;
  }
}

/**
 * Créer le cookie CSRF sécurisé
 */
export function createCSRFCookie(token: string): string {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  
  return [
    `${CSRF_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly=false', // Le frontend doit pouvoir lire ce cookie
    `Expires=${expires.toUTCString()}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
    'SameSite=Strict'
  ].filter(Boolean).join('; ');
}

/**
 * Supprimer le cookie CSRF
 */
export function clearCSRFCookie(): string {
  return [
    `${CSRF_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly=false',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'SameSite=Strict'
  ].join('; ');
}

/**
 * Middleware pour vérifier la protection CSRF sur les routes sensibles
 */
export function requireCSRFProtection(request: NextRequest): boolean {
  const method = request.method.toLowerCase();
  
  // Seules les requêtes de modification nécessitent une protection CSRF
  if (!['post', 'put', 'patch', 'delete'].includes(method)) {
    return true;
  }
  
  // Vérifier le token CSRF
  return verifyCSRFToken(request);
}

/**
 * Vérifier si la requête nécessite une protection CSRF
 */
export function needsCSRFProtection(pathname: string, method: string): boolean {
  const authRoutes = [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/auth/logout',
    '/api/auth/change-password',
    '/api/auth/refresh'
  ];
  
  const sensitiveRoutes = [
    '/api/books',
    '/api/categories', 
    '/api/tags',
    '/api/upload',
    '/api/export'
  ];
  
  const modifyingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  return modifyingMethods.includes(method.toUpperCase()) && 
         (authRoutes.some(route => pathname.startsWith(route)) ||
          sensitiveRoutes.some(route => pathname.startsWith(route)));
}

/**
 * Constantes pour l'export
 */
export const CSRF_CONSTANTS = {
  TOKEN_LENGTH: CSRF_TOKEN_LENGTH,
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME
} as const;