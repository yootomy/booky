import { NextRequest, NextResponse } from "next/server";
import { hashPassword, checkRateLimit } from "@/lib/auth";
import { db } from "@/utils/db";
import { z } from "zod";
import { RegisterValidationSchema, evaluatePasswordStrength } from "@/lib/password-policy";
import { randomUUID } from "crypto";

// Schéma pour la route register (les utilisateurs ne peuvent pas choisir leur rôle)
const RegisterRouteSchema = RegisterValidationSchema.extend({
  role: z.enum(["ADMIN", "USER"]).optional().default("USER"),
});

// POST /api/auth/register - Créer un compte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RegisterRouteSchema.parse(body);

    // Rate limiting pour les inscriptions (plus permissif que login)
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    if (!checkRateLimit(`register:${clientIP}`, 3, 300000)) { // 3 tentatives par 5min
      return NextResponse.json(
        { error: "Trop de tentatives d'inscription. Veuillez réessayer plus tard." },
        { status: 429 }
      );
    }

    // Évaluer la force du mot de passe
    const passwordStrength = evaluatePasswordStrength(validatedData.password);
    if (!passwordStrength.isStrong) {
      return NextResponse.json(
        { 
          error: "Mot de passe trop faible", 
          feedback: passwordStrength.feedback,
          score: passwordStrength.score 
        },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Vérifier si c'est le premier utilisateur (devient admin automatiquement)
    const userCount = await db.user.count();
    const isFirstUser = userCount === 0;
    const role = isFirstUser ? "ADMIN" : validatedData.role;

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(validatedData.password);

    // Créer l'utilisateur
    const user = await db.user.create({
      data: {
        id: randomUUID(),
        email: validatedData.email,
        password: hashedPassword,
        nom_complet: validatedData.nom_complet || null,
        username: validatedData.username || null,
        role: role,
        emailVerified: isFirstUser, // Auto-vérifier pour l'admin
        date_modification: new Date(),
      },
      select: {
        id: true,
        email: true,
        nom_complet: true,
        username: true,
        role: true,
        emailVerified: true,
      }
    });

    console.log(`👥 New ${role} user created: ${validatedData.email}`);

    return NextResponse.json({
      message: "User created successfully",
      user: user,
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}