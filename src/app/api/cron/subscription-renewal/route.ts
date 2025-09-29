import { NextRequest, NextResponse } from 'next/server';
import { subscriptionManager } from '@/lib/subscription-manager';

export async function GET(request: NextRequest) {
  try {
    // Check if this is a cron job request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting subscription renewal process...');
    
    // Process expired subscriptions
    const result = await subscriptionManager.processExpiredSubscriptions();
    
    console.log('Subscription renewal process completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription renewal process completed',
      result
    });

  } catch (error) {
    console.error('Error in subscription renewal cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription renewals' },
      { status: 500 }
    );
  }
}

// This endpoint can be called by Vercel Cron Jobs or external cron services
// Set up a cron job to call this endpoint daily at midnight UTC:
// 0 0 * * * curl -X GET "https://your-app.vercel.app/api/cron/subscription-renewal" -H "Authorization: Bearer YOUR_CRON_SECRET"
