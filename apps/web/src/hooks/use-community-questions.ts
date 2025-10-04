import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface CommunityQuestion {
  id: string;
  title: string;
  excerpt: string;
  author: {
    nom: string;
    avatar?: string;
  };
  book: {
    id: string;
    titre: string;
    auteur: string;
    image_couverture?: string;
  };
  status: 'ANSWERED' | 'PENDING';
  likes_count: number;
  answers_count: number;
  date_question: string;
  is_public: boolean;
}

export function useCommunityQuestions() {
  const [data, setData] = useState<CommunityQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les questions publiques depuis l'API proxy
        const response = await apiClient.get('/api/questions?is_public=true&sort=likes_count_desc&limit=4');
        
        if (!response.success) {
          // Fallback: utiliser des données simulées si l'API n'existe pas encore
          const simulatedQuestions: CommunityQuestion[] = [
            {
              id: "1",
              title: "Pourquoi les anti-héros m\"attirent-ils autant ?",
              excerpt: 'Je me retrouve toujours à tomber pour les personnages les plus sombres. Est-ce que quelqu\'un d\'autre ressent ça ?',
              author: { nom: 'Sarah M.' },
              book: {
                id: 'book-1',
                titre: 'Twisted Love',
                auteur: 'Ana Huang',
                image_couverture: '/placeholder-book.svg'
              },
              status: 'ANSWERED',
              likes_count: 24,
              answers_count: 8,
              date_question: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              is_public: true
            },
            {
              id: "2",
              title: "Comment gérer l\"intensité émotionnelle ?",
              excerpt: 'Certains livres me bouleversent tellement que j\'ai du mal à passer à autre chose. Des conseils ?',
              author: { nom: 'Emma L.' },
              book: {
                id: 'book-2',
                titre: 'Broken Prince',
                auteur: 'Jen L. Grey',
                image_couverture: '/placeholder-book.svg'
              },
              status: 'PENDING',
              likes_count: 18,
              answers_count: 5,
              date_question: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              is_public: true
            },
            {
              id: "3",
              title: "Vos tropes favoris en dark romance ?",
              excerpt: 'Je cherche de nouvelles lectures, quels sont vos tropes préférés et pourquoi ?',
              author: { nom: 'Lisa K.' },
              book: {
                id: 'book-3',
                titre: 'King of Wrath',
                auteur: 'Ana Huang',
                image_couverture: '/placeholder-book.svg'
              },
              status: 'ANSWERED',
              likes_count: 31,
              answers_count: 12,
              date_question: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              is_public: true
            },
            {
              id: "4",
              title: "Gestion des triggers en lecture",
              excerpt: 'Comment abordez-vous les contenus sensibles ? Des stratégies pour continuer à lire tout en se protégeant ?',
              author: { nom: 'Marie D.' },
              book: {
                id: 'book-4',
                titre: 'Haunting Adeline',
                auteur: 'H.D. Carlton',
                image_couverture: '/placeholder-book.svg'
              },
              status: 'ANSWERED',
              likes_count: 45,
              answers_count: 20,
              date_question: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              is_public: true
            }
          ];
          
          setData(simulatedQuestions);
          setError(null);
          return;
        }
        
        const questions = response.data;
        
        // Traiter les données de l'API
        const processedQuestions = questions.map((question: any) => ({
          id: question.id,
          title: question.titre || question.title,
          excerpt: question.contenu?.substring(0, 120) + '...' || question.excerpt,
          author: {
            nom: question.user?.nom_complet || question.author?.nom || 'Anonyme',
            avatar: question.user?.avatar || question.author?.avatar
          },
          book: {
            id: question.book?.id || question.livre?.id,
            titre: question.book?.titre || question.livre?.titre || 'Livre inconnu',
            auteur: question.book?.auteur || question.livre?.auteur || 'Auteur inconnu',
            image_couverture: question.book?.image_couverture || question.livre?.image_couverture
          },
          status: question.status || (question.answers_count > 0 ? "ANSWERED" : "PENDING"),
          likes_count: question._count?.likes || question.likes_count || 0,
          answers_count: question._count?.answers || question.answers_count || 0,
          date_question: question.date_creation || question.date_question || new Date().toISOString(),
          is_public: question.is_public !== false
        }));

        setData(processedQuestions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return { data, isLoading, error };
}