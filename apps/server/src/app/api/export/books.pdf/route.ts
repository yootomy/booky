import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";
import { 
  generateExportFilename,
  type PDFConfig
} from "@/utils/export-helpers";
import { getPDFGenerator, type PDFGenerationOptions } from "@/utils/pdf-generator";

// =============================================================================
// 📄 EXPORT API - PDF FORMAT
// =============================================================================

// Schéma pour les paramètres d'export PDF
const PDFExportSchema = z.object({
  title: z.string().default('Ma Bibliothèque Personnelle'),
  author: z.string().default('Utilisateur Booky'),
  subject: z.string().default('Export de bibliothèque personnelle'),
  keywords: z.string().default('livres,bibliothèque,lecture').transform(val => val.split(',')),
  include_cover_images: z.boolean().default(false), // Désactivé par défaut pour la performance
  include_statistics: z.boolean().default(true),
  page_format: z.enum(['A4', 'Letter']).default('A4'),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  font_size: z.coerce.number().int().min(8).max(16).default(11),
  theme: z.enum(['light', 'dark']).default('light'),
  status_filter: z.enum(['LU', 'EN_COURS', 'A_LIRE', 'ABANDONNE']).optional(),
  rating_filter: z.string().optional().transform(val => val ? Number(val) : undefined).refine(val => val === undefined || (val >= 0 && val <= 10), "Rating must be between 0 and 10"),
  genre_filter: z.string().optional(),
  date_from: z.string().optional().transform(val => val ? new Date(val) : undefined),
  date_to: z.string().optional().transform(val => val ? new Date(val) : undefined),
  sort_by: z.enum(['date_creation', 'titre', 'auteur', 'note_generale']).default('titre'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  margin_top: z.string().default('1in'),
  margin_right: z.string().default('1in'),
  margin_bottom: z.string().default('1in'),
  margin_left: z.string().default('1in'),
  display_header_footer: z.boolean().default(true),
  print_background: z.boolean().default(true),
});

// GET /api/export/books.pdf - Export PDF complet des livres
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const userId = user.id;

    try {
      // Parser et valider les paramètres
      const { searchParams } = new URL(req.url);
      const queryObject = Object.fromEntries(searchParams.entries());
      
      const transformedQuery = {
        ...queryObject,
        include_cover_images: queryObject.include_cover_images === 'true',
        include_statistics: queryObject.include_statistics !== 'false',
        display_header_footer: queryObject.display_header_footer !== 'false',
        print_background: queryObject.print_background !== 'false',
      };
      
      const validatedParams = PDFExportSchema.parse(transformedQuery);
      const {
        title,
        author,
        subject,
        keywords,
        include_cover_images,
        include_statistics,
        page_format,
        orientation,
        font_size,
        theme,
        status_filter,
        rating_filter,
        genre_filter,
        date_from,
        date_to,
        sort_by,
        sort_order,
        margin_top,
        margin_right,
        margin_bottom,
        margin_left,
        display_header_footer,
        print_background
      } = validatedParams;
  
      // Construire les conditions de filtrage
      const whereConditions: any = {
        createdBy: userId,
        ...(status_filter && { statut: status_filter }),
        ...(rating_filter && { note_generale: { gte: rating_filter } }),
        ...(date_from || date_to) && {
          date_creation: {
            ...(date_from && { gte: date_from }),
            ...(date_to && { lte: date_to })
          }
        }
      };
  
      // Filtrage par genre si spécifié
      if (genre_filter) {
        whereConditions.OR = [
          {
            book_category: {
              some: {
                category: {
                  nom: { contains: genre_filter, mode: 'insensitive' }
                }
              }
            }
          },
          {
            book_tag: {
              some: {
                tag: {
                  nom: { contains: genre_filter, mode: 'insensitive' },
                  type: 'GENRE'
                }
              }
            }
          }
        ];
      }
  
      // Définir l'ordre de tri
      const orderBy: any = {};
      if (sort_by === 'titre') {
        orderBy.titre = sort_order;
      } else if (sort_by === 'auteur') {
        orderBy.auteur = sort_order;
      } else if (sort_by === 'note_generale') {
        orderBy.note_generale = sort_order;
      } else {
        orderBy.date_creation = sort_order;
      }
  
      // Récupérer les livres avec relations
      console.log(`[PDF EXPORT] Starting export for user ${userId} with ${Object.keys(whereConditions).length} filters`);
      
      const books = await db.book.findMany({
        where: whereConditions,
        include: {
          book_category: {
            include: {
              category: {
                select: {
                  id: true,
                  nom: true,
                  couleur: true,
                  icone: true,
                  description: true
                }
              }
            }
          },
          book_tag: {
            include: {
              tag: {
                select: {
                  id: true,
                  nom: true,
                  couleur: true,
                  type: true
                }
              }
            }
          }
        },
        orderBy
      });
  
      console.log(`[PDF EXPORT] Found ${books.length} books for export`);
  
      if (books.length === 0) {
        return NextResponse.json({
          success: false,
          error: lang === 'fr' ? 'Aucun livre trouvé avec ces critères' : 'No books found with these criteria',
          code: 'NO_BOOKS_FOUND',
        }, { status: 404 });
      }
  
      // Configuration PDF
      const pdfConfig: PDFConfig = {
        title,
        author,
        subject,
        keywords,
        include_cover_images,
        include_statistics,
        page_format,
        font_size,
        theme
      };
  
      // Options de génération PDF
      const pdfOptions: PDFGenerationOptions = {
        format: page_format,
        orientation,
        margin: {
          top: margin_top,
          right: margin_right,
          bottom: margin_bottom,
          left: margin_left
        },
        displayHeaderFooter: display_header_footer,
        headerTemplate: `
          <div style="font-size: 10px; text-align: left; width: 100%; margin-left: 1in; color: #666;">
            ${title}
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            Page <span class="pageNumber"></span> sur <span class="totalPages"></span>
          </div>
        `,
        printBackground: print_background
      };
  
      // Obtenir le générateur PDF
      const pdfGenerator = await getPDFGenerator();
      
      console.log(`[PDF EXPORT] Generating PDF with ${books.length} books...`);
  
      // Générer le PDF
      const pdfBuffer = await pdfGenerator.generatePDF(
        books as any, 
        pdfConfig, 
        userId, 
        pdfOptions,
        include_statistics
      );
  
      console.log(`[PDF EXPORT] PDF generated successfully: ${pdfBuffer.length} bytes`);
  
      // Générer le nom de fichier
      const filename = generateExportFilename(userId, 'pdf', {
        include_metadata: true,
        include_relations: true,
        include_personal_notes: true,
        include_ratings: true
      });
  
      // Headers pour le téléchargement
      const headers = new Headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
  
      // Log de l'export pour audit
      console.log(`[PDF EXPORT] PDF export completed for user ${userId}: ${books.length} books, ${pdfBuffer.length} bytes, ${Date.now() - startTime}ms`);
  
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers
      });
  
    } catch (error) {
      console.error(`[PDF EXPORT] Error generating PDF for user ${userId}:`, error);
      
      // Gérer les erreurs spécifiques
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: lang === 'fr' ? 'Paramètres d\'export invalides' : 'Invalid export parameters',
          code: 'INVALID_PARAMETERS',
          details: error.issues
        }, { status: 400 });
      }
  
      if (error instanceof Error) {
        if (error.message.includes('PDF generator')) {
          return NextResponse.json({
            success: false,
            error: lang === 'fr' ? 'Erreur de génération PDF' : 'PDF generation error',
            code: 'PDF_GENERATION_ERROR',
          }, { status: 500 });
        }
  
        if (error.message.includes('timeout')) {
          return NextResponse.json({
            success: false,
            error: lang === 'fr' ? 'Timeout de génération PDF' : 'PDF generation timeout',
            code: 'PDF_TIMEOUT',
          }, { status: 408 });
        }
      }
  
      // Erreur générique
      return NextResponse.json({
        success: false,
        error: lang === 'fr' ? 'Erreur interne lors de la génération PDF' : 'Internal error during PDF generation',
        code: 'INTERNAL_ERROR',
      }, { status: 500 });
    }
  });
}
