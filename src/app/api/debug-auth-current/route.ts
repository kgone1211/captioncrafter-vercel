import { NextRequest, NextResponse } from 'next/server';
import { getWhopAuth } from '@/lib/whop-auth';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    // Get authentication result
    const auth = await getWhopAuth();
    
    // Get user data if authenticated
    let user = null;
    if (auth.isAuthenticated && auth.userId) {
      try {
        user = await whopSdk.getUser({ userId: auth.userId });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    // Get URL parameters
    const url = new URL(request.url);
    const urlParams = Object.fromEntries(url.searchParams.entries());

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      auth: auth,
      user: user,
      urlParams: urlParams,
      message: `Auth source: ${auth.source}, User ID: ${auth.userId}, Username: ${user?.username || 'N/A'}`
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { error: 'Failed to debug auth', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
