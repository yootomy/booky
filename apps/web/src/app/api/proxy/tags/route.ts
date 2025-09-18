import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    const serverUrl = `${SERVER_URL}/api/tags${queryParams ? `?${queryParams}` : ''}`;

    const response = await fetch(serverUrl, {
      headers: {
        'Content-Type': 'application/json',
        // Forward any authentication headers
        ...(request.headers.get('cookie') && { cookie: request.headers.get('cookie')! }),
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error for tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}