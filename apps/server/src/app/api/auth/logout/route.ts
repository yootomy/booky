import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, clearRefreshCookie } from "@/lib/auth";

// POST /api/auth/logout - Déconnecter l'utilisateur
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout successful"
    });

    // Clear tous les cookies d'auth
    response.headers.set("Set-Cookie", clearAuthCookie());
    response.headers.append("Set-Cookie", clearRefreshCookie());

    return response;

  } catch (error) {
    console.error("Logout error:", error);
    
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}