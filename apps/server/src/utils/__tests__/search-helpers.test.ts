import { normalizeString, calculateScore, calculateFuzzyScore } from '../search-helpers';

describe('Search Helpers', () => {
  describe('normalizeString', () => {
    it('should convert to lowercase', () => {
      expect(normalizeString('HELLO')).toBe('hello');
      expect(normalizeString('Hello')).toBe('hello');
      expect(normalizeString('hELLO')).toBe('hello');
    });

    it('should remove diacritics', () => {
      expect(normalizeString('café')).toBe('cafe');
      expect(normalizeString('naïve')).toBe('naive');
      expect(normalizeString('résumé')).toBe('resume');
      expect(normalizeString('José')).toBe('jose');
      expect(normalizeString('français')).toBe('francais');
    });

    it('should handle empty strings', () => {
      expect(normalizeString('')).toBe('');
    });

    it('should handle strings with no special characters', () => {
      expect(normalizeString('hello world')).toBe('hello world');
      expect(normalizeString('123')).toBe('123');
    });

    it('should handle mixed case and diacritics', () => {
      expect(normalizeString('Café Français')).toBe('cafe francais');
      expect(normalizeString('RÉSUMÉ')).toBe('resume');
    });
  });

  describe('calculateScore', () => {
    it('should give highest score for exact matches', () => {
      const bookScore = calculateScore('test', 'test', 'book');
      const authorScore = calculateScore('test', 'test', 'author');
      const tagScore = calculateScore('test', 'test', 'tag');
      
      expect(bookScore).toBe(104); // 100 + 4 (book bonus)
      expect(authorScore).toBe(103); // 100 + 3 (author bonus)
      expect(tagScore).toBe(101); // 100 + 1 (tag bonus)
    });

    it('should give high score for prefix matches', () => {
      const score = calculateScore('test', 'testing', 'book');
      expect(score).toBe(84); // 80 + 4 (book bonus)
    });

    it('should give medium score for contains matches', () => {
      const score = calculateScore('test', 'my test book', 'book');
      expect(score).toBe(64); // 60 + 4 (book bonus)
    });

    it('should handle case insensitive matching', () => {
      const score1 = calculateScore('test', 'TEST', 'book');
      const score2 = calculateScore('TEST', 'test', 'book');
      
      expect(score1).toBe(104); // Exact match
      expect(score2).toBe(104); // Exact match
    });

    it('should handle diacritics', () => {
      const score = calculateScore('cafe', 'café', 'book');
      expect(score).toBe(104); // Should be exact match after normalization
    });

    it('should return 0 for no matches', () => {
      const score = calculateScore('xyz', 'abc', 'book');
      expect(score).toBe(0);
    });

    it('should prioritize book type over others', () => {
      const bookScore = calculateScore('test', 'test', 'book');
      const authorScore = calculateScore('test', 'test', 'author');
      const categoryScore = calculateScore('test', 'test', 'category');
      const tagScore = calculateScore('test', 'test', 'tag');
      
      expect(bookScore).toBeGreaterThan(authorScore);
      expect(authorScore).toBeGreaterThan(categoryScore);
      expect(categoryScore).toBeGreaterThan(tagScore);
    });
  });

  describe('calculateFuzzyScore', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateFuzzyScore('test', 'test')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(calculateFuzzyScore('abc', 'xyz')).toBe(0);
    });

    it('should handle empty strings', () => {
      expect(calculateFuzzyScore('', '')).toBe(1);
      expect(calculateFuzzyScore('test', '')).toBe(0);
      expect(calculateFuzzyScore('', 'test')).toBe(0);
    });

    it('should return high score for short terms that are contained', () => {
      expect(calculateFuzzyScore('te', 'test')).toBe(0.8);
      expect(calculateFuzzyScore('ab', 'abc')).toBe(0.8);
    });

    it('should return 0 for short terms that are not contained', () => {
      expect(calculateFuzzyScore('xy', 'test')).toBe(0);
    });

    it('should calculate partial matches for longer terms', () => {
      const score = calculateFuzzyScore('test', 'tset'); // 't', 's', 'e', 't' → 3/4 = 0.75
      expect(score).toBeCloseTo(0.75);
    });

    it('should handle character order', () => {
      const score1 = calculateFuzzyScore('abc', 'abcdef'); // Perfect order → 1
      const score2 = calculateFuzzyScore('abc', 'acb'); // 'a', 'c' found, but 'b' after 'c' → 2/3
      
      expect(score1).toBe(1);
      expect(score2).toBeCloseTo(0.67, 1);
    });

    it('should handle repeated characters', () => {
      const score = calculateFuzzyScore('aaa', 'banana'); // Should find 3 'a's
      expect(score).toBe(1);
    });
  });
});

describe('Integration Tests', () => {
  it('should rank suggestions correctly', () => {
    const query = 'dark';
    const suggestions = [
      { text: 'Dark Romance', type: 'category' },
      { text: 'A Dark Secret', type: 'book' },
      { text: 'Darker', type: 'book' },
      { text: 'Dark Academia', type: 'tag' },
      { text: 'Romance Dark', type: 'book' },
    ];

    const scores = suggestions.map(s => ({
      ...s,
      score: calculateScore(query, s.text, s.type)
    }));

    const sorted = scores.sort((a, b) => b.score - a.score);

    // Exact prefix match + book bonus should be highest
    expect(sorted[0].text).toBe('Darker');
    expect(sorted[0].type).toBe('book');
    
    // Then other prefix matches, sorted by type bonus
    expect(sorted.filter(s => s.text.toLowerCase().startsWith('dark')).length).toBeGreaterThan(0);
  });
});