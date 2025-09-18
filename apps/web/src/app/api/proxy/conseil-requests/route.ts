import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3004';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const cookieStore = await cookies();
    const authToken = cookieStore.get('booky_auth')?.value;

    const response = await fetch(`${SERVER_URL}/api/conseil-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur proxy conseil-requests POST:', error);
    return NextResponse.json(
      { error: 'Erreur de communication avec le serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('booky_auth')?.value;

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const response = await fetch(`${SERVER_URL}/api/conseil-requests?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur proxy conseil-requests GET:', error);
    return NextResponse.json(
      { error: 'Erreur de communication avec le serveur' },
      { status: 500 }
    );
  }
}