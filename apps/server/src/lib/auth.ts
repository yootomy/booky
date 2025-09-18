import { NextRequest, NextResponse } from "next/server";
import { verify, hash } from "@node-rs/argon2";
import { sign, verify as verifyJWT } from "jsonwebtoken";
import { serialize, parse } from "cookie";
import { db } from "../utils/db";
import { randomUUID } from "crypto";

// Configuration sécurisée depuis les variables d'environnement
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
const COOKIE_NAME = "booky_auth";

// Validation de la configuration au démarrage
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

// Variable sécurisée pour TypeScript
const VALIDATED_JWT_SECRET: string = JWT_SECRET;

export interface AuthUser {
  id: string;
  email: string;
  nom_complet: string | null;
  role: "ADMIN" | "USER";
  avatar: string | null;
}

// Hash password avec argon2
export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

// Verify password
export async function verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
  return verify(hashedPassword, password);
}

// Create JWT token
export function createToken(user: AuthUser): string {
  return sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      jti: randomUUID() // JWT ID pour invalidation
    },
    VALIDATED_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any
  );
}

// Create refresh token
export function createRefreshToken(user: AuthUser): string {
  return sign(
    {
      userId: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      jti: randomUUID()
    },
    VALIDATED_JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as any
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = verifyJWT(token, VALIDATED_JWT_SECRET) as any;
    return {
      id: decoded.userId,
      email: decoded.email,
      nom_complet: decoded.nom_complet || null,
      role: decoded.role,
      avatar: decoded.avatar || null,
    };
  } catch {
    return null;
  }
}

// Get user from database
export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await db.user.findUnique({
    where: { id }
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    nom_complet: user.nom_complet,
    role: user.role as "ADMIN" | "USER",
    avatar: user.avatar,
  };
}

// Login function
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
  try {
    // Find user directly
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return { success: false, error: "Invalid credentials" };
    }

    // Verify password
    const isValidPassword = await verifyPassword(user.password, password);
    if (!isValidPassword) {
      return { success: false, error: "Invalid credentials" };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      nom_complet: user.nom_complet,
      role: user.role as "ADMIN" | "USER",
      avatar: user.avatar,
    };

    const token = createToken(authUser);

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { derniere_connexion: new Date() }
    });

    return { success: true, user: authUser, token };

  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Login failed" };
  }
}

// Get user from request (cookies or headers)
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get token from cookie
    let token = req.cookies.get(COOKIE_NAME)?.value;
    
    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Get fresh user data from database
    return await getUserById(decoded.id);

  } catch {
    return null;
  }
}

// Create auth cookie avec sécurité renforcée
export function createAuthCookie(token: string, rememberMe: boolean = false): string {
  const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 jours ou 24h
  
  return serialize(COOKIE_NAME, token, {
    httpOnly: true, // Empêche l'accès JavaScript côté client
    secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Lax en dev pour les ports différents
    maxAge: maxAge,
    path: "/",
    domain: process.env.NODE_ENV === "production" ? process.env.FRONTEND_DOMAIN : undefined,
  });
}

// Create refresh cookie
export function createRefreshCookie(refreshToken: string): string {
  return serialize("booky_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Lax en dev pour les ports différents
    maxAge: 7 * 24 * 60 * 60, // 7 jours
    path: "/", // Path global en dev pour que le proxy puisse y accéder
    domain: process.env.NODE_ENV === "production" ? process.env.FRONTEND_DOMAIN : undefined,
  });
}

// Clear auth cookie
export function clearAuthCookie(): string {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
    domain: process.env.NODE_ENV === "production" ? process.env.FRONTEND_DOMAIN : undefined,
  });
}

// Clear refresh cookie
export function clearRefreshCookie(): string {
  return serialize("booky_refresh", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict",
    maxAge: 0,
    path: "/",
    domain: process.env.NODE_ENV === "production" ? process.env.FRONTEND_DOMAIN : undefined,
  });
}

// Rate limiting
const loginAttempts = new Map<string, { attempts: number; lastAttempt: Date }>();

export function checkRateLimit(
  email: string, 
  maxAttempts: number = parseInt(process.env.AUTH_RATE_LIMIT_MAX || "5"), 
  windowMs: number = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || "300000")
): boolean {
  const now = new Date();
  const userAttempts = loginAttempts.get(email);

  if (!userAttempts) {
    loginAttempts.set(email, { attempts: 1, lastAttempt: now });
    return true;
  }

  // Reset if window passed
  if (now.getTime() - userAttempts.lastAttempt.getTime() > windowMs) {
    loginAttempts.set(email, { attempts: 1, lastAttempt: now });
    return true;
  }

  userAttempts.attempts++;
  userAttempts.lastAttempt = now;

  if (userAttempts.attempts > maxAttempts) {
    console.log(`🚫 Rate limit exceeded for: ${email}`);
    return false;
  }

  return true;
}

export function clearRateLimit(email: string): void {
  loginAttempts.delete(email);
}