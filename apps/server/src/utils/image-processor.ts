import sharp from 'sharp';
import { z } from 'zod';

// =============================================================================
// 🖼️ IMAGE PROCESSOR - TRAITEMENT D'IMAGES AVANCÉ
// =============================================================================

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
  optimizeForWeb?: boolean;
  preserveMetadata?: boolean;
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: {
    format: string;
    width: number;
    height: number;
    size: number;
    originalSize: number;
    compressionRatio: number;
  };
  filename: string;
  mimetype: string;
}

export interface ThumbnailResult {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    size: number;
  };
  filename: string;
}

// Configuration par défaut pour les couvertures de livres
const DEFAULT_COVER_OPTIONS: ImageProcessingOptions = {
  maxWidth: 800,
  maxHeight: 1200,
  quality: 85,
  format: 'webp',
  generateThumbnail: true,
  thumbnailSize: 200,
  optimizeForWeb: true,
  preserveMetadata: false
};

const THUMBNAIL_OPTIONS: ImageProcessingOptions = {
  maxWidth: 200,
  maxHeight: 300,
  quality: 80,
  format: 'webp',
  optimizeForWeb: true,
  preserveMetadata: false
};

// Validation des formats d'image
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DIMENSIONS = { width: 100, height: 150 };
const MAX_DIMENSIONS = { width: 4000, height: 6000 };

// Schéma de validation pour les options d'image
const ImageOptionsSchema = z.object({
  maxWidth: z.number().min(100).max(4000).optional(),
  maxHeight: z.number().min(150).max(6000).optional(),
  quality: z.number().min(10).max(100).optional(),
  format: z.enum(['jpeg', 'png', 'webp']).optional(),
  generateThumbnail: z.boolean().optional(),
  thumbnailSize: z.number().min(50).max(500).optional(),
  optimizeForWeb: z.boolean().optional(),
  preserveMetadata: z.boolean().optional()
});

// =============================================================================
// 🔍 VALIDATION D'IMAGES
// =============================================================================

export class ImageValidator {
  static validateFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Vérifier l'extension du fichier
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
      return {
        isValid: false,
        error: `Unsupported file format: ${extension}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
      };
    }

    // Vérifier le type MIME
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];

    if (!validMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid MIME type: ${file.mimetype}. File may be corrupted or not an image.`
      };
    }

    return { isValid: true };
  }

  static async validateImageBuffer(buffer: Buffer): Promise<{ isValid: boolean; error?: string; metadata?: sharp.Metadata }> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        return {
          isValid: false,
          error: 'Unable to read image dimensions. File may be corrupted.'
        };
      }

      // Vérifier les dimensions minimales
      if (metadata.width < MIN_DIMENSIONS.width || metadata.height < MIN_DIMENSIONS.height) {
        return {
          isValid: false,
          error: `Image too small: ${metadata.width}x${metadata.height}. Minimum required: ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}`
        };
      }

      // Vérifier les dimensions maximales
      if (metadata.width > MAX_DIMENSIONS.width || metadata.height > MAX_DIMENSIONS.height) {
        return {
          isValid: false,
          error: `Image too large: ${metadata.width}x${metadata.height}. Maximum allowed: ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}`
        };
      }

      // Vérifier le format
      if (!metadata.format || !SUPPORTED_FORMATS.includes(metadata.format)) {
        return {
          isValid: false,
          error: `Unsupported image format: ${metadata.format}`
        };
      }

      return { isValid: true, metadata };
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// =============================================================================
// 🔧 PROCESSEUR D'IMAGES
// =============================================================================

export class ImageProcessor {
  private static generateFilename(originalName: string, suffix: string = '', format: string = 'webp'): string {
    const baseName = originalName.replace(/\.[^/.]+$/, ''); // Supprimer l'extension
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const timestamp = Date.now();
    return `${sanitizedName}${suffix ? `-${suffix}` : ''}-${timestamp}.${format}`;
  }

