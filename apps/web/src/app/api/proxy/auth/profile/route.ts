import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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
    
    // Appel vers l'API backend pour récupérer le profil
    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Backend responded with status: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Profile proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Récupérer les cookies d'authentification
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('booky_auth');
    const refreshCookie = cookieStore.get('booky_refresh');
    
    // Récupérer le body de la requête
    const body = await request.json();
    
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
    
    // Appel vers l'API backend pour mettre à jour le profil
    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Backend responded with status: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Profile update proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}