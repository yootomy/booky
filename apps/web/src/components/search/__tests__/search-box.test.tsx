import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBox } from '../search-box';

// Mock du router Next.js
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock du hook useSearchSuggestions
const mockSuggestions = [
  {
    type: 'book' as const,
    id: "book-1",
    title: "Dark Romance Test",
    author: 'Test Author',
    cover: '/test-cover.jpg'
  },
  {
    type: 'author' as const,
    id: 'author-1',
    name: 'Romance Author'
  },
  {
    type: 'tag' as const,
    id: 'tag-1',
    label: 'Dark Academia'
  }
];

const mockUseSearchSuggestions = {
  suggestions: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  setSearchTerm: jest.fn(),
  clearSuggestions: jest.fn(),
  selectedIndex: -1,
  setSelectedIndex: jest.fn(),
};

jest.mock('../../../hooks/use-search-suggestions', () => ({
  useSearchSuggestions: () => mockUseSearchSuggestions,
}));

describe('SearchBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    Object.assign(mockUseSearchSuggestions, {
      suggestions: [],
      isLoading: false,
      error: null,
      searchTerm: '',
      selectedIndex: -1,
    });
  });

  it('should render search input with placeholder', () => {
    render(<SearchBox placeholder="Test placeholder" />);
    
    const input = screen.getByPlaceholderText("Test placeholder");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('role', 'combobox');
  });

  it('should call setSearchTerm when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    await user.type(input, 'test');
    
    expect(mockUseSearchSuggestions.setSearchTerm).toHaveBeenCalledWith('t');
    expect(mockUseSearchSuggestions.setSearchTerm).toHaveBeenCalledWith('te');
    expect(mockUseSearchSuggestions.setSearchTerm).toHaveBeenCalledWith('tes');
    expect(mockUseSearchSuggestions.setSearchTerm).toHaveBeenCalledWith('test');
  });

  it('should show suggestions when available and focused', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'test',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    // Doit afficher la liste des suggestions
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Dark Romance Test')).toBeInTheDocument();
    expect(screen.getByText('Romance Author')).toBeInTheDocument();
    expect(screen.getByText('Dark Academia')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    Object.assign(mockUseSearchSuggestions, {
      isLoading: true,
      searchTerm: 'test',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    expect(screen.getByText('Recherche en cours...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    Object.assign(mockUseSearchSuggestions, {
      error: 'Test error message',
      searchTerm: 'test',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should show no results message', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: [],
      searchTerm: 'noresults',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    expect(screen.getByText(/Aucun résultat pour/)).toBeInTheDocument();
    expect(screen.getByText(/Essayez avec d'autres termes/)).toBeInTheDocument();
  });

  it('should navigate with arrow keys', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'test',
      selectedIndex: 0,
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    expect(mockUseSearchSuggestions.setSelectedIndex).toHaveBeenCalledWith(1);
  });

  it('should select suggestion with Enter', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'test',
      selectedIndex: 0,
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    
    // Doit naviguer vers la page du livre
    expect(mockPush).toHaveBeenCalledWith('/books/book-1');
  });

  it('should close suggestions with Escape', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'test',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    
    // Les suggestions ne doivent plus être visibles
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should complete term with Tab', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'dark',
      selectedIndex: 0,
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Tab' });
    
    // Doit mettre à jour le terme de recherche avec le titre
    expect(mockUseSearchSuggestions.setSearchTerm).toHaveBeenCalledWith('Dark Romance Test');
  });

  it('should handle suggestion clicks', async () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'test',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    const bookSuggestion = screen.getByText('Dark Romance Test');
    fireEvent.click(bookSuggestion);
    
    expect(mockPush).toHaveBeenCalledWith('/books/book-1');
  });

  it('should handle different suggestion types correctly', async () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'test',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    // Test author suggestion
    const authorSuggestion = screen.getByText('Romance Author');
    fireEvent.click(authorSuggestion);
    expect(mockPush).toHaveBeenCalledWith('/books?author=Romance%20Author');
    
    // Test tag suggestion
    const tagSuggestion = screen.getByText('Dark Academia');
    fireEvent.click(tagSuggestion);
    expect(mockPush).toHaveBeenCalledWith('/books?tag=tag-1');
  });

  it('should submit search on Enter without selection', () => {
    Object.assign(mockUseSearchSuggestions, {
      searchTerm: 'test search',
      selectedIndex: -1,
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockPush).toHaveBeenCalledWith('/books?q=test%20search');
  });

  it('should clear search when clicking clear button', async () => {
    Object.assign(mockUseSearchSuggestions, {
      searchTerm: 'test',
    });

    render(<SearchBox />);
    
    const clearButton = screen.getByLabelText('Effacer la recherche');
    fireEvent.click(clearButton);
    
    expect(mockUseSearchSuggestions.setSearchTerm).toHaveBeenCalledWith('');
    expect(mockUseSearchSuggestions.clearSuggestions).toHaveBeenCalled();
  });

  it('should call onSearchComplete when provided', () => {
    const onSearchComplete = jest.fn();
    Object.assign(mockUseSearchSuggestions, {
      searchTerm: 'test',
      selectedIndex: -1,
    });

    render(<SearchBox onSearchComplete={onSearchComplete} />);
    
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(onSearchComplete).toHaveBeenCalledWith('test');
  });

  it('should highlight matching terms in suggestions', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'dark',
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    // Doit surligner le terme "Dark" dans "Dark Romance Test"
    const highlightedText = screen.getByText("Dark");
    expect(highlightedText.tagName.toLowerCase()).toBe('mark');
  });

  it('should render compact variant', () => {
    render(<SearchBox variant="compact" />);
    
    const input = screen.getByRole("combobox");
    expect(input).toHaveClass('h-9'); // Compact height
  });

  it('should have proper ARIA attributes', () => {
    Object.assign(mockUseSearchSuggestions, {
      suggestions: mockSuggestions,
      searchTerm: 'test',
      selectedIndex: 1,
    });

    render(<SearchBox />);
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-owns', 'search-suggestions');
    expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-1');
    
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Suggestions de recherche');
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });
});