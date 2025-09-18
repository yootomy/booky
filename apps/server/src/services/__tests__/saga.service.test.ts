import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SagaService } from '../saga.service';
import prisma from '../../../prisma/index';

// Mock Prisma
vi.mock('../../../prisma/index', () => ({
  default: {
    saga: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    book: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('SagaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =============================================================================
  // TESTS CRÉATION DE SAGA
  // =============================================================================
  
  describe('createSaga', () => {
    it('should create a saga with generated slug', async () => {
      const mockSaga = {
        id: 'saga-1',
        name: 'Test Saga',
        slug: 'test-saga',
        description: 'Test description',
        status: 'ONGOING',
        createdAt: new Date(),
        updatedAt: new Date(),
        books: []
      };

      (prisma.saga.findUnique as any).mockResolvedValue(null);
      (prisma.saga.create as any).mockResolvedValue(mockSaga);

      const input = {
        name: 'Test Saga',
        description: 'Test description',
        status: 'ONGOING' as const
      };

      const result = await SagaService.createSaga(input);

      expect(prisma.saga.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-saga' }
      });
      expect(prisma.saga.create).toHaveBeenCalledWith({
        data: {
          ...input,
          slug: 'test-saga'
        },
        include: {
          books: {
            select: {
              id: true,
              titre: true,
              sagaOrder: true,
            },
            orderBy: {
              sagaOrder: 'asc'
            }
          }
        }
      });
      expect(result).toEqual(mockSaga);
    });

    it('should handle slug collision by adding suffix', async () => {
      const mockExistingSaga = { id: 'existing-saga', slug: 'test-saga' };
      const mockNewSaga = {
        id: 'new-saga',
        name: 'Test Saga',
        slug: 'test-saga-1',
        books: []
      };

      (prisma.saga.findUnique as any)
        .mockResolvedValueOnce(mockExistingSaga) // Premier appel - slug existe
        .mockResolvedValueOnce(null); // Deuxième appel - slug-1 disponible
      (prisma.saga.create as any).mockResolvedValue(mockNewSaga);

      const input = {
        name: 'Test Saga',
        slug: 'test-saga',
        status: 'ONGOING' as const
      };

      const result = await SagaService.createSaga(input);

      expect(prisma.saga.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.saga.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'test-saga-1'
          })
        })
      );
    });
  });

  // =============================================================================
  // TESTS MISE À JOUR DE SAGA
  // =============================================================================

  describe('updateSaga', () => {
    it('should update saga successfully', async () => {
      const mockUpdatedSaga = {
        id: 'saga-1',
        name: 'Updated Saga',
        slug: 'updated-saga',
        books: []
      };

      (prisma.saga.update as any).mockResolvedValue(mockUpdatedSaga);

      const result = await SagaService.updateSaga('saga-1', {
        name: 'Updated Saga'
      });

      expect(prisma.saga.update).toHaveBeenCalledWith({
        where: { id: 'saga-1' },
        data: { name: 'Updated Saga' },
        include: {
          books: {
            select: {
              id: true,
              titre: true,
              sagaOrder: true,
            },
            orderBy: {
              sagaOrder: 'asc'
            }
          }
        }
      });
      expect(result).toEqual(mockUpdatedSaga);
    });
  });

  // =============================================================================
  // TESTS RÉCUPÉRATION DE SAGA
  // =============================================================================

  describe('getSagaById', () => {
    it('should return saga with enriched metadata', async () => {
      const mockSaga = {
        id: 'saga-1',
        name: 'Test Saga',
        slug: 'test-saga',
        description: 'Test',
        status: 'ONGOING',
        createdAt: new Date(),
        updatedAt: new Date(),
        books: [
          { id: 'book-1', titre: 'Book 1', auteur: 'Author 1', sagaOrder: 1 },
          { id: 'book-2', titre: 'Book 2', auteur: 'Author 2', sagaOrder: 2 }
        ]
      };

      (prisma.saga.findUnique as any).mockResolvedValue(mockSaga);

      const result = await SagaService.getSagaById('saga-1');

      expect(result).toEqual({
        ...mockSaga,
        bookCount: 2,
        firstBook: { id: 'book-1', titre: 'Book 1', auteur: 'Author 1', sagaOrder: 1 },
        lastBook: { id: 'book-2', titre: 'Book 2', auteur: 'Author 2', sagaOrder: 2 }
      });
    });

    it('should throw error when saga not found', async () => {
      (prisma.saga.findUnique as any).mockResolvedValue(null);

      await expect(SagaService.getSagaById('nonexistent')).rejects.toThrow('Saga non trouvée');
    });
  });

  // =============================================================================
  // TESTS ASSIGNATION DE LIVRES
  // =============================================================================

  describe('assignBookToSaga', () => {
    it('should assign book to saga successfully', async () => {
      const mockSaga = { id: 'saga-1', name: 'Test Saga' };
      const mockBook = { id: 'book-1', titre: 'Test Book' };
      const mockUpdatedBook = { 
        id: 'book-1', 
        titre: 'Test Book',
        sagaId: 'saga-1',
        sagaOrder: 1,
        saga: mockSaga
      };

      (prisma.saga.findUnique as any).mockResolvedValue(mockSaga);
      (prisma.book.findUnique as any).mockResolvedValue(mockBook);
      (prisma.book.findFirst as any).mockResolvedValue(null); // Ordre disponible
      (prisma.book.update as any).mockResolvedValue(mockUpdatedBook);

      const result = await SagaService.assignBookToSaga('book-1', {
        sagaId: 'saga-1',
        sagaOrder: 1
      });

      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: {
          sagaId: 'saga-1',
          sagaOrder: 1
        },
        include: {
          saga: true
        }
      });
      expect(result).toEqual(mockUpdatedBook);
    });

    it('should throw error when saga not found', async () => {
      (prisma.saga.findUnique as any).mockResolvedValue(null);

      await expect(SagaService.assignBookToSaga('book-1', {
        sagaId: 'nonexistent',
        sagaOrder: 1
      })).rejects.toThrow('Saga non trouvée');
    });

    it('should throw error when book not found', async () => {
      const mockSaga = { id: 'saga-1', name: 'Test Saga' };
      
      (prisma.saga.findUnique as any).mockResolvedValue(mockSaga);
      (prisma.book.findUnique as any).mockResolvedValue(null);

      await expect(SagaService.assignBookToSaga('nonexistent', {
        sagaId: 'saga-1',
        sagaOrder: 1
      })).rejects.toThrow('Livre non trouvé');
    });

    it('should throw error when order already taken', async () => {
      const mockSaga = { id: 'saga-1', name: 'Test Saga' };
      const mockBook = { id: 'book-1', titre: 'Test Book' };
      const mockExistingBook = { id: 'book-2', titre: 'Existing Book' };

      (prisma.saga.findUnique as any).mockResolvedValue(mockSaga);
      (prisma.book.findUnique as any).mockResolvedValue(mockBook);
      (prisma.book.findFirst as any).mockResolvedValue(mockExistingBook);

      await expect(SagaService.assignBookToSaga('book-1', {
        sagaId: 'saga-1',
        sagaOrder: 1
      })).rejects.toThrow('L\'ordre 1 est déjà occupé');
    });
  });

  // =============================================================================
  // TESTS RETRAIT DE LIVRES DE SAGA
  // =============================================================================

  describe('removeBookFromSaga', () => {
    it('should remove book from saga successfully', async () => {
      const mockBook = { 
        id: 'book-1', 
        titre: 'Test Book',
        sagaId: 'saga-1',
        saga: { id: 'saga-1', name: 'Test Saga' }
      };
      const mockUpdatedBook = { 
        id: 'book-1', 
        titre: 'Test Book',
        sagaId: null,
        sagaOrder: null
      };

      (prisma.book.findUnique as any).mockResolvedValue(mockBook);
      (prisma.book.update as any).mockResolvedValue(mockUpdatedBook);

      const result = await SagaService.removeBookFromSaga('book-1');

      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: {
          sagaId: null,
          sagaOrder: null
        }
      });
      expect(result).toEqual(mockUpdatedBook);
    });

    it('should throw error when book not in saga', async () => {
      const mockBook = { 
        id: 'book-1', 
        titre: 'Test Book',
        sagaId: null
      };

      (prisma.book.findUnique as any).mockResolvedValue(mockBook);

      await expect(SagaService.removeBookFromSaga('book-1')).rejects.toThrow(
        'Ce livre ne fait pas partie d\'une saga'
      );
    });
  });

  // =============================================================================
  // TESTS RÉORGANISATION DE SAGA
  // =============================================================================

  describe('reorderSaga', () => {
    it('should reorder saga books successfully', async () => {
      const mockSaga = {
        id: 'saga-1',
        books: [
          { id: 'book-1' },
          { id: 'book-2' }
        ]
      };
      const mockUpdatedBooks = [
        { id: 'book-1', sagaOrder: 2, saga: mockSaga },
        { id: 'book-2', sagaOrder: 1, saga: mockSaga }
      ];

      (prisma.saga.findUnique as any).mockResolvedValue(mockSaga);
      
      // Mock transaction
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          book: {
            update: vi.fn()
              .mockResolvedValueOnce(mockUpdatedBooks[1]) // book-2 order 1
              .mockResolvedValueOnce(mockUpdatedBooks[0]) // book-1 order 2
          }
        };
        return callback(tx);
      });
      
      (prisma.$transaction as any).mockImplementation(mockTransaction);

      const result = await SagaService.reorderSaga('saga-1', {
        items: [
          { bookId: 'book-2', sagaOrder: 1 },
          { bookId: 'book-1', sagaOrder: 2 }
        ]
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should throw error when book not in saga', async () => {
      const mockSaga = {
        id: 'saga-1',
        books: [{ id: 'book-1' }]
      };

      (prisma.saga.findUnique as any).mockResolvedValue(mockSaga);

      await expect(SagaService.reorderSaga('saga-1', {
        items: [
          { bookId: 'book-2', sagaOrder: 1 } // book-2 not in saga
        ]
      })).rejects.toThrow('ne fait pas partie de cette saga');
    });
  });

  // =============================================================================
  // TESTS VOISINS DE LIVRE
  // =============================================================================

  describe('getSagaNeighbors', () => {
    it('should return neighbors correctly', async () => {
      const mockBook = {
        sagaId: 'saga-1',
        sagaOrder: 2
      };
      const mockPrevious = {
        id: 'book-1',
        titre: 'Book 1',
        sagaOrder: 1
      };
      const mockNext = {
        id: 'book-3',
        titre: 'Book 3',
        sagaOrder: 3
      };

      (prisma.book.findUnique as any).mockResolvedValue(mockBook);
      (prisma.book.findFirst as any)
        .mockResolvedValueOnce(mockPrevious) // Previous
        .mockResolvedValueOnce(mockNext);    // Next

      const result = await SagaService.getSagaNeighbors('book-2');

      expect(result).toEqual({
        previous: {
          id: 'book-1',
          titre: 'Book 1',
          sagaOrder: 1
        },
        next: {
          id: 'book-3',
          titre: 'Book 3',
          sagaOrder: 3
        }
      });
    });

    it('should return empty neighbors when book not in saga', async () => {
      const mockBook = {
        sagaId: null,
        sagaOrder: null
      };

      (prisma.book.findUnique as any).mockResolvedValue(mockBook);

      const result = await SagaService.getSagaNeighbors('book-1');

      expect(result).toEqual({
        previous: undefined,
        next: undefined
      });
    });
  });

  // =============================================================================
  // TESTS UTILITAIRES
  // =============================================================================

  describe('getNextSagaOrder', () => {
    it('should return correct next order', async () => {
      const mockLastBook = { sagaOrder: 3 };
      
      (prisma.book.findFirst as any).mockResolvedValue(mockLastBook);

      const result = await SagaService.getNextSagaOrder('saga-1');

      expect(result).toBe(4);
    });

    it('should return 1 when no books in saga', async () => {
      (prisma.book.findFirst as any).mockResolvedValue(null);

      const result = await SagaService.getNextSagaOrder('saga-1');

      expect(result).toBe(1);
    });
  });

  describe('isOrderAvailable', () => {
    it('should return true when order is available', async () => {
      (prisma.book.findFirst as any).mockResolvedValue(null);

      const result = await SagaService.isOrderAvailable('saga-1', 1);

      expect(result).toBe(true);
    });

    it('should return false when order is taken', async () => {
      const mockExistingBook = { id: 'book-1' };
      
      (prisma.book.findFirst as any).mockResolvedValue(mockExistingBook);

      const result = await SagaService.isOrderAvailable('saga-1', 1);

      expect(result).toBe(false);
    });
  });
});