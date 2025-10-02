"use client";

// =============================================================================
// 📤 GESTIONNAIRE D'EXPORT AVANCÉ
// =============================================================================
// Interface complète pour configurer et exporter des données de la bibliothèque
// avec options personnalisées, templates et prévisualisation

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  DownloadIcon, 
  FileTextIcon, 
  TableIcon, 
  FileImageIcon, 
  SettingsIcon,
  EyeIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  FilterIcon,
  BookIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  StarIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import { exportApi } from "@/utils/orpc";
import type { BookFilters } from "@/types/api";

// =============================================================================
// 🎨 INTERFACES ET TYPES
// =============================================================================

interface ExportManagerProps {
  className?: string;
}

interface ExportConfig {
  format: "PDF" | "CSV' | 'JSON';
  filename?: string;
  template?: string;
  options: ExportOptions;
  filters: BookFilters;
}

interface ExportOptions {
  // Champs à inclure
  include_metadata: boolean;
  include_relations: boolean;
  include_personal_notes: boolean;
  include_ratings: boolean;
  include_images: boolean;
  include_statistics: boolean;
  
  // Options de formatage
  date_format: 'iso' | 'french' | 'us';
  sort_by: string;
  sort_order: 'asc' | 'desc';
  group_by?: string;
  
  // Options PDF spécifiques
  pdf_layout: 'list' | 'cards' | 'table';
  pdf_theme: 'light' | 'dark' | 'romance';
  pdf_include_cover: boolean;
  pdf_page_size: 'A4' | 'A3' | 'Letter';
  
  // Options CSV spécifiques
  csv_delimiter: ',' | ';' | '\t';
  csv_encoding: 'utf-8' | 'latin1';
  csv_include_headers: boolean;
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
}

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL
// =============================================================================

