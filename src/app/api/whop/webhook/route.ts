import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Whop webhook received:', body);

    const { type, data } = body;

    switch (type) {
      case 'subscription.created':
      case 'subscription.updated':
        console.log('Subscription created/updated:', data);
        // Handle subscription activation
        if (data.user_id) {
          fallbackCounter.upgradeToSubscription(parseInt(data.user_id), data.plan_id);
        }
        break;

      case 'subscription.cancelled':
        console.log('Subscription cancelled:', data);
        // Handle subscription cancellation
        if (data.user_id) {
          // Downgrade user back to free plan
          const usage = fallbackCounter.getUsage(parseInt(data.user_id));
          usage.subscriptionStatus = 'inactive';
          fallbackCounter.counters.set(parseInt(data.user_id), usage);
        }
        break;

      case 'payment.succeeded':
        console.log('Payment succeeded:', data);
        // Handle successful payment
        if (data.subscription?.user_id) {
          fallbackCounter.upgradeToSubscription(
            parseInt(data.subscription.user_id), 
            data.subscription.plan_id
          );
        }
        break;

      case 'payment.failed':
        console.log('Payment failed:', data);
        // Handle failed payment - could send notification or retry logic
        break;

      default:
        console.log('Unhandled webhook type:', type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}