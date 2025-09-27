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
    
    // Check specific Whop headers
    const whopUserId = headersList.get('x-whop-user-id');
    const whopCompanyId = headersList.get('x-whop-company-id');
    const whopToken = headersList.get('x-whop-token');
    const authorization = headersList.get('authorization');
    const referer = headersList.get('referer');
    
    // Check if this looks like Whop access
    const isFromWhop = referer && (
      referer.includes('whop.com') || 
      referer.includes('whop.io') ||
      referer.includes('whop.app')
    );
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      whopHeaders: {
        'x-whop-user-id': whopUserId,
        'x-whop-company-id': whopCompanyId,
        'x-whop-token': whopToken,
        'authorization': authorization
      },
      accessInfo: {
        referer: referer,
        isFromWhop: isFromWhop,
        userAgent: headersList.get('user-agent')
      },
      allHeaders: Object.keys(allHeaders).sort(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing'
      },
      diagnosis: {
        hasWhopUserId: !!whopUserId,
        hasWhopCompanyId: !!whopCompanyId,
        hasWhopToken: !!whopToken,
        hasAuthorization: !!authorization,
        isFromWhop: isFromWhop,
        shouldWork: !!(whopUserId || whopToken || authorization)
      }
    });
    
  } catch (error) {
    console.error('Simple debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
