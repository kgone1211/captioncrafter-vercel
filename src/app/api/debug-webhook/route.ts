import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug webhook endpoint called');
    
    const body = await request.json();
    console.log('Debug payload:', JSON.stringify(body, null, 2));

    // Test 1: Check if webhook endpoint is accessible
    const webhookAccessible = true; // We're here, so it's accessible
    
    // Test 2: Check user lookup
    const { userId } = body;
    let userLookup = null;
    let userLookupError = null;
    
    if (userId) {
      try {
        const usage = await db.getUserUsage(parseInt(userId));
        userLookup = usage;
      } catch (error) {
        userLookupError = error instanceof Error ? error.message : String(error);
      }
    }

    // Test 3: Check database columns
    let columnCheck = null;
    try {
      // This will fail if columns don't exist
      const testUpdate = await db.upsertUser(
        'test@example.com',
        'test_user_id',
        'active',
        'test_user',
        'plan_test'
      );
      columnCheck = { success: true, userId: testUpdate };
    } catch (error) {
      columnCheck = { success: false, error: error instanceof Error ? error.message : String(error) };
    }

    // Test 4: Simulate webhook processing
    let webhookProcessing = null;
    try {
      const testPayload = {
        event: 'payment.succeeded',
        data: {
          id: 'pay_test123',
          user_id: userId || 'user_test',
          subscription_id: 'sub_test123',
          plan_id: 'plan_qbxMJNrDzxyfw',
          amount: 1999,
          currency: 'usd',
          status: 'succeeded',
          billing_cycle: 'month',
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method_id: 'pm_test123',
          user: {
            email: 'test@example.com',
            username: 'Test User'
          }
        }
      };

      // Try to process the webhook
      const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whop-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-whop-signature': 'test-signature'
        },
        body: JSON.stringify(testPayload)
      });

      webhookProcessing = {
        success: webhookResponse.ok,
        status: webhookResponse.status,
        response: await webhookResponse.text()
      };
    } catch (error) {
      webhookProcessing = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      diagnostics: {
        webhookAccessible,
        userLookup: {
          userId: userId,
          found: userLookup ? true : false,
          data: userLookup,
          error: userLookupError
        },
        columnCheck,
        webhookProcessing,
        recommendations: [
          '1. Check Whop dashboard webhook URL configuration',
          '2. Verify webhook secret is set correctly',
          '3. Check if user ID format matches between Whop and your database',
          '4. Ensure all database columns exist for subscription data',
          '5. Check Vercel logs for webhook processing errors'
        ]
      }
    });

  } catch (error) {
    console.error('Debug webhook error:', error);
    return NextResponse.json(
      { error: 'Debug webhook failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug webhook endpoint',
    usage: {
      method: 'POST',
      body: {
        userId: 'string (optional)'
      }
    },
    purpose: 'Diagnose why webhooks are not updating subscription status'
  });
}
