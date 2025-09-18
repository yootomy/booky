// =============================================================================
// 📤 HOOKS PERSONNALISÉS POUR L'EXPORT
// =============================================================================
// Hooks React Query optimisés pour la gestion des exports avec cache intelligent

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { exportApi } from '@/utils/orpc';
import type { ApiResponse } from '@/types/api';

// =============================================================================
// 🔧 QUERY KEYS
// =============================================================================

export const exportQueryKeys = {
  all: ['exports'] as const,
  history: () => [...exportQueryKeys.all, 'history'] as const,
  configs: () => [...exportQueryKeys.all, 'configs'] as const,
  templates: () => [...exportQueryKeys.all, 'templates'] as const,
} as const;

// =============================================================================
// 📊 TYPES POUR LES HOOKS
// =============================================================================

interface ExportCreateParams {
  type: string;
  format: string;
  filters?: Record<string, unknown>;
  options?: Record<string, unknown>;
  template?: string;
  filename?: string;
}

interface ExportHistory {
  id: string;
  format: string;
  filename: string;
  created_at: string;
  file_size: number;
  status: 'completed' | 'failed' | 'processing';
  download_url?: string;
  error_message?: string;
  export_options?: Record<string, unknown>;
}

interface ExportStats {
  total_exports: number;
  exports_this_month: number;
  most_used_format: string;
  total_size_mb: number;
  success_rate: number;
  average_generation_time_seconds: number;
}

// =============================================================================
// 📋 HOOK POUR L'HISTORIQUE DES EXPORTS
// =============================================================================

export function useExportHistory(options?: {
  limit?: number;
  format?: string;
  status?: string;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: exportQueryKeys.history(),
    queryFn: async (): Promise<ExportHistory[]> => {
      const response = await exportApi.getHistory();
      return response.data || [];
    },
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: options?.refetchInterval,
    retry: (failureCount, error) => {
      // Retry seulement pour les erreurs réseau
      if (error instanceof Error && error.message.includes('Network')) {
        return failureCount < 2;
      }
      return false;
    },
  });
}

// =============================================================================
// ⚡ HOOK POUR CRÉER UN EXPORT
// =============================================================================

export function useCreateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ExportCreateParams) => {
      const response = await exportApi.create(
        params.type,
        params.format,
        params.filters || {}
      );
      return response;
    },
    onSuccess: (response, variables) => {
      // Invalider et refetch l'historique
      queryClient.invalidateQueries({ queryKey: exportQueryKeys.history() });
      
      // Notification de succès
      toast.success(`Export ${variables.format} créé avec succès`, {
        description: `Votre export "${variables.filename || 'sans-nom'}" est en cours de génération`,
        action: response.data?.download_url ? {
          label: 'Télécharger',
          onClick: () => {
            if (response.data?.download_url) {
              window.open(response.data.download_url, '_blank');
            }
          },
        } : undefined,
      });
    },
    onError: (error: Error, variables) => {
      // Notification d'erreur
      toast.error(`Erreur lors de la création de l'export ${variables.format}`, {
        description: error.message || 'Une erreur inattendue s\'est produite',
        action: {
          label: 'Réessayer',
          onClick: () => {
            // L'utilisateur devra relancer manuellement
          },
        },
      });
    },
  });
}

// =============================================================================
// 💾 HOOK POUR TÉLÉCHARGER UN EXPORT
// =============================================================================

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (exportId: string): Promise<void> => {
      try {
        // Pour une vraie implémentation, remplacez par votre logique de téléchargement
        const response = await exportApi.download(exportId);
        
        if (response instanceof Blob) {
          // Créer un lien de téléchargement temporaire
          const url = window.URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = url;
          link.download = `export-${exportId}`;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Libérer la mémoire
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (error) {
        throw new Error(`Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    },
    onSuccess: (_, exportId) => {
      toast.success('Téléchargement démarré', {
        description: `L'export ${exportId} est en cours de téléchargement`,
      });
    },
    onError: (error: Error, exportId) => {
      toast.error('Erreur de téléchargement', {
        description: error.message,
        action: {
          label: 'Réessayer',
          onClick: () => {
            // L'utilisateur devra relancer manuellement
          },
        },
      });
    },
  });
}

// =============================================================================
// 🗑️ HOOK POUR SUPPRIMER UN EXPORT
// =============================================================================

