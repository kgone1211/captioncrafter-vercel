import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('whop-signature');
    
    // Verify webhook signature
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const data = JSON.parse(body);
    
    console.log('Whop webhook received:', {
      type: data.type,
      data: data.data
    });

    // Handle subscription events
    if (data.type === 'subscription.created' || data.type === 'subscription.updated') {
      const subscription = data.data;
      const userId = subscription.user_id;
      
      if (subscription.status === 'active') {
        // User has active subscription - upgrade them in fallback counter
        const numericUserId = parseInt(userId);
        if (!isNaN(numericUserId)) {
          fallbackCounter.upgradeToSubscription(numericUserId, subscription.plan_id);
          console.log(`Webhook: Upgraded user ${numericUserId} to subscription ${subscription.plan_id}`);
        }
      } else if (subscription.status === 'cancelled' || subscription.status === 'inactive') {
        // User subscription cancelled - downgrade them
        const numericUserId = parseInt(userId);
        if (!isNaN(numericUserId)) {
          fallbackCounter.downgradeToFree(numericUserId);
          console.log(`Webhook: Downgraded user ${numericUserId} to free plan`);
        }
      }
    }

    // Handle payment events
    if (data.type === 'payment.succeeded') {
      const payment = data.data;
      const userId = payment.user_id;
      
      // If payment succeeded, ensure user has active subscription
      const numericUserId = parseInt(userId);
      if (!isNaN(numericUserId)) {
        fallbackCounter.upgradeToSubscription(numericUserId, 'active');
        console.log(`Webhook: Payment succeeded for user ${numericUserId}, upgraded to active`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
