"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookCover, 
  BookCoverStack, 
  BookStatus, 
  BookStatusSelector,
  ReadingProgress,
  BookCard, 
  BookGrid,
  BookList,
  type BookData,
  type BookStatusType 
} from "./index";

// Mock data pour la démo
const mockBooks: BookData[] = [
  {
    id: "1",
    titre: "Twisted Love",
    auteur: "Ana Huang",
    image_couverture: null,
    statut: "LU" as BookStatusType,
    note_generale: 8,
    niveau_spicy: 7,
    niveau_dark: 5,
    niveau_romance: 9,
    resume_personnel: "Une histoire d"amour intense avec des personnages complexes et une tension sexuelle incroyable.',
    date_creation: new Date("2024-01-15"),
    date_lecture: new Date("2024-02-01"),
    nombre_pages: 320,
    is_favorite: true,
    categories: [
      { category: { id: "1", nom: "Dark Romance", couleur: "#8B0000" } },
      { category: { id: "2", nom: "Contemporary", couleur: "#4B0082" } }
    ],
    tags: [
      { tag: { id: "1", nom: "Enemies to Lovers", couleur: "#DC143C", type: "TROPE" } },
      { tag: { id: "2", nom: "Spicy", couleur: "#FF4500", type: "GENRE" } }
    ]
  },
  {
    id: "2",
    titre: "Book Lovers",
    auteur: "Emily Henry",
    image_couverture: null,
    statut: "EN_COURS" as BookStatusType,
    note_generale: 0,
    niveau_spicy: 3,
    niveau_romance: 8,
    resume_personnel: "Une comédie romantique rafraîchissante avec des personnages attachants.",
    date_creation: new Date("2024-02-10"),
    nombre_pages: 368,
    current_page: 180,
    categories: [
      { category: { id: "3", nom: "Romance", couleur: "#FF69B4" } }
    ]
  },
  {
    id: "3",
    titre: "Fourth Wing",
    auteur: "Rebecca Yarros",
    image_couverture: null,
    statut: "A_LIRE" as BookStatusType,
    note_generale: 0,
    niveau_dark: 6,
    niveau_romance: 7,
    resume_personnel: "Fantasy militaire avec dragons et romance épique.",
    date_creation: new Date("2024-03-05"),
    nombre_pages: 496,
    categories: [
      { category: { id: "4", nom: "Fantasy", couleur: "#9370DB" } },
      { category: { id: "5", nom: "Dragons", couleur: "#FF6347" } }
    ]
  },
  {
    id: "4",
    titre: "Haunting Adeline",
    auteur: "H.D. Carlton",
    image_couverture: null,
    statut: "ABANDONNE" as BookStatusType,
    note_generale: 4,
    niveau_spicy: 9,
    niveau_dark: 10,
    niveau_romance: 6,
    resume_personnel: "Trop dark pour moi, j"ai abandonné à la moitié.',
    date_creation: new Date("2024-01-20"),
    nombre_pages: 592,
    categories: [
      { category: { id: "6", nom: "Dark Romance", couleur: "#8B0000" } },
      { category: { id: "7", nom: "Thriller", couleur: "#B22222" } }
    ]
  },
  {
    id: "5",
    titre: "The Seven Husbands of Evelyn Hugo",
    auteur: "Taylor Jenkins Reid",
    image_couverture: null,
    statut: "LU" as BookStatusType,
    note_generale: 10,
    niveau_romance: 8,
    resume_personnel: "Un chef-d"œuvre absolu ! L'histoire d'Evelyn est captivante du début à la fin.',
    date_creation: new Date("2023-12-01"),
    date_lecture: new Date("2023-12-15"),
    nombre_pages: 400,
    is_favorite: true,
    categories: [
      { category: { id: "8", nom: "Historical Fiction", couleur: "#DAA520" } }
    ]
  }
];

