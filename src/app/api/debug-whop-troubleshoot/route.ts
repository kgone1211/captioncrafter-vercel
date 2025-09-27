import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    
    // Get all headers
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Check for any Whop-related headers (case insensitive)
    const whopHeaders: Record<string, string | null> = {};
    const possibleWhopHeaders = [
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
      'whop-app-id'
    ];
    
    possibleWhopHeaders.forEach(header => {
      whopHeaders[header] = headersList.get(header);
    });
    
    // Check for any header that contains 'whop' (case insensitive)
    const whopRelatedHeaders: Record<string, string> = {};
    Object.keys(allHeaders).forEach(key => {
      if (key.toLowerCase().includes('whop')) {
        whopRelatedHeaders[key] = allHeaders[key];
      }
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
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      accessMethod: {
        referer: referer,
        userAgent: userAgent,
        isFromWhop: isFromWhop,
        directAccess: !referer
      },
      whopHeaders,
      whopRelatedHeaders,
      allHeadersCount: Object.keys(allHeaders).length,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'missing'
      },
      troubleshooting: {
        issue: "Still showing 'User' instead of real name",
        possibleCauses: [
          "Whop iframe not passing headers properly",
          "Whop app configuration issue", 
          "User not authenticated in Whop",
          "App permissions not set correctly",
          "Whop API key not working"
        ],
        nextSteps: [
          "Check if any whopHeaders are populated above",
          "Verify Whop app is set to 'embed' not 'redirect'",
          "Check user has access to your Whop experience",
          "Verify WHOP_API_KEY is correct in Vercel",
          "Test with a different user in Whop"
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
