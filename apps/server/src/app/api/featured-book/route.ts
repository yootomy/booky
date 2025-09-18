import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

// Simple storage for featured book ID (in production, this should be in database)
let featuredBookId: string | null = null;

const setFeaturedBookSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
});

// GET /api/featured-book - Get current featured book
export async function GET() {
  try {
    if (!featuredBookId) {
      // If no featured book is set, return the highest rated book as default
      const defaultBook = await db.book.findFirst({
        where: { statut: 'LU' },
        orderBy: { note_generale: 'desc' },
        include: {
          user: {
            select: { id: true, nom_complet: true, avatar: true }
          },
          book_category: {
            include: { category: true }
          },
          book_tag: {
            include: { tag: true }
          },
          saga: {
            select: { id: true, name: true }
          },
          _count: {
            select: { book_favorite: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: defaultBook,
        isDefault: true,
        message: "No featured book set, returning highest rated book"
      });
    }

    // Get the specifically set featured book
    const featuredBook = await db.book.findUnique({
      where: { id: featuredBookId },
      include: {
        user: {
          select: { id: true, nom_complet: true, avatar: true }
        },
        book_category: {
          include: { category: true }
        },
        book_tag: {
          include: { tag: true }
        },
        saga: {
          select: { id: true, name: true }
        },
        _count: {
          select: { book_favorite: true }
        }
      }
    });

    if (!featuredBook) {
      // If featured book was deleted, reset and return default
      featuredBookId = null;
      return GET(); // Recursive call to get default
    }

    return NextResponse.json({
      success: true,
      data: featuredBook,
      isDefault: false,
      message: "Featured book retrieved successfully"
    });

  } catch (error) {
    console.error("Get featured book error:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured book" },
      { status: 500 }
    );
  }
}

// POST /api/featured-book - Set featured book (admin only)
export async function POST(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      // Check if user is admin
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Access denied. Admin role required." },
          { status: 403 }
        );
      }

      const body = await req.json();
      const { bookId } = setFeaturedBookSchema.parse(body);

      // Verify book exists
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

      // Set as featured book
      featuredBookId = bookId;

      console.log(`📚 Featured book set to "${book.titre}" by ${book.auteur} (ID: ${bookId}) by admin ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        data: { bookId, bookTitle: book.titre, bookAuthor: book.auteur },
        message: "Featured book set successfully"
      });

    } catch (error) {
      console.error("Set featured book error:", error);

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
        { error: "Failed to set featured book" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/featured-book - Clear featured book (admin only)
export async function DELETE(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    try {
      // Check if user is admin
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Access denied. Admin role required." },
          { status: 403 }
        );
      }

      featuredBookId = null;

      console.log(`📚 Featured book cleared by admin ${user.nom_complet}`);

      return NextResponse.json({
        success: true,
        message: "Featured book cleared successfully. Will show default highest rated book."
      });

    } catch (error) {
      console.error("Clear featured book error:", error);
      return NextResponse.json(
        { error: "Failed to clear featured book" },
        { status: 500 }
      );
    }
  });
}