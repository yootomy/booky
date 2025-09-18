import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/proxy/books/[id]/questions - Récupérer les questions d'un livre
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId } = await params;
    
    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

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

    // Appel vers l'API backend
    const response = await fetch(`http://localhost:3000/api/books/${bookId}/questions`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch questions' }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy get questions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/proxy/books/[id]/questions - Créer une nouvelle question
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId } = await params;
    
    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
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

    // Appel vers l'API backend pour créer la question
    const response = await fetch(`http://localhost:3000/api/books/${bookId}/questions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create question' }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy create question error:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}