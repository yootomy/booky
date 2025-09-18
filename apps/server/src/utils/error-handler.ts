import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// =============================================================================
// 🚨 SYSTÈME DE GESTION D'ERREURS PERSONNALISÉES
// =============================================================================

// Types d'erreurs personnalisées
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  DUPLICATE_ERROR = "DUPLICATE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR"
}

// Interface pour les erreurs personnalisées
export interface CustomError {
  type: ErrorType;
  message: string;
  details?: unknown;
  field?: string;
  code?: string;
  statusCode: number;
}

// Messages d'erreur localisés
const ErrorMessages = {
  fr: {
    // Erreurs de validation
    VALIDATION_ERROR: "Données invalides",
    REQUIRED_FIELD: "Ce champ est obligatoire",
    INVALID_FORMAT: "Format invalide",
    
    // Erreurs de ressources
    NOT_FOUND: "Ressource non trouvée",
    BOOK_NOT_FOUND: "Livre non trouvé",
    CATEGORY_NOT_FOUND: "Catégorie non trouvée", 
    TAG_NOT_FOUND: "Tag non trouvé",
    USER_NOT_FOUND: "Utilisateur non trouvé",
    
    // Erreurs d'autorisation
    UNAUTHORIZED: "Non autorisé - Connexion requise",
    FORBIDDEN: "Accès interdit",
    INVALID_CREDENTIALS: "Identifiants invalides",
    SESSION_EXPIRED: "Session expirée",
    
    // Erreurs de duplication
    DUPLICATE_ERROR: "Cette ressource existe déjà",
    BOOK_ALREADY_EXISTS: "Un livre avec ce titre et auteur existe déjà",
    CATEGORY_ALREADY_EXISTS: "Cette catégorie existe déjà",
    TAG_ALREADY_EXISTS: "Ce tag existe déjà",
    EMAIL_ALREADY_EXISTS: "Cette adresse email est déjà utilisée",
    
    // Erreurs de base de données
    DATABASE_ERROR: "Erreur de base de données",
    DATABASE_CONNECTION_ERROR: "Impossible de se connecter à la base de données",
    TRANSACTION_ERROR: "Erreur lors de la transaction",
    
    // Erreurs d'API externes
    EXTERNAL_API_ERROR: "Erreur de l'API externe",
    GOOGLE_BOOKS_ERROR: "Erreur de l'API Google Books",
    OPEN_LIBRARY_ERROR: "Erreur de l'API Open Library",
    API_RATE_LIMIT: "Limite de taux d'API atteinte",
    
    // Erreurs système
    INTERNAL_ERROR: "Erreur interne du serveur",
    FILE_UPLOAD_ERROR: "Erreur lors du téléchargement du fichier",
    IMAGE_PROCESSING_ERROR: "Erreur lors du traitement de l'image",
    
    // Erreurs de limite
    RATE_LIMIT_ERROR: "Trop de requêtes - Veuillez réessayer plus tard",
    FILE_SIZE_LIMIT: "Fichier trop volumineux",
    REQUEST_TIMEOUT: "Délai d'attente de la requête dépassé"
  },
  
  en: {
    // Validation errors
    VALIDATION_ERROR: "Invalid data",
    REQUIRED_FIELD: "This field is required",
    INVALID_FORMAT: "Invalid format",
    
    // Resource errors
    NOT_FOUND: "Resource not found",
    BOOK_NOT_FOUND: "Book not found",
    CATEGORY_NOT_FOUND: "Category not found",
    TAG_NOT_FOUND: "Tag not found", 
    USER_NOT_FOUND: "User not found",
    
    // Authorization errors
    UNAUTHORIZED: "Unauthorized - Login required",
    FORBIDDEN: "Access forbidden",
    INVALID_CREDENTIALS: "Invalid credentials",
    SESSION_EXPIRED: "Session expired",
    
    // Duplication errors
    DUPLICATE_ERROR: "This resource already exists",
    BOOK_ALREADY_EXISTS: "A book with this title and author already exists",
    CATEGORY_ALREADY_EXISTS: "This category already exists",
    TAG_ALREADY_EXISTS: "This tag already exists",
    EMAIL_ALREADY_EXISTS: "This email address is already in use",
    
    // Database errors
    DATABASE_ERROR: "Database error",
    DATABASE_CONNECTION_ERROR: "Unable to connect to database",
    TRANSACTION_ERROR: "Transaction error",
    
    // External API errors
    EXTERNAL_API_ERROR: "External API error",
    GOOGLE_BOOKS_ERROR: "Google Books API error",
    OPEN_LIBRARY_ERROR: "Open Library API error", 
    API_RATE_LIMIT: "API rate limit reached",
    
    // System errors
    INTERNAL_ERROR: "Internal server error",
    FILE_UPLOAD_ERROR: "File upload error",
    IMAGE_PROCESSING_ERROR: "Image processing error",
    
    // Rate limit errors
    RATE_LIMIT_ERROR: "Too many requests - Please try again later",
    FILE_SIZE_LIMIT: "File too large",
    REQUEST_TIMEOUT: "Request timeout"
  }
};

