import { NextRequest, NextResponse } from "next/server";
import { verifyToken, createToken, createRefreshToken, createAuthCookie, createRefreshCookie, getUserById } from "@/lib/auth";
import { z } from "zod";

/**
 * POST /api/auth/refresh
 * Rafraîchit le token d'authentification
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le refresh token depuis les cookies
    const refreshToken = request.cookies.get("booky_refresh")?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Vérifier le refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Vérifier que c'est bien un refresh token
    const payload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
    if (payload.type !== 'refresh') {
      return NextResponse.json(
        { success: false, error: "Invalid token type" },
        { status: 401 }
      );
    }

    // Récupérer les données utilisateur à jour
    const user = await getUserById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 }
      );
    }

    // Générer nouveaux tokens
    const newToken = createToken(user);
    const newRefreshToken = createRefreshToken(user);

    // Créer la réponse avec les nouveaux cookies
    const response = NextResponse.json({
      success: true,
      user,
      token: newToken
    });

    // Définir les nouveaux cookies sécurisés
    response.headers.set("Set-Cookie", createAuthCookie(newToken));
    response.headers.append("Set-Cookie", createRefreshCookie(newRefreshToken));

    return response;

  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Token refresh failed" },
      { status: 500 }
    );
  }
}