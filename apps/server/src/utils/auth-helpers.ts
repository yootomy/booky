// =============================================================================
// 🔐 UTILITAIRES D'AUTHENTIFICATION
// =============================================================================
// Helpers pour simplifier l'utilisation du système d'authentification custom

import { NextRequest } from "next/server";
import { getUserFromRequest, AuthUser } from "@/lib/auth";

// =============================================================================
// 🚀 SESSION MANAGEMENT
// =============================================================================

/**
 * Récupère l'utilisateur depuis une requête Next.js
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await getUserFromRequest(request);
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const user = await getAuthUser(request);
  return !!user;
}

/**
 * Récupère l'ID utilisateur
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await getAuthUser(request);
  return user?.id || null;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasRole(request: NextRequest, role: "ADMIN" | "USER"): Promise<boolean> {
  const user = await getAuthUser(request);
  return user?.role === role;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  return await hasRole(request, 'ADMIN');
}

/**
 * Vérifie si l'utilisateur est un user normal
 */
export async function isUser(request: NextRequest): Promise<boolean> {
  return await hasRole(request, 'USER');
}

// =============================================================================
// 🛡️ MIDDLEWARE HELPERS
// =============================================================================

/**
 * Type pour les données de session utilisateur (alias pour AuthUser)
 */
export type SessionUser = AuthUser;

/**
 * Récupère l'utilisateur avec typage strict (même chose que getAuthUser)
 */
export async function getTypedUser(request: NextRequest): Promise<SessionUser | null> {
  return await getAuthUser(request);
}

/**
 * Récupère la session avec typage strict (alias pour getAuthUser pour compatibilité)
 */
export async function getTypedSession(request: NextRequest): Promise<SessionUser | null> {
  return await getAuthUser(request);
}

/**
 * Alias pour getAuthUser (pour compatibilité)
 */
export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  return await getAuthUser(request);
}