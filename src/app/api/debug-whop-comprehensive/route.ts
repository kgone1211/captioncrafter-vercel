import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    
    // Get ALL headers for debugging
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Check for ANY header that might contain user info
    const possibleUserHeaders = [
      'authorization',
      'x-whop-user-id',
      'x-whop-company-id', 
      'x-whop-token',
      'x-whop-app-id',
      'x-whop-user',
      'x-whop-customer',
      'whop-user-id',
      'whop-company-id',
      'whop-token',
      'whop-app-id',
      'x-user-id',
      'x-customer-id',
      'x-session-id'
    ];
    
    const userHeaders: Record<string, string | null> = {};
    possibleUserHeaders.forEach(header => {
      userHeaders[header] = headersList.get(header);
    });
    
    // Check referer and user agent
    const referer = headersList.get('referer');
    const userAgent = headersList.get('user-agent');
    
    // Check if this looks like it's coming from Whop
    const isFromWhop = referer && (
      referer.includes('whop.com') || 
      referer.includes('whop.io') ||
      referer.includes('whop.app')
    );
    
    // Look for any header that contains 'whop' (case insensitive)
    const whopRelatedHeaders: Record<string, string> = {};
    Object.keys(allHeaders).forEach(key => {
      if (key.toLowerCase().includes('whop')) {
        whopRelatedHeaders[key] = allHeaders[key];
      }
    });
    
    // Check if this is an iframe request
    const isIframe = headersList.get('sec-fetch-dest') === 'iframe' || 
                     headersList.get('sec-fetch-mode') === 'navigate' ||
                     userAgent?.includes('Mozilla'); // Most iframes will have Mozilla
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      accessMethod: {
        referer: referer,
        userAgent: userAgent,
        isFromWhop: isFromWhop,
        isIframe: isIframe,
        directAccess: !referer
      },
      userHeaders,
      whopRelatedHeaders,
      allHeaders: Object.keys(allHeaders).sort(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'missing'
      },
      troubleshooting: {
        issue: "Accessing through Whop app but headers not detected",
        possibleCauses: [
          "Whop app configured as redirect instead of iframe",
          "Whop not passing headers through iframe",
          "App permissions not set correctly",
          "User not properly authenticated in Whop",
          "Whop iframe security settings blocking headers"
        ],
        nextSteps: [
          "Check if any userHeaders are populated above",
          "Verify Whop app is set to 'embed' not 'redirect'",
          "Check user authentication in Whop",
          "Verify app permissions in Whop settings",
          "Try accessing with a different user"
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
