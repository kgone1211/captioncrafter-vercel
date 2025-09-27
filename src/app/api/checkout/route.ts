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

    console.log('Creating checkout session...');
    // Create checkout session
    const checkoutSession = await whopSdk.createCheckoutSession({
      planId,
      userId: userId.toString(),
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/cancel`,
      metadata: {
        plan_id: planId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });

    console.log('Checkout session created:', checkoutSession);
    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
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
