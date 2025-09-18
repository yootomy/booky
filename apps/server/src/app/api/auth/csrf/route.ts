import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken, createCSRFCookie } from "@/lib/csrf";

/**
 * GET /api/auth/csrf
 * Obtenir un token CSRF pour les requêtes d'authentification
 */
export async function GET(request: NextRequest) {
  try {
    // Générer un nouveau token CSRF
    const csrfToken = generateCSRFToken();
    
    const response = NextResponse.json({
      success: true,
      csrfToken,
      message: "CSRF token generated"
    });

    // Définir le cookie CSRF
    response.headers.set("Set-Cookie", createCSRFCookie(csrfToken));

    return response;

  } catch (error) {
    console.error("CSRF token generation error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate CSRF token" 
      },
      { status: 500 }
    );
  }
}