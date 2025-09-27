// Debug API to check what headers Whop is sending

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug Headers API called');
    
    const headersList = await headers();
    
    // Get all headers
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Get specific Whop-related headers
    const whopHeaders = {
      authorization: headersList.get('authorization'),
      'x-whop-user-id': headersList.get('x-whop-user-id'),
      'x-whop-company-id': headersList.get('x-whop-company-id'),
      'x-whop-token': headersList.get('x-whop-token'),
      'x-whop-app-id': headersList.get('x-whop-app-id'),
      referer: headersList.get('referer'),
      'user-agent': headersList.get('user-agent'),
    };
    
    // Check for any headers that contain 'whop'
    const whopRelatedHeaders = Object.keys(allHeaders).filter(key => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes('whop');
    });
    
    const whopRelatedValues = whopRelatedHeaders.reduce((acc, key) => {
      acc[key] = allHeaders[key];
      return acc;
    }, {} as Record<string, string>);
    
    return NextResponse.json({
      success: true,
      allHeaders,
      whopHeaders,
      whopRelatedHeaders,
      whopRelatedValues,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        WHOP_API_KEY: process.env.WHOP_API_KEY ? 'present' : 'missing',
        NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
        NEXT_PUBLIC_WHOP_COMPANY_URL: process.env.NEXT_PUBLIC_WHOP_COMPANY_URL,
      }
    });
  } catch (error) {
    console.error('Debug headers error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
