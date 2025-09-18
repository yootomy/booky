import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Récupérer tous les paramètres de requête
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
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
    
    // Construire l'URL avec les paramètres
    const queryString = queryParams.toString();
    const url = `http://localhost:3000/api/sagas/${id}/books${queryString ? `?${queryString}` : ''}`;
    
    // Appel vers l'API backend
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy saga books error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saga books' },
      { status: 500 }
    );
  }
}