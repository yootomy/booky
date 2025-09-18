// Types complets pour éviter les erreurs
type Book = { 
  id: string; titre: string; auteur: string; statut: string; 
  note_generale?: number; niveau_spicy?: number; niveau_dark?: number; niveau_romance?: number; 
  resume_personnel?: string | null; resume_officiel?: string | null; isbn?: string | null; date_creation: Date; date_modification: Date;
  editeur?: string; date_publication?: Date | null; nombre_pages?: number; langue?: string; image_couverture?: string;
  google_books_id?: string; open_library_id?: string; ajout_manuel: boolean; intensite_emotionnelle?: number;
  danger?: number; violence?: number; originalite?: number; rythme?: string; date_lecture?: Date | null;
  critique_detaillee?: string; citations_favorites?: string; pourquoi_aimer?: string; questions_sur_le_livre?: string;
  categories?: any; tags?: any; 
};
type Category = { id: string; nom: string; couleur: string; icone?: string; date_creation: Date; };
type Tag = { id: string; nom: string; couleur: string; type: string; };
type BookCategory = { bookId: string; categoryId: string; category: Category; };
type BookTag = { bookId: string; tagId: string; tag: Tag; dateAssociation?: Date; };

// =============================================================================
// 🔧 EXPORT UTILITIES - HELPERS POUR L'EXPORT DE DONNÉES
// =============================================================================

// Types pour les exports
export type BookWithRelations = Book & {
  book_category: (BookCategory & {
    category: Category;
  })[];
  book_tag: (BookTag & {
    tag: Tag;
  })[];
};

export interface ExportOptions {
  include_metadata?: boolean;
  include_relations?: boolean;
  include_personal_notes?: boolean;
  include_ratings?: boolean;
  date_format?: 'iso' | 'french' | 'us';
  fields_selection?: string[];
  compression?: boolean;
}

export interface ExportMetadata {
  export_date: string;
  export_type: string;
  total_books: number;
  user_id: string;
  format_version: string;
  filters_applied: any;
  generation_time_ms: number;
}

// =============================================================================
// 📊 FORMATTERS DE DONNÉES
// =============================================================================

export function formatDateForExport(date: Date | null, format: 'iso' | 'french' | 'us' = 'iso'): string {
  if (!date) return '';
  
  switch (format) {
    case 'french':
      return date.toLocaleDateString('fr-FR');
    case 'us':
      return date.toLocaleDateString('en-US');
    default:
      return date.toISOString().split('T')[0];
  }
}

export function sanitizeForExport(value: any): any {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    // Nettoyer les caractères problématiques pour CSV/JSON
    return value.replace(/[\r\n\t]/g, ' ').trim();
  }
  return value;
}

export function formatBookForExport(
  book: BookWithRelations, 
  options: ExportOptions = {}
): any {
  const {
    include_metadata = true,
    include_relations = true,
    include_personal_notes = true,
    include_ratings = true,
    date_format = 'iso'
  } = options;

  const baseData = {
    id: book.id,
    titre: sanitizeForExport(book.titre),
    auteur: sanitizeForExport(book.auteur),
    isbn: sanitizeForExport(book.isbn),
    statut: book.statut,
    date_creation: formatDateForExport(book.date_creation, date_format),
    date_modification: formatDateForExport(book.date_modification, date_format),
  };

  const exportData: any = { ...baseData };

  if (include_metadata) {
    exportData.editeur = sanitizeForExport(book.editeur);
    exportData.date_publication = formatDateForExport(book.date_publication || null, date_format);
    exportData.nombre_pages = book.nombre_pages;
    exportData.langue = book.langue;
    exportData.resume_officiel = sanitizeForExport(book.resume_officiel);
    exportData.image_couverture = book.image_couverture;
    exportData.google_books_id = book.google_books_id;
    exportData.open_library_id = book.open_library_id;
    exportData.ajout_manuel = book.ajout_manuel;
  }

  if (include_ratings) {
    exportData.note_generale = book.note_generale;
    exportData.niveau_spicy = book.niveau_spicy;
    exportData.niveau_dark = book.niveau_dark;
    exportData.niveau_romance = book.niveau_romance;
    exportData.intensite_emotionnelle = book.intensite_emotionnelle;
    exportData.danger = book.danger;
    exportData.violence = book.violence;
    exportData.originalite = book.originalite;
    exportData.rythme = book.rythme;
  }

  if (include_personal_notes) {
    exportData.date_lecture = formatDateForExport(book.date_lecture || null, date_format);
    exportData.resume_personnel = sanitizeForExport(book.resume_personnel);
    exportData.critique_detaillee = sanitizeForExport(book.critique_detaillee);
    exportData.citations_favorites = sanitizeForExport(book.citations_favorites);
    exportData.pourquoi_aimer = sanitizeForExport(book.pourquoi_aimer);
    exportData.questions_sur_le_livre = sanitizeForExport(book.questions_sur_le_livre);
  }

  if (include_relations) {
    exportData.categories = book.book_category?.map((c: BookCategory & { category: Category }) => c.category.nom).join(', ') || '';
    exportData.book_tag = book.book_tag?.map((t: BookTag & { tag: Tag }) => t.tag.nom).join(', ') || '';
    exportData.genres = book.book_tag?.filter((t: BookTag & { tag: Tag }) => t.tag.type === 'GENRE').map((t: BookTag & { tag: Tag }) => t.tag.nom).join(', ') || '';
    exportData.tropes = book.book_tag?.filter((t: BookTag & { tag: Tag }) => t.tag.type === 'TROPE').map((t: BookTag & { tag: Tag }) => t.tag.nom).join(', ') || '';
    exportData.triggers = book.book_tag?.filter((t: BookTag & { tag: Tag }) => t.tag.type === 'TRIGGER').map((t: BookTag & { tag: Tag }) => t.tag.nom).join(', ') || '';
  }

  return exportData;
}

