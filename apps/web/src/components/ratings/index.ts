/**
 * Index des composants de rating - Système de notation custom Dark Romance
 */

// Star Rating - Note générale (1-10)
export {
  StarRating,
  StarDisplay,
  useStarRating,
  type StarRatingProps,
} from "./star-rating";

// Spicy Rating - Niveau épicé (1-10) 🌶️
export {
  SpicyRating,
  SpicyDisplay,
  SpicyBadge,
  useSpicyRating,
  type SpicyRatingProps,
} from "./spicy-rating";

// Dark Rating - Niveau sombre (1-10) 💀
export {
  DarkRating,
  DarkDisplay,
  DarkBadge,
  useDarkRating,
  type DarkRatingProps,
} from "./dark-rating";

// Romance Rating - Niveau romantique (1-10) ❤️
export {
  RomanceRating,
  RomanceDisplay,
  RomanceBadge,
  useRomanceRating,
  type RomanceRatingProps,
} from "./romance-rating";

// Rhythm Selector - Sélecteur de rythme ⚡
export {
  RhythmSelector,
  RhythmDisplay,
  RhythmBadge,
  useRhythm,
  rhythmOptions,
  type RhythmSelectorProps,
  type RhythmValue,
  type RhythmOption,
} from "./rhythm-selector";

// Multi Rating Display - Affichage combiné
export {
  MultiRatingDisplay,
  RatingCard,
  RatingComparison,
  useRatingStats,
  type MultiRatingDisplayProps,
  type MultiRatingData,
} from "./multi-rating-display";