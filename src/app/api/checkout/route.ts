import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('Checkout API called');
    const { planId, userId, successUrl, cancelUrl } = await request.json();
    console.log('Checkout request data:', { planId, userId, successUrl, cancelUrl });
    
    if (!planId || !userId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Plan ID and User ID are required' },
        { status: 400 }
      );
    }

    // For now, use hardcoded plan prices
    const planPrices: Record<string, number> = {
      'prod_OAeju0utHppI2': 9.99, // Basic Plan
      'prod_xcU9zERSGgyNK': 19.99, // Premium Plan
      'prod_Premium123': 19.99, // Premium Plan fallback
    };
    
    const planPrice = planPrices[planId] || 9.99;

    // Create checkout session using Whop SDK
    console.log('Creating checkout session with Whop SDK...');
    const result = await whopSdk.createCheckoutSession({
      planId: planId,
      userId: userId.toString(),
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      metadata: {
        planId: planId,
        planName: planId.includes('Basic') ? 'Basic Plan' : 'Premium Plan',
        app_name: 'Caption Crafter',
        user_id: userId.toString()
      }
    });

    if (!result?.url) {
      throw new Error("Failed to create checkout session");
    }

    console.log('Checkout session created:', result);
    
    return NextResponse.json({
      checkoutUrl: result.url,
      sessionId: result.id,
      planId: planId,
      amount: planPrice,
      currency: "usd"
    });

  } catch (error) {
    console.error('Checkout error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
