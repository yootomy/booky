import multer from 'multer';
import { NextRequest } from 'next/server';
import { ImageValidator } from './image-processor';

// =============================================================================
// 📤 UPLOAD MIDDLEWARE - GESTION DES UPLOADS DE FICHIERS
// =============================================================================

// Configuration pour le stockage en mémoire (plus sécurisé)
const storage = multer.memoryStorage();

// Configuration Multer pour les images
const multerConfig = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1, // Un seul fichier à la fois
    fieldNameSize: 100,
    fieldSize: 1024,
    fields: 5,
    parts: 10
  },
  fileFilter: (req, file, cb) => {
    // Validation initiale du fichier
    const validation = ImageValidator.validateFile(file);
    
    if (!validation.isValid) {
      const error = new Error(validation.error) as any;
      error.code = 'INVALID_FILE';
      return cb(error, false);
    }
    
    cb(null, true);
  }
});

// Middleware principal pour upload d'images
export const uploadImage = multerConfig.single('cover');

// =============================================================================
// 🔧 HELPER POUR NEXT.JS 15 APP ROUTER
// =============================================================================

export interface MulterRequest {
  file?: Express.Multer.File;
  body: any;
}

// Fonction pour convertir une requête Next.js en format Multer compatible
export function createMulterHandler(
  multerMiddleware: any
): (request: NextRequest) => Promise<{ file?: Express.Multer.File; body?: any; error?: string }> {
  return async (request: NextRequest) => {
    return new Promise((resolve) => {
      // Créer des objets req/res compatibles avec Express
      const req = {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: undefined,
        file: undefined,
        files: undefined
      } as any;

      const res = {
        status: (code: number) => ({ json: (data: any) => data }),
        json: (data: any) => data
      } as any;

      // Traitement du body multipart/form-data
      request.formData().then(formData => {
        const fileEntry = formData.get('cover') as File | null;
        
        if (fileEntry && fileEntry instanceof File) {
          // Convertir File en format Multer
          fileEntry.arrayBuffer().then(buffer => {
            req.file = {
              fieldname: 'cover',
              originalname: fileEntry.name,
              encoding: '7bit',
              mimetype: fileEntry.type,
              size: fileEntry.size,
              buffer: Buffer.from(buffer),
              stream: undefined as any,
              destination: '',
              filename: '',
              path: ''
            };

            // Validation du fichier
            const validation = ImageValidator.validateFile(req.file);
            if (!validation.isValid) {
              resolve({ error: validation.error });
              return;
            }

            // Ajouter les autres champs du formulaire
            req.body = {};
            for (const [key, value] of formData.entries()) {
              if (key !== 'cover') {
                req.body[key] = value;
              }
            }

            resolve({ file: req.file, body: req.body });
          }).catch(error => {
            resolve({ error: `Failed to read file buffer: ${error.message}` });
          });
        } else {
          resolve({ error: 'No file provided or invalid file format' });
        }
      }).catch(error => {
        resolve({ error: `Failed to parse form data: ${error.message}` });
      });
    });
  };
}

// Handler spécialisé pour les uploads d'images
export const handleImageUpload = createMulterHandler(uploadImage);

// =============================================================================
// 🔒 VALIDATION ET SÉCURITÉ
// =============================================================================

export interface UploadValidationOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  requireAuthentication?: boolean;
}

export class UploadValidator {
  static validateUploadRequest(
    file: Express.Multer.File | undefined,
    options: UploadValidationOptions = {}
  ): { isValid: boolean; error?: string } {
    const {
      maxFileSize = 10 * 1024 * 1024,
      allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'],
      requireAuthentication = true
    } = options;

    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    // Vérifier la taille
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds limit: ${Math.round(file.size / 1024 / 1024)}MB > ${Math.round(maxFileSize / 1024 / 1024)}MB`
      };
    }

    // Vérifier le type MIME
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`
      };
    }

    // Vérifier l'extension
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file extension: ${extension}. Allowed: ${allowedExtensions.join(', ')}`
      };
    }

    // Vérifier que le buffer n'est pas vide
    if (!file.buffer || file.buffer.length === 0) {
      return {
        isValid: false,
        error: 'File buffer is empty or corrupted'
      };
    }

    return { isValid: true };
  }

  static async validateImageContent(file: Express.Multer.File): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Utiliser ImageValidator pour une validation approfondie
      const validation = await ImageValidator.validateImageBuffer(file.buffer);
      
      if (!validation.isValid) {
        return validation;
      }

      // Vérifications supplémentaires de sécurité
      const metadata = validation.metadata;
      
      // Vérifier que l'image n'est pas suspecte (dimensions extremes, etc.)
      if (metadata && metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        
        // Ratios suspects (trop longs ou trop larges peuvent être des attaques)
        if (aspectRatio > 10 || aspectRatio < 0.1) {
          return {
            isValid: false,
            error: `Suspicious aspect ratio: ${aspectRatio.toFixed(2)}. Image may be malformed.`
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Image content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// =============================================================================
// 📝 TYPES ET INTERFACES
// =============================================================================

export interface UploadResult {
  success: boolean;
  file?: {
    originalName: string;
    size: number;
    mimeType: string;
    buffer: Buffer;
  };
  error?: string;
  validationErrors?: string[];
}

export interface ImageUploadMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
  uploadedBy: string;
}

// =============================================================================
// 🛠️ UTILITAIRES
// =============================================================================

export function createUploadResponse(
  success: boolean,
  data?: any,
  error?: string,
  statusCode: number = 200
): Response {
  const response = {
    success,
    ...(data && { data }),
    ...(error && { error }),
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

export function sanitizeFileName(fileName: string): string {
  // Supprimer les caractères dangereux et normaliser
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
    .substring(0, 100); // Limiter la longueur
}

export function generateUniqueFileName(originalName: string, userId: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = sanitizeFileName(baseName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${sanitizedName}_${userId.substring(0, 8)}_${timestamp}_${randomSuffix}.${extension}`;
}

// Configuration par défaut pour les uploads
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'],
  UPLOAD_TIMEOUT: 30000, // 30 secondes
  MAX_FILES_PER_HOUR: 50, // Limitation de rate
  SUPPORTED_FORMATS: ['jpeg', 'jpg', 'png', 'webp']
};