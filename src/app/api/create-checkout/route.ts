import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

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
    
    try {
      console.log('Attempting to create Whop checkout session...');
      
      // Create a checkout session using Whop SDK
      const checkoutSession = await whopSdk.createCheckoutSession({
        planId: planId,
        userId: userId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/checkout/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/checkout/cancel`,
        metadata: {
          embedded: true,
          source: 'caption-crafter-app',
          user_agent: 'embedded-checkout'
        }
      });

      console.log('Checkout session created successfully:', checkoutSession);

      return NextResponse.json({
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        success: true
      });

    } catch (sdkError) {
      console.error('Whop SDK checkout session creation failed:', sdkError);
      
      // Provide multiple fallback URLs
      const fallbackUrls = {
        primary: `https://whop.com/checkout/${planId}`,
        alternative: `https://whop.com/p/${planId}`,
        accessPass: `https://whop.com/access-pass/${planId}`
      };
      
      return NextResponse.json({
        checkoutUrl: fallbackUrls.primary,
        fallbackUrls: fallbackUrls,
        sessionId: null,
        fallback: true,
        error: sdkError instanceof Error ? sdkError.message : 'Failed to create checkout session'
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
