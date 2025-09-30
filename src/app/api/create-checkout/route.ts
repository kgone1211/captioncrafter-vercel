import { NextRequest, NextResponse } from 'next/server';
import { WhopSDKWithAccess } from '@/lib/whop-sdk';

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json();

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Plan ID and User ID are required' },
        { status: 400 }
      );
    }

    console.log('Creating checkout session for plan:', planId, 'user:', userId);

    // Initialize Whop SDK
    const whopSdk = new WhopSDKWithAccess();
    
    try {
      // Create a checkout session using Whop SDK
      const checkoutSession = await whopSdk.createCheckoutSession({
        productId: planId,
        userId: userId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/checkout/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/checkout/cancel`
      });

      console.log('Checkout session created:', checkoutSession);

      return NextResponse.json({
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id
      });

    } catch (sdkError) {
      console.error('Whop SDK error:', sdkError);
      
      // Fallback: return the direct checkout URL
      const fallbackUrl = `https://whop.com/checkout/${planId}`;
      return NextResponse.json({
        checkoutUrl: fallbackUrl,
        sessionId: null,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
