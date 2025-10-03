import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('booky_auth')?.value;

    // Transférer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`http://localhost:3000/api/users${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type' : 'application/json',
        'Cookie': authToken ? `booky_auth=${authToken}` : '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying users: ", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}