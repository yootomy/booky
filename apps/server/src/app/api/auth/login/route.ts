import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginUser, checkRateLimit, clearRateLimit, createAuthCookie, createRefreshCookie, createRefreshToken } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = LoginSchema.parse(body);

    // Check rate limit
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const result = await loginUser(email, password);

    if (!result.success || !result.user || !result.token) {
      console.log(`❌ Login failed for: ${email}`);
      return NextResponse.json(
        { error: result.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    // Clear rate limit on successful login
    clearRateLimit(email);

    console.log(`✅ Login successful for: ${email} (${result.user.role})`);

    // Créer refresh token
    const refreshToken = createRefreshToken(result.user);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: result.user,
      token: result.token
    });

    // Set cookies sécurisés
    response.headers.set("Set-Cookie", createAuthCookie(result.token, rememberMe));
    response.headers.append("Set-Cookie", createRefreshCookie(refreshToken));

    return response;

  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}