// =============================================================================
// 📋 CSV HELPERS
// =============================================================================

export function generateCSVHeaders(options: ExportOptions = {}): string[] {
  const baseHeaders = ['id', 'titre', 'auteur', 'isbn', 'statut', 'date_creation', 'date_modification'];
  
  const headers = [...baseHeaders];

  if (options.include_metadata !== false) {
    headers.push(
      'editeur', 'date_publication', 'nombre_pages', 'langue', 
      'resume_officiel', 'image_couverture', 'google_books_id', 
      'open_library_id', 'ajout_manuel'
    );
  }

  if (options.include_ratings !== false) {
    headers.push(
      'note_generale', 'niveau_spicy', 'niveau_dark', 'niveau_romance',
      'intensite_emotionnelle', 'danger', 'violence', 'originalite', 'rythme'
    );
  }

  if (options.include_personal_notes !== false) {
    headers.push(
      'date_lecture', 'resume_personnel', 'critique_detaillee', 
      'citations_favorites', 'pourquoi_aimer', 'questions_sur_le_livre'
    );
  }

  if (options.include_relations !== false) {
    headers.push('categories', 'tags', 'genres', 'tropes', 'triggers');
  }

  return headers;
}

export function formatValueForCSV(value: any): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // Échapper les guillemets doubles
  const escaped = stringValue.replace(/"/g, '""');
  
  // Entourer de guillemets si nécessaire (contient virgules, guillemets ou retours à la ligne)
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
    return `"${escaped}"`;
  }
  
  return escaped;
}

export function generateCSVContent(books: any[], headers: string[]): string {
  const csvLines = [headers.join(',')];
  
  for (const book of books) {
    const row = headers.map(header => formatValueForCSV(book[header]));
    csvLines.push(row.join(','));
  }
  
  return csvLines.join('\n');
}

// =============================================================================
// 📄 PDF HELPERS
// =============================================================================

export interface PDFConfig {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  include_cover_images: boolean;
  include_statistics: boolean;
  page_format: 'A4' | 'Letter';
  font_size: number;
  theme: 'light' | 'dark';
}

export function generatePDFMetadata(config: PDFConfig): any {
  return {
    title: config.title,
    author: config.author,
    subject: config.subject,
    keywords: config.keywords.join(', '),
    creator: 'Booky - Personal Library Manager',
    producer: 'Booky Export System',
    creationDate: new Date(),
    modificationDate: new Date()
  };
}

export function formatBookForPDF(book: any): any {
  return {
    ...book,
    formatted_rating: book.note_generale ? `${book.note_generale}/10` : 'Non noté',
    formatted_status: {
      'LU': '✅ Lu',
      'EN_COURS': '📖 En cours',
      'A_LIRE': '📚 À lire',
      'ABANDONNE': '❌ Abandonné'
    }[book.statut as 'LU' | 'EN_COURS' | 'A_LIRE' | 'ABANDONNE'] || book.statut,
    formatted_content_levels: [
      book.niveau_spicy ? `🌶️ ${book.niveau_spicy}/10` : '',
      book.niveau_dark ? `🖤 ${book.niveau_dark}/10` : '',
      book.niveau_romance ? `💕 ${book.niveau_romance}/10` : ''
    ].filter(Boolean).join(' • '),
    short_description: book.resume_personnel 
      ? (book.resume_personnel.length > 200 ? book.resume_personnel.substring(0, 197) + '...' : book.resume_personnel)
      : book.resume_officiel
      ? (book.resume_officiel.length > 200 ? book.resume_officiel.substring(0, 197) + '...' : book.resume_officiel)
      : 'Aucune description disponible'
  };
}