// =============================================================================
// 🌍 FONCTIONS UTILITAIRES POUR LA LOCALISATION
// =============================================================================

export function getErrorMessage(key: string, lang: 'fr' | 'en' = 'fr'): string {
  const messages = ErrorMessages[lang] as Record<string, string>;
  return messages[key] || messages['INTERNAL_ERROR'] || "Une erreur est survenue";
}

export function detectLanguageFromHeaders(headers: Headers): 'fr' | 'en' {
  const acceptLanguage = headers.get('accept-language') || '';
  
  if (acceptLanguage.includes('fr')) return 'fr';
  if (acceptLanguage.includes('en')) return 'en';
  
  return 'fr'; // Défaut français
}

// =============================================================================
// 🔧 CLASSES D'ERREURS PERSONNALISÉES
// =============================================================================

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly field?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean = true;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    field?: string,
    details?: unknown
  ) {
    super(message);
    
    this.type = type;
    this.statusCode = statusCode;
    this.field = field;
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Classes spécialisées pour chaque type d'erreur
export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: unknown) {
    super(ErrorType.VALIDATION_ERROR, message, 400, field, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    const message = `${resource} not found`;
    super(ErrorType.NOT_FOUND, message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super(
      ErrorType.UNAUTHORIZED,
      message || "Unauthorized access",
      401
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(
      ErrorType.FORBIDDEN, 
      message || "Access forbidden",
      403
    );
  }
}

export class DuplicateError extends AppError {
  constructor(resource: string, field?: string) {
    super(
      ErrorType.DUPLICATE_ERROR,
      `${resource} already exists`,
      409,
      field
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message?: string, details?: unknown) {
    super(
      ErrorType.DATABASE_ERROR,
      message || "Database error",
      500,
      undefined,
      details
    );
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, message?: string) {
    super(
      ErrorType.EXTERNAL_API_ERROR,
      message || `${service} API error`,
      502
    );
  }
}

export class RateLimitError extends AppError {
  constructor(message?: string) {
    super(
      ErrorType.RATE_LIMIT_ERROR,
      message || "Rate limit exceeded",
      429
    );
  }
}

// =============================================================================
// 🎯 GESTIONNAIRE GLOBAL D'ERREURS
// =============================================================================

export function handleError(error: unknown, lang: 'fr' | 'en' = 'fr'): NextResponse {
  console.error("🚨 Error occurred:", error);

  // Erreur Zod (validation)
  if (error instanceof z.ZodError) {
    const translatedIssues = error.issues.map(issue => ({
      path: issue.path,
      message: translateZodError(issue, lang),
      code: issue.code,
      received: 'received' in issue ? issue.received : undefined
    }));

    return NextResponse.json({
      success: false,
      error: getErrorMessage('VALIDATION_ERROR', lang),
      type: ErrorType.VALIDATION_ERROR,
      details: translatedIssues
    }, { status: 400 });
  }

  // Erreur personnalisée
  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type,
      field: error.field,
      details: error.details
    }, { status: error.statusCode });
  }

  // Erreur Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error, lang);
  }

  // Erreur inconnue
  return NextResponse.json({
    success: false,
    error: getErrorMessage('INTERNAL_ERROR', lang),
    type: ErrorType.INTERNAL_ERROR
  }, { status: 500 });
}

