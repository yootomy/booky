import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, AuthUser } from "../lib/auth";
import { db } from "../utils/db";

export async function withBetterAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "Authentication required",
          code: "AUTH_REQUIRED"
        },
        { status: 401 }
      );
    }

    return handler(request, user);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { 
        error: "Authentication error", 
        message: "Failed to verify authentication",
        code: "AUTH_ERROR"
      },
      { status: 401 }
    );
  }
}

export async function withOptionalBetterAuth(
  request: NextRequest,
  handler: (request: NextRequest, user?: AuthUser) => Promise<NextResponse>
) {
  try {
    const user = await getUserFromRequest(request);
    return handler(request, user || undefined);
  } catch (error) {
    console.error("Optional Auth middleware error:", error);
    return handler(request, undefined);
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return withBetterAuth(request, async (req, user) => {
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { 
          error: "Forbidden", 
          message: "Admin access required",
          code: "ADMIN_REQUIRED"
        },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}

export async function withRoleAuth(
  roles: ("ADMIN" | "USER")[],
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return withBetterAuth(request, async (req, user) => {
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { 
          error: "Forbidden", 
          message: `Required roles: ${roles.join(", ")}`,
          code: "INSUFFICIENT_ROLE"
        },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}

// Utilitaire pour vérifier les sessions
export async function verifySession(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return { authenticated: false, user: null };
    }

    return { 
      authenticated: true, 
      user: user
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return { authenticated: false, user: null };
  }
}

// Utilitaire pour mettre à jour la dernière connexion
export async function updateLastLogin(userId: string) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { derniere_connexion: new Date() }
    });
  } catch (error) {
    console.error("Failed to update last login:", error);
  }
}