// =============================================================================
// 📊 EXPORT STATISTICS
// =============================================================================

export function generateExportStatistics(books: BookWithRelations[]): any {
  const stats = {
    total_books: books.length,
    by_status: {} as Record<string, number>,
    by_rating: {} as Record<string, number>,
    by_genre: {} as Record<string, number>,
    reading_stats: {
      average_rating: 0,
      total_pages: 0,
      books_with_rating: 0,
      books_read: 0,
      books_in_progress: 0,
      books_to_read: 0
    },
    date_range: {
      first_added: null as Date | null,
      last_added: null as Date | null,
      first_read: null as Date | null,
      last_read: null as Date | null
    }
  };

  let totalRating = 0;
  let ratedBooksCount = 0;
  let totalPages = 0;

  books.forEach(book => {
    // Statistiques par statut
    stats.by_status[book.statut] = (stats.by_status[book.statut] || 0) + 1;

    // Statistiques par note
    if (book.note_generale) {
      const ratingKey = Math.floor(book.note_generale).toString();
      stats.by_rating[ratingKey] = (stats.by_rating[ratingKey] || 0) + 1;
      totalRating += book.note_generale;
      ratedBooksCount++;
    }

    // Statistiques par genre
    book.book_tag?.forEach((book_tag: BookTag & { tag: Tag }) => {
      if (book_tag.tag.type === 'GENRE') {
        stats.by_genre[book_tag.tag.nom] = (stats.by_genre[book_tag.tag.nom] || 0) + 1;
      }
    });

    // Pages totales
    if (book.nombre_pages) {
      totalPages += book.nombre_pages;
    }

    // Plages de dates
    if (!stats.date_range.first_added || book.date_creation < stats.date_range.first_added) {
      stats.date_range.first_added = book.date_creation;
    }
    if (!stats.date_range.last_added || book.date_creation > stats.date_range.last_added) {
      stats.date_range.last_added = book.date_creation;
    }

    if (book.date_lecture) {
      if (!stats.date_range.first_read || book.date_lecture < stats.date_range.first_read) {
        stats.date_range.first_read = book.date_lecture;
      }
      if (!stats.date_range.last_read || book.date_lecture > stats.date_range.last_read) {
        stats.date_range.last_read = book.date_lecture;
      }
    }
  });

  // Calculs finaux
  stats.reading_stats.average_rating = ratedBooksCount > 0 ? Number((totalRating / ratedBooksCount).toFixed(2)) : 0;
  stats.reading_stats.total_pages = totalPages;
  stats.reading_stats.books_with_rating = ratedBooksCount;
  stats.reading_stats.books_read = stats.by_status['LU'] || 0;
  stats.reading_stats.books_in_progress = stats.by_status['EN_COURS'] || 0;
  stats.reading_stats.books_to_read = stats.by_status['A_LIRE'] || 0;

  return stats;
}

// =============================================================================
// 🔒 VALIDATION ET SÉCURITÉ
// =============================================================================

export function validateExportOptions(options: any): ExportOptions {
  return {
    include_metadata: options.include_metadata !== false,
    include_relations: options.include_relations !== false,
    include_personal_notes: options.include_personal_notes !== false,
    include_ratings: options.include_ratings !== false,
    date_format: ['iso', 'french', 'us'].includes(options.date_format) ? options.date_format : 'iso',
    fields_selection: Array.isArray(options.fields_selection) ? options.fields_selection : undefined,
    compression: options.compression === true
  };
}

export function sanitizeFilename(filename: string): string {
  // Supprimer ou remplacer les caractères problématiques
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

export function generateExportFilename(userId: string, format: string, options: ExportOptions = {}): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedUserId = sanitizeFilename(userId.substring(0, 8));
  
  let suffix = '';
  if (options.fields_selection?.length) {
    suffix += '_custom';
  }
  if (options.compression) {
    suffix += '_compressed';
  }
  
  return `booky_export_${sanitizedUserId}_${timestamp}${suffix}.${format}`;
}