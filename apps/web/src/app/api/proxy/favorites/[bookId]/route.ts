import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ bookId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookId } = await params;
    
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
    const response = await fetch(`http://localhost:3000/api/favorites/${bookId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `Failed to remove favorite (server error: ${response.status})`
      }));
      console.error(`Favorites DELETE failed: ${response.status}`, errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to remove favorite' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy favorites DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}