import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const url = new URL(request.url);
    
    // Get all headers
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Get URL parameters
    const urlParams = Object.fromEntries(url.searchParams.entries());
    
    // Check for specific Whop headers
    const whopHeaders = {
      'x-whop-user-id': headersList.get('x-whop-user-id') || 'missing',
      'x-whop-company-id': headersList.get('x-whop-company-id') || 'missing',
      'x-whop-token': headersList.get('x-whop-token') ? 'present' : 'missing',
      'x-whop-app-id': headersList.get('x-whop-app-id') || 'missing',
      'authorization': headersList.get('authorization') ? 'present' : 'missing',
      'referer': headersList.get('referer') || 'missing',
    };
    
    // Check if coming from Whop
    const referer = headersList.get('referer');
    const isFromWhop = referer && (referer.includes('whop.com') || referer.includes('whop.io'));
    
    // Check for OAuth code
    const hasOAuthCode = urlParams.code ? 'present' : 'missing';
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      url: request.url,
      urlParams: urlParams,
      hasOAuthCode: hasOAuthCode,
      whopHeaders: whopHeaders,
      isFromWhop: isFromWhop,
      referer: referer,
      allHeaders: allHeaders,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'missing',
      },
      diagnosis: {
        hasWhopHeaders: Object.values(whopHeaders).some(v => v !== 'missing'),
        hasOAuthCode: hasOAuthCode === 'present',
        isFromWhop: isFromWhop,
        shouldWork: Object.values(whopHeaders).some(v => v !== 'missing') || hasOAuthCode === 'present'
      },
      troubleshootingTips: [
        "1. If 'hasOAuthCode' is 'present', the app is using OAuth flow",
        "2. If 'hasWhopHeaders' is true, the app is using iframe headers",
        "3. If 'isFromWhop' is true but no headers/code, check Whop app configuration",
        "4. If 'shouldWork' is false, the app needs proper Whop configuration"
      ]
    });
  } catch (error) {
    console.error('Debug comprehensive error:', error);
    return NextResponse.json(
      { error: 'Failed to run comprehensive debug', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
