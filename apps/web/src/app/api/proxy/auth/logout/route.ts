import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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
    
    // Appel vers l'API backend pour la déconnexion
    const response = await fetch(`http://localhost:3000/api/auth/logout`, {
      method: 'POST',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Logout failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    
    // Créer la réponse et copier les cookies du backend
    const proxyResponse = NextResponse.json(data);
    
    // Copier tous les cookies Set-Cookie du backend vers le frontend
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split(',').map(cookie => cookie.trim());
      cookies.forEach(cookie => {
        proxyResponse.headers.append('Set-Cookie', cookie);
      });
    }
    
    // Aussi copier individuellement si nécessaire
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        proxyResponse.headers.append('Set-Cookie', value);
      }
    });
    
    return proxyResponse;
    
  } catch (error) {
    console.error('Proxy logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}