/**
 * Utilitaires pour transformer les types Book de l'API en BookData pour les composants UI
 */

import type { Book } from '@/types/book';
import type { BookData } from '@/components/books/book-card';
import type { BookStatusType } from '@/components/books/book-status';

/**
 * Transforme un Book de l'API en BookData pour BookCard
 */
export function transformBookForCard(book: Book): BookData {
  return {
    id: book.id,
    titre: book.titre,
    auteur: book.auteur,
    image_couverture: book.image_couverture,
    statut: book.statut as BookStatusType,
    note_generale: book.note_generale,
    niveau_spicy: book.niveau_spicy,
    niveau_dark: book.niveau_dark,
    niveau_romance: book.niveau_romance,
    resume_personnel: book.resume_personnel,
    resume_officiel: book.resume_officiel,
    date_creation: new Date(book.date_creation),
    date_lecture: book.date_lecture ? new Date(book.date_lecture) : null,
    nombre_pages: book.nombre_pages,
    categories: book.categories?.map(cat => ({
      category: {
        id: cat.category.id,
        nom: cat.category.nom,
        couleur: cat.category.couleur,
      }
    })),
    tags: book.tags?.map(tag => ({
      tag: {
        id: tag.tag.id,
        nom: tag.tag.nom,
        couleur: tag.tag.couleur,
        type: tag.tag.type,
      }
    })),
    current_page: undefined, // Not available in Book type
    is_favorite: false, // Not available in Book type
  };
}

/**
 * Transforme un tableau de Books en BookData
 */
export function transformBooksForCards(books: Book[]): BookData[] {
  return books.map(transformBookForCard);
}