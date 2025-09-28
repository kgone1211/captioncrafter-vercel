import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const urlParams = Object.fromEntries(url.searchParams.entries());
    
    // Check for OAuth code
    const hasOAuthCode = urlParams.code ? 'present' : 'missing';
    
    // Get headers
    const headersList = request.headers;
    const referer = headersList.get('referer');
    const isFromWhop = referer && (referer.includes('whop.com') || referer.includes('whop.io'));
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      oauthTest: {
        hasOAuthCode: hasOAuthCode,
        oauthCode: urlParams.code || 'none',
        urlParams: urlParams,
        isFromWhop: isFromWhop,
        referer: referer,
        fullUrl: request.url
      },
      environment: {
        hasClientId: !!process.env.NEXT_PUBLIC_WHOP_CLIENT_ID,
        hasClientSecret: !!process.env.WHOP_CLIENT_SECRET,
        clientIdPrefix: process.env.NEXT_PUBLIC_WHOP_CLIENT_ID ? process.env.NEXT_PUBLIC_WHOP_CLIENT_ID.substring(0, 8) + '...' : 'missing'
      },
      nextSteps: {
        ifHasOAuthCode: 'OAuth flow is working - check if real username appears',
        ifNoOAuthCode: 'OAuth flow not triggered - check Whop app configuration',
        ifNotFromWhop: 'Not accessed through Whop - OAuth only works through Whop'
      }
    });
  } catch (error) {
    console.error('OAuth test error:', error);
    return NextResponse.json(
      { error: 'Failed to test OAuth', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