export function ExportManager({ className }: ExportManagerProps) {
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'CSV' | 'JSON'>('PDF');
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'PDF',
    filename: `booky-export-${new Date().toISOString().split("T")[0]}`,
    options: {
      include_metadata: true,
      include_relations: true,
      include_personal_notes: true,
      include_ratings: true,
      include_images: true,
      include_statistics: false,
      date_format: `french',
      sort_by: 'date_creation',
      sort_order: 'desc',
      pdf_layout: 'cards',
      pdf_theme: 'romance',
      pdf_include_cover: true,
      pdf_page_size: 'A4',
      csv_delimiter: ',',
      csv_encoding: 'utf-8',
      csv_include_headers: true,
    },
    filters: {},
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Récupérer l'historique des exports
  const { data: exportHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['export-history'],
    queryFn: () => exportApi.getHistory(),
    staleTime: 30 * 1000,
  });

  // Mutation pour créer un export
  const createExportMutation = useMutation({
    mutationFn: (config: ExportConfig) => 
      exportApi.create('books', config.format.toLowerCase(), {
        ...config.filters,
        export_options: config.options,
        filename: config.filename,
        template: config.template,
      }),
    onSuccess: (response) => {
      toast.success(`Export créé avec succès", {
        description: "Votre export est en cours de génération",
        action: {
          label: "Télécharger",
          onClick: () => {
            if (response.data?.download_url) {
              window.open(response.data.download_url, '_blank');
            }
          },
        },
      });
      
      // Actualiser l'historique
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création de l\`export', {
        description: error.message,
      });
    },
  });

  // Gérer la création d'export
  const handleCreateExport = useCallback(() => {
    createExportMutation.mutate(exportConfig);
  }, [exportConfig, createExportMutation]);

  // Télécharger un export depuis l'historique
  const handleDownload = useCallback((exportId: string) => {
    exportApi.download(exportId).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = `none`;
      a.href = url;
      a.download = `export-${exportId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }).catch((error) => {
      toast.error(`Erreur lors du téléchargement`, {
        description: error.message,
      });
    });
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export des données</h2>
          <p className="text-muted-foreground">
            Exportez votre bibliothèque dans différents formats
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Configuration d'export</DialogTitle>
                <DialogDescription>
                  Personnalisez les options d'export selon vos besoins
                </DialogDescription>
              </DialogHeader>
              <ExportConfigDialog 
                config={exportConfig} 
                onConfigChange={setExportConfig} 
              />
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handleCreateExport}
            disabled={createExportMutation.isPending}
            className="bg-primary"
          >
            {createExportMutation.isPending ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4 mr-2" />
            )}
            {createExportMutation.isPending ? "Export en cours..." : "Créer export'}
          </Button>
        </div>
      </div>

      {/* Types d'export rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <ExportTypeCard
          icon={<FileImageIcon className="h-8 w-8" />}
          title="Export PDF"
          description="Catalogue complet avec images et mise en page"
          format="PDF"
          isSelected={selectedFormat === "PDF"}
          onSelect={() => {
            setSelectedFormat('PDF');
            setExportConfig(prev => ({ ...prev, format: "PDF" }));
          }}
        />
        
        <ExportTypeCard
          icon={<TableIcon className="h-8 w-8" />}
          title="Export CSV"
          description="Données tabulaires pour Excel ou Google Sheets"
          format="CSV"
          isSelected={selectedFormat === "CSV"}
          onSelect={() => {
            setSelectedFormat('CSV');
            setExportConfig(prev => ({ ...prev, format: "CSV" }));
          }}
        />
        
        <ExportTypeCard
          icon={<FileTextIcon className="h-8 w-8" />}
          title="Export JSON"
          description="Données brutes pour développeurs et APIs"
          format="JSON"
          isSelected={selectedFormat === "JSON"}
          onSelect={() => {
            setSelectedFormat('JSON');
            setExportConfig(prev => ({ ...prev, format: "JSON" }));
          }}
        />
      </div>

      {/* Configuration rapide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configuration actuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom du fichier</Label>
              <Input
                value={exportConfig.filename}
                onChange={(e) => setExportConfig(prev => ({ ...prev, filename: e.target.value }))}
                placeholder="nom-du-fichier"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Format de date</Label>
              <Select
                value={exportConfig.options.date_format}
                onValueChange={(value: any) => setExportConfig(prev => ({
                  ...prev,
                  options: { ...prev.options, date_format: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="french">Français (DD/MM/YYYY)</SelectItem>
                  <SelectItem value="us">US (MM/DD/YYYY)</SelectItem>
                  <SelectItem value="iso">ISO (YYYY-MM-DD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={exportConfig.options.include_ratings}
                onCheckedChange={(checked) => setExportConfig(prev => ({
                  ...prev,
                  options: { ...prev.options, include_ratings: !!checked }
                }))}
              />
              <Label>Inclure les notes</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={exportConfig.options.include_personal_notes}
                onCheckedChange={(checked) => setExportConfig(prev => ({
                  ...prev,
                  options: { ...prev.options, include_personal_notes: !!checked }
                }))}
              />
              <Label>Inclure les critiques</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={exportConfig.options.include_images}
                onCheckedChange={(checked) => setExportConfig(prev => ({
                  ...prev,
                  options: { ...prev.options, include_images: !!checked }
                }))}
              />
              <Label>Inclure les images</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Historique des exports
          </CardTitle>
          <CardDescription>
            Retrouvez et téléchargez vos exports précédents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : exportHistory?.data?.length ? (
            <div className="space-y-3">
              {exportHistory.data.map((exportItem: ExportHistory) => (
                <ExportHistoryItem
                  key={exportItem.id}
                  export={exportItem}
                  onDownload={() => handleDownload(exportItem.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DownloadIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun export trouvé</p>
              <p className="text-sm">Créez votre premier export ci-dessus</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// 🎴 COMPOSANT CARTE TYPE D`EXPORT
// =============================================================================

interface ExportTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  format: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ExportTypeCard({ icon, title, description, format, isSelected, onSelect }: ExportTypeCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onSelect}
    >
      <CardContent className="p-6 text-center`>
        <div className={`mx-auto mb-4 p-3 rounded-lg w-fit ${isSelected ? `}bg-primary/10 text-primary` : `bg-muted'}'}>
          {icon}
        </div>
        <h3 className='font-semibold mb-2'>{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <Badge variant={isSelected ? "default" : "outline"}>
          {format}
        </Badge>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// ⚙️ DIALOG DE CONFIGURATION
// =============================================================================

interface ExportConfigDialogProps {
  config: ExportConfig;
  onConfigChange: (config: ExportConfig) => void;
}

function ExportConfigDialog({ config, onConfigChange }: ExportConfigDialogProps) {
  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="content">Contenu</TabsTrigger>
        <TabsTrigger value="format">Format</TabsTrigger>
        <TabsTrigger value="filters">Filtres</TabsTrigger>
        <TabsTrigger value="advanced">Avancé</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h4 className="font-medium">Données à inclure</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.options.include_metadata}
                  onCheckedChange={(checked) => onConfigChange({
                    ...config,
                    options: { ...config.options, include_metadata: !!checked }
                  })}
                />
                <Label>Métadonnées (ISBN, éditeur, etc.)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.options.include_relations}
                  onCheckedChange={(checked) => onConfigChange({
                    ...config,
                    options: { ...config.options, include_relations: !!checked }
                  })}
                />
                <Label>Catégories et tags</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.options.include_personal_notes}
                  onCheckedChange={(checked) => onConfigChange({
                    ...config,
                    options: { ...config.options, include_personal_notes: !!checked }
                  })}
                />
                <Label>Critiques personnelles</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.options.include_ratings}
                  onCheckedChange={(checked) => onConfigChange({
                    ...config,
                    options: { ...config.options, include_ratings: !!checked }
                  })}
                />
                <Label>Évaluations (Spicy/Dark/Romance)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.options.include_images}
                  onCheckedChange={(checked) => onConfigChange({
                    ...config,
                    options: { ...config.options, include_images: !!checked }
                  })}
                />
                <Label>Images de couverture</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.options.include_statistics}
                  onCheckedChange={(checked) => onConfigChange({
                    ...config,
                    options: { ...config.options, include_statistics: !!checked }
                  })}
                />
                <Label>Statistiques générales</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium">Options de tri</h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Trier par</Label>
                <Select
                  value={config.options.sort_by}
                  onValueChange={(value) => onConfigChange({
                    ...config,
                    options: { ...config.options, sort_by: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_creation">Date d"ajout</SelectItem>
                    <SelectItem value="date_lecture">Date de lecture</SelectItem>
                    <SelectItem value="titre">Titre alphabétique</SelectItem>
                    <SelectItem value="auteur">Auteur</SelectItem>
                    <SelectItem value="note_generale">Note générale</SelectItem>
                    <SelectItem value="niveau_spicy">Niveau Spicy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Select
                  value={config.options.sort_order}
                  onValueChange={(value: "asc" | "desc") => onConfigChange({
                    ...config,
                    options: { ...config.options, sort_order: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Décroissant</SelectItem>
                    <SelectItem value="asc">Croissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="format" className="space-y-4">
        {config.format === "PDF" && (
          <div className="space-y-4">
            <h4 className="font-medium">Options PDF</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mise en page</Label>
                <Select
                  value={config.options.pdf_layout}
                  onValueChange={(value: any) => onConfigChange({
                    ...config,
                    options: { ...config.options, pdf_layout: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Liste</SelectItem>
                    <SelectItem value="cards">Cartes</SelectItem>
                    <SelectItem value="table">Tableau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Thème</Label>
                <Select
                  value={config.options.pdf_theme}
                  onValueChange={(value: any) => onConfigChange({
                    ...config,
                    options: { ...config.options, pdf_theme: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="romance">Dark Romance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Taille de page</Label>
                <Select
                  value={config.options.pdf_page_size}
                  onValueChange={(value: any) => onConfigChange({
                    ...config,
                    options: { ...config.options, pdf_page_size: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.options.pdf_include_cover}
                  onCheckedChange={(checked) => onConfigChange({
                    ...config,
                    options: { ...config.options, pdf_include_cover: !!checked }
                  })}
                />
                <Label>Page de couverture</Label>
              </div>
            </div>
          </div>
        )}

        {config.format === "CSV" && (
          <div className="space-y-4">
            <h4 className="font-medium">Options CSV</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Délimiteur</Label>
                <Select
                  value={config.options.csv_delimiter}
                  onValueChange={(value: any) => onConfigChange({
                    ...config,
                    options: { ...config.options, csv_delimiter: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">,  (Virgule)</SelectItem>
                    <SelectItem value=";">; (Point-virgule)</SelectItem>
                    <SelectItem value="\t">⇥ (Tabulation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Encodage</Label>
                <Select
                  value={config.options.csv_encoding}
                  onValueChange={(value: any) => onConfigChange({
                    ...config,
                    options: { ...config.options, csv_encoding: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf-8">UTF-8 (Recommandé)</SelectItem>
                    <SelectItem value="latin1">Latin-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={config.options.csv_include_headers}
                onCheckedChange={(checked) => onConfigChange({
                  ...config,
                  options: { ...config.options, csv_include_headers: !!checked }
                })}
              />
              <Label>Inclure les en-têtes de colonne</Label>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="filters" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configurez les filtres pour exporter uniquement certains livres
        </p>
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Les filtres avancés seront implémentés dans une prochaine version.
            Pour l'instant, tous vos livres seront exportés.
          </AlertDescription>
        </Alert>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template personnalisé (optionnel)</Label>
            <Select
              value={config.template || ""}
              onValueChange={(value) => onConfigChange({
                ...config,
                template: value || undefined
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Template par défaut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Template par défaut</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="detailed">Détaillé</SelectItem>
                <SelectItem value="statistics">Avec statistiques</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Notes techniques</Label>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Les exports PDF peuvent prendre plusieurs minutes selon le nombre de livres</p>
              <p>• Les images de couverture augmentent significativement la taille du fichier</p>
              <p>• Les exports sont conservés 30 jours avant suppression automatique</p>
              <p>• Taille maximale d'export : 100 MB</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// =============================================================================
// 📋 COMPOSANT ITEM HISTORIQUE
// =============================================================================

interface ExportHistoryItemProps {
  export: ExportHistory;
  onDownload: () => void;
}

function ExportHistoryItem({ export: exportItem, onDownload }: ExportHistoryItemProps) {
  const getStatusIcon = () => {
    switch (exportItem.status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "processing":
        return <RefreshCwIcon className="h-4 w-4 animate-spin text-blue-500" />;
      case "failed":
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (exportItem.status) {
      case `completed': return 'Terminé';
      case 'processing': return 'En cours';
      case 'failed`: return `Échoué`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}`B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted rounded">
          {exportItem.format === "PDF" ? (
            <FileImageIcon className="h-4 w-4" />
          ) : exportItem.format === "CSV" ? (
            <TableIcon className="h-4 w-4" />
          ) : (
            <FileTextIcon className="h-4 w-4" />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{exportItem.filename}</span>
            <Badge variant="outline" className="text-xs">
              {exportItem.format}
            </Badge>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-sm text-muted-foreground">
                {getStatusText()}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {new Date(exportItem.created_at).toLocaleDateString("fr-FR", {
              day: `2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: "2-digit"
            })} • {formatFileSize(exportItem.file_size)}
          </div>
          
          {exportItem.error_message && (
            <div className="text-sm text-red-500 mt-1">
              {exportItem.error_message}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        {exportItem.status === "completed" && (
          <Button size="sm" variant="outline" onClick={onDownload}>
            <DownloadIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default ExportManager;

