import { describe, it, expect } from 'vitest';
import {
  CreateSagaSchema,
  UpdateSagaSchema,
  AssignBookToSagaSchema,
  ReorderSagaSchema,
  SagaFiltersSchema,
  SagaBooksFiltersSchema,
  generateSlug
} from '../saga.schemas';

describe('Saga Schemas', () => {
  
  // =============================================================================
  // TESTS GÉNÉRATION DE SLUG
  // =============================================================================
  
  describe('generateSlug', () => {
    it('should generate correct slug from name', () => {
      expect(generateSlug('Dark Romance Collection')).toBe('dark-romance-collection');
      expect(generateSlug('The Seven Husbands of Evelyn Hugo')).toBe('the-seven-husbands-of-evelyn-hugo');
      expect(generateSlug('   Spaced   Out   ')).toBe('spaced-out');
    });

    it('should handle special characters', () => {
      expect(generateSlug('Café & Théâtre')).toBe('cafe-theatre');
      expect(generateSlug('L\'Étranger')).toBe('l-etranger');
      expect(generateSlug('100% Romance!')).toBe('100-romance');
    });

    it('should handle edge cases', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug('   ')).toBe('');
      expect(generateSlug('---')).toBe('');
      expect(generateSlug('a-b--c---d')).toBe('a-b-c-d');
    });
  });

  // =============================================================================
  // TESTS SCHÉMA CRÉATION DE SAGA
  // =============================================================================
  
  describe('CreateSagaSchema', () => {
    it('should validate correct saga data', () => {
      const validData = {
        name: 'Dark Romance Collection',
        description: 'A collection of dark romance novels',
        status: 'ONGOING' as const
      };

      const result = CreateSagaSchema.parse(validData);

      expect(result).toEqual({
        ...validData,
        slug: 'dark-romance-collection'
      });
    });

    it('should auto-generate slug when not provided', () => {
      const data = {
        name: 'Test Saga'
      };

      const result = CreateSagaSchema.parse(data);

      expect(result.slug).toBe('test-saga');
    });

    it('should use provided slug when valid', () => {
      const data = {
        name: 'Test Saga',
        slug: 'custom-slug'
      };

      const result = CreateSagaSchema.parse(data);

      expect(result.slug).toBe('custom-slug');
    });

    it('should set default status to ONGOING', () => {
      const data = {
        name: 'Test Saga'
      };

      const result = CreateSagaSchema.parse(data);

      expect(result.status).toBe('ONGOING');
    });

    it('should handle empty description', () => {
      const data = {
        name: 'Test Saga',
        description: ''
      };

      const result = CreateSagaSchema.parse(data);

      expect(result.description).toBeUndefined();
    });

    it('should reject invalid name', () => {
      expect(() => CreateSagaSchema.parse({ name: 'a' })).toThrow();
      expect(() => CreateSagaSchema.parse({ name: '' })).toThrow();
      expect(() => CreateSagaSchema.parse({ name: 'a'.repeat(201) })).toThrow();
    });

    it('should reject invalid slug', () => {
      expect(() => CreateSagaSchema.parse({ 
        name: 'Test', 
        slug: 'Invalid Slug!' 
      })).toThrow();
      
      expect(() => CreateSagaSchema.parse({ 
        name: 'Test', 
        slug: 'UPPERCASE' 
      })).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => CreateSagaSchema.parse({ 
        name: 'Test', 
        status: 'INVALID' 
      })).toThrow();
    });

    it('should reject description too long', () => {
      expect(() => CreateSagaSchema.parse({ 
        name: 'Test', 
        description: 'x'.repeat(1001) 
      })).toThrow();
    });
  });

  // =============================================================================
  // TESTS SCHÉMA MISE À JOUR DE SAGA
  // =============================================================================

  describe('UpdateSagaSchema', () => {
    it('should validate partial updates', () => {
      const validData = {
        id: 'clxy1234567890',
        name: 'Updated Name'
      };

      const result = UpdateSagaSchema.parse(validData);

      expect(result).toEqual({
        id: 'clxy1234567890',
        name: 'Updated Name',
        slug: 'updated-name'
      });
    });

    it('should require valid CUID for id', () => {
      expect(() => UpdateSagaSchema.parse({ 
        id: 'invalid-id', 
        name: 'Test' 
      })).toThrow();
    });
  });

  // =============================================================================
  // TESTS SCHÉMA ASSIGNATION DE LIVRE
  // =============================================================================

  describe('AssignBookToSagaSchema', () => {
    it('should validate correct assignment data', () => {
      const validData = {
        sagaId: 'clxy1234567890',
        sagaOrder: 1
      };

      const result = AssignBookToSagaSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should reject invalid sagaId', () => {
      expect(() => AssignBookToSagaSchema.parse({ 
        sagaId: 'invalid', 
        sagaOrder: 1 
      })).toThrow();
    });

    it('should reject invalid sagaOrder', () => {
      expect(() => AssignBookToSagaSchema.parse({ 
        sagaId: 'clxy1234567890', 
        sagaOrder: 0 
      })).toThrow();

      expect(() => AssignBookToSagaSchema.parse({ 
        sagaId: 'clxy1234567890', 
        sagaOrder: -1 
      })).toThrow();

      expect(() => AssignBookToSagaSchema.parse({ 
        sagaId: 'clxy1234567890', 
        sagaOrder: 1.5 
      })).toThrow();
    });
  });

  // =============================================================================
  // TESTS SCHÉMA RÉORGANISATION
  // =============================================================================

  describe('ReorderSagaSchema', () => {
    it('should validate correct reorder data', () => {
      const validData = {
        items: [
          { bookId: 'clxy1234567890', sagaOrder: 1 },
          { bookId: 'clxy1234567891', sagaOrder: 2 }
        ]
      };

      const result = ReorderSagaSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should reject duplicate bookIds', () => {
      const duplicateBookIds = {
        items: [
          { bookId: 'clxy1234567890', sagaOrder: 1 },
          { bookId: 'clxy1234567890', sagaOrder: 2 }
        ]
      };

      expect(() => ReorderSagaSchema.parse(duplicateBookIds)).toThrow(
        'Chaque livre ne peut apparaître qu\'une seule fois'
      );
    });

    it('should reject duplicate sagaOrders', () => {
      const duplicateOrders = {
        items: [
          { bookId: 'clxy1234567890', sagaOrder: 1 },
          { bookId: 'clxy1234567891', sagaOrder: 1 }
        ]
      };

      expect(() => ReorderSagaSchema.parse(duplicateOrders)).toThrow(
        'Chaque ordre doit être unique'
      );
    });

    it('should reject empty items array', () => {
      expect(() => ReorderSagaSchema.parse({ items: [] })).toThrow();
    });

    it('should reject too many items', () => {
      const tooManyItems = {
        items: Array.from({ length: 101 }, (_, i) => ({
          bookId: `clxy${i.toString().padStart(10, '0')}`,
          sagaOrder: i + 1
        }))
      };

      expect(() => ReorderSagaSchema.parse(tooManyItems)).toThrow();
    });

    it('should reject invalid bookId format', () => {
      const invalidBookId = {
        items: [
          { bookId: 'invalid-id', sagaOrder: 1 }
        ]
      };

      expect(() => ReorderSagaSchema.parse(invalidBookId)).toThrow();
    });

    it('should reject invalid sagaOrder', () => {
      const invalidOrder = {
        items: [
          { bookId: 'clxy1234567890', sagaOrder: 0 }
        ]
      };

      expect(() => ReorderSagaSchema.parse(invalidOrder)).toThrow();
    });
  });

  // =============================================================================
  // TESTS SCHÉMAS DE FILTRAGE
  // =============================================================================

  describe('SagaFiltersSchema', () => {
    it('should validate correct filters', () => {
      const validFilters = {
        page: '2',
        pageSize: '20',
        search: 'dark romance',
        status: 'ONGOING' as const
      };

      const result = SagaFiltersSchema.parse(validFilters);

      expect(result).toEqual({
        page: 2,
        pageSize: 20,
        search: 'dark romance',
        status: 'ONGOING'
      });
    });

    it('should set default values', () => {
      const result = SagaFiltersSchema.parse({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should reject invalid page values', () => {
      expect(() => SagaFiltersSchema.parse({ page: '0' })).toThrow();
      expect(() => SagaFiltersSchema.parse({ page: 'abc' })).toThrow();
    });

    it('should reject invalid pageSize values', () => {
      expect(() => SagaFiltersSchema.parse({ pageSize: '0' })).toThrow();
      expect(() => SagaFiltersSchema.parse({ pageSize: '101' })).toThrow();
    });

    it('should reject search too short or too long', () => {
      expect(() => SagaFiltersSchema.parse({ search: '' })).toThrow();
      expect(() => SagaFiltersSchema.parse({ search: 'x'.repeat(101) })).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => SagaFiltersSchema.parse({ status: 'INVALID' })).toThrow();
    });
  });

  describe('SagaBooksFiltersSchema', () => {
    it('should validate book filters', () => {
      const validFilters = {
        page: '1',
        pageSize: '10',
        include_categories: 'true',
        include_tags: 'false'
      };

      const result = SagaBooksFiltersSchema.parse(validFilters);

      expect(result).toEqual({
        page: 1,
        pageSize: 10,
        include_categories: true,
        include_tags: false
      });
    });

    it('should handle boolean transforms', () => {
      const filters = {
        include_categories: 'true',
        include_tags: 'false'
      };

      const result = SagaBooksFiltersSchema.parse(filters);

      expect(result.include_categories).toBe(true);
      expect(result.include_tags).toBe(false);
    });

    it('should handle missing boolean fields', () => {
      const result = SagaBooksFiltersSchema.parse({});

      expect(result.include_categories).toBeUndefined();
      expect(result.include_tags).toBeUndefined();
    });
  });

  // =============================================================================
  // TESTS EDGE CASES ET VALIDATION STRICTE
  // =============================================================================

  describe('Strict validation', () => {
    it('should reject extra fields in CreateSagaSchema', () => {
      const dataWithExtraFields = {
        name: 'Test Saga',
        extraField: 'should be rejected'
      };

      expect(() => CreateSagaSchema.parse(dataWithExtraFields)).toThrow();
    });

    it('should reject extra fields in AssignBookToSagaSchema', () => {
      const dataWithExtraFields = {
        sagaId: 'clxy1234567890',
        sagaOrder: 1,
        extraField: 'should be rejected'
      };

      expect(() => AssignBookToSagaSchema.parse(dataWithExtraFields)).toThrow();
    });

    it('should reject extra fields in ReorderSagaSchema', () => {
      const dataWithExtraFields = {
        items: [
          { bookId: 'clxy1234567890', sagaOrder: 1 }
        ],
        extraField: 'should be rejected'
      };

      expect(() => ReorderSagaSchema.parse(dataWithExtraFields)).toThrow();
    });
  });
});