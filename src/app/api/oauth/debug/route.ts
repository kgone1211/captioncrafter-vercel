import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const allParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    const headersList = request.headers;
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      urlParams: allParams,
      headers: allHeaders,
      hasCode: !!allParams.code,
      code: allParams.code || 'none',
      environment: {
        clientId: process.env.NEXT_PUBLIC_WHOP_CLIENT_ID ? 'present' : 'missing',
        clientSecret: process.env.WHOP_CLIENT_SECRET ? 'present' : 'missing',
      }
    });
  } catch (error) {
    console.error('OAuth Debug error:', error);
    return NextResponse.json(
      { error: 'OAuth debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}