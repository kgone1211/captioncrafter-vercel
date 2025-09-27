import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET() {
  try {
    console.log('Testing Whop SDK...');
    
    // Test getting plans
    console.log('Testing getSubscriptionPlans...');
    const plans = await whopSdk.getSubscriptionPlans();
    console.log('Plans result:', plans);
    
    // Test creating checkout session
    console.log('Testing createCheckoutSession...');
    const checkoutSession = await whopSdk.createCheckoutSession({
      planId: 'test_plan',
      userId: '1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    });
    console.log('Checkout session result:', checkoutSession);
    
    return NextResponse.json({
      success: true,
      plans: plans,
      checkoutSession: checkoutSession
    });
    
  } catch (error) {
    console.error('Whop SDK test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
