import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { randomUUID } from "crypto";
import { z } from "zod";

const createFavoriteSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
});

// POST /api/favorites - Add a book to favorites
export async function POST(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const { bookId } = createFavoriteSchema.parse(body);

      // Check if book exists
      const book = await db.book.findUnique({
        where: { id: bookId },
        select: { id: true, titre: true, auteur: true }
      });

      if (!book) {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }

      // Check if already favorited
      const existingFavorite = await db.book_favorite.findUnique({
        where: {
          bookId_userId: {
            bookId,
            userId: user.id
          }
        }
      });

      if (existingFavorite) {
        return NextResponse.json(
          { error: "Book is already in favorites" },
          { status: 400 }
        );
      }

      // Add to favorites
      const favorite = await db.book_favorite.create({
        data: {
          id: randomUUID(),
          bookId,
          userId: user.id,
        },
        include: {
          book: {
            select: { id: true, titre: true, auteur: true }
          }
        }
      });

      console.log(`❤️ Book "${book.titre}" added to favorites by ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        data: favorite,
        message: "Book added to favorites"
      });

    } catch (error) {
      console.error("Add favorite error:", error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: "Validation error",
            details: error.issues 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to add book to favorites" },
        { status: 500 }
      );
    }
  });
}

// GET /api/favorites - Get user's favorite books
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      const favorites = await db.book_favorite.findMany({
        where: { userId: user.id },
        include: {
          book: {
            include: {
              user: {
                select: { id: true, nom_complet: true, avatar: true }
              },
              book_category: {
                include: { category: true }
              },
              book_tag: {
                include: { tag: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      const totalCount = await db.book_favorite.count({
        where: { userId: user.id }
      });

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        success: true,
        data: favorites.map(fav => fav.book),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }
      });

    } catch (error) {
      console.error("Get favorites error:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }
  });
}