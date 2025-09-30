import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, eventType } = await request.json();
    
    // Simulate different webhook events for testing
    const testEvents = {
      'subscription.created': {
        event: 'subscription.created',
        data: {
          id: 'sub_test123',
          user_id: userId,
          plan_id: 'plan_cs24bg68DSLES',
          status: 'active',
          billing_cycle: 'month',
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method_id: 'pm_test123',
          user: {
            email: 'test@example.com',
            username: 'Test User'
          }
        }
      },
      'payment.succeeded': {
        event: 'payment.succeeded',
        data: {
          id: 'pay_test123',
          user_id: userId,
          subscription_id: 'sub_test123',
          plan_id: 'plan_cs24bg68DSLES',
          amount: 999,
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
      },
      'subscription.cancelled': {
        event: 'subscription.cancelled',
        data: {
          id: 'sub_test123',
          user_id: userId,
          plan_id: 'plan_cs24bg68DSLES',
          status: 'cancelled',
          user: {
            email: 'test@example.com',
            username: 'Test User'
          }
        }
      }
    };

    const testEvent = testEvents[eventType as keyof typeof testEvents];
    
    if (!testEvent) {
      return NextResponse.json(
        { error: 'Invalid event type. Use: subscription.created, payment.succeeded, or subscription.cancelled' },
        { status: 400 }
      );
    }

    // Send the test webhook to our webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whop-webhook`;
    
    console.log(`🧪 Sending test webhook: ${eventType} for user ${userId}`);
    console.log('Test payload:', JSON.stringify(testEvent, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whop-signature': 'test-signature'
      },
      body: JSON.stringify(testEvent)
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `Test webhook ${eventType} sent successfully`,
        webhookUrl,
        testEvent
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        message: `Webhook test failed: ${response.status}`,
        error: errorText,
        webhookUrl,
        testEvent
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to send test webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint',
    usage: {
      method: 'POST',
      body: {
        userId: 'string (required)',
        eventType: 'subscription.created | payment.succeeded | subscription.cancelled'
      }
    },
    examples: [
      {
        subscription_created: {
          userId: 'user_123',
          eventType: 'subscription.created'
        }
      },
      {
        payment_succeeded: {
          userId: 'user_123',
          eventType: 'payment.succeeded'
        }
      },
      {
        subscription_cancelled: {
          userId: 'user_123',
          eventType: 'subscription.cancelled'
        }
      }
    ]
  });
}
