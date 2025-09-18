// Fonction pour normaliser les chaînes (accents, casse)
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les diacritiques
}

// Fonction de scoring pour classer les résultats
export function calculateScore(term: string, text: string, type: string): number {
  const normalizedTerm = normalizeString(term);
  const normalizedText = normalizeString(text);
  
  // Bonus selon le type
  const typeBonus = {
    book: 4,
    author: 3,
    category: 2,
    tag: 1
  };
  
  // Match exact = score le plus élevé
  if (normalizedText === normalizedTerm) {
    return 100 + typeBonus[type as keyof typeof typeBonus];
  }
  
  // Commence par le terme
  if (normalizedText.startsWith(normalizedTerm)) {
    return 80 + typeBonus[type as keyof typeof typeBonus];
  }
  
  // Contient le terme
  if (normalizedText.includes(normalizedTerm)) {
    return 60 + typeBonus[type as keyof typeof typeBonus];
  }
  
  // Fuzzy matching simple (distance de Levenshtein approximative)
  const fuzzyScore = calculateFuzzyScore(normalizedTerm, normalizedText);
  if (fuzzyScore > 0.7) {
    return Math.floor(fuzzyScore * 40) + typeBonus[type as keyof typeof typeBonus];
  }
  
  return 0;
}

// Calcul de score fuzzy simplifié
export function calculateFuzzyScore(term: string, text: string): number {
  if (term.length === 0) return text.length === 0 ? 1 : 0;
  if (text.length === 0) return 0;
  
  // Pour les termes courts, on est plus strict
  if (term.length <= 2) {
    return text.includes(term) ? 0.8 : 0;
  }
  
  // Compter les caractères communs dans l'ordre
  let matches = 0;
  let textIndex = 0;
  
  for (let i = 0; i < term.length && textIndex < text.length; i++) {
    while (textIndex < text.length && text[textIndex] !== term[i]) {
      textIndex++;
    }
    if (textIndex < text.length) {
      matches++;
      textIndex++;
    }
  }
  
  return matches / term.length;
}