import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug webhook processing endpoint called');
    
    // Get your current user data
    const currentUser = await db.getUserUsage(6);
    console.log('Current user data:', currentUser);

    // Test webhook processing with your actual user ID
    const testWebhookPayload = {
      event: 'payment.succeeded',
      data: {
        id: 'pay_debug_test',
        user_id: 'user_GSw70c4ejphdI', // Your Whop user ID
        subscription_id: 'sub_debug_test', 
        plan_id: 'plan_qbxMJNrDzxyfw', // Premium plan
        amount: 1999,
        currency: 'usd',
        status: 'succeeded',
        billing_cycle: 'month',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method_id: 'pm_debug_test',
        user: {
          email: 'user-user_GSw70c4ejphdI@example.com',
          username: 'officialkgg'
        }
      }
    };

    console.log('🧪 Testing webhook with payload:', JSON.stringify(testWebhookPayload, null, 2));

    // Send to webhook endpoint
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whop-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whop-signature': 'debug-test-signature'
      },
      body: JSON.stringify(testWebhookPayload)
    });

    const webhookResult = await webhookResponse.text();
    console.log('Webhook response:', webhookResult);

    // Check user data after webhook
    const userAfterWebhook = await db.getUserUsage(6);
    console.log('User data after webhook:', userAfterWebhook);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      debug: {
        currentUser,
        webhookPayload: testWebhookPayload,
        webhookResponse: {
          status: webhookResponse.status,
          ok: webhookResponse.ok,
          result: webhookResult
        },
        userAfterWebhook,
        changes: {
          planIdChanged: currentUser.planId !== userAfterWebhook.planId,
          statusChanged: currentUser.subscriptionStatus !== userAfterWebhook.subscriptionStatus,
          beforePlanId: currentUser.planId,
          afterPlanId: userAfterWebhook.planId,
          beforeStatus: currentUser.subscriptionStatus,
          afterStatus: userAfterWebhook.subscriptionStatus
        }
      }
    });

  } catch (error) {
    console.error('Debug webhook processing error:', error);
    return NextResponse.json(
      { error: 'Debug webhook processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug webhook processing endpoint',
    usage: {
      method: 'POST',
      purpose: 'Test webhook processing with your actual user data to identify why updates are failing'
    }
  });
}
