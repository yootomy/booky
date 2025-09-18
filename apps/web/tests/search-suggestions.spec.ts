import { test, expect } from '@playwright/test';

test.describe('Search with Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/books');
  });

  test('should display search box in navbar', async ({ page }) => {
    // Vérifier que la search box est visible sur desktop
    const searchBox = page.locator('[placeholder*="Rechercher un livre"]');
    await expect(searchBox).toBeVisible();
  });

  test('should show suggestions when typing', async ({ page }) => {
    // Intercepter l'API de suggestions
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [
            {
              type: 'book',
              id: 'book-1',
              title: 'Dark Romance Test',
              author: 'Test Author',
              cover: '/test-cover.jpg'
            },
            {
              type: 'author',
              id: 'author-1',
              name: 'Test Author'
            },
            {
              type: 'tag',
              id: 'tag-1',
              label: 'Dark Romance'
            }
          ]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    
    // Taper dans le champ de recherche
    await searchInput.fill('dark');
    
    // Attendre que les suggestions apparaissent
    const suggestionsContainer = page.locator('[role="listbox"]');
    await expect(suggestionsContainer).toBeVisible();
    
    // Vérifier que les suggestions contiennent les bons éléments
    const bookSuggestion = page.locator('[role="option"]').filter({ hasText: 'Dark Romance Test' });
    const authorSuggestion = page.locator('[role="option"]').filter({ hasText: 'Test Author' });
    const tagSuggestion = page.locator('[role="option"]').filter({ hasText: 'Dark Romance' });
    
    await expect(bookSuggestion).toBeVisible();
    await expect(authorSuggestion).toBeVisible();
    await expect(tagSuggestion).toBeVisible();
  });

  test('should highlight search terms in suggestions', async ({ page }) => {
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [{
            type: 'book',
            id: 'book-1',
            title: 'Dark Romance Novel',
            author: 'Romance Author'
          }]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('romance');
    
    // Vérifier que le terme est surligné
    const highlightedText = page.locator('mark').filter({ hasText: 'Romance' });
    await expect(highlightedText).toBeVisible();
  });

  test('should navigate with keyboard arrows', async ({ page }) => {
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [
            { type: 'book', id: 'book-1', title: 'Book 1', author: 'Author 1' },
            { type: 'book', id: 'book-2', title: 'Book 2', author: 'Author 2' },
            { type: 'book', id: 'book-3', title: 'Book 3', author: 'Author 3' }
          ]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('book');
    
    // Attendre les suggestions
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    
    // Naviguer avec les flèches
    await searchInput.press('ArrowDown');
    
    // Le premier élément doit être sélectionné
    const firstOption = page.locator('[role="option"]').first();
    await expect(firstOption).toHaveClass(/bg-accent/);
    
    // Naviguer vers le deuxième
    await searchInput.press('ArrowDown');
    const secondOption = page.locator('[role="option"]').nth(1);
    await expect(secondOption).toHaveClass(/bg-accent/);
    
    // Remonter
    await searchInput.press('ArrowUp');
    await expect(firstOption).toHaveClass(/bg-accent/);
  });

  test('should select suggestion with Enter key', async ({ page }) => {
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [{
            type: 'book',
            id: 'test-book-123',
            title: 'Test Book',
            author: 'Test Author'
          }]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('test');
    
    // Attendre les suggestions et naviguer
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    await searchInput.press('ArrowDown');
    
    // Appuyer sur Entrée pour sélectionner
    await searchInput.press('Enter');
    
    // Doit naviguer vers la page du livre
    await expect(page).toHaveURL(/\/books\/test-book-123/);
  });

  test('should close suggestions with Escape key', async ({ page }) => {
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [{
            type: 'book',
            id: 'book-1',
            title: 'Test Book',
            author: 'Test Author'
          }]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('test');
    
    // Vérifier que les suggestions sont visibles
    const suggestionsContainer = page.locator('[role="listbox"]');
    await expect(suggestionsContainer).toBeVisible();
    
    // Appuyer sur Escape
    await searchInput.press('Escape');
    
    // Les suggestions doivent disparaître
    await expect(suggestionsContainer).not.toBeVisible();
  });

  test('should complete search term with Tab key', async ({ page }) => {
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [{
            type: 'book',
            id: 'book-1',
            title: 'Complete Book Title',
            author: 'Complete Author'
          }]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('comp');
    
    // Attendre les suggestions et naviguer
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    await searchInput.press('ArrowDown');
    
    // Utiliser Tab pour compléter
    await searchInput.press('Tab');
    
    // Le champ doit contenir le titre complet
    await expect(searchInput).toHaveValue('Complete Book Title');
  });

  test('should show "no results" when no suggestions found', async ({ page }) => {
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: { items: [] }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('xyznoresults');
    
    // Attendre et vérifier le message "aucun résultat"
    await expect(page.locator('text=Aucun résultat')).toBeVisible();
    await expect(page.locator('text=Essayez avec d\'autres termes')).toBeVisible();
  });

  test('should perform full search when submitting', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('romance');
    
    // Soumettre la recherche
    await searchInput.press('Enter');
    
    // Doit naviguer vers la page de catalogue avec le paramètre q
    await expect(page).toHaveURL(/\/books\?q=romance/);
  });

  test('should click on suggestions to navigate', async ({ page }) => {
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [
            {
              type: 'book',
              id: 'clickable-book',
              title: 'Clickable Book',
              author: 'Author Name'
            },
            {
              type: 'author',
              id: 'author-123',
              name: 'Clickable Author'
            },
            {
              type: 'tag',
              id: 'tag-123',
              label: 'Clickable Tag'
            }
          ]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('click');
    
    await expect(page.locator('[role="listbox"]')).toBeVisible();
    
    // Cliquer sur le livre
    await page.locator('text=Clickable Book').click();
    await expect(page).toHaveURL(/\/books\/clickable-book/);
    
    // Revenir et tester l'auteur
    await page.goBack();
    await searchInput.fill('click');
    await page.locator('text=Clickable Author').click();
    await expect(page).toHaveURL(/\/books\?author=Clickable%20Author/);
    
    // Revenir et tester le tag
    await page.goBack();
    await searchInput.fill('click');
    await page.locator('text=Clickable Tag').click();
    await expect(page).toHaveURL(/\/books\?tag=tag-123/);
  });

  test('should clear search with X button', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('test search');
    
    // Vérifier que le bouton X est visible
    const clearButton = page.locator('[aria-label="Effacer la recherche"]');
    await expect(clearButton).toBeVisible();
    
    // Cliquer pour effacer
    await clearButton.click();
    
    // Le champ doit être vide
    await expect(searchInput).toHaveValue('');
  });

  test('should be mobile responsive', async ({ page }) => {
    // Simuler un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Sur mobile, la recherche doit être dans le menu hamburger
    const mobileMenuButton = page.locator('[aria-label="Menu"]');
    await mobileMenuButton.click();
    
    // Chercher le champ de recherche dans le menu mobile
    const mobileSearch = page.locator('[placeholder*="Rechercher"]');
    await expect(mobileSearch).toBeVisible();
    
    // Le test des suggestions doit fonctionner sur mobile aussi
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        json: {
          items: [{
            type: 'book',
            id: 'mobile-book',
            title: 'Mobile Test Book',
            author: 'Mobile Author'
          }]
        }
      });
    });
    
    await mobileSearch.fill('mobile');
    await expect(page.locator('[role="listbox"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Simuler une erreur d'API
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Server error' }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('error');
    
    // Doit afficher un message d'erreur ou ne pas planter
    await expect(searchInput).toBeEnabled();
    
    // Après un délai, aucune suggestion ne doit apparaître
    await page.waitForTimeout(500);
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });

  test('should show loading state while fetching', async ({ page }) => {
    // Simuler une réponse lente
    await page.route('**/api/proxy/search/suggest**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        json: {
          items: [{
            type: 'book',
            id: 'slow-book',
            title: 'Slow Loading Book',
            author: 'Slow Author'
          }]
        }
      });
    });

    const searchInput = page.locator('[placeholder*="Rechercher un livre"]');
    await searchInput.fill('slow');
    
    // Doit montrer un indicateur de chargement
    await expect(page.locator('text=Recherche en cours')).toBeVisible();
    
    // Puis montrer les résultats
    await expect(page.locator('text=Slow Loading Book')).toBeVisible();
  });
});