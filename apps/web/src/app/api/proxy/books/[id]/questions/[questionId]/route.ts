import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId, questionId } = await params;
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
    
    // Appel vers l'API backend pour répondre à la question
    const response = await fetch(`http://localhost:3000/api/books/${bookId}/questions/${questionId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(async () => ({ error: await response.text() }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy answer question error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookId, questionId } = await params;
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
    
    // Appel vers l'API backend pour modérer la question
    const response = await fetch(`http://localhost:3000/api/books/${bookId}/questions/${questionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(async () => ({ error: await response.text() }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy moderate question error:', error);
    return NextResponse.json(
      { error: 'Failed to moderate question' },
      { status: 500 }
    );
  }
}