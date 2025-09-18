import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Appel vers l'API backend pour la connexion
    const response = await fetch(`http://localhost:3000/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    
    // Créer la réponse et copier les cookies du backend
    const proxyResponse = NextResponse.json(data);
    
    // Copier tous les cookies Set-Cookie du backend vers le frontend
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      // Next.js peut retourner plusieurs cookies dans un seul header
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
    console.error('Proxy login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}