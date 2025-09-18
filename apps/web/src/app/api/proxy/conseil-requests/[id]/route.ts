import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const cookieStore = await cookies();
    const authToken = cookieStore.get('booky_auth')?.value;
    const { id } = resolvedParams;

    const response = await fetch(`${SERVER_URL}/api/conseil-requests/${id}`, {
      method: 'PATCH',
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
    console.error('Erreur proxy conseil-requests PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur de communication avec le serveur' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const authToken = cookieStore.get('booky_auth')?.value;
    const { id } = resolvedParams;

    const response = await fetch(`${SERVER_URL}/api/conseil-requests/${id}`, {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const authToken = cookieStore.get('booky_auth')?.value;
    const { id } = resolvedParams;

    const response = await fetch(`${SERVER_URL}/api/conseil-requests/${id}`, {
      method: 'DELETE',
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
    console.error('Erreur proxy conseil-requests DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur de communication avec le serveur' },
      { status: 500 }
    );
  }
}