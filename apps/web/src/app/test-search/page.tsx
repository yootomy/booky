import { SearchDemo } from "@/components/search/search-demo";

export default function TestSearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <SearchDemo />
    </div>
  );
}

export const metadata = {
  title: "Test - Composants de Recherche",
  description: "Page de test pour les composants SearchBar, FilterPanel, SortDropdown et TagSelector",
};