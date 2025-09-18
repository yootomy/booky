import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les cookies d'authentification
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('booky_auth');
    const refreshCookie = cookieStore.get('booky_refresh');
    
    // Construire les headers avec les cookies
    const headers: HeadersInit = {};
    
    // Ajouter les cookies d'authentification si ils existent
    if (authCookie || refreshCookie) {
      const cookieHeader = [];
      if (authCookie) cookieHeader.push(`${authCookie.name}=${authCookie.value}`);
      if (refreshCookie) cookieHeader.push(`${refreshCookie.name}=${refreshCookie.value}`);
      headers['Cookie'] = cookieHeader.join('; ');
    }
    
    // Appel vers l'API backend pour vérifier la session
    const response = await fetch(`http://localhost:3000/api/auth/session`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Session invalid' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy session error:', error);
    return NextResponse.json(
      { error: 'Session check failed' },
      { status: 500 }
    );
  }
}