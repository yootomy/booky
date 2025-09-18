import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { 
  detectLanguageFromHeaders, 
  withErrorHandler 
} from "@/utils/error-handler";
import { getTypedSession } from "@/utils/auth-helpers";
import { z } from "zod";
import { 
  formatBookForExport, 
  generateCSVHeaders,
  generateCSVContent,
  validateExportOptions,
  generateExportFilename,
  generateExportStatistics,
  type ExportOptions
} from "@/utils/export-helpers";

// =============================================================================
// 📊 EXPORT API - CSV FORMAT
// =============================================================================

// Schéma pour les paramètres d'export CSV
const CSVExportSchema = z.object({
  include_metadata: z.boolean().default(true),
  include_relations: z.boolean().default(true),
  include_personal_notes: z.boolean().default(true),
  include_ratings: z.boolean().default(true),
  include_statistics_sheet: z.boolean().default(false),
  date_format: z.enum(['iso', 'french', 'us']).default('iso'),
  delimiter: z.enum([',', ';', '\t']).default(','),
  encoding: z.enum(['utf8', 'utf8-bom', 'latin1']).default('utf8-bom'),
  fields_selection: z.string().optional().transform(val => val ? val.split(',') : undefined),
  status_filter: z.enum(['LU', 'EN_COURS', 'A_LIRE', 'ABANDONNE']).optional(),
  rating_filter: z.string().optional().transform(val => val ? Number(val) : undefined).refine(val => val === undefined || (val >= 0 && val <= 10), "Rating must be between 0 and 10"),
  genre_filter: z.string().optional(),
  date_from: z.string().optional().transform(val => val ? new Date(val) : undefined),
  date_to: z.string().optional().transform(val => val ? new Date(val) : undefined),
  sort_by: z.enum(['date_creation', 'titre', 'auteur', 'note_generale']).default('date_creation'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/export/books.csv - Export CSV complet des livres
export const GET = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(request.headers);
  
  // Vérifier l'authentification
  const user = await getTypedSession(request);
  if (!user?.id) {
    return NextResponse.json({
      success: false,
      error: lang === 'fr' ? 'Authentification requise' : 'Authentication required',
      code: 'UNAUTHORIZED',
    }, { status: 401 });
  }

  const userId = user?.id;

  // Parser et valider les paramètres
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());
  
  const transformedQuery = {
    ...queryObject,
    include_metadata: queryObject.include_metadata !== 'false',
    include_relations: queryObject.include_relations !== 'false',
    include_personal_notes: queryObject.include_personal_notes !== 'false',
    include_ratings: queryObject.include_ratings !== 'false',
    include_statistics_sheet: queryObject.include_statistics_sheet === 'true',
  };
  
  const validatedParams = CSVExportSchema.parse(transformedQuery);
  const {
    include_metadata,
    include_relations,
    include_personal_notes,
    include_ratings,
    include_statistics_sheet,
    date_format,
    delimiter,
    encoding,
    fields_selection,
    status_filter,
    rating_filter,
    genre_filter,
    date_from,
    date_to,
    sort_by,
    sort_order
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

  // Options d'export
  const exportOptions: ExportOptions = {
    include_metadata,
    include_relations,
    include_personal_notes,
    include_ratings,
    date_format,
    fields_selection
  };

  // Formatter les livres pour l'export
  const formattedBooks = books.map(book => formatBookForExport(book as any, exportOptions));

  // Générer les headers CSV
  const csvHeaders = fields_selection && fields_selection.length > 0 
    ? fields_selection 
    : generateCSVHeaders(exportOptions);

  // Filtrer les données selon les headers sélectionnés
  const filteredBooks = formattedBooks.map(book => {
    const filtered: any = {};
    csvHeaders.forEach(header => {
      filtered[header] = book[header] ?? '';
    });
    return filtered;
  });

  // Générer le contenu CSV principal
  let csvContent = generateCSVContent(filteredBooks, csvHeaders);

  // Remplacer le délimiteur si nécessaire
  if (delimiter !== ',') {
    csvContent = csvContent.replace(/,/g, delimiter);
  }

  // Ajouter les statistiques comme section séparée si demandées
  if (include_statistics_sheet) {
    const statistics = generateExportStatistics(books as any);
    
    csvContent += '\n\n';
    csvContent += '='.repeat(50) + '\n';
    csvContent += 'STATISTIQUES D\'EXPORT\n';
    csvContent += '='.repeat(50) + '\n\n';
    
    // Statistiques générales
    csvContent += 'Statistique' + delimiter + 'Valeur\n';
    csvContent += `Total de livres${delimiter}${statistics.total_books}\n`;
    csvContent += `Note moyenne${delimiter}${statistics.reading_stats.average_rating}\n`;
    csvContent += `Pages totales${delimiter}${statistics.reading_stats.total_pages}\n`;
    csvContent += `Livres notés${delimiter}${statistics.reading_stats.books_with_rating}\n`;
    
    // Répartition par statut
    csvContent += '\nRépartition par statut:\n';
    csvContent += 'Statut' + delimiter + 'Nombre\n';
    Object.entries(statistics.by_status).forEach(([status, count]) => {
      csvContent += `${status}${delimiter}${count}\n`;
    });
    
    // Top genres
    csvContent += '\nTop 10 des genres:\n';
    csvContent += 'Genre' + delimiter + 'Nombre de livres\n';
    Object.entries(statistics.by_genre)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .forEach(([genre, count]) => {
        csvContent += `${genre}${delimiter}${count}\n`;
      });
  }

  // Ajouter l'en-tête d'information
  const infoHeader = [
    `# Export CSV - Booky Personal Library`,
    `# Généré le: ${new Date().toISOString()}`,
    `# Utilisateur: ${userId}`,
    `# Total de livres: ${books.length}`,
    `# Filtres appliqués: ${status_filter || 'aucun'}, ${genre_filter || 'aucun'}, ${rating_filter ? `note >= ${rating_filter}` : 'aucun'}`,
    `# Format de date: ${date_format}`,
    `# Délimiteur: ${delimiter === ',' ? 'virgule' : delimiter === ';' ? 'point-virgule' : 'tabulation'}`,
    `# Encodage: ${encoding}`,
    `# Options: ${Object.entries(exportOptions).filter(([, v]) => v === true).map(([k]) => k).join(', ')}`,
    `# Temps de génération: ${Date.now() - startTime}ms`,
    `#`,
    ``
  ].join('\n');

  // Construire le contenu final
  let finalContent = infoHeader + csvContent;

  // Ajouter BOM pour UTF-8 si demandé
  if (encoding === 'utf8-bom') {
    finalContent = '\ufeff' + finalContent;
  }

  // Gérer l'encodage Latin1 si demandé
  if (encoding === 'latin1') {
    // Note: pour un vrai projet, utiliser une vraie conversion d'encodage
    finalContent = finalContent.replace(/[^\x00-\xFF]/g, '?');
  }

  // Générer le nom de fichier
  const filename = generateExportFilename(userId, 'csv', exportOptions);

  // Déterminer le Content-Type selon l'encodage
  const contentType = encoding === 'latin1' 
    ? 'text/csv; charset=iso-8859-1'
    : 'text/csv; charset=utf-8';

  // Headers pour le téléchargement
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Length': Buffer.byteLength(finalContent, 'utf8').toString()
  });

  // Log de l'export pour audit
  console.log(`[EXPORT] CSV export generated for user ${userId}: ${books.length} books, ${finalContent.length} chars, delimiter: ${delimiter}, encoding: ${encoding}`);

  return new NextResponse(finalContent, {
    status: 200,
    headers
  });
});