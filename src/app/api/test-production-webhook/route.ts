import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing production webhook scenario');
    
    // Step 1: Simulate a new user signing up through Whop
    const newWhopUserId = 'user_test_production_123';
    const newUserEmail = 'newuser@example.com';
    
    console.log('Step 1: Creating new user through Whop signup');
    const newUserId = await db.upsertUser(
      newUserEmail,
      newWhopUserId,
      'inactive',
      'testuser'
    );
    
    console.log('New user created with ID:', newUserId);
    
    // Step 2: Verify user was created with correct whop_user_id
    const userAfterSignup = await db.getUserUsage(newUserId);
    console.log('User after signup:', userAfterSignup);
    
    // Step 3: Simulate webhook for payment success
    console.log('Step 3: Simulating webhook for payment success');
    const webhookPayload = {
      event: 'payment.succeeded',
      data: {
        id: 'pay_test_production',
        user_id: newWhopUserId, // Same ID as signup
        subscription_id: 'sub_test_production',
        plan_id: 'plan_cs24bg68DSLES', // Basic plan
        amount: 999,
        currency: 'usd',
        status: 'succeeded',
        billing_cycle: 'month',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method_id: 'pm_test_production',
        user: {
          email: newUserEmail,
          username: 'testuser'
        }
      }
    };
    
    // Send webhook to our endpoint
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whop-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whop-signature': 'test-production-signature'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const webhookResult = await webhookResponse.text();
    console.log('Webhook response:', webhookResult);
    
    // Step 4: Check if user subscription was updated
    const userAfterPayment = await db.getUserUsage(newUserId);
    console.log('User after payment:', userAfterPayment);
    
    // Step 5: Test upgrade scenario
    console.log('Step 5: Testing upgrade to premium');
    const upgradeWebhookPayload = {
      event: 'payment.succeeded',
      data: {
        id: 'pay_test_upgrade',
        user_id: newWhopUserId,
        subscription_id: 'sub_test_upgrade',
        plan_id: 'plan_qbxMJNrDzxyfw', // Premium plan
        amount: 1999,
        currency: 'usd',
        status: 'succeeded',
        billing_cycle: 'month',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method_id: 'pm_test_upgrade',
        user: {
          email: newUserEmail,
          username: 'testuser'
        }
      }
    };
    
    const upgradeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whop-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whop-signature': 'test-upgrade-signature'
      },
      body: JSON.stringify(upgradeWebhookPayload)
    });
    
    const upgradeResult = await upgradeResponse.text();
    console.log('Upgrade webhook response:', upgradeResult);
    
    // Step 6: Check final user state
    const userAfterUpgrade = await db.getUserUsage(newUserId);
    console.log('User after upgrade:', userAfterUpgrade);
    
    return NextResponse.json({
      success: true,
      testResults: {
        newUserId,
        userAfterSignup,
        webhookProcessing: {
          status: webhookResponse.status,
          result: webhookResult
        },
        userAfterPayment,
        upgradeProcessing: {
          status: upgradeResponse.status,
          result: upgradeResult
        },
        userAfterUpgrade,
        summary: {
          signupWorked: userAfterSignup !== null,
          paymentWebhookWorked: webhookResponse.ok && userAfterPayment.subscriptionStatus === 'active',
          upgradeWebhookWorked: upgradeResponse.ok && userAfterUpgrade.planId === 'plan_qbxMJNrDzxyfw',
          allTestsPassed: webhookResponse.ok && upgradeResponse.ok && 
                         userAfterPayment.subscriptionStatus === 'active' && 
                         userAfterUpgrade.planId === 'plan_qbxMJNrDzxyfw'
        }
      }
    });
    
  } catch (error) {
    console.error('Production webhook test error:', error);
    return NextResponse.json(
      { 
        error: 'Production webhook test failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Production webhook test endpoint',
    usage: {
      method: 'POST',
      purpose: 'Test complete production webhook flow: signup → payment → upgrade'
    }
  });
}
