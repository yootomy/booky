import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sagas/[id]/books - Obtenir les livres d'une saga
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Paramètres optionnels
    const includeCategories = searchParams.get('include_categories') === 'true';
    const includeTags = searchParams.get('include_tags') === 'true';

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid saga ID" },
        { status: 400 }
      );
    }

    // Vérifier que la saga existe
    const saga = await db.saga.findUnique({
      where: { id }
    });

    if (!saga) {
      return NextResponse.json(
        { error: "Saga not found" },
        { status: 404 }
      );
    }

    // Récupérer les livres de la saga, triés par ordre
    const books = await db.book.findMany({
      where: { sagaId: id },
      include: {
        user: {
          select: { id: true, nom_complet: true, avatar: true }
        },
        book_category: includeCategories ? {
          include: { category: true }
        } : false,
        book_tag: includeTags ? {
          include: { tag: true }
        } : false,
        saga: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        sagaOrder: 'asc'
      }
    });

    // Mapper la structure pour le frontend
    const mappedBooks = books.map(book => ({
      ...book,
      categories: book.book_category || [],
      tags: book.book_tag || []
    }));

    return NextResponse.json({
      success: true,
      data: mappedBooks
    });

  } catch (error) {
    console.error("Get saga books error:", error);
    return NextResponse.json(
      { error: "Failed to fetch saga books" },
      { status: 500 }
    );
  }
}