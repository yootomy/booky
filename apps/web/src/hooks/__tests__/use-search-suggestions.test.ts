import { renderHook, waitFor } from '@testing-library/react';
import { useSearchSuggestions } from '../use-search-suggestions';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock du hook useDebounce
jest.mock('../use-debounce', () => ({
  useDebounce: (value: string, _delay: number) => value, // Retourne immédiatement la valeur pour les tests
}));

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Nettoyer le cache entre les tests
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useSearchSuggestions());

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.searchTerm).toBe('');
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('should not fetch suggestions for short queries', async () => {
    const { result } = renderHook(() => useSearchSuggestions({ minQueryLength: 2 }));

    result.current.setSearchTerm('a');

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.suggestions).toEqual([]);
    });
  });

  it('should fetch suggestions for valid queries', async () => {
    const mockResponse = {
      items: [
        {
          type: 'book',
          id: "book-1",
          title: "Test Book",
          author: 'Test Author',
          cover: 'test-cover.jpg'
        },
        {
          type: 'author',
          id: 'author-1',
          name: 'Test Author'
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useSearchSuggestions());

    result.current.setSearchTerm('test');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/search/suggest?q=test&limit=8',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result.current.suggestions).toEqual(mockResponse.items);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSearchSuggestions());

    result.current.setSearchTerm('test');

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Erreur lors du chargement des suggestions');
    });
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useSearchSuggestions());

    result.current.setSearchTerm('test');

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Erreur lors du chargement des suggestions');
    });
  });

  it('should clear suggestions when clearSuggestions is called', () => {
    const { result } = renderHook(() => useSearchSuggestions());

    // Simuler qu'on a des suggestions
    result.current.setSearchTerm('test');
    result.current.setSelectedIndex(1);

    result.current.clearSuggestions();

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.selectedIndex).toBe(-1);
    expect(result.current.error).toBeNull();
  });

  it('should manage selected index correctly', () => {
    const { result } = renderHook(() => useSearchSuggestions());

    expect(result.current.selectedIndex).toBe(-1);

    result.current.setSelectedIndex(2);
    expect(result.current.selectedIndex).toBe(2);

    result.current.setSelectedIndex(-1);
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('should respect custom options', async () => {
    const mockResponse = { items: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => 
      useSearchSuggestions({
        minQueryLength: 3,
        maxSuggestions: 5,
        enabled: true
      })
    );

    result.current.setSearchTerm('te'); // Moins que minQueryLength
    
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });

    result.current.setSearchTerm('test'); // Plus que minQueryLength

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proxy/search/suggest?q=test&limit=5',
        expect.any(Object)
      );
    });
  });

  it('should not fetch when disabled', async () => {
    const { result } = renderHook(() => 
      useSearchSuggestions({ enabled: false })
    );

    result.current.setSearchTerm('test');

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.suggestions).toEqual([]);
    });
  });
});