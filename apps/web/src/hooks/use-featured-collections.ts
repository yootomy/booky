import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface FeaturedCollection {
  id: string;
  nom: string;
  description?: string;
  couleur?: string;
  books: {
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    note_generale: number;
  }[];
}

export function useFeaturedCollections() {
  const [data, setData] = useState<FeaturedCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les catégories actives triées par ordre_affichage 
        const categoriesResponse = await apiClient.get('/api/categories');
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");
        
        const allCategories = await categoriesResponse.json();
        const activeCategories = allCategories
          .filter((cat: any) => cat.est_actif)
          .sort((a: any, b: any) => (a.ordre_affichage || 999) - (b.ordre_affichage || 999))
          .slice(0, 3); // Top 3 collections éditorialisées
        
        // Pour chaque catégorie, récupérer les livres
        const collectionsWithBooks = await Promise.all(
          activeCategories.map(async (category: any) => {
            const booksResponse = await apiClient.get('/api/books');
            const allBooks = booksResponse.ok ? await booksResponse.json() : [];
            
            // Filtrer les livres liés à cette catégorie (via book_category)
            const categoryBooks = allBooks.filter((book: any) => 
              book.categories?.some((cat: any) => cat.id === category.id)
            ).slice(0, 4);
            
            // Si pas assez de livres, compléter avec des livres similaires
            let books = categoryBooks;
            if (books.length < 4) {
              const similarBooks = allBooks
                .filter((book: any) => !books.some((b: any) => b.id === book.id))
                .slice(0, 4 - books.length);
              books = [...books, ...similarBooks];
            }

            return {
              id: category.id,
              nom: category.nom,
              description: category.description || 'Découvrez notre sélection ${category.nom.toLowerCase()}',
              couleur: category.couleur || '#8B1538',
              books: books.map((book: any) => ({
                id: book.id,
                titre: book.titre,
                auteur: book.auteur,
                image_couverture: book.image_couverture,
                note_generale: book.note_generale || 0
              }))
            };
          })
        );

        setData(collectionsWithBooks);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return { data, isLoading, error };
}