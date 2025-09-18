import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Appel vers l'API backend
    const response = await fetch('http://localhost:3000/api/auth/csrf', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    // Retourner les données avec les cookies si nécessaire
    const responseNext = NextResponse.json(data);
    
    // Récupérer les cookies du backend depuis les headers Set-Cookie
    const setCookieHeaders = response.headers.getSetCookie();
    
    setCookieHeaders.forEach((cookieString) => {
      // Parser le cookie pour extraire name, value et options
      const [nameValue, ...options] = cookieString.split(';');
      const [name, value] = nameValue.split('=');
      
      // Définir le cookie avec les mêmes options
      if (name && value) {
        const cookieOptions: any = {
          httpOnly: false, // CSRF token peut être accessible en JS
          sameSite: 'strict' as const,
          secure: false, // localhost donc pas de HTTPS
        };
        
        // Parser les options du cookie
        options.forEach((option) => {
          const [key, val] = option.trim().split('=');
          switch (key.toLowerCase()) {
            case 'max-age':
              cookieOptions.maxAge = parseInt(val);
              break;
            case 'path':
              cookieOptions.path = val;
              break;
            case 'expires':
              cookieOptions.expires = new Date(val);
              break;
          }
        });
        
        responseNext.cookies.set(name.trim(), value.trim(), cookieOptions);
      }
    });
    
    return responseNext;
    
  } catch (error) {
    console.error('CSRF proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}