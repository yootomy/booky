import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Appel vers l'API backend
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    // Si la connexion est réussie, définir les cookies côté frontend
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
          httpOnly: true,
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
    console.error("Login proxy error: ", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}