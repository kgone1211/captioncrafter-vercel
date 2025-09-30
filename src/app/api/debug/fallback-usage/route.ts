import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';

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
    const usage = fallbackCounter.getUsage(numericUserId);
    const canGenerate = fallbackCounter.canGenerateCaption(numericUserId);

    return NextResponse.json({
      success: true,
      userId: numericUserId,
      usage: usage,
      canGenerate: canGenerate,
      instructions: [
        "This shows the raw fallback counter data",
        "freeCaptionsUsed should show 3 when paywall appears",
        "subscriptionStatus should be 'inactive' for free users",
        "canGenerate should be false when usage limit reached"
      ]
    });

  } catch (error) {
    console.error('Debug fallback usage error:', error);
    return NextResponse.json(
      { error: 'Debug fallback usage failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();
    
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

    switch (action) {
      case 'increment':
        fallbackCounter.incrementUsage(numericUserId);
        break;
      case 'reset':
        fallbackCounter.resetUsage(numericUserId);
        break;
      case 'upgrade':
        fallbackCounter.upgradeToSubscription(numericUserId, 'test-plan');
        break;
      case 'downgrade':
        fallbackCounter.downgradeToFree(numericUserId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: increment, reset, upgrade, downgrade' },
          { status: 400 }
        );
    }

    const updatedUsage = fallbackCounter.getUsage(numericUserId);
    const canGenerate = fallbackCounter.canGenerateCaption(numericUserId);

    return NextResponse.json({
      success: true,
      userId: numericUserId,
      action: action,
      updatedUsage: updatedUsage,
      canGenerate: canGenerate
    });

  } catch (error) {
    console.error('Debug fallback usage POST error:', error);
    return NextResponse.json(
      { error: 'Debug fallback usage POST failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
