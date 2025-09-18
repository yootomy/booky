import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";

interface RouteParams {
  params: Promise<{ bookId: string }>;
}

// DELETE /api/favorites/[bookId] - Remove a book from favorites
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withBetterAuth(request, async (req, user) => {
    try {
      const { bookId } = await params;

      if (!bookId || typeof bookId !== "string") {
        return NextResponse.json(
          { error: "Invalid book ID" },
          { status: 400 }
        );
      }

      // Check if the favorite exists
      const existingFavorite = await db.book_favorite.findUnique({
        where: {
          bookId_userId: {
            bookId,
            userId: user.id
          }
        },
        include: {
          book: {
            select: { id: true, titre: true, auteur: true }
          }
        }
      });

      if (!existingFavorite) {
        return NextResponse.json(
          { error: "Book not found in favorites" },
          { status: 404 }
        );
      }

      // Remove from favorites
      await db.book_favorite.delete({
        where: {
          bookId_userId: {
            bookId,
            userId: user.id
          }
        }
      });

      console.log(`💔 Book "${existingFavorite.book.titre}" removed from favorites by ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        message: "Book removed from favorites",
        data: {
          bookId,
          bookTitle: existingFavorite.book.titre,
          removedBy: user.nom_complet
        }
      });

    } catch (error) {
      console.error("Remove favorite error:", error);
      return NextResponse.json(
        { error: "Failed to remove book from favorites" },
        { status: 500 }
      );
    }
  });
}