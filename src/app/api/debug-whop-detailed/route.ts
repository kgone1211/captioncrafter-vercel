import { NextRequest, NextResponse } from 'next/server';
import { getWhopAuth } from '@/lib/whop-auth';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DETAILED WHOP DEBUG ===');
    
    // Get all headers
    const headersList = request.headers;
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Get Whop-specific headers
    const whopHeaders = {
      authorization: headersList.get('authorization'),
      'x-whop-user-id': headersList.get('x-whop-user-id'),
      'x-whop-company-id': headersList.get('x-whop-company-id'),
      'x-whop-token': headersList.get('x-whop-token'),
      'x-whop-app-id': headersList.get('x-whop-app-id'),
      referer: headersList.get('referer'),
      'user-agent': headersList.get('user-agent')
    };
    
    // Get authentication result
    const authResult = await getWhopAuth();
    console.log('Auth result:', authResult);
    
    // Get user data if authenticated
    let whopUser = null;
    if (authResult.isAuthenticated && authResult.userId) {
      try {
        whopUser = await whopSdk.getUser({ userId: authResult.userId });
        console.log('Whop user data:', whopUser);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'missing'
      },
      headers: {
        total: Object.keys(allHeaders).length,
        whopHeaders,
        allHeaders: Object.keys(allHeaders).sort()
      },
      auth: authResult,
      whopUser,
      instructions: {
        message: "To see real Whop user data:",
        steps: [
          "1. Access the app through Whop's iframe (not directly)",
          "2. Whop will inject x-whop-user-id and other headers",
          "3. The app will then show your real user data",
          "4. Direct access will always show 'Demo User'"
        ]
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
