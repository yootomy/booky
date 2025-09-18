import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { z } from "zod";
import { normalizeString, calculateScore } from "@/utils/search-helpers";

// Schema de validation pour les suggestions
const SuggestSchema = z.object({
  q: z.string().min(1, "Search query is required").max(100, "Query too long"),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

interface SuggestionItem {
  type: 'book' | 'author' | 'tag' | 'category';
  id: string;
  title?: string;
  author?: string;
  cover?: string;
  name?: string;
  label?: string;
  score?: number;
}


// GET /api/search/suggest
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { q, limit } = SuggestSchema.parse(Object.fromEntries(searchParams.entries()));
    
    // Ne pas faire de suggestions pour des termes très courts
    if (q.length < 2) {
      return NextResponse.json({ items: [] });
    }
    
    const suggestions: SuggestionItem[] = [];
    
    // 1. Rechercher dans les livres (titre et auteur)
    const books = await db.book.findMany({
      where: {
        OR: [
          { titre: { contains: q, mode: "insensitive" } },
          { auteur: { contains: q, mode: "insensitive" } },
        ]
      },
      select: {
        id: true,
        titre: true,
        auteur: true,
        image_couverture: true,
      },
      take: limit,
    });
    
    // Ajouter les livres avec score pour le titre
    books.forEach(book => {
      const titleScore = calculateScore(q, book.titre, 'book');
      const authorScore = calculateScore(q, book.auteur, 'book');
      const maxScore = Math.max(titleScore, authorScore);
      
      if (maxScore > 0) {
        suggestions.push({
          type: 'book',
          id: book.id,
          title: book.titre,
          author: book.auteur,
          cover: book.image_couverture || undefined,
          score: maxScore
        });
      }
    });
    
    // 2. Rechercher dans les auteurs uniques
    const authors = await db.book.findMany({
      where: {
        auteur: { contains: q, mode: "insensitive" }
      },
      select: {
        auteur: true,
      },
      distinct: ['auteur'],
      take: limit,
    });
    
    // Ajouter les auteurs
    authors.forEach(book => {
      const score = calculateScore(q, book.auteur, 'author');
      if (score > 0) {
        suggestions.push({
          type: 'author',
          id: `author_${normalizeString(book.auteur)}`,
          name: book.auteur,
          score
        });
      }
    });
    
    // 3. Rechercher dans les catégories
    const categories = await db.category.findMany({
      where: {
        nom: { contains: q, mode: "insensitive" }
      },
      select: {
        id: true,
        nom: true,
      },
      take: limit,
    });
    
    categories.forEach(category => {
      const score = calculateScore(q, category.nom, 'category');
      if (score > 0) {
        suggestions.push({
          type: 'category',
          id: category.id,
          label: category.nom,
          score
        });
      }
    });
    
    // 4. Rechercher dans les tags
    const tags = await db.tag.findMany({
      where: {
        nom: { contains: q, mode: "insensitive" }
      },
      select: {
        id: true,
        nom: true,
      },
      take: limit,
    });
    
    tags.forEach(tag => {
      const score = calculateScore(q, tag.nom, 'tag');
      if (score > 0) {
        suggestions.push({
          type: 'tag',
          id: tag.id,
          label: tag.nom,
          score
        });
      }
    });
    
    // Trier par score décroissant et limiter
    const sortedSuggestions = suggestions
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit)
      .map(item => {
        // Nettoyer l'objet pour ne pas exposer le score
        const { score, ...cleanItem } = item;
        return cleanItem;
      });
    
    return NextResponse.json({
      items: sortedSuggestions
    });
    
  } catch (error) {
    console.error("Search suggestions error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}