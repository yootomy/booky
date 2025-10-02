import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface Author {
  nom: string;
  slug: string;
  livres_count: number;
  note_moyenne: number;
  livre_phare: {
    id: string;
    titre: string;
    image_couverture?: string;
    note_generale: number;
  };
  tagline: string;
  dominant_tags: string[];
}

export function useAuthorsSpotlight() {
  const [data, setData] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer tous les livres pour calculer les stats par auteur
        const response = await apiClient.get('/api/books');
        if (!response.ok) throw new Error("Failed to fetch books");
        
        const books = await response.json();
        
        // Calculer les statistiques par auteur
        const authorStats = books.reduce((acc: any, book: any) => {
          const author = book.auteur;
          if (!author) return acc;

          if (!acc[author]) {
            acc[author] = {
              nom: author,
              slug: author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              livres: [],
              notes: [],
              tags: []
            };
          }

          acc[author].livres.push(book);
          if (book.note_generale > 0) {
            acc[author].notes.push(book.note_generale);
          }
          
          // Collecter les tags
          if (book.tags) {
            acc[author].tags.push(...book.tags.map((tag: any) => tag.nom));
          }

          return acc;
        }, {});

        // Transformer en array et calculer les métriques
        const authorsArray = Object.values(authorStats).map((author: any) => {
          const note_moyenne = author.notes.length > 0 
            ? author.notes.reduce((sum: number, note: number) => sum + note, 0) / author.notes.length
            : 0;
          
          // Livre phare (meilleure note)
          const livre_phare = author.livres.reduce((best: any, book: any) => {
            return (book.note_generale || 0) > (best.note_generale || 0) ? book : best;
          }, author.livres[0]);

          // Générer tagline basée sur les tags dominants
          const tagCounts = author.tags.reduce((acc: any, tag: string) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
          }, {});
          
          const dominantTags = Object.entries(tagCounts)
            .sort(([,a]: any, [,b]: any) => b - a)
            .slice(0, 2)
            .map(([tag]: any) => tag);

          const tagline = generateTagline(dominantTags);

          return {
            nom: author.nom,
            slug: author.slug,
            livres_count: author.livres.length,
            note_moyenne: note_moyenne,
            livre_phare: {
              id: livre_phare.id,
              titre: livre_phare.titre,
              image_couverture: livre_phare.image_couverture,
              note_generale: livre_phare.note_generale || 0
            },
            tagline: tagline,
            dominant_tags: dominantTags
          };
        });

        // Trier par score pondéré (moyenne × nb de livres) et prendre le top 6
        const topAuthors = authorsArray
          .filter((author: any) => author.note_moyenne > 0)
          .sort((a: any, b: any) => {
            const scoreA = a.note_moyenne * Math.log(a.livres_count + 1);
            const scoreB = b.note_moyenne * Math.log(b.livres_count + 1);
            return scoreB - scoreA;
          })
          .slice(0, 6);

        setData(topAuthors);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  return { data, isLoading, error };
}

// Fonction pour générer des taglines basées sur les tags dominants
function generateTagline(tags: string[]): string {
  const taglines = {
    'dark': 'Âmes tourmentées, passions destructrices',
    'romance': 'Cœurs brisés, amours interdites',
    'enemies': 'De la haine à l\'obsession',
    'forbidden': 'Désirs inavouables, secrets brûlants',
    'psychologique': 'Manipulations subtiles, esprits complexes',
    'academia': 'Élégance gothique, mystères érudits',
    'obsession': 'Fascination malsaine, dépendance totale',
    'redemption': 'Chute et renaissance, pardons impossibles',
    'age-gap': 'Différences interdites, attractions irrésistibles',
    'morally-grey': 'Héros imparfaits, anti-héroïnes féroces'
  };

  // Chercher une tagline correspondant aux tags
  for (const tag of tags) {
    const key = tag.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (taglines[key as keyof typeof taglines]) {
      return taglines[key as keyof typeof taglines];
    }
  }

  // Taglines génériques basées sur la combinaison
  const fallbacks = [
    'Plume noire, émotions intenses',
    'Héroïnes fissurées, anti-héros féroces',
    'Passions sombres, fins lumineuses',
    'Caractères complexes, amours impossibles',
    'Tension constante, dénouements saisissants',
    'Psychés brisées, guérisons douloureuses'
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}