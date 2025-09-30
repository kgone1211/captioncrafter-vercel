import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';
import { supabaseDb } from '@/lib/supabase';
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
        // User has active subscription - upgrade them in both databases
        const numericUserId = parseInt(userId);
        if (!isNaN(numericUserId)) {
          // Update Supabase database
          try {
            await supabaseDb.upsertUser(
              subscription.user_email || 'user@example.com',
              userId,
              'active',
              subscription.user_name || 'User'
            );
            console.log(`Webhook: Updated Supabase user ${numericUserId} to active subscription`);
          } catch (error) {
            console.error('Error updating Supabase user:', error);
          }
          
          // Update fallback counter
          fallbackCounter.upgradeToSubscription(numericUserId, subscription.plan_id);
          console.log(`Webhook: Upgraded user ${numericUserId} to subscription ${subscription.plan_id}`);
        }
      } else if (subscription.status === 'cancelled' || subscription.status === 'inactive') {
        // User subscription cancelled - downgrade them in both databases
        const numericUserId = parseInt(userId);
        if (!isNaN(numericUserId)) {
          // Update Supabase database
          try {
            await supabaseDb.upsertUser(
              subscription.user_email || 'user@example.com',
              userId,
              'inactive',
              subscription.user_name || 'User'
            );
            console.log(`Webhook: Updated Supabase user ${numericUserId} to inactive subscription`);
          } catch (error) {
            console.error('Error updating Supabase user:', error);
          }
          
          // Update fallback counter
          fallbackCounter.downgradeToFree(numericUserId);
          console.log(`Webhook: Downgraded user ${numericUserId} to free plan`);
        }
      }
    }

    // Handle payment events
    if (data.type === 'payment.succeeded') {
      const payment = data.data;
      const userId = payment.user_id;
      
      // If payment succeeded, ensure user has active subscription in both databases
      const numericUserId = parseInt(userId);
      if (!isNaN(numericUserId)) {
        // Update Supabase database
        try {
          await supabaseDb.upsertUser(
            payment.user_email || 'user@example.com',
            userId,
            'active',
            payment.user_name || 'User'
          );
          console.log(`Webhook: Payment succeeded - Updated Supabase user ${numericUserId} to active`);
        } catch (error) {
          console.error('Error updating Supabase user after payment:', error);
        }
        
        // Update fallback counter
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
