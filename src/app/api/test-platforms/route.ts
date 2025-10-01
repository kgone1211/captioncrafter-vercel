import { NextRequest, NextResponse } from 'next/server';
import { getAvailablePlatforms } from '@/lib/plan-features';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionStatus = searchParams.get('subscriptionStatus') || 'inactive';
    const planId = searchParams.get('planId') || undefined;

    console.log('Testing platforms for:', { subscriptionStatus, planId });

    const platforms = getAvailablePlatforms(subscriptionStatus, planId);

    return NextResponse.json({
      success: true,
      subscriptionStatus,
      planId,
      platforms,
      platformCount: platforms.length
    });
  } catch (error) {
    console.error('Test platforms error:', error);
    return NextResponse.json(
      { error: 'Failed to test platforms', details: error },
      { status: 500 }
    );
  }
}