// =============================================================================
// 📝 TRADUCTION DES ERREURS ZOD
// =============================================================================

function translateZodError(issue: z.ZodIssue, lang: 'fr' | 'en'): string {
  const { code, path, message } = issue;
  const fieldName = path.join('.');

  const translations = {
    fr: {
      required_error: `Le champ '${fieldName}' est obligatoire`,
      invalid_type: `Type invalide pour '${fieldName}'`,
      too_small: `'${fieldName}' est trop court`,
      too_big: `'${fieldName}' est trop long`,
      invalid_string: `Format invalide pour '${fieldName}'`,
      invalid_date: `Date invalide pour '${fieldName}'`,
      invalid_url: `URL invalide pour '${fieldName}'`,
      invalid_email: `Email invalide pour '${fieldName}'`,
      custom: message
    },
    en: {
      required_error: `Field '${fieldName}' is required`,
      invalid_type: `Invalid type for '${fieldName}'`,
      too_small: `'${fieldName}' is too short`,
      too_big: `'${fieldName}' is too long`, 
      invalid_string: `Invalid format for '${fieldName}'`,
      invalid_date: `Invalid date for '${fieldName}'`,
      invalid_url: `Invalid URL for '${fieldName}'`,
      invalid_email: `Invalid email for '${fieldName}'`,
      custom: message
    }
  };

  return translations[lang][code as keyof typeof translations[typeof lang]] || message;
}

// =============================================================================
// 🗄️ GESTION DES ERREURS PRISMA
// =============================================================================

function handlePrismaError(error: any, lang: 'fr' | 'en'): NextResponse {
  const { code, message } = error;

  switch (code) {
    case 'P2002': // Unique constraint violation
      return NextResponse.json({
        success: false,
        error: getErrorMessage('DUPLICATE_ERROR', lang),
        type: ErrorType.DUPLICATE_ERROR,
        details: { constraint: error.meta?.target }
      }, { status: 409 });

    case 'P2025': // Record not found
      return NextResponse.json({
        success: false,
        error: getErrorMessage('NOT_FOUND', lang),
        type: ErrorType.NOT_FOUND
      }, { status: 404 });

    case 'P2003': // Foreign key constraint violation
      return NextResponse.json({
        success: false,
        error: getErrorMessage('VALIDATION_ERROR', lang),
        type: ErrorType.VALIDATION_ERROR,
        details: { foreignKey: error.meta?.field_name }
      }, { status: 400 });

    case 'P2014': // Invalid ID
      return NextResponse.json({
        success: false,
        error: getErrorMessage('VALIDATION_ERROR', lang),
        type: ErrorType.VALIDATION_ERROR,
        details: { message: "Invalid ID provided" }
      }, { status: 400 });

    default:
      console.error("Unhandled Prisma error:", error);
      return NextResponse.json({
        success: false,
        error: getErrorMessage('DATABASE_ERROR', lang),
        type: ErrorType.DATABASE_ERROR,
        details: process.env.NODE_ENV === 'development' ? message : undefined
      }, { status: 500 });
  }
}

// =============================================================================
// 🔄 WRAPPER POUR GESTIONNAIRE D'ERREURS ASYNC
// =============================================================================

type AsyncHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withErrorHandler(handler: AsyncHandler) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      const lang = detectLanguageFromHeaders(req.headers);
      return handleError(error, lang);
    }
  };
}

// =============================================================================
// 📊 LOGGING ET MONITORING
// =============================================================================

export function logError(error: AppError | Error, context?: Record<string, unknown>) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    type: error instanceof AppError ? error.type : 'UNKNOWN',
    context: context || {},
    environment: process.env.NODE_ENV,
  };

  // En développement, log dans la console
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error Log:', JSON.stringify(errorLog, null, 2));
  } else {
    // En production, log dans un service externe (Sentry, LogRocket, etc.)
    // await externalLoggingService.log(errorLog);
    console.error('🚨 Production Error:', errorLog);
  }
}

// =============================================================================
// ✅ VALIDATION D'ERREURS POUR LES TESTS
// =============================================================================

export function isValidationError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof AppError && error.type === ErrorType.NOT_FOUND;
}