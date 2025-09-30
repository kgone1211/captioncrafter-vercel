import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';
import { whopSdk } from '@/lib/whop-sdk';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    console.log(`Syncing subscription status for user ${numericUserId}`);

    // Get Whop subscription status
    let whopStatus = 'inactive';
    let whopPlanId = null;
    
    try {
      whopStatus = await whopSdk.getUserSubscriptionStatus(userId);
      const planInfo = await whopSdk.getUserSubscriptionPlan(userId);
      whopPlanId = planInfo?.plan_id;
      
      console.log(`Whop subscription status: ${whopStatus}, plan: ${whopPlanId}`);
    } catch (error) {
      console.error('Error fetching Whop subscription:', error);
    }

    // Update fallback counter based on Whop status
    if (whopStatus === 'active') {
      fallbackCounter.upgradeToSubscription(numericUserId, whopPlanId || 'active');
      console.log(`Synced: Upgraded user ${numericUserId} to active subscription`);
    } else {
      fallbackCounter.downgradeToFree(numericUserId);
      console.log(`Synced: Downgraded user ${numericUserId} to free plan`);
    }

    // Get updated fallback counter status
    const updatedUsage = fallbackCounter.getUsage(numericUserId);
    const canGenerate = fallbackCounter.canGenerateCaption(numericUserId);

    return NextResponse.json({
      success: true,
      userId: numericUserId,
      whopStatus: whopStatus,
      whopPlanId: whopPlanId,
      updatedFallbackCounter: updatedUsage,
      canGenerate: canGenerate,
      message: `Subscription status synced for user ${numericUserId}`
    });

  } catch (error) {
    console.error('Subscription sync error:', error);
    return NextResponse.json(
      { error: 'Subscription sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
