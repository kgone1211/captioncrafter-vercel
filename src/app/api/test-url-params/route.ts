import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Check for various possible parameter names that Whop might use
    const possibleParams = [
      'user_id',
      'whop_user_id', 
      'userId',
      'whopUserId',
      'user',
      'whop_user',
      'uid',
      'whop_uid'
    ];
    
    const foundParams: Record<string, string> = {};
    
    for (const param of possibleParams) {
      const value = searchParams.get(param);
      if (value && value.trim()) {
        foundParams[param] = value.trim();
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      url: request.url,
      foundParams: foundParams,
      allParams: Object.fromEntries(searchParams.entries()),
      message: Object.keys(foundParams).length > 0 
        ? `Found user ID parameters: ${Object.keys(foundParams).join(', ')}`
        : 'No user ID parameters found in URL'
    });
  } catch (error) {
    console.error('URL params test error:', error);
    return NextResponse.json(
      { error: 'Failed to test URL parameters', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
