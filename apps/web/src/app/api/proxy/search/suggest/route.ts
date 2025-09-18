import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Appel vers l'API backend
    const url = `http://localhost:3000/api/search/suggest${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Ajouter les headers de cache pour les suggestions
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120'); // Cache 60s
    
    return NextResponse.json(data, { headers });
    
  } catch (error) {
    console.error('Proxy search suggest error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}