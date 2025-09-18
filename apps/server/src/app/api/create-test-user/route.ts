import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { hash } from "@node-rs/argon2";

export async function POST(req: NextRequest) {
  try {
    console.log("🔧 Creating test user via custom endpoint...");
    
    // Supprimer l'utilisateur existant
    await db.user.deleteMany({
      where: { email: "bruna@example.com" }
    });
    
    // Hasher le mot de passe avec Argon2 (compatible Better Auth)
    const hashedPassword = await hash("password123", {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
    
    // Créer l'utilisateur
    const { randomUUID } = await import('crypto');
    const user = await db.user.create({
      data: {
        id: randomUUID(),
        email: "bruna@example.com",
        password: hashedPassword,
        nom_complet: "Bruna Test",
        role: "ADMIN",
        emailVerified: true,
        date_modification: new Date(),
      },
    });
    
    console.log("✅ Test user created:", user.email);
    
    return NextResponse.json({
      success: true,
      message: "Test user created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.nom_complet,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
    
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create test user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}