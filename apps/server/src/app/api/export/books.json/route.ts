import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";
import { 
  formatBookForExport, 
  validateExportOptions, 
  generateExportFilename,
  generateExportStatistics,
  type ExportOptions,
  type ExportMetadata
} from "@/utils/export-helpers";

// =============================================================================
// 📄 EXPORT API - JSON FORMAT
// =============================================================================

// Schéma pour les paramètres d'export JSON
const JSONExportSchema = z.object({
  include_metadata: z.boolean().default(true),
  include_relations: z.boolean().default(true),
  include_personal_notes: z.boolean().default(true),
  include_ratings: z.boolean().default(true),
  include_statistics: z.boolean().default(true),
  date_format: z.enum(['iso', 'french', 'us']).default('iso'),
  fields_selection: z.string().optional().transform(val => val ? val.split(',') : undefined),
  pretty_print: z.boolean().default(true),
  compression: z.boolean().default(false),
  status_filter: z.enum(['LU', 'EN_COURS', 'A_LIRE', 'ABANDONNE']).optional(),
  rating_filter: z.string().optional().transform(val => val ? Number(val) : undefined).refine(val => val === undefined || (val >= 0 && val <= 10), "Rating must be between 0 and 10"),
  genre_filter: z.string().optional(),
  date_from: z.string().optional().transform(val => val ? new Date(val) : undefined),
  date_to: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

// GET /api/export/books.json - Export JSON complet des livres
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
    const startTime = Date.now();
    const lang = detectLanguageFromHeaders(req.headers);
    const userId = user.id;

    // Parser et valider les paramètres
    const { searchParams } = new URL(req.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const transformedQuery = {
      ...queryObject,
      include_metadata: queryObject.include_metadata !== 'false',
      include_relations: queryObject.include_relations !== 'false',
      include_personal_notes: queryObject.include_personal_notes !== 'false',
      include_ratings: queryObject.include_ratings !== 'false',
      include_statistics: queryObject.include_statistics !== 'false',
      pretty_print: queryObject.pretty_print !== 'false',
      compression: queryObject.compression === 'true',
    };
    
    const validatedParams = JSONExportSchema.parse(transformedQuery);
    const {
      include_metadata,
      include_relations,
      include_personal_notes,
      include_ratings,
      include_statistics,
      date_format,
      fields_selection,
      pretty_print,
      compression,
      status_filter,
      rating_filter,
      genre_filter,
      date_from,
      date_to
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
  
    // Récupérer les livres avec relations
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
      orderBy: { date_creation: 'desc' }
    });
  
    // Options d'export
    const exportOptions: ExportOptions = {
      include_metadata,
      include_relations,
      include_personal_notes,
      include_ratings,
      date_format,
      fields_selection,
      compression
    };
  
    // Formatter les livres pour l'export
    const formattedBooks = books.map(book => {
      const formatted = formatBookForExport(book as any, exportOptions);
      
      // Si une sélection de champs est spécifiée, ne garder que ces champs
      if (fields_selection && fields_selection.length > 0) {
        const filtered: any = {};
        fields_selection.forEach(field => {
          if (formatted.hasOwnProperty(field)) {
            filtered[field] = formatted[field];
          }
        });
        return filtered;
      }
      
      return formatted;
    });
  
    // Générer les statistiques si demandées
    let statistics = null;
    if (include_statistics) {
      statistics = generateExportStatistics(books as any);
    }
  
    // Métadonnées de l'export
    const metadata: ExportMetadata = {
      export_date: new Date().toISOString(),
      export_type: 'JSON',
      total_books: books.length,
      user_id: userId,
      format_version: '1.0',
      filters_applied: {
        status_filter: status_filter || 'all',
        rating_filter: rating_filter || 'none',
        genre_filter: genre_filter || 'all',
        date_range: {
          from: date_from?.toISOString().split('T')[0] || null,
          to: date_to?.toISOString().split('T')[0] || null
        }
      },
      generation_time_ms: Date.now() - startTime
    };
  
    // Structure finale de l'export
    const exportData = {
      metadata,
      books: formattedBooks,
      ...(include_statistics && { statistics }),
      export_info: {
        exported_by: 'Booky - Personal Library Manager',
        version: '1.0.0',
        format: 'JSON',
        options: exportOptions,
        total_size_estimate: `${Math.round(JSON.stringify(formattedBooks).length / 1024)} KB`
      }
    };
  
    // Générer le nom de fichier
    const filename = generateExportFilename(userId, 'json', exportOptions);
  
    // Préparer la réponse
    const jsonContent = pretty_print 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  
    // Headers pour le téléchargement
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  
    // Si compression demandée (note: pour un vrai projet, utiliser gzip)
    if (compression) {
      headers.set('Content-Encoding', 'identity'); // Placeholder pour compression
    }
  
    // Log de l'export pour audit
    console.log(`[EXPORT] JSON export generated for user ${userId}: ${books.length} books, ${jsonContent.length} bytes`);
  
    return new NextResponse(jsonContent, {
      status: 200,
      headers
    });
  });
}
