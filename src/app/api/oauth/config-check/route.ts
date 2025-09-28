import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      oauthConfig: {
        clientId: process.env.NEXT_PUBLIC_WHOP_CLIENT_ID ? 'present' : 'missing',
        clientSecret: process.env.WHOP_CLIENT_SECRET ? 'present' : 'missing',
        callbackUrl: 'https://captioncrafter-vercel.vercel.app/api/oauth/callback'
      },
      instructions: {
        step1: 'Go to Whop Dashboard > App Settings > OAuth/Callback',
        step2: 'Add callback URL: https://captioncrafter-vercel.vercel.app/api/oauth/callback',
        step3: 'Get Client ID and Secret',
        step4: 'Add to Vercel environment variables: NEXT_PUBLIC_WHOP_CLIENT_ID and WHOP_CLIENT_SECRET'
      },
      currentStatus: {
        hasClientId: !!process.env.NEXT_PUBLIC_WHOP_CLIENT_ID,
        hasClientSecret: !!process.env.WHOP_CLIENT_SECRET,
        readyForOAuth: !!(process.env.NEXT_PUBLIC_WHOP_CLIENT_ID && process.env.WHOP_CLIENT_SECRET)
      }
    });
  } catch (error) {
    console.error('OAuth config check error:', error);
    return NextResponse.json(
      { error: 'Failed to check OAuth config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
