import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface HauntingQuote {
  id: string;
  text: string;
  book_title: string;
  book_author: string;
  book_id: string;
  date_added: string;
}

export function useHauntingQuotes() {
  const [data, setData] = useState<HauntingQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les livres avec citations
        const response = await apiClient.get('/api/books?has_citations=true&limit=20');
        if (!response.ok) {
          // Fallback en cas d'erreur API
          setData([]);
          return;
        }
        
        const books = await response.json();
        
        // Traiter les livres pour extraire des citations
        const quotes: HauntingQuote[] = [];
        
        books.forEach((book: any) => {
          if (book.citations && book.citations.trim()) {
            // Diviser les citations par lignes et prendre les plus marquantes
            const citationLines = book.citations
              .split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 20);
            
            // Prendre jusqu'à 2 citations par livre
            citationLines.slice(0, 2).forEach((citation: string, index: number) => {
              quotes.push({
                id: '${book.id}-${index}',
                text: citation,
                book_title: book.titre,
                book_author: book.auteur,
                book_id: book.id,
                date_added: book.date_creation || new Date().toISOString()
              });
            });
          }
        });
        
        // Mélanger et limiter à 6 citations
        const shuffled = quotes
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);
        
        setData(shuffled);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  return { data, isLoading, error };
}