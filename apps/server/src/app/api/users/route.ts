import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";

// GET /api/users - Récupérer tous les utilisateurs (admin seulement)
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      // Vérifier que l'utilisateur est admin
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Access denied - Admin required" },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role') || '';

      const skip = (page - 1) * limit;

      // Construire les filtres
      const whereClause: any = {};
      
      if (search) {
        whereClause.OR = [
          { nom_complet: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        whereClause.role = role;
      }

      // Récupérer les utilisateurs avec comptage
      const [users, totalCount] = await Promise.all([
        db.user.findMany({
          where: whereClause,
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
              }
            }
          },
          orderBy: {
            date_creation: 'desc'
          },
          skip,
          take: limit
        }),
        db.user.count({
          where: whereClause
        })
      ]);

      // Transformer les données pour le frontend
      const usersFormatted = users.map(u => ({
        id: u.id,
        email: u.email,
        nom_complet: u.nom_complet,
        username: u.username,
        avatar: u.avatar,
        role: u.role,
        emailVerified: u.emailVerified,
        derniere_connexion: u.derniere_connexion?.toISOString() || null,
        date_creation: u.date_creation.toISOString(),
        stats: {
          books_count: u._count.book,
          questions_count: u._count.book_question_book_question_authorIdTouser,
          likes_count: u._count.book_question_like,
        }
      }));

      return NextResponse.json({
        success: true,
        data: usersFormatted,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error("Get users error:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }
  });
}