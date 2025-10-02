/**
 * ImageUpload - Composant d'upload d'images pour les couvertures
 * Supporte le drag & drop, preview, validation et compression
 */

"use client";

import { useState, useRef, useCallback } from "react";
import Image from 'next/image';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  AlertCircle,
  Crop,
  RotateCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface ImageUploadProps {
  value?: string | File | null;
  onChange: (file: File | null, url?: string) => void;
  onUploadComplete?: (url: string) => void;
  accept?: string;
  maxSize?: number; // en MB
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showPreview?: boolean;
  allowCrop?: boolean;
  compressQuality?: number;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUploadComplete,
  accept = 'image/*',
  maxSize = 5, // 5MB par défaut
  maxWidth = 1200,
  maxHeight = 1800,
  aspectRatio,
  placeholder = 'Choisir une image ou glisser-déposer',
  className,
  disabled = false,
  required = false,
  showPreview = true,
  allowCrop = false,
  compressQuality = 0.8
}: ImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gérer la preview
  const generatePreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Valider le fichier
  const validateFile = (file: File): string | null => {
    // Type de fichier
    if (!file.type.startsWith('image/')) {
      return 'Veuillez sélectionner une image valide';
    }

    // Taille du fichier
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `L'image ne doit pas dépasser ${maxSize}MB`;
    }

    return null;
  };

  // Redimensionner et compresser l'image
  const processImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let { width, height } = img;

        // Calculer les nouvelles dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratioW = maxWidth / width;
          const ratioH = maxHeight / height;
          const ratio = Math.min(ratioW, ratioH);
          
          width = width * ratio;
          height = height * ratio;
        }

        // Appliquer l'aspect ratio si spécifié
        if (aspectRatio) {
          const currentRatio = width / height;
          if (currentRatio !== aspectRatio) {
            if (currentRatio > aspectRatio) {
              width = height * aspectRatio;
            } else {
              height = width / aspectRatio;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(processedFile);
            } else {
              reject(new Error('Erreur lors du traitement de l\'image'));
            }
          },
          file.type,
          compressQuality
        );
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Gérer la sélection de fichier
  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadState(prev => ({ ...prev, error, success: false }));
      return;
    }

    setUploadState({ uploading: true, progress: 0, error: null, success: false });

    try {
      // Générer la preview immédiatement
      generatePreview(file);

      // Traiter l'image (redimensionner, compresser)
      setUploadState(prev => ({ ...prev, progress: 30 }));
      const processedFile = await processImage(file);
      
      setUploadState(prev => ({ ...prev, progress: 60 }));

      // Simuler l'upload (à remplacer par l'API réelle)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadState(prev => ({ ...prev, progress: 100, success: true, uploading: false }));
      
      // Callback avec le fichier traité
      onChange(processedFile);
      
      // Si on a un callback d'upload complet, on peut générer une URL
      if (onUploadComplete) {
        const url = URL.createObjectURL(processedFile);
        onUploadComplete(url);
      }

    } catch (error) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: 'Erreur lors du traitement de l\'image',
        success: false
      });
    }
  };

  // Gérer le drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled]);

  // Gérer le clic sur l'input
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Supprimer l'image
  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    setUploadState({ uploading: false, progress: 0, error: null, success: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // URL de l'image actuelle (value ou preview)
  const currentImageUrl = typeof value === 'string' ? value : preview;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone d'upload */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          dragActive && !disabled && 'border-primary bg-primary/5',
          uploadState.error && 'border-destructive bg-destructive/5',
          uploadState.success && 'border-green-500 bg-green-50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !dragActive && 'hover:border-muted-foreground/50',
          currentImageUrl ? "p-2" : "p-8"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="sr-only"
          disabled={disabled}
          required={required}
        />

        {/* Contenu de la zone d'upload */}
        {currentImageUrl && showPreview ? (
          <div className="relative group">
            <div className="relative aspect-[2/3] max-w-48 mx-auto">
              <Image
                src={currentImageUrl}
                alt="Preview"
                fill
                className="object-cover rounded-md"
              />
              
              {/* Overlay avec actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  <Upload className="w-4 h-4" />
                </Button>
                
                {allowCrop && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Crop className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {uploadState.uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Upload en cours...</p>
                  <Progress value={uploadState.progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{uploadState.progress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {uploadState.error ? (
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  ) : uploadState.success ? (
                    <Check className="w-8 h-8 text-green-500" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {uploadState.error
                      ? "Erreur d'upload"
                      : uploadState.success
                        ? 'Image uploadée avec succès' : placeholder
                    }
                  </p>
                  
                  <p className='text-xs text-muted-foreground'>
                    {dragActive 
                      ? 'Relâchez pour uploader'
                      : 'Formats acceptés: PNG, JPG, GIF (max ${maxSize}MB)'
                    }
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choisir un fichier
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages d"état */}
      {uploadState.error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {uploadState.error}
        </div>
      )}

      {uploadState.success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          Image uploadée avec succès
        </div>
      )}

      {/* Informations sur l'image */}
      {currentImageUrl && !uploadState.uploading && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">
            {typeof value === 'object' && value instanceof File
              ? `${(value.size / 1024).toFixed(0)} KB` : "Image externe"
            }
          </Badge>
          
          {aspectRatio && (
            <Badge variant="outline">
              Ratio {aspectRatio}:1
            </Badge>
          )}
          
          <Badge variant="outline">
            Max {maxWidth}x{maxHeight}px
          </Badge>
        </div>
      )}
    </div>
  );
}

// Hook pour gérer plusieurs images
export function useMultipleImageUpload(maxFiles: number = 5) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const addFile = (file: File) => {
    if (files.length >= maxFiles) return;
    
    setFiles(prev => [...prev, file]);
    
    // Générer preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(prev => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setPreviews([]);
  };

  return {
    files,
    previews,
    addFile,
    removeFile,
    clearAll,
    canAddMore: files.length < maxFiles
  };
}