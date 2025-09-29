// API route for usage tracking

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fallbackCounter } from '@/lib/fallback-counter';
import { subscriptionManager } from '@/lib/subscription-manager';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    console.log('Usage API GET called with userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    
    // Get usage from database (includes billing info)
    const dbUsage = await db.getUserUsage(userIdNum);
    console.log('Database usage result:', dbUsage);
    
    // Get subscription status with expiry info
    const subscriptionStatus = await subscriptionManager.getSubscriptionStatus(userIdNum);
    console.log('Subscription status:', subscriptionStatus);
    
    // Combine usage and subscription info
    const combinedUsage = {
      ...dbUsage,
      daysUntilExpiry: subscriptionStatus.daysUntilExpiry
    };
    
    console.log('Combined usage result:', combinedUsage);
    return NextResponse.json(combinedUsage);
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Always use fallback counter for consistency
    const canGenerate = fallbackCounter.canGenerateCaption(userId);
    
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Usage limit reached', canGenerate: false },
        { status: 403 }
      );
    }

    // Increment fallback counter
    fallbackCounter.incrementUsage(userId);
    const usage = fallbackCounter.getUsage(userId);
    return NextResponse.json({ 
      usage, 
      canGenerate: true 
    });
  } catch (error) {
    console.error('Usage increment error:', error);
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
}
