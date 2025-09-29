import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk-official';

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

    // TEMPORARY: Mock response for testing paywall
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock checkout for development testing');
      return NextResponse.json({
        inAppPurchase: {
          id: 'mock_checkout_' + Date.now(),
          url: 'https://mock-checkout.whop.com',
          amount: planPrice * 100,
          currency: 'usd'
        },
        planId: planId,
        amount: planPrice,
        currency: "usd"
      });
    }

    // Create charge using Whop's chargeUser method
    console.log('Creating charge with Whop SDK...');
    const result = await whopSdk.payments.chargeUser({
      amount: planPrice * 100, // Convert to cents
      currency: "usd",
      userId: userId.toString(),
      metadata: {
        planId: planId,
        planName: planId.includes('Basic') ? 'Basic Plan' : 'Premium Plan',
        app_name: 'Caption Crafter',
        user_id: userId.toString()
      }
    });

    if (!result?.inAppPurchase) {
      throw new Error("Failed to create charge");
    }

    console.log('Charge created:', result.inAppPurchase);
    
    return NextResponse.json({
      inAppPurchase: result.inAppPurchase,
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
