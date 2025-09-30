import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get('planId');

  if (!planId) {
    return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
  }

  const checkoutUrl = `https://whop.com/checkout/${planId}/`;
  
  try {
    console.log('Testing Whop checkout URL:', checkoutUrl);
    
    const response = await fetch(checkoutUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CaptionCrafter-Test)',
      },
    });

    console.log('Whop URL response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    return NextResponse.json({
      planId,
      checkoutUrl,
      status: response.status,
      statusText: response.statusText,
      accessible: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('Error testing Whop URL:', error);
    return NextResponse.json({
      planId,
      checkoutUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      accessible: false
    });
  }
}
