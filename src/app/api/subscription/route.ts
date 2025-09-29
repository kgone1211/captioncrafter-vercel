import { NextRequest, NextResponse } from 'next/server';
import { subscriptionManager } from '@/lib/subscription-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Get subscription status with billing info
    const subscriptionStatus = await subscriptionManager.getSubscriptionStatus(userIdNum);
    
    return NextResponse.json({
      success: true,
      subscription: subscriptionStatus
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, planId, billingCycle } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'create':
        if (!planId) {
          return NextResponse.json(
            { error: 'Plan ID is required for creating subscription' },
            { status: 400 }
          );
        }
        await subscriptionManager.createSubscription(
          userIdNum,
          planId,
          billingCycle || 'monthly'
        );
        result = { message: 'Subscription created successfully' };
        break;

      case 'renew':
        const renewed = await subscriptionManager.renewSubscription(userIdNum);
        result = { 
          message: renewed ? 'Subscription renewed successfully' : 'Failed to renew subscription',
          renewed: renewed
        };
        break;

      case 'cancel':
        await subscriptionManager.cancelSubscription(userIdNum);
        result = { message: 'Subscription cancelled successfully' };
        break;

      case 'check_expiry':
        const expiryInfo = await subscriptionManager.checkSubscriptionExpiry(userIdNum);
        result = { expiryInfo };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: create, renew, cancel, check_expiry' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      ...result,
      success: true
    });

  } catch (error) {
    console.error('Error processing subscription action:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription action' },
      { status: 500 }
    );
  }
}
