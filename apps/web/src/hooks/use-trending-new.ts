import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface Book {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy: number;
  rythme: 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';
  date_creation: string;
  date_publication?: string;
  trending_score?: number;
  favorite_count?: number;
  question_count?: number;
  tags?: string[];
}

export function useTrendingNew() {
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer tous les livres
        const booksResponse = await apiClient.get('/api/books');
        const allBooks = booksResponse.success ? booksResponse.data : [];
        
        // Nouveautés : triés par date de publication ou création
        const newBooksData = [...allBooks]
          .sort((a, b) => {
            const dateA = new Date(a.date_publication || a.date_creation).getTime();
            const dateB = new Date(b.date_publication || b.date_creation).getTime();
            return dateB - dateA;
          })
          .slice(0, 8);

        // Tendances : calculer le score de popularité
        const booksWithTrendingScore = allBooks.map((book: any) => {
          const favoriteCount = book._count?.favorites || book.favorites?.length || 0;
          const questionCount = book._count?.questions || book.questions?.length || 0;
          const tagUtilization = book.tags?.reduce((sum: number, tag: any) => sum + (tag.utilisation_count || 0), 0) / 10 || 0;
          
          const trendingScore = (favoriteCount * 2) + questionCount + tagUtilization;
          return { ...book, trending_score: trendingScore };
        });
        
        const trendingBooksData = booksWithTrendingScore
          .sort((a: any, b: any) => b.trending_score - a.trending_score)
          .slice(0, 8);
        
        const processBooks = (books: any[]) => books.map((book: any) => {
          // Calculer trending_score algorithmiquement
          const favorite_count = book._count?.favorites || book.favorite_count || 0;
          const question_count = book._count?.questions || book.question_count || 0;
          const trending_score = favorite_count * 2 + question_count * 1.5;

          return {
            id: book.id,
            titre: book.titre,
            auteur: book.auteur,
            image_couverture: book.image_couverture,
            note_generale: book.note_generale || 0,
            niveau_spicy: book.niveau_spicy || 0,
            rythme: book.rythme || 'MEDIUM_BURN',
            date_creation: book.date_creation,
            date_publication: book.date_publication,
            trending_score: trending_score,
            favorite_count: favorite_count,
            question_count: question_count,
            tags: book.tags?.map((tag: any) => tag.nom) || []
          };
        });

        setNewBooks(processBooks(newBooksData));
        setTrendingBooks(processBooks(trendingBooksData));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setNewBooks([]);
        setTrendingBooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return { newBooks, trendingBooks, isLoading, error };
}