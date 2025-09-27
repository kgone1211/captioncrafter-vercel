// Debug API to test authentication flow

import { NextRequest, NextResponse } from 'next/server';
import { getWhopAuth } from '@/lib/whop-auth';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug Auth API called');
    
    // Test the authentication flow
    const auth = await getWhopAuth();
    console.log('Auth result:', auth);
    
    let whopUser = null;
    let authError = null;
    
    if (auth.isAuthenticated) {
      try {
        whopUser = await whopSdk.getUser({ userId: auth.userId });
        console.log('Whop user from SDK:', whopUser);
      } catch (error) {
        console.error('Error getting Whop user:', error);
        authError = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      success: true,
      auth,
      whopUser,
      authError,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
        NEXT_PUBLIC_WHOP_COMPANY_URL: process.env.NEXT_PUBLIC_WHOP_COMPANY_URL,
        TEST_USERNAME: process.env.TEST_USERNAME,
        TEST_EMAIL: process.env.TEST_EMAIL,
      }
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
