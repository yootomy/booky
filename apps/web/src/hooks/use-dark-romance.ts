import { useState, useEffect } from 'react';

export interface DarkRomanceBook {
  id: string;
  titre: string;
  auteur: string;
  image_couverture?: string;
  note_generale: number;
  niveau_dark: number;
  niveau_romance: number;
  niveau_spicy: number;
  intensite_emotionnelle: number;
  danger: number;
  violence: number;
  dark_score: number;
  resume_court?: string;
  pourquoi_aimer?: string;
  has_triggers: boolean;
}

export function useDarkRomance() {
  const [data, setData] = useState<DarkRomanceBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDarkRomanceBooks = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer tous les livres et filtrer pour dark romance
        const response = await fetch('/api/proxy/books');
        if (!response.ok) throw new Error('Failed to fetch dark romance books');
        
        const books = await response.json();
        
        // Filtrer pour obtenir les livres dark romance et prendre seulement les 6 premiers
        const darkRomanceBooks = books
          .filter((book: any) => (book.niveau_dark || 0) >= 4 && (book.niveau_romance || 0) >= 5)
          .slice(0, 6);
        
        const processedBooks = darkRomanceBooks.map((book: any) => {
          // Calculer dark_score algorithmiquement
          const dark_score = (
            (book.niveau_dark || 0) * 0.3 +
            (book.niveau_romance || 0) * 0.25 +
            (book.intensite_emotionnelle || 0) * 0.25 +
            (book.danger || 0) * 0.1 +
            (book.violence || 0) * 0.1
          ) / 10;

          return {
            id: book.id,
            titre: book.titre,
            auteur: book.auteur,
            image_couverture: book.image_couverture,
            note_generale: book.note_generale || 0,
            niveau_dark: book.niveau_dark || 0,
            niveau_romance: book.niveau_romance || 0,
            niveau_spicy: book.niveau_spicy || 0,
            intensite_emotionnelle: book.intensite_emotionnelle || 0,
            danger: book.danger || 0,
            violence: book.violence || 0,
            dark_score: dark_score,
            resume_court: book.resume_court,
            pourquoi_aimer: book.pourquoi_aimer,
            has_triggers: (book.danger || 0) >= 6 || (book.violence || 0) >= 5
          };
        });

        setData(processedBooks);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDarkRomanceBooks();
  }, []);

  return { data, isLoading, error };
}