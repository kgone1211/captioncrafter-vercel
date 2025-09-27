import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('Checkout API called');
    const { planId, userId } = await request.json();
    console.log('Checkout request data:', { planId, userId });
    
    if (!planId || !userId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Plan ID and User ID are required' },
        { status: 400 }
      );
    }

    // For now, return a mock checkout session to test the flow
    console.log('Returning mock checkout session...');
    const mockCheckoutUrl = `https://captioncrafter-vercel.vercel.app/success?session_id=mock_${Date.now()}`;
    
    return NextResponse.json({
      checkoutUrl: mockCheckoutUrl,
      sessionId: `mock_${Date.now()}`
    });

  } catch (error) {
    console.error('Checkout error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
