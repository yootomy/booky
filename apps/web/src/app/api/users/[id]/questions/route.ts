import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id]/questions - Récupérer les questions d'un utilisateur
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const authToken = cookieStore.get('booky_auth')?.value;

    console.log('Proxy - User ID:', id);
    console.log('Proxy - Auth token present:', !!authToken);

    const response = await fetch(`http://localhost:3000/api/users/${id}/questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authToken ? `booky_auth=${authToken}` : '',
      },
    });

    const data = await response.json();
    console.log('Proxy - Backend response status:', response.status);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying get user questions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}