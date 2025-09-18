import { useState, useEffect } from 'react';

export interface LatestBook {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy?: number;
  niveau_dark?: number;
  niveau_romance?: number;
  date_creation: string;
  date_publication?: string;
  resume_court?: string;
  saga?: {
    nom: string;
    ordre?: number;
  };
}

export function useLatestBooks() {
  const [data, setData] = useState<LatestBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestBooks = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les livres triés par date de création (les plus récents en premier)
        const response = await fetch('/api/proxy/books?limit=8&sortBy=date_creation&sortOrder=desc');
        if (!response.ok) throw new Error('Failed to fetch latest books');
        
        const books = await response.json();
        
        const processedBooks = books.map((book: any) => ({
          id: book.id,
          titre: book.titre,
          auteur: book.auteur,
          image_couverture: book.image_couverture,
          note_generale: book.note_generale || 0,
          niveau_spicy: book.niveau_spicy || 0,
          niveau_dark: book.niveau_dark || 0,
          niveau_romance: book.niveau_romance || 0,
          date_creation: book.date_creation,
          date_publication: book.date_publication,
          resume_court: book.resume_court,
          saga: book.saga ? {
            nom: book.saga.nom || book.saga.name,
            ordre: book.saga_ordre || book.saga.ordre
          } : undefined
        }));

        setData(processedBooks);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestBooks();
  }, []);

  return { data, isLoading, error };
}