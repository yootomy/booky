"use client";

// =============================================================================
// 📤 PAGE ADMIN - GESTION DES EXPORTS
// =============================================================================
// Interface complète d'administration pour créer et gérer les exports
// de données avec templates personnalisés et historique

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, DownloadIcon, FileTextIcon, SettingsIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ExportManager } from "@/components/admin/export-manager";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/utils/orpc";

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL PAGE EXPORT
// =============================================================================

export default function AdminExportPage() {
  const router = useRouter();

  // Récupérer les statistiques pour les templates
  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getData(),
    staleTime: 5 * 60 * 1000,
  });

  const stats = dashboardData?.data?.stats_generales;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="p-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <DownloadIcon className="h-8 w-8 text-primary" />
                    Gestion des exports
                  </h1>
                  <p className="text-muted-foreground">
                    Exportez et gérez vos données de bibliothèque
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques rapides */}
            {stats && (
              <Card className="w-72">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{stats.total_livres}</div>
                      <div className="text-xs text-muted-foreground">Livres total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{stats.livres_lus}</div>
                      <div className="text-xs text-muted-foreground">Livres lus</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Guide d'utilisation */}
          <Alert>
            <FileTextIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Guide rapide :</strong> Choisissez un format d'export, personnalisez les options selon vos besoins, 
              puis créez votre export. Les fichiers générés sont conservés 30 jours et peuvent être téléchargés depuis l'historique.
            </AlertDescription>
          </Alert>

          {/* Onglets principaux */}
          <Tabs defaultValue="export" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="export" className="flex items-center gap-2">
                <DownloadIcon className="h-4 w-4" />
                Créer un export
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4" />
                Statistiques
              </TabsTrigger>
            </TabsList>

            {/* Onglet Export principal */}
            <TabsContent value="export">
              <ExportManager />
            </TabsContent>

            {/* Onglet Templates */}
            <TabsContent value="templates">
              <ExportTemplatesManager />
            </TabsContent>

            {/* Onglet Analytics */}
            <TabsContent value="analytics">
              <ExportAnalytics stats={stats} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
}

// =============================================================================
// 📝 GESTIONNAIRE DE TEMPLATES
// =============================================================================

function ExportTemplatesManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Templates d'export</h2>
        <p className="text-muted-foreground">
          Créez et gérez des templates personnalisés pour vos exports
        </p>
      </div>

      {/* Templates prédéfinis */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TemplateCard
          name="Catalogue complet"
          description="Export complet avec toutes les données, images et critiques"
          format="PDF"
          isDefault={true}
          features={[
            "Toutes les métadonnées",
            "Images de couverture",
            "Critiques détaillées",
            "Notes Spicy/Dark/Romance",
            "Catégories et tags"
          ]}
        />
        
        <TemplateCard
          name="Liste simple"
          description="Export minimal pour inventaire ou partage"
          format="CSV"
          isDefault={true}
          features={[
            "Titre et auteur",
            "Statut de lecture",
            "Note générale",
            "Date d'ajout"
          ]}
        />
        
        <TemplateCard
          name="Données techniques"
          description="Export JSON pour développeurs et intégrations"
          format="JSON"
          isDefault={true}
          features={[
            "Structure complète",
            "Relations entre entités",
            "Timestamps",
            "Identifiants uniques"
          ]}
        />
        
        <TemplateCard
          name="Rapport mensuel"
          description="Template personnalisé pour rapports périodiques"
          format="PDF"
          isDefault={false}
          isCustom={true}
          features={[
            "Livres du mois",
            "Statistiques de lecture",
            "Top des genres",
            "Objectifs de lecture"
          ]}
        />
      </div>

      {/* Actions sur les templates */}
      <Card>
        <CardHeader>
          <CardTitle>Créer un template personnalisé</CardTitle>
          <CardDescription>
            Créez vos propres templates pour des exports récurrents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
            <Button variant="outline">
              Importer template
            </Button>
          </div>
          
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Prochainement :</strong> L'éditeur de templates personnalisés sera disponible 
              dans une prochaine mise à jour. En attendant, utilisez les templates prédéfinis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// 📊 ANALYTICS DES EXPORTS
// =============================================================================

interface ExportAnalyticsProps {
  stats?: any;
}

function ExportAnalytics({ stats }: ExportAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Statistiques d'export</h2>
        <p className="text-muted-foreground">
          Analysez vos habitudes d'export et optimisez votre workflow
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Données disponibles"
          value={stats?.total_livres || 0}
          subtitle="Livres dans la bibliothèque"
          icon={<FileTextIcon className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Livres avec critiques"
          value={stats?.livres_lus || 0}
          subtitle="Critiques détaillées disponibles"
          icon={<FileTextIcon className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Note moyenne"
          value={stats?.note_moyenne ? `${stats.note_moyenne.toFixed(1)}/10` : "N/A"}
          subtitle="Qualité générale de la collection"
          icon={<TrendingUpIcon className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Exports ce mois"
          value="0"
          subtitle="Exports créés ce mois-ci"
          icon={<DownloadIcon className="h-4 w-4" />}
        />
      </div>

      {/* Recommandations d'export */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations d'export</CardTitle>
          <CardDescription>
            Suggestions basées sur votre collection et vos habitudes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📚 Export catalogue PDF recommandé</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Votre collection de {stats?.total_livres || 0} livres avec {stats?.livres_lus || 0} critiques 
                est idéale pour un catalogue PDF complet.
              </p>
              <Button size="sm">Créer maintenant</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📊 Export CSV pour analyse</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Exportez vos données en CSV pour créer des graphiques et analyses dans Excel ou Google Sheets.
              </p>
              <Button size="sm" variant="outline">En savoir plus</Button>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔄 Sauvegarde JSON complète</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Créez une sauvegarde complète de vos données au format JSON pour une sécurité maximale.
              </p>
              <Button size="sm" variant="outline">Programmer</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// 🃏 COMPOSANTS UTILITAIRES
// =============================================================================

interface TemplateCardProps {
  name: string;
  description: string;
  format: string;
  isDefault: boolean;
  isCustom?: boolean;
  features: string[];
}

function TemplateCard({ name, description, format, isDefault, isCustom = false, features }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline">{format}</Badge>
            {isDefault && <Badge variant="secondary">Défaut</Badge>}
            {isCustom && <Badge variant="default">Personnalisé</Badge>}
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium mb-2">Fonctionnalités :</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              Utiliser
            </Button>
            {isCustom && (
              <Button size="sm" variant="ghost">
                Modifier
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}

function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}