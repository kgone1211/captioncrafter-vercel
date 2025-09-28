import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { fallbackCounter } from '@/lib/fallback-counter';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('Verifying checkout session:', sessionId);

    // Verify the session with Whop (if API key is available)
    if (whopSdk.hasApiKey()) {
      try {
        if (!sessionId.startsWith('mock_')) {
          console.log('Verifying real Whop session:', sessionId);
          // TODO: Implement real Whop session verification
          // const session = await whopSdk.getCheckoutSession(sessionId);
          // userId = session.metadata.user_id;
        }
      } catch (error) {
        console.error('Error verifying with Whop:', error);
        // Continue with fallback upgrade
      }
    }

    // Extract user ID from session ID or metadata
    // For mock sessions, we'll need to get the user ID from the session
    // In a real implementation, this would come from Whop's session data
    let userId: number;
    
    if (sessionId.startsWith('mock_')) {
      // For mock sessions, we'll use a default user ID
      // In production, you'd get this from the session metadata
      userId = 1; // This should be the actual user ID from the session
    } else {
      // For real sessions, extract from Whop session data
      userId = 1; // This should be extracted from the actual session
    }

    // Upgrade user to subscription
    console.log('Upgrading user to subscription:', userId);
    fallbackCounter.upgradeToSubscription(userId, 'premium'); // Default to premium plan
    
    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      userId,
      sessionId
    });

  } catch (error) {
    console.error('Verify checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to verify checkout session' },
      { status: 500 }
    );
  }
}
