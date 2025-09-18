import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";

// GET /api/profile - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      // Récupérer les données complètes de l'utilisateur avec ses statistiques
      const userProfile = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          nom_complet: true,
          username: true,
          avatar: true,
          role: true,
          emailVerified: true,
          derniere_connexion: true,
          date_creation: true,
          _count: {
            select: {
              book: true,
              book_question_book_question_authorIdTouser: true,
              book_question_like: true,
              book_favorite: true
            }
          }
        }
      });

      if (!userProfile) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Transformer les données pour le frontend
      const profileFormatted = {
        id: userProfile.id,
        email: userProfile.email,
        nom_complet: userProfile.nom_complet,
        username: userProfile.username,
        avatar: userProfile.avatar,
        role: userProfile.role,
        emailVerified: userProfile.emailVerified,
        derniere_connexion: userProfile.derniere_connexion?.toISOString() || null,
        date_creation: userProfile.date_creation.toISOString(),
        stats: {
          books_count: userProfile._count.book,
          questions_count: userProfile._count.book_question_book_question_authorIdTouser,
          likes_given_count: userProfile._count.book_question_like,
          favorites_count: userProfile._count.book_favorite
        }
      };

      return NextResponse.json({
        success: true,
        data: profileFormatted
      });

    } catch (error) {
      console.error("Get profile error:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }
  });
}

// PUT /api/profile - Mettre à jour le profil de l'utilisateur connecté
export async function PUT(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      const { nom_complet, username, email } = body;

      // Validation des données
      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { error: "Valid email is required" },
          { status: 400 }
        );
      }

      // Récupérer l'utilisateur complet depuis la base de données
      const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { 
          id: true, 
          email: true, 
          nom_complet: true, 
          username: true, 
          avatar: true 
        }
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Vérifier si l'email ou le username existe déjà (pour un autre utilisateur)
      if (email !== currentUser.email) {
        const existingEmailUser = await db.user.findFirst({
          where: {
            email,
            id: { not: user.id }
          }
        });

        if (existingEmailUser) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
          );
        }
      }

      if (username && username !== currentUser.username) {
        const existingUsernameUser = await db.user.findFirst({
          where: {
            username,
            id: { not: user.id }
          }
        });

        if (existingUsernameUser) {
          return NextResponse.json(
            { error: "Username already exists" },
            { status: 400 }
          );
        }
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          nom_complet: nom_complet || null,
          username: username || null,
          email,
          date_modification: new Date()
        },
        select: {
          id: true,
          email: true,
          nom_complet: true,
          username: true,
          avatar: true,
          role: true,
          emailVerified: true,
          derniere_connexion: true,
          date_creation: true,
          _count: {
            select: {
              book: true,
              book_question_book_question_authorIdTouser: true,
              book_question_like: true,
              book_favorite: true
            }
          }
        }
      });

      // Transformer les données pour le frontend
      const profileFormatted = {
        id: updatedUser.id,
        email: updatedUser.email,
        nom_complet: updatedUser.nom_complet,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        derniere_connexion: updatedUser.derniere_connexion?.toISOString() || null,
        date_creation: updatedUser.date_creation.toISOString(),
        stats: {
          books_count: updatedUser._count.book,
          questions_count: updatedUser._count.book_question_book_question_authorIdTouser,
          likes_given_count: updatedUser._count.book_question_like,
          favorites_count: updatedUser._count.book_favorite
        }
      };

      return NextResponse.json({
        success: true,
        data: profileFormatted,
        message: "Profile updated successfully"
      });

    } catch (error) {
      console.error("Update profile error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
  });
}