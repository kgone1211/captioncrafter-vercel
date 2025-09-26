import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Whop webhook received:', body);
    
    // Verify webhook signature if needed (optional but recommended)
    const signature = request.headers.get('x-whop-signature');
    if (signature) {
      // Add signature verification logic here if needed
      console.log('Webhook signature:', signature);
    }
    
    // Handle different webhook events
    switch (body.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionUpdate(body.data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancellation(body.data);
        break;
      case 'payment.succeeded':
        await handlePaymentSuccess(body.data);
        break;
      default:
        console.log('Unhandled webhook type:', body.type);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscriptionData: any) {
  try {
    // Update user's subscription status
    await sql`
      UPDATE users 
      SET subscription_status = 'active'
      WHERE whop_user_id = ${subscriptionData.user_id}
    `;
    
    console.log('Updated subscription status for user:', subscriptionData.user_id);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionCancellation(subscriptionData: any) {
  try {
    // Update user's subscription status to inactive
    await sql`
      UPDATE users 
      SET subscription_status = 'inactive'
      WHERE whop_user_id = ${subscriptionData.user_id}
    `;
    
    console.log('Cancelled subscription for user:', subscriptionData.user_id);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
  }
}

async function handlePaymentSuccess(paymentData: any) {
  try {
    // Update user's subscription status to active
    await sql`
      UPDATE users 
      SET subscription_status = 'active'
      WHERE whop_user_id = ${paymentData.user_id}
    `;
    
    console.log('Payment succeeded for user:', paymentData.user_id);
  } catch (error) {
    console.error('Error processing payment success:', error);
  }
}
