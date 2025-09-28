import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });

    const url = new URL(request.url);
    const urlParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });

    // Check for Whop-specific headers
    const whopHeaders = {
      'x-whop-user-id': headersList.get('x-whop-user-id'),
      'x-whop-company-id': headersList.get('x-whop-company-id'),
      'x-whop-token': headersList.get('x-whop-token'),
      'x-whop-app-id': headersList.get('x-whop-app-id'),
      'authorization': headersList.get('authorization'),
      'referer': headersList.get('referer'),
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Debug info for Whop authentication',
      whopHeaders: whopHeaders,
      urlParams: urlParams,
      allHeaders: allHeaders,
      diagnosis: {
        hasWhopUserId: !!whopHeaders['x-whop-user-id'],
        hasWhopToken: !!whopHeaders['x-whop-token'],
        hasAuthorization: !!whopHeaders['authorization'],
        hasOAuthCode: !!urlParams.code,
        isFromWhop: whopHeaders.referer?.includes('whop.com') || whopHeaders.referer?.includes('whop.io'),
        shouldWork: !!(whopHeaders['x-whop-user-id'] || whopHeaders['x-whop-token'] || urlParams.code)
      },
      instructions: [
        "1. If 'hasWhopUserId' is true, Whop is sending your user ID",
        "2. If 'hasOAuthCode' is true, Whop is using OAuth flow",
        "3. If 'shouldWork' is false, Whop app configuration needs fixing",
        "4. Check Whop app settings: App Type, Permissions, Activation"
      ]
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
