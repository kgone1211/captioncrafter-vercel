// API route for usage tracking

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fallbackCounter } from '@/lib/fallback-counter';

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

    // Always use fallback counter for consistency
    console.log('Using fallback counter for usage fetch');
    const fallbackUsage = fallbackCounter.getUsage(parseInt(userId));
    console.log('Fallback usage result:', fallbackUsage);
    return NextResponse.json(fallbackUsage);
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
