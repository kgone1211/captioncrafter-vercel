import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Test different Whop checkout URL formats
    const testUrls = [
      {
        name: 'Direct Checkout',
        url: `https://whop.com/checkout/${planId}`,
        description: 'Standard checkout format'
      },
      {
        name: 'Product Page',
        url: `https://whop.com/p/${planId}`,
        description: 'Product page format'
      },
      {
        name: 'Access Pass',
        url: `https://whop.com/access-pass/${planId}`,
        description: 'Access pass format'
      },
      {
        name: 'Checkout with Query',
        url: `https://whop.com/checkout?product_id=${planId}`,
        description: 'Checkout with query parameter'
      },
      {
        name: 'Checkout with Plan',
        url: `https://whop.com/checkout?plan_id=${planId}`,
        description: 'Checkout with plan parameter'
      }
    ];

    return NextResponse.json({
      planId,
      testUrls,
      message: 'Test URLs generated. Try each one to see which works for your plan.',
      instructions: [
        '1. Click each URL to test if it loads properly',
        '2. The working URL should show Whop checkout with payment options',
        '3. Use the working format in your app'
      ]
    });

  } catch (error) {
    console.error('Error testing checkout URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate test URLs' },
      { status: 500 }
    );
  }
}
