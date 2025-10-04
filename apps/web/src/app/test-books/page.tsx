import { BooksDemo } from "@/components/books/books-demo";

export default function TestBooksPage() {
  return (
    <div className="min-h-screen bg-background">
      <BooksDemo />
    </div>
  );
}

export const metadata = {
  title: "Test - Composants de Livres",
  description: "Page de test pour tous les composants d'affichage de livres",
};