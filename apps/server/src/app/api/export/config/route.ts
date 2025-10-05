import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import {
  detectLanguageFromHeaders,
  withErrorHandler
} from "@/utils/error-handler";
import { withBetterAuth } from "@/middlewares/auth-improved";
import { z } from "zod";

// =============================================================================
// ⚙️ EXPORT CONFIGURATION API
// =============================================================================

// Schéma pour la configuration d'export
const ExportConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  format: z.enum(['JSON', 'CSV', 'PDF']),
  default_options: z.object({
    include_metadata: z.boolean().default(true),
    include_relations: z.boolean().default(true),
    include_personal_notes: z.boolean().default(true),
    include_ratings: z.boolean().default(true),
    include_statistics: z.boolean().default(true),
    date_format: z.enum(['iso', 'french', 'us']).default('iso'),
    // Options spécifiques CSV
    delimiter: z.enum([',', ';', '\t']).optional(),
    encoding: z.enum(['utf8', 'utf8-bom', 'latin1']).optional(),
    // Options spécifiques PDF
    page_format: z.enum(['A4', 'Letter']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    font_size: z.coerce.number().int().min(8).max(16).optional(),
    include_cover_images: z.boolean().optional(),
  }),
  filters: z.object({
    status_filter: z.enum(['LU', 'EN_COURS', 'A_LIRE', 'ABANDONNE']).optional(),
    rating_filter: z.coerce.number().min(0).max(10).optional(),
    genre_filter: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }).default({}),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true)
});

const UpdateConfigSchema = ExportConfigSchema.partial().extend({
  id: z.string().uuid()
});

// GET /api/export/config - Récupérer les configurations d'export
export async function GET(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const userId = user.id;
  
    try {
      // Récupérer toutes les configurations de l'utilisateur
      const configs = await db.export_configs.findMany({
        where: { createdBy: userId },
        orderBy: [
          { is_default: 'desc' },
          { createdAt: 'desc' }
        ]
      });
  
      // Configurations par défaut du système si l'utilisateur n'en a pas
      const defaultConfigs = configs.length === 0 ? [
        {
          id: 'default-json',
          name: 'Export JSON Complet',
          description: 'Export JSON avec toutes les données et statistiques',
          format: 'json',
          default_options: {
            include_metadata: true,
            include_relations: true,
            include_personal_notes: true,
            include_ratings: true,
            include_statistics: true,
            date_format: 'iso',
            pretty_print: true
          },
          filters: {},
          is_default: true,
          is_active: true,
          is_system: true
        },
        {
          id: 'default-csv',
          name: 'Export CSV Standard',
          description: 'Export CSV avec encodage UTF-8 et délimiteur virgule',
          format: 'csv',
          default_options: {
            include_metadata: true,
            include_relations: true,
            include_personal_notes: true,
            include_ratings: true,
            delimiter: ',',
            encoding: 'utf8-bom',
            date_format: 'iso'
          },
          filters: {},
          is_default: false,
          is_active: true,
          is_system: true
        },
        {
          id: 'default-pdf',
          name: 'Export PDF Élégant',
          description: 'PDF A4 avec thème clair et statistiques',
          format: 'pdf',
          default_options: {
            page_format: 'A4',
            orientation: 'portrait',
            theme: 'light',
            font_size: 11,
            include_cover_images: false,
            include_statistics: true
          },
          filters: {},
          is_default: false,
          is_active: true,
          is_system: true
        }
      ] : [];
  
      const response = {
        success: true,
        data: {
          user_configs: configs,
          default_configs: defaultConfigs,
          total_configs: configs.length,
          available_formats: ['json', 'csv', 'pdf']
        },
        metadata: {
          user_id: userId,
          has_custom_configs: configs.length > 0,
          default_config: configs.find(c => c.is_default) || defaultConfigs.find(c => c.is_default),
          generated_at: new Date().toISOString()
        },
        message: lang === 'fr' 
          ? `${configs.length} configuration(s) d'export trouvée(s)` 
          : `${configs.length} export configuration(s) found`,
        execution_time_ms: Date.now() - startTime,
      };
  
      return NextResponse.json(response);
    } catch (error) {
      console.error('[EXPORT CONFIG] Error fetching configurations:', error);
      throw error;
    }
  });
}

