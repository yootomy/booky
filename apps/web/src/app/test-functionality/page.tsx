import { SearchTest } from "@/components/search/search-test";

export default function TestFunctionalityPage() {
  return (
    <div className="min-h-screen bg-background">
      <SearchTest />
    </div>
  );
}

export const metadata = {
  title: "Test - Fonctionnalités",
  description: "Page de test pour les hooks et fonctionnalités des composants",
};