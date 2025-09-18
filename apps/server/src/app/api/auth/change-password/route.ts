import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword, getUserFromRequest } from "@/lib/auth";
import { db } from "@/utils/db";
import { z } from "zod";
import { ChangePasswordSchema } from "@/lib/password-policy";

/**
 * POST /api/auth/change-password
 * Changer le mot de passe d'un utilisateur connecté
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const currentUser = await getUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(body);

    // Récupérer l'utilisateur avec son mot de passe
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, password: true }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier l'ancien mot de passe
    const isCurrentPasswordValid = await verifyPassword(user.password, currentPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await db.user.update({
      where: { id: currentUser.id },
      data: { 
        password: hashedNewPassword,
        date_modification: new Date()
      }
    });

    console.log(`🔐 Password changed for user: ${currentUser.email}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe modifié avec succès"
    });

  } catch (error) {
    console.error("Change password error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Échec du changement de mot de passe" },
      { status: 500 }
    );
  }
}