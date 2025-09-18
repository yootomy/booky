import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les cookies d'authentification
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('booky_auth');
    const refreshCookie = cookieStore.get('booky_refresh');
    
    // Construire les headers avec les cookies
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Ajouter les cookies d'authentification si ils existent
    if (authCookie || refreshCookie) {
      const cookieHeader = [];
      if (authCookie) cookieHeader.push(`${authCookie.name}=${authCookie.value}`);
      if (refreshCookie) cookieHeader.push(`${refreshCookie.name}=${refreshCookie.value}`);
      headers['Cookie'] = cookieHeader.join('; ');
    }
    
    // Récupérer toutes les questions de tous les livres (pour l'admin)
    const response = await fetch('http://localhost:3000/api/admin/questions', {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      // Si l'endpoint admin n'existe pas, récupérer les livres et leurs questions
      const booksResponse = await fetch('http://localhost:3000/api/books', {
        method: 'GET',
        headers,
      });
      
      if (!booksResponse.ok) {
        throw new Error(`Failed to fetch books: ${booksResponse.status}`);
      }
      
      const booksData = await booksResponse.json();
      const books = booksData.data || [];
      
      // Récupérer les questions pour chaque livre
      const allQuestions: any[] = [];
      for (const book of books) {
        try {
          const questionsResponse = await fetch(`http://localhost:3000/api/books/${book.id}/questions`, {
            method: 'GET',
            headers,
          });
          
          if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            const questions = questionsData.data || [];
            
            // Ajouter les infos du livre à chaque question
            questions.forEach((question: any) => {
              allQuestions.push({
                ...question,
                book_title: book.titre,
                book_id: book.id,
                user_name: question.user?.nom_complet || 'Utilisateur anonyme'
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching questions for book ${book.id}:`, error);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: allQuestions
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Admin questions proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin questions' },
      { status: 500 }
    );
  }
}