// POST /api/export/config - Créer une nouvelle configuration d'export
export async function POST(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const userId = user.id;
  
    try {
      // Parser et valider les données
      const body = await request.json();
      const validatedData = ExportConfigSchema.parse(body);
  
      // Si cette config doit être par défaut, désactiver les autres
      if (validatedData.is_default) {
        await db.export_configs.updateMany({
          where: { createdBy: userId },
          data: { is_default: false }
        });
      }
  
      // Créer la nouvelle configuration
      const { randomUUID } = await import('crypto');
      const newConfig = await db.export_configs.create({
        data: {
          id: randomUUID(),
          ...validatedData,
          createdBy: userId,
          updatedAt: new Date(),
          default_options: validatedData.default_options as any,
          filters: validatedData.filters as any
        }
      });
  
      const response = {
        success: true,
        data: newConfig,
        metadata: {
          user_id: userId,
          created_at: newConfig.createdAt,
          is_default: newConfig.is_default
        },
        message: lang === 'fr' 
          ? `Configuration '${newConfig.name}' créée avec succès` 
          : `Configuration '${newConfig.name}' created successfully`,
        execution_time_ms: Date.now() - startTime,
      };
  
      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: lang === 'fr' ? 'Données de configuration invalides' : 'Invalid configuration data',
          code: 'INVALID_CONFIG_DATA',
          details: error.issues
        }, { status: 400 });
      }
  
      console.error('[EXPORT CONFIG] Error creating configuration:', error);
      throw error;
    }
  });
}

// PUT /api/export/config - Mettre à jour une configuration existante
export async function PUT(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const userId = user.id;

    try {
      // Parser et valider les données
      const body = await req.json();
      const validatedData = UpdateConfigSchema.parse(body);
      const { id, ...updateData } = validatedData;
  
      // Vérifier que la configuration appartient à l'utilisateur
      const existingConfig = await db.export_configs.findFirst({
        where: { id, createdBy: userId }
      });
  
      if (!existingConfig) {
        return NextResponse.json({
          success: false,
          error: lang === 'fr' ? 'Configuration non trouvée' : 'Configuration not found',
          code: 'CONFIG_NOT_FOUND',
        }, { status: 404 });
      }
  
      // Si cette config doit être par défaut, désactiver les autres
      if (updateData.is_default) {
        await db.export_configs.updateMany({
          where: { 
            createdBy: userId,
            id: { not: id }
          },
          data: { is_default: false }
        });
      }
  
      // Mettre à jour la configuration
      const updatedConfig = await db.export_configs.update({
        where: { id },
        data: {
          ...updateData,
          default_options: updateData.default_options as any,
          filters: updateData.filters as any,
          updatedAt: new Date()
        }
      });
  
      const response = {
        success: true,
        data: updatedConfig,
        metadata: {
          user_id: userId,
          updated_at: updatedConfig.updatedAt,
          is_default: updatedConfig.is_default
        },
        message: lang === 'fr' 
          ? `Configuration '${updatedConfig.name}' mise à jour avec succès` 
          : `Configuration '${updatedConfig.name}' updated successfully`,
        execution_time_ms: Date.now() - startTime,
      };
  
      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: lang === 'fr' ? 'Données de mise à jour invalides' : 'Invalid update data',
          code: 'INVALID_UPDATE_DATA',
          details: error.issues
        }, { status: 400 });
      }
  
      console.error('[EXPORT CONFIG] Error updating configuration:', error);
      throw error;
    }
  });
}

// DELETE /api/export/config - Supprimer une configuration
export async function DELETE(request: NextRequest) {
  return withBetterAuth(request, async (req, user) => {
  const startTime = Date.now();
  const lang = detectLanguageFromHeaders(req.headers);

  const userId = user.id;

  try {
    // Récupérer l'ID depuis les paramètres de requête
    const { searchParams } = new URL(req.url);
    const configId = searchParams.get('id');

    if (!configId) {
      return NextResponse.json({
        success: false,
        error: lang === 'fr' ? 'ID de configuration requis' : 'Configuration ID required',
        code: 'MISSING_CONFIG_ID',
      }, { status: 400 });
    }
  
      // Vérifier que la configuration appartient à l'utilisateur
      const existingConfig = await db.export_configs.findFirst({
        where: { id: configId, createdBy: userId }
      });
  
      if (!existingConfig) {
        return NextResponse.json({
          success: false,
          error: lang === 'fr' ? 'Configuration non trouvée' : 'Configuration not found',
          code: 'CONFIG_NOT_FOUND',
        }, { status: 404 });
      }
  
      // Supprimer la configuration
      await db.export_configs.delete({
        where: { id: configId }
      });
  
      // Si c'était la configuration par défaut, en définir une nouvelle
      if (existingConfig.is_default) {
        const firstConfig = await db.export_configs.findFirst({
          where: { createdBy: userId },
          orderBy: { createdAt: 'asc' }
        });
  
        if (firstConfig) {
          await db.export_configs.update({
            where: { id: firstConfig.id },
            data: { is_default: true }
          });
        }
      }
  
      const response = {
        success: true,
        data: {
          deleted_config: {
            id: existingConfig.id,
            name: existingConfig.name,
            was_default: existingConfig.is_default
          }
        },
        metadata: {
          user_id: userId,
          deleted_at: new Date().toISOString()
        },
        message: lang === 'fr' 
          ? `Configuration '${existingConfig.name}' supprimée avec succès` 
          : `Configuration '${existingConfig.name}' deleted successfully`,
        execution_time_ms: Date.now() - startTime,
      };
  
      return NextResponse.json(response);
    } catch (error) {
      console.error('[EXPORT CONFIG] Error deleting configuration:', error);
      throw error;
    }
  });
}
