import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { whopSdk } from '@/lib/whop-sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Whop webhook received');
    
    const body = await request.json();
    console.log('Webhook payload:', JSON.stringify(body, null, 2));

    // Verify webhook signature (recommended for production)
    const signature = request.headers.get('x-whop-signature');
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { event, data } = body;

    switch (event) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionUpdate(data);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancellation(data);
        break;
      
      case 'payment.succeeded':
        await handlePaymentSuccess(data);
        break;
      
      case 'payment.failed':
        await handlePaymentFailure(data);
        break;
      
      default:
        console.log(`📝 Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(data: any) {
  console.log('✅ Subscription updated:', data);
  
  const { user_id, plan_id, status, billing_cycle, next_billing_date } = data;
  
  try {
    // Update user subscription in database
    await db.upsertUser(
      data.user?.email || '',
      user_id,
      status,
      data.user?.username || '',
      plan_id,
      billing_cycle,
      next_billing_date ? new Date(next_billing_date) : undefined,
      new Date(),
      data.payment_method_id,
      data.id
    );
    
    console.log(`✅ Updated subscription for user ${user_id} to ${status}`);
  } catch (error) {
    console.error('❌ Failed to update subscription:', error);
  }
}

async function handleSubscriptionCancellation(data: any) {
  console.log('❌ Subscription cancelled:', data);
  
  const { user_id } = data;
  
  try {
    // Update user subscription status to cancelled
    await db.upsertUser(
      data.user?.email || '',
      user_id,
      'cancelled',
      data.user?.username || '',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      data.id
    );
    
    console.log(`✅ Cancelled subscription for user ${user_id}`);
  } catch (error) {
    console.error('❌ Failed to cancel subscription:', error);
  }
}

async function handlePaymentSuccess(data: any) {
  console.log('💳 Payment succeeded:', data);
  
  const { user_id, amount, currency } = data;
  
  try {
    // Update user's subscription status to active
    await db.upsertUser(
      data.user?.email || '',
      user_id,
      'active',
      data.user?.username || '',
      data.plan_id,
      data.billing_cycle,
      data.next_billing_date ? new Date(data.next_billing_date) : undefined,
      new Date(),
      data.payment_method_id,
      data.subscription_id
    );
    
    console.log(`✅ Payment successful for user ${user_id}: ${amount} ${currency}`);
  } catch (error) {
    console.error('❌ Failed to process payment success:', error);
  }
}

async function handlePaymentFailure(data: any) {
  console.log('❌ Payment failed:', data);
  
  const { user_id, amount, currency, failure_reason } = data;
  
  try {
    // Update user's subscription status to failed
    await db.upsertUser(
      data.user?.email || '',
      user_id,
      'payment_failed',
      data.user?.username || '',
      data.plan_id,
      data.billing_cycle,
      data.next_billing_date ? new Date(data.next_billing_date) : undefined,
      undefined,
      data.payment_method_id,
      data.subscription_id
    );
    
    console.log(`❌ Payment failed for user ${user_id}: ${amount} ${currency} - ${failure_reason}`);
  } catch (error) {
    console.error('❌ Failed to process payment failure:', error);
  }
}

function verifyWebhookSignature(payload: any, signature: string): boolean {
  // TODO: Implement webhook signature verification
  // This is important for production to ensure webhooks are actually from Whop
  // You'll need to use your webhook secret from Whop dashboard
  console.log('⚠️ Webhook signature verification not implemented');
  return true; // For now, accept all webhooks
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Whop webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
