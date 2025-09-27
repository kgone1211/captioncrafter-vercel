// API route for fallback usage counter

import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';

export async function GET(request: NextRequest) {
  try {
    console.log('Fallback usage API called');
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    console.log('Fallback usage API userId:', userId);
    
    if (!userId) {
      console.log('Fallback usage API: No userId provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const usage = fallbackCounter.getUsage(parseInt(userId));
    console.log('Fallback usage API returning for user', userId, ':', usage);
    
    return NextResponse.json(usage);
  } catch (error) {
    console.error('Fallback usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to get fallback usage' },
      { status: 500 }
    );
  }
}
