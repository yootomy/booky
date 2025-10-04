import { useState, useEffect } from 'react';
import { Zap, Moon, Heart } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Playlist {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  books: {
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
    note_generale: number;
  }[];
  total_count: number;
}

export function usePlaylistsIndociles() {
  const [data, setData] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer tous les livres
        const response = await apiClient.get('/api/books');
        if (!response.success) throw new Error(response.error || "Failed to fetch books");
        
        const books = response.data;
        
        // Règle 1: "Dévorer en une nuit"
        // rythme IN ("FAST_PACE", 'INSTA_LOVE') AND note_generale >= 7
        const devourerEnUneNuit = books.filter((book: any) => 
          ['FAST_PACE', 'INSTA_LOVE'].includes(book.rythme) && (book.note_generale || 0) >= 7
        );

        // Règle 2: "Nuits d"hôtel & secrets' 
        // tags contenant "forbidden", 'secret' ET intensite_emotionnelle >= 7
        const nuitsHotelSecrets = books.filter((book: any) => {
          const hasForbiddenSecretTag = book.tags?.some((tag: any) => 
            tag.nom?.toLowerCase().includes('forbidden') || 
            tag.nom?.toLowerCase().includes('secret') ||
            tag.nom?.toLowerCase().includes('interdit')
          );
          return hasForbiddenSecretTag && (book.intensite_emotionnelle || 0) >= 7;
        });

        // Règle 3: "Âmes abîmées, fin douce-amère"
        // niveau_dark >= 6 AND niveau_romance >= 6 AND rythme="SLOW_BURN"
        const amesAbimees = books.filter((book: any) => 
          (book.niveau_dark || 0) >= 6 && 
          (book.niveau_romance || 0) >= 6 && 
          book.rythme === 'SLOW_BURN'
        );

        const playlists: Playlist[] = [
          {
            id: "devorer-une-nuit",
            title: "Dévorer en une nuit",
            description: "Rythme effréné, passion instantanée. Ces histoires vous tiendront éveillé jusqu\"au bout.",
            icon: Zap,
            color: '#F59E0B',
            books: devourerEnUneNuit.slice(0, 6),
            total_count: devourerEnUneNuit.length
          },
          {
            id: "nuits-hotel-secrets",
            title: "Nuits d\"hôtel & secrets",
            description: "Amours interdites, liaisons dangereuses. L\"intensité émotionnelle à son paroxysme.",
            icon: Moon,
            color: '#6B4C7B',
            books: nuitsHotelSecrets.slice(0, 6),
            total_count: nuitsHotelSecrets.length
          },
          {
            id: "ames-abimees",
            title: "Âmes abîmées, fin douce-amère",
            description: "Dark romance profond, lent burn intense. Guérison douloureuse, rédemption possible.",
            icon: Heart,
            color: '#8B1538',
            books: amesAbimees.slice(0, 6),
            total_count: amesAbimees.length
          }
        ];

        // Filtrer les playlists qui ont au moins des livres
        const playlistsWithBooks = playlists.filter(playlist => playlist.total_count > 0);

        setData(playlistsWithBooks);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  return { data, isLoading, error };
}