export function useDeleteExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exportId: string): Promise<void> => {
      await exportApi.delete(exportId);
    },
    onSuccess: (_, exportId) => {
      // Invalider l'historique pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: exportQueryKeys.history() });
      
      toast.success('Export supprimé', {
        description: `L'export ${exportId} a été supprimé avec succès`,
      });
    },
    onError: (error: Error, exportId) => {
      toast.error('Erreur de suppression', {
        description: error.message || 'Impossible de supprimer cet export',
      });
    },
  });
}

// =============================================================================
// 📊 HOOK POUR LES STATISTIQUES D'EXPORT
// =============================================================================

export function useExportStats() {
  return useQuery({
    queryKey: [...exportQueryKeys.all, 'stats'],
    queryFn: async (): Promise<ExportStats> => {
      // Pour l'instant, retourner des données simulées
      // À remplacer par un vrai appel API quand disponible
      return {
        total_exports: 0,
        exports_this_month: 0,
        most_used_format: 'PDF',
        total_size_mb: 0,
        success_rate: 100,
        average_generation_time_seconds: 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// =============================================================================
// 🎨 HOOK POUR LES TEMPLATES D'EXPORT
// =============================================================================

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  is_default: boolean;
  is_custom: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useExportTemplates() {
  return useQuery({
    queryKey: exportQueryKeys.templates(),
    queryFn: async (): Promise<ExportTemplate[]> => {
      // Templates prédéfinis (à remplacer par un appel API si nécessaire)
      const templates: ExportTemplate[] = [
        {
          id: 'catalog-complete',
          name: 'Catalogue complet',
          description: 'Export complet avec toutes les données, images et critiques',
          format: 'PDF',
          is_default: true,
          is_custom: false,
          config: {
            include_metadata: true,
            include_relations: true,
            include_personal_notes: true,
            include_ratings: true,
            include_images: true,
            pdf_layout: 'cards',
            pdf_theme: 'romance',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'simple-list',
          name: 'Liste simple',
          description: 'Export minimal pour inventaire ou partage',
          format: 'CSV',
          is_default: true,
          is_custom: false,
          config: {
            include_metadata: false,
            include_relations: false,
            include_personal_notes: false,
            include_ratings: true,
            csv_include_headers: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'technical-data',
          name: 'Données techniques',
          description: 'Export JSON pour développeurs et intégrations',
          format: 'JSON',
          is_default: true,
          is_custom: false,
          config: {
            include_metadata: true,
            include_relations: true,
            include_personal_notes: true,
            include_ratings: true,
            include_statistics: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      return templates;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// =============================================================================
// 🔄 HOOK POUR LE POLLING DES EXPORTS EN COURS
// =============================================================================

export function useExportPolling(enabled: boolean = false) {
  const { data: history, refetch } = useExportHistory({
    refetchInterval: enabled ? 5000 : undefined, // Poll toutes les 5 secondes si activé
  });

  // Filtrer les exports en cours
  const processingExports = history?.filter(exp => exp.status === 'processing') || [];
  const hasProcessingExports = processingExports.length > 0;

  // Fonction pour démarrer/arrêter le polling
  const togglePolling = useCallback((shouldPoll: boolean) => {
    // Cette logique peut être étendue si nécessaire
  }, []);

  return {
    processingExports,
    hasProcessingExports,
    totalProcessing: processingExports.length,
    togglePolling,
    refetchHistory: refetch,
  };
}

// =============================================================================
// 🎯 HOOK COMBINÉ POUR L'INTERFACE D'EXPORT
// =============================================================================

export function useExportManager() {
  const history = useExportHistory();
  const createExport = useCreateExport();
  const downloadExport = useDownloadExport();
  const deleteExport = useDeleteExport();
  const stats = useExportStats();
  const templates = useExportTemplates();
  const polling = useExportPolling(createExport.isPending);

  return {
    // Données
    history: history.data || [],
    stats: stats.data,
    templates: templates.data || [],
    
    // États de chargement
    isLoadingHistory: history.isLoading,
    isLoadingStats: stats.isLoading,
    isLoadingTemplates: templates.isLoading,
    
    // Actions
    createExport: createExport.mutate,
    downloadExport: downloadExport.mutate,
    deleteExport: deleteExport.mutate,
    
    // États des actions
    isCreating: createExport.isPending,
    isDownloading: downloadExport.isPending,
    isDeleting: deleteExport.isPending,
    
    // Polling
    processingExports: polling.processingExports,
    hasProcessingExports: polling.hasProcessingExports,
    
    // Rafraîchissement
    refetchHistory: history.refetch,
    refetchStats: stats.refetch,
  };
}

export default useExportManager;