import puppeteer, { Browser, Page } from 'puppeteer';
import { BookWithRelations, PDFConfig, formatBookForPDF, generateExportStatistics } from './export-helpers';

// =============================================================================
// 📄 PDF GENERATOR - GÉNÉRATEUR DE PDF POUR LES EXPORTS
// =============================================================================

export interface PDFGenerationOptions {
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  displayHeaderFooter: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground: boolean;
}

export class PDFGenerator {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      this.page = await this.browser.newPage();
    } catch (error) {
      console.error('Failed to initialize PDF generator:', error);
      throw new Error('PDF generator initialization failed');
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('Error during PDF generator cleanup:', error);
    }
  }

  generateHTML(
    books: BookWithRelations[], 
    config: PDFConfig, 
    userId: string,
    includeStatistics: boolean = true
  ): string {
    const formattedBooks = books.map(formatBookForPDF);
    const statistics = includeStatistics ? generateExportStatistics(books) : null;
    
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.title}</title>
        <style>
            ${this.getCSS(config)}
        </style>
    </head>
    <body class="${config.theme}">
        <!-- Page de couverture -->
        <div class="cover-page">
            <div class="cover-content">
                <h1 class="main-title">${config.title}</h1>
                <div class="cover-subtitle">Bibliothèque Personnelle</div>
                <div class="cover-stats">
                    <div class="stat-item">
                        <span class="stat-number">${books.length}</span>
                        <span class="stat-label">Livres</span>
                    </div>
                    ${statistics ? `
                    <div class="stat-item">
                        <span class="stat-number">${statistics.reading_stats.books_read}</span>
                        <span class="stat-label">Lus</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${statistics.reading_stats.average_rating}/10</span>
                        <span class="stat-label">Note Moyenne</span>
                    </div>
                    ` : ''}
                </div>
                <div class="cover-footer">
                    <div class="export-date">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
                    <div class="export-by">Booky - Personal Library Manager</div>
                </div>
            </div>
        </div>

        <div class="page-break"></div>

        <!-- Table des matières -->
        <div class="toc-page">
            <h2 class="toc-title">Table des Matières</h2>
            <div class="toc-content">
                <div class="toc-item">
                    <span class="toc-text">Bibliothèque</span>
                    <span class="toc-dots"></span>
                    <span class="toc-page-number">3</span>
                </div>
                ${includeStatistics ? `
                <div class="toc-item">
                    <span class="toc-text">Statistiques</span>
                    <span class="toc-dots"></span>
                    <span class="toc-page-number">${Math.ceil(books.length / 3) + 3}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="page-break"></div>

        <!-- Section des livres -->
        <div class="books-section">
            <h2 class="section-title">Ma Bibliothèque</h2>
            
            ${formattedBooks.map((book, index) => `
                <div class="book-entry ${index % 3 === 2 ? 'page-break-after' : ''}">
                    <div class="book-header">
                        <div class="book-title-section">
                            <h3 class="book-title">${book.titre}</h3>
                            <div class="book-author">par ${book.auteur}</div>
                        </div>
                        <div class="book-status ${book.statut.toLowerCase()}">${book.formatted_status}</div>
                    </div>
                    
                    <div class="book-content">
                        <div class="book-main">
                            ${book.image_couverture && config.include_cover_images ? `
                            <div class="book-cover">
                                <img src="${book.image_couverture}" alt="Couverture" onerror="this.style.display='none'" />
                            </div>
                            ` : ''}
                            
                            <div class="book-details">
                                <div class="book-meta">
                                    ${book.isbn ? `<div class="meta-item"><strong>ISBN:</strong> ${book.isbn}</div>` : ''}
                                    ${book.editeur ? `<div class="meta-item"><strong>Éditeur:</strong> ${book.editeur}</div>` : ''}
                                    ${book.date_publication ? `<div class="meta-item"><strong>Publication:</strong> ${book.date_publication}</div>` : ''}
                                    ${book.nombre_pages ? `<div class="meta-item"><strong>Pages:</strong> ${book.nombre_pages}</div>` : ''}
                                    ${book.langue ? `<div class="meta-item"><strong>Langue:</strong> ${book.langue}</div>` : ''}
                                </div>
                                
                                ${book.formatted_rating !== 'Non noté' ? `
                                <div class="book-rating">
                                    <div class="rating-main">Note: <strong>${book.formatted_rating}</strong></div>
                                    ${book.formatted_content_levels ? `
                                    <div class="content-levels">${book.formatted_content_levels}</div>
                                    ` : ''}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${book.short_description ? `
                        <div class="book-description">
                            <strong>Description:</strong>
                            <p>${book.short_description}</p>
                        </div>
                        ` : ''}
                        
                        ${book.book_category || book.book_tag ? `
                        <div class="book-tags">
                            ${book.book_category ? `<div class="tag-group"><strong>Catégories:</strong> ${book.book_category}</div>` : ''}
                            ${book.genres ? `<div class="tag-group"><strong>Genres:</strong> ${book.genres}</div>` : ''}
                            ${book.tropes ? `<div class="tag-group"><strong>Tropes:</strong> ${book.tropes}</div>` : ''}
                        </div>
                        ` : ''}
                        
                        ${book.citations_favorites ? `
                        <div class="book-quote">
                            <em>"${book.citations_favorites}"</em>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        ${includeStatistics && statistics ? `
        <div class="page-break"></div>
        
        <!-- Section des statistiques -->
        <div class="statistics-section">
            <h2 class="section-title">Statistiques de Lecture</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Résumé Général</h3>
                    <div class="stat-content">
                        <div class="stat-row">
                            <span>Total de livres:</span>
                            <strong>${statistics.total_books}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Note moyenne:</span>
                            <strong>${statistics.reading_stats.average_rating}/10</strong>
                        </div>
                        <div class="stat-row">
                            <span>Pages totales:</span>
                            <strong>${statistics.reading_stats.total_pages.toLocaleString()}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Livres notés:</span>
                            <strong>${statistics.reading_stats.books_with_rating}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h3>Répartition par Statut</h3>
                    <div class="stat-content">
                        ${Object.entries(statistics.by_status).map(([status, count]) => `
                        <div class="stat-row">
                            <span>${status}:</span>
                            <strong>${count}</strong>
                        </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="stat-card">
                    <h3>Top 10 des Genres</h3>
                    <div class="stat-content">
                        ${Object.entries(statistics.by_genre)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 10)
                          .map(([genre, count]) => `
                        <div class="stat-row">
                            <span>${genre}:</span>
                            <strong>${count}</strong>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
    </body>
    </html>`;

    return html;
  }

  private getCSS(config: PDFConfig): string {
    return `
    /* Variables CSS */
    :root {
        --primary-color: ${config.theme === 'dark' ? '#bb86fc' : '#6366f1'};
        --secondary-color: ${config.theme === 'dark' ? '#03dac6' : '#8b5cf6'};
        --background-color: ${config.theme === 'dark' ? '#121212' : '#ffffff'};
        --surface-color: ${config.theme === 'dark' ? '#1e1e1e' : '#f8fafc'};
        --text-color: ${config.theme === 'dark' ? '#ffffff' : '#1f2937'};
        --text-secondary: ${config.theme === 'dark' ? '#b0b0b0' : '#6b7280'};
        --border-color: ${config.theme === 'dark' ? '#333333' : '#e5e7eb'};
        --accent-color: ${config.theme === 'dark' ? '#ffd700' : '#f59e0b'};
    }

    /* Reset et base */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: ${config.font_size}px;
        line-height: 1.6;
        color: var(--text-color);
        background-color: var(--background-color);
    }

    .light { color: #1f2937; background-color: #ffffff; }
    .dark { color: #ffffff; background-color: #121212; }

    /* Utilitaires de page */
    .page-break { page-break-before: always; }
    .page-break-after { page-break-after: always; }

    /* Page de couverture */
    .cover-page {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
    }

    .main-title {
        font-size: 3.5em;
        font-weight: bold;
        margin-bottom: 20px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .cover-subtitle {
        font-size: 1.5em;
        margin-bottom: 40px;
        opacity: 0.9;
    }

    .cover-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-bottom: 60px;
    }

    .stat-item {
        text-align: center;
    }

    .stat-number {
        display: block;
        font-size: 2.5em;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .stat-label {
        font-size: 1.1em;
        opacity: 0.8;
    }

    .cover-footer {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
    }

    .export-date {
        font-size: 1.1em;
        margin-bottom: 5px;
    }

    .export-by {
        font-size: 0.9em;
        opacity: 0.7;
    }

    /* Table des matières */
    .toc-page {
        padding: 40px;
        min-height: 80vh;
    }

    .toc-title {
        font-size: 2.5em;
        margin-bottom: 40px;
        color: var(--primary-color);
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 20px;
    }

    .toc-item {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        font-size: 1.2em;
    }

    .toc-text {
        flex-shrink: 0;
    }

    .toc-dots {
        flex-grow: 1;
        border-bottom: 1px dotted var(--text-secondary);
        margin: 0 15px;
        height: 1px;
    }

    .toc-page-number {
        flex-shrink: 0;
        font-weight: bold;
    }

    /* Section des livres */
    .books-section {
        padding: 40px;
    }

    .section-title {
        font-size: 2.5em;
        margin-bottom: 40px;
        color: var(--primary-color);
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 20px;
    }

    .book-entry {
        margin-bottom: 40px;
        background-color: var(--surface-color);
        border-radius: 12px;
        padding: 30px;
        border: 1px solid var(--border-color);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .book-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 15px;
    }

    .book-title {
        font-size: 1.8em;
        font-weight: bold;
        color: var(--primary-color);
        margin-bottom: 5px;
        line-height: 1.3;
    }

    .book-author {
        font-style: italic;
        color: var(--text-secondary);
        font-size: 1.1em;
    }

    .book-status {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9em;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .book-status.lu { background-color: #dcfce7; color: #166534; }
    .book-status.en_cours { background-color: #fef3c7; color: #92400e; }
    .book-status.a_lire { background-color: #dbeafe; color: #1e40af; }
    .book-status.abandonne { background-color: #fee2e2; color: #dc2626; }

    .book-content {
        margin-top: 20px;
    }

    .book-main {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
    }

    .book-cover {
        flex-shrink: 0;
        width: 120px;
    }

    .book-cover img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .book-details {
        flex-grow: 1;
    }

    .book-meta {
        margin-bottom: 15px;
    }

    .meta-item {
        margin-bottom: 5px;
        font-size: 0.95em;
    }

    .meta-item strong {
        color: var(--text-color);
        margin-right: 5px;
    }

    .book-rating {
        background-color: var(--background-color);
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }

    .rating-main {
        font-size: 1.1em;
        margin-bottom: 5px;
    }

    .content-levels {
        font-size: 0.9em;
        color: var(--text-secondary);
    }

    .book-description {
        margin-bottom: 15px;
        background-color: var(--background-color);
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid var(--primary-color);
    }

    .book-description p {
        margin-top: 10px;
        text-align: justify;
    }

    .book-tags {
        margin-bottom: 15px;
    }

    .tag-group {
        margin-bottom: 8px;
        font-size: 0.95em;
    }

    .tag-group strong {
        color: var(--text-color);
        margin-right: 8px;
    }

    .book-quote {
        font-style: italic;
        text-align: center;
        padding: 15px;
        background-color: var(--background-color);
        border-radius: 8px;
        border-left: 4px solid var(--accent-color);
        color: var(--text-secondary);
    }

    /* Section des statistiques */
    .statistics-section {
        padding: 40px;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
        margin-top: 30px;
    }

    .stat-card {
        background-color: var(--surface-color);
        border-radius: 12px;
        padding: 25px;
        border: 1px solid var(--border-color);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-card h3 {
        font-size: 1.4em;
        margin-bottom: 20px;
        color: var(--primary-color);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 10px;
    }

    .stat-content {
        space-y: 10px;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.95em;
    }

    .stat-row:last-child {
        border-bottom: none;
    }

    .stat-row strong {
        color: var(--primary-color);
        font-weight: bold;
    }

    /* Print styles */
    @media print {
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .book-entry {
            break-inside: avoid;
        }
    }
    `;
  }

  async generatePDF(
    books: BookWithRelations[], 
    config: PDFConfig, 
    userId: string,
    options: PDFGenerationOptions,
    includeStatistics: boolean = true
  ): Promise<Buffer> {
    if (!this.page) {
      throw new Error('PDF generator not initialized');
    }

    try {
      // Générer le HTML
      const html = this.generateHTML(books, config, userId, includeStatistics);
      
      // Configurer la page
      await this.page.setContent(html, { waitUntil: 'networkidle0' });

      // Générer le PDF
      const pdfBuffer = await this.page.pdf({
        format: options.format,
        landscape: options.orientation === 'landscape',
        margin: options.margin,
        displayHeaderFooter: options.displayHeaderFooter,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
        printBackground: options.printBackground,
        preferCSSPageSize: true
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }
}

// Singleton instance
let pdfGeneratorInstance: PDFGenerator | null = null;

export async function getPDFGenerator(): Promise<PDFGenerator> {
  if (!pdfGeneratorInstance) {
    pdfGeneratorInstance = new PDFGenerator();
    await pdfGeneratorInstance.initialize();
  }
  return pdfGeneratorInstance;
}

export async function cleanupPDFGenerator(): Promise<void> {
  if (pdfGeneratorInstance) {
    await pdfGeneratorInstance.cleanup();
    pdfGeneratorInstance = null;
  }
}