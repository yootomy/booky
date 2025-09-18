import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, AuthUser } from "../lib/auth";

// Middleware pour protéger les routes qui nécessitent une authentification
export function withAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const user = await getUserFromRequest(req);

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      return handler(req, user);

    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

// Middleware pour protéger les routes admin uniquement
export function withAdminAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, user: AuthUser) => {
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}

// Middleware pour vérifier les sessions (optionnel - n'échoue pas si pas connecté)
export async function getOptionalAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    return await getUserFromRequest(req);
  } catch (error) {
    console.error("Optional auth error:", error);
    return null;
  }
}

// Rate limiting pour protection brute force
const loginAttempts = new Map<string, { attempts: number; lastAttempt: Date }>();

export function checkRateLimit(email: string, maxAttempts: number = 5, windowMs: number = 900000): boolean {
  const now = new Date();
  const userAttempts = loginAttempts.get(email);

  if (!userAttempts) {
    loginAttempts.set(email, { attempts: 1, lastAttempt: now });
    return true;
  }

  // Reset si la fenêtre est passée
  if (now.getTime() - userAttempts.lastAttempt.getTime() > windowMs) {
    loginAttempts.set(email, { attempts: 1, lastAttempt: now });
    return true;
  }

  // Incrémenter les tentatives
  userAttempts.attempts++;
  userAttempts.lastAttempt = now;

  if (userAttempts.attempts > maxAttempts) {
    console.log(`🚫 Rate limit exceeded for: ${email}`);
    return false;
  }

  return true;
}

// Nettoyer les tentatives réussies
export function clearRateLimit(email: string): void {
  loginAttempts.delete(email);
}
