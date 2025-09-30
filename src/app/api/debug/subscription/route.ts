import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
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

    // Get fallback counter status
    const fallbackUsage = fallbackCounter.getUsage(numericUserId);
    
    // Try to get Whop subscription status
    let whopSubscriptionStatus = 'unknown';
    let whopError = null;
    
    try {
      whopSubscriptionStatus = await whopSdk.getUserSubscriptionStatus(userId);
    } catch (error) {
      whopError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Try to get database subscription status
    let dbSubscriptionStatus = 'unknown';
    let dbError = null;
    
    try {
      const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/api/subscription?userId=${numericUserId}`);
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        dbSubscriptionStatus = subscriptionData.subscription?.status || 'unknown';
      } else {
        dbError = `Database API returned ${subscriptionResponse.status}`;
      }
    } catch (error) {
      dbError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test generation permission
    const canGenerate = fallbackCounter.canGenerateCaption(numericUserId);

    return NextResponse.json({
      success: true,
      userId: numericUserId,
      fallbackCounter: {
        usage: fallbackUsage,
        canGenerate: canGenerate
      },
      whopSubscription: {
        status: whopSubscriptionStatus,
        error: whopError
      },
      databaseSubscription: {
        status: dbSubscriptionStatus,
        error: dbError
      },
      recommendations: [
        "1. Check if all three statuses match (fallback, Whop, database)",
        "2. If Whop shows 'active' but fallback shows 'inactive', call /api/debug/subscription-sync",
        "3. If user can't generate but should be able to, check the generation API logs",
        "4. Use /api/debug/reset-user to reset a user's fallback counter"
      ]
    });

  } catch (error) {
    console.error('Debug subscription error:', error);
    return NextResponse.json(
      { error: 'Debug subscription failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
