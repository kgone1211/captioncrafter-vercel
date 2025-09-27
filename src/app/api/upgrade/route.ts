import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';

export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json();
    
    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'User ID and Plan ID are required' },
        { status: 400 }
      );
    }

    // Upgrade user to subscription
    fallbackCounter.upgradeToSubscription(userId, planId);
    
    // Get updated usage
    const usage = fallbackCounter.getUsage(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User upgraded to subscription',
      usage
    });

  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade user' },
      { status: 500 }
    );
  }
}
