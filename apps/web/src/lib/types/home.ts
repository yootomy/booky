type BookRhythm = 'SLOW_BURN' | 'MEDIUM_BURN' | 'FAST_PACE' | 'INSTA_LOVE';
type BookStatus = 'PAS_LU' | 'EN_COURS' | 'LU' | 'ABANDONNE';

// Book types for homepage
export interface HomeBook {
  id: string;
  titre: string;
  auteur: string;
  isbn?: string;
  image_couverture?: string;
  note_generale: number;
  niveau_spicy: number;
  niveau_dark: number;
  niveau_romance: number;
  rythme: BookRhythm;
  statut: BookStatus;
  date_lecture?: Date;
  resume_personnel?: string;
  pourquoi_aimer?: string;
  citations_favorites?: string;
  sagaId?: string;
  sagaOrder?: number;
  date_creation: Date;
  saga?: {
    id: string;
    name: string;
    status: string;
  };
  _count?: {
    book_favorite: number;
  };
}

// Stats types
export interface HomeStats {
  total_books: number;
  books_lu: number;
  books_en_cours: number;
  books_a_lire: number;
  note_moyenne: number;
  total_sagas: number;
}

// Tag types
export interface HomeTag {
  id: string;
  nom: string;
  type: 'GENRE' | 'TROPE' | 'TRIGGER';
  couleur?: string;
  utilisation_count: number;
}

// Question types
export interface HomeQuestion {
  id: string;
  question: string;
  reponse?: string;
  date_question: Date;
  status: 'PENDING' | 'ANSWERED' | 'REJECTED';
  book: {
    id: string;
    titre: string;
  };
  user: {
    id: string;
    nom_complet?: string;
    email: string;
  };
}

// Category types
export interface HomeCategory {
  id: string;
  nom: string;
  couleur?: string;
  ordre_affichage: number;
  _count: {
    book_category: number;
  };
}

// Saga types
export interface HomeSaga {
  id: string;
  name: string;
  status: string;
  books: HomeBook[];
}

// Carousel data types
export interface CarouselSection {
  title: string;
  books: HomeBook[];
  showViewAll?: boolean;
  href?: string;
}

// Filter types
export interface BookFilter {
  genres: string[];
  tropes: string[];
  triggers: string[];
  rhythms: BookRhythm[];
  minSpicy?: number;
  maxSpicy?: number;
  minDark?: number;
  maxDark?: number;
  minRomance?: number;
  maxRomance?: number;
}

// Search types
export interface SearchSuggestion {
  type: 'book' | 'author' | 'tag';
  id: string;
  text: string;
  subtitle?: string;
}

// Personalization types
export interface UserProfile {
  favoriteGenres: HomeTag[];
  favoriteRhythms: BookRhythm[];
  averageRating: number;
  readingHistory: HomeBook[];
}

// Component props types
export interface BookCardProps {
  book: HomeBook;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
  className?: string;
}

export interface RatingChipsProps {
  spicy: number;
  dark: number;
  romance: number;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

export interface RhythmBadgeProps {
  rhythm: BookRhythm;
  size?: 'sm' | 'md';
}

export interface SagaPillProps {
  sagaName: string;
  tomeNumber: number;
  size?: 'sm' | 'md';
}

// API response types
export interface HomeDataResponse {
  stats: HomeStats;
  spotlightBook: HomeBook | null;
  recentReads: HomeBook[];
  carousels: {
    nouveautes: HomeBook[];
    meilleuresNotes: HomeBook[];
    sagasEnCours: HomeSaga[];
    darkSpicy: HomeBook[];
  };
  popularTags: {
    genres: HomeTag[];
    tropes: HomeTag[];
    triggers: HomeTag[];
  };
  recentQuestions: HomeQuestion[];
  popularCategories: HomeCategory[];
  featuredQuote?: {
    text: string;
    bookTitle: string;
    bookId: string;
  };
  personalizedBooks?: HomeBook[];
}

// Hook return types
export interface UseHomeDataReturn {
  data: HomeDataResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseBookFiltersReturn {
  filters: BookFilter;
  filteredBooks: HomeBook[];
  isLoading: boolean;
  updateFilters: (newFilters: Partial<BookFilter>) => void;
  clearFilters: () => void;
}

export interface UseRandomPickReturn {
  randomBook: HomeBook | null;
  isLoading: boolean;
  pickRandom: () => void;
}

// Mood presets
export interface MoodPreset {
  id: string;
  label: string;
  description: string;
  filters: Partial<BookFilter>;
  icon?: string;
}

export const MOOD_PRESETS: MoodPreset[] = [
  {
    id: 'very-dark-slow',
    label: 'Very Dark + Slow Burn',
    description: 'Sombre et intense, développement lent',
    filters: {
      minDark: 7,
      rhythms: ['SLOW_BURN']
    }
  },
  {
    id: 'enemies-to-lovers',
    label: 'Enemies to Lovers',
    description: 'De la haine à l\'amour',
    filters: {
      tropes: ['enemies-to-lovers']
    }
  },
  {
    id: 'gothic-romance',
    label: 'Gothic Romance',
    description: 'Romance gothique mystérieuse',
    filters: {
      genres: ['gothic'],
      minDark: 5,
      minRomance: 6
    }
  },
  {
    id: 'spicy-fast',
    label: 'Hot & Fast',
    description: 'Sensuel et rythmé',
    filters: {
      minSpicy: 7,
      rhythms: ['FAST_PACE']
    }
  }
];