export function BooksDemo() {
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookStatusType>("LU`);

  const handleStatusChange = (book: BookData, newStatus: BookStatusType) => {
    console.log(`Changing status of `${book.titre}` to ${newStatus}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Composants d"Affichage de Livres</h1>
        <p className="text-muted-foreground">
          Démonstration complète des composants BookCover, BookStatus, BookCard, BookGrid et BookList
        </p>
      </div>

      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">Composants de base</TabsTrigger>
          <TabsTrigger value="cards">Cartes de livres</TabsTrigger>
          <TabsTrigger value="grid">Grille</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>

        {/* Composants de base */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BookCover */}
            <Card>
              <CardHeader>
                <CardTitle>BookCover</CardTitle>
                <CardDescription>
                  Couvertures de livres avec placeholders et différentes tailles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="text-center">
                    <BookCover
                      src={null}
                      alt="Test XS"
                      title="Exemple XS"
                      size="xs"
                      placeholderVariant="gradient"
                    />
                    <Badge variant="outline" className="mt-2 text-xs">XS</Badge>
                  </div>
                  <div className="text-center">
                    <BookCover
                      src={null}
                      alt="Test SM"
                      title="Exemple SM"
                      size="sm"
                      placeholderVariant="gradient"
                    />
                    <Badge variant="outline" className="mt-2 text-xs">SM</Badge>
                  </div>
                  <div className="text-center">
                    <BookCover
                      src={null}
                      alt="Test MD"
                      title="Exemple MD"
                      author="Auteur"
                      size="md"
                      placeholderVariant="gradient"
                    />
                    <Badge variant="outline" className="mt-2 text-xs">MD</Badge>
                  </div>
                  <div className="text-center">
                    <BookCover
                      src={null}
                      alt="Test LG"
                      title="Exemple LG"
                      size="lg"
                      placeholderVariant="pattern"
                    />
                    <Badge variant="outline" className="mt-2 text-xs">LG</Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="font-medium mb-2">BookCoverStack :</h4>
                  <BookCoverStack
                    books={mockBooks.slice(0, 4).map(book => ({
                      src: book.image_couverture,
                      alt: book.titre,
                      title: book.titre
                    }))}
                    size="sm"
                    maxVisible={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* BookStatus */}
            <Card>
              <CardHeader>
                <CardTitle>BookStatus</CardTitle>
                <CardDescription>
                  Statuts de lecture avec différents styles et progression
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Variants par défaut :</h4>
                    <div className="flex flex-wrap gap-2">
                      <BookStatus status="LU" />
                      <BookStatus status="EN_COURS" />
                      <BookStatus status="A_LIRE" />
                      <BookStatus status="ABANDONNE" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Variant minimal :</h4>
                    <div className="flex flex-wrap gap-3">
                      <BookStatus status="LU" variant="minimal" />
                      <BookStatus status="EN_COURS" variant="minimal" />
                      <BookStatus status="A_LIRE" variant="minimal" />
                      <BookStatus status="ABANDONNE" variant="minimal" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Sélecteur de statut :</h4>
                    <BookStatusSelector
                      currentStatus={statusFilter}
                      onStatusChange={setStatusFilter}
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Progression de lecture :</h4>
                    <ReadingProgress
                      currentPage={180}
                      totalPages={368}
                      showText
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cartes de livres */}
        <TabsContent value="cards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Variant Minimal</CardTitle>
                <CardDescription>Affichage compact pour listes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockBooks.slice(0, 3).map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    variant="minimal"
                    onView={() => console.log("View:", book.titre)}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variant Compact</CardTitle>
                <CardDescription>Affichage moyennement détaillé</CardDescription>
              </CardHeader>
              <CardContent>
                <BookCard
                  book={mockBooks[0]}
                  variant="compact"
                  onView={() => console.log("View")}
                  onEdit={() => console.log("Edit")}
                  onFavoriteToggle={() => console.log("Favorite")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variant Default</CardTitle>
                <CardDescription>Affichage standard avec tous les détails</CardDescription>
              </CardHeader>
              <CardContent>
                <BookCard
                  book={mockBooks[0]}
                  variant="default"
                  showRatings
                  showCategories
                  showDescription
                  onView={() => console.log("View")}
                  onEdit={() => console.log("Edit")}
                  onDelete={() => console.log("Delete")}
                  onFavoriteToggle={() => console.log("Favorite")}
                  onStatusChange={handleStatusChange}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Variant Detailed</CardTitle>
              <CardDescription>Affichage complet avec toutes les métadonnées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm mx-auto">
                <BookCard
                  book={mockBooks[0]}
                  variant="detailed"
                  showRatings
                  showCategories
                  showTags
                  showDescription
                  onView={() => console.log("View")}
                  onEdit={() => console.log("Edit")}
                  onDelete={() => console.log("Delete")}
                  onFavoriteToggle={() => console.log("Favorite")}
                  onStatusChange={handleStatusChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grille */}
        <TabsContent value="grid" className="space-y-6">
          <BookGrid
            books={mockBooks}
            variant="default"
            columns="auto"
            showSearch
            showFilters
            showViewToggle
            showSort
            onBookView={(book) => console.log("View:", book.titre)}
            onBookEdit={(book) => console.log("Edit:", book.titre)}
            onBookDelete={(book) => console.log("Delete:", book.titre)}
            onBookFavorite={(book) => console.log("Favorite:", book.titre)}
            onBookStatusChange={handleStatusChange}
          />
        </TabsContent>

        {/* Liste */}
        <TabsContent value="list" className="space-y-6">
          <BookList
            books={mockBooks}
            columns={["cover", "title", "author", "status", "rating", "specialRatings", "categories", "dateAdded", "actions"]}
            selectable
            selectedBooks={selectedBooks}
            onSelectionChange={setSelectedBooks}
            sortable
            onBookView={(book) => console.log("View:", book.titre)}
            onBookEdit={(book) => console.log("Edit:", book.titre)}
            onBookDelete={(book) => console.log("Delete:", book.titre)}
            onBookStatusChange={handleStatusChange}
            onBulkAction={(action, ids) => console.log("Bulk action:", action, ids)}
          />
        </TabsContent>
      </Tabs>

      {/* Résumé des fonctionnalités */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Fonctionnalités Implémentées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">BookCover :</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• 5 tailles (xs, sm, md, lg, xl)</li>
                <li>• 3 variants de placeholder</li>
                <li>• Gestion d'erreur d'image</li>
                <li>• Stack de couvertures</li>
                <li>• Loading states</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">BookStatus :</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• 4 statuts de lecture</li>
                <li>• 3 variants d'affichage</li>
                <li>• Sélecteur interactif</li>
                <li>• Progression de lecture</li>
                <li>• Statistiques de lecture</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">BookCard :</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• 4 variants (minimal à detailed)</li>
                <li>• Actions complètes</li>
                <li>• Ratings spéciaux</li>
                <li>• Catégories et tags</li>
                <li>• Descriptions tronquées</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">BookGrid :</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Grille responsive</li>
                <li>• Recherche et filtres</li>
                <li>• Tri multiple</li>
                <li>• Toggle vue grille/liste</li>
                <li>• Pagination</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">BookList :</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Table responsive</li>
                <li>• Sélection multiple</li>
                <li>• Actions en lot</li>
                <li>• Tri par colonnes</li>
                <li>• Colonnes configurables</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Général :</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Thème Dark Romance</li>
                <li>• TypeScript strict</li>
                <li>• Responsive design</li>
                <li>• Accessibilité</li>
                <li>• Performance optimisée</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}