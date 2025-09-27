// API route for usage tracking

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    await db.initDatabase();
    const usage = await db.getUserUsage(parseInt(userId));

    return NextResponse.json(usage);
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

    await db.initDatabase();
    
    // Check if user can generate caption
    const canGenerate = await db.canGenerateCaption(userId);
    
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Usage limit reached', canGenerate: false },
        { status: 403 }
      );
    }

    // Increment usage
    await db.incrementUsage(userId);
    
    // Get updated usage
    const usage = await db.getUserUsage(userId);

    return NextResponse.json({ 
      canGenerate: true, 
      usage,
      remainingFree: Math.max(0, 10 - usage.freeCaptionsUsed)
    });
  } catch (error) {
    console.error('Usage increment error:', error);
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
}
