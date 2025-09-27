// Simple test API to check authentication

import { NextRequest, NextResponse } from 'next/server';
import { getWhopAuth } from '@/lib/whop-auth';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    console.log('Test Auth API called');
    
    // Test authentication
    const auth = await getWhopAuth();
    console.log('Auth result:', auth);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        auth
      });
    }
    
    // Test Whop SDK
    let whopUser = null;
    let sdkError = null;
    
    try {
      whopUser = await whopSdk.getUser({ userId: auth.userId });
      console.log('Whop user from SDK:', whopUser);
    } catch (error) {
      console.error('Whop SDK error:', error);
      sdkError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    return NextResponse.json({
      success: true,
      auth,
      whopUser,
      sdkError,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        TEST_USERNAME: process.env.TEST_USERNAME,
        TEST_EMAIL: process.env.TEST_EMAIL,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing'
      }
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