  static async processImage(
    buffer: Buffer,
    originalName: string,
    options: ImageProcessingOptions = DEFAULT_COVER_OPTIONS
  ): Promise<ProcessedImage> {
    try {
      // Validation des options
      const validatedOptions = ImageOptionsSchema.parse(options);
      const processOptions = { ...DEFAULT_COVER_OPTIONS, ...validatedOptions };

      // Obtenir les métadonnées originales
      const originalMetadata = await sharp(buffer).metadata();
      const originalSize = buffer.length;

      if (!originalMetadata.width || !originalMetadata.height) {
        throw new Error('Unable to read image metadata');
      }

      // Initialiser Sharp
      let processor = sharp(buffer);

      // Supprimer les métadonnées EXIF si demandé (par défaut pour la vie privée)
      if (!processOptions.preserveMetadata) {
        processor = processor.rotate(); // Auto-rotation basée sur EXIF puis suppression
      }

      // Redimensionnement intelligent
      if (processOptions.maxWidth || processOptions.maxHeight) {
        const resizeOptions: sharp.ResizeOptions = {
          fit: 'inside',
          withoutEnlargement: true
        };

        if (processOptions.maxWidth) resizeOptions.width = processOptions.maxWidth;
        if (processOptions.maxHeight) resizeOptions.height = processOptions.maxHeight;

        processor = processor.resize(resizeOptions);
      }

      // Optimisation selon le format
      switch (processOptions.format) {
        case 'jpeg':
          processor = processor.jpeg({
            quality: processOptions.quality || 85,
            progressive: processOptions.optimizeForWeb,
            mozjpeg: processOptions.optimizeForWeb
          });
          break;
        case 'png':
          processor = processor.png({
            compressionLevel: processOptions.optimizeForWeb ? 9 : 6,
            progressive: processOptions.optimizeForWeb,
            palette: processOptions.optimizeForWeb
          });
          break;
        case 'webp':
        default:
          processor = processor.webp({
            quality: processOptions.quality || 85,
            effort: processOptions.optimizeForWeb ? 6 : 4
          });
          break;
      }

      // Traitement final
      const processedBuffer = await processor.toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      // Calculer le ratio de compression
      const compressionRatio = Math.round((1 - processedBuffer.length / originalSize) * 100);

      return {
        buffer: processedBuffer,
        metadata: {
          format: processedMetadata.format || processOptions.format || 'webp',
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
          size: processedBuffer.length,
          originalSize: originalSize,
          compressionRatio: compressionRatio
        },
        filename: this.generateFilename(originalName, 'cover', processOptions.format),
        mimetype: `image/${processOptions.format || 'webp'}`
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateThumbnail(
    buffer: Buffer,
    originalName: string,
    size: number = 200,
    format: 'jpeg' | 'png' | 'webp' = 'webp'
  ): Promise<ThumbnailResult> {
    try {
      // Créer une miniature carrée avec crop intelligent
      const thumbnailBuffer = await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'centre'
        })
        .webp({ quality: 80 })
        .toBuffer();

      const metadata = await sharp(thumbnailBuffer).metadata();

      return {
        buffer: thumbnailBuffer,
        metadata: {
          width: metadata.width || size,
          height: metadata.height || size,
          size: thumbnailBuffer.length
        },
        filename: this.generateFilename(originalName, 'thumb', format)
      };
    } catch (error) {
      throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async processBookCover(
    buffer: Buffer,
    originalName: string,
    generateThumbnail: boolean = true
  ): Promise<{
    cover: ProcessedImage;
    thumbnail?: ThumbnailResult;
  }> {
    try {
      // Traitement de la couverture principale
      const cover = await this.processImage(buffer, originalName, {
        ...DEFAULT_COVER_OPTIONS,
        generateThumbnail: false // On génère manuellement le thumbnail
      });

      let thumbnail: ThumbnailResult | undefined;

      // Génération du thumbnail si demandé
      if (generateThumbnail) {
        thumbnail = await this.generateThumbnail(
          buffer, 
          originalName, 
          THUMBNAIL_OPTIONS.thumbnailSize
        );
      }

      return {
        cover,
        thumbnail
      };
    } catch (error) {
      throw new Error(`Book cover processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fonction utilitaire pour obtenir des informations sur une image
  static async getImageInfo(buffer: Buffer): Promise<{
    metadata: sharp.Metadata;
    isValid: boolean;
    validationError?: string;
  }> {
    try {
      const validation = await ImageValidator.validateImageBuffer(buffer);
      
      return {
        metadata: validation.metadata || {
          format: 'unknown' as any,
          width: 0,
          height: 0,
          space: 'srgb' as any,
          channels: 3,
          depth: 'uchar' as any,
          density: 72,
          chromaSubsampling: '4:2:0',
          isProgressive: false,
          resolutionUnit: 'inch' as any,
          hasProfile: false,
          hasAlpha: false,
          orientation: 1,
          exif: Buffer.alloc(0),
          icc: Buffer.alloc(0),
          iptc: Buffer.alloc(0),
          xmp: Buffer.alloc(0),
          tifftagPhotoshop: Buffer.alloc(0),
          autoOrient: { width: 0, height: 0 },
          isPalette: false
        },
        isValid: validation.isValid,
        validationError: validation.error
      };
    } catch (error) {
      return {
        metadata: {
          format: 'unknown' as any,
          width: 0,
          height: 0,
          space: 'srgb' as any,
          channels: 3,
          depth: 'uchar' as any,
          density: 72,
          chromaSubsampling: '4:2:0',
          isProgressive: false,
          resolutionUnit: 'inch' as any,
          hasProfile: false,
          hasAlpha: false,
          orientation: 1,
          exif: Buffer.alloc(0),
          icc: Buffer.alloc(0),
          iptc: Buffer.alloc(0),
          xmp: Buffer.alloc(0),
          tifftagPhotoshop: Buffer.alloc(0),
          autoOrient: { width: 0, height: 0 },
          isPalette: false
        },
        isValid: false,
        validationError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Fonction pour optimiser une image existante
  static async optimizeExistingImage(
    buffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp' = 'webp',
    quality: number = 85
  ): Promise<{ buffer: Buffer; compressionRatio: number; originalSize: number; newSize: number }> {
    const originalSize = buffer.length;

    let processor = sharp(buffer);

    switch (targetFormat) {
      case 'jpeg':
        processor = processor.jpeg({ quality, progressive: true, mozjpeg: true });
        break;
      case 'png':
        processor = processor.png({ compressionLevel: 9, progressive: true });
        break;
      case 'webp':
        processor = processor.webp({ quality, effort: 6 });
        break;
    }

    const optimizedBuffer = await processor.toBuffer();
    const compressionRatio = Math.round((1 - optimizedBuffer.length / originalSize) * 100);

    return {
      buffer: optimizedBuffer,
      compressionRatio,
      originalSize,
      newSize: optimizedBuffer.length
    };
  }
}

// =============================================================================
// 📊 UTILITAIRES ET CONSTANTS
// =============================================================================

export const IMAGE_CONSTANTS = {
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
  MIN_DIMENSIONS,
  MAX_DIMENSIONS,
  DEFAULT_COVER_OPTIONS,
  THUMBNAIL_OPTIONS
};

export const MIME_TYPE_MAP: Record<string, string> = {
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp'
};

// Fonction utilitaire pour générer des URLs sécurisées
export function generateImageUrl(filename: string, type: 'cover' | 'thumbnail' = 'cover'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  return `${baseUrl}/api/images/${type}/${filename}`;
}

// Fonction pour nettoyer les anciens fichiers (si stockage local)
export function sanitizeImagePath(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}