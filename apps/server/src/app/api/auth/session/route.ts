import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/auth/session - Vérifier si connecté
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: user,
    });

  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Session check failed", user: null },
      { status: 500 }
    );
  }
}