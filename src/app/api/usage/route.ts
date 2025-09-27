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

    await db.initDatabase();
    console.log('Database initialized for usage fetch');
    
    try {
      const usage = await db.getUserUsage(parseInt(userId));
      console.log('Database usage result:', usage);
      return NextResponse.json(usage);
    } catch (dbError) {
      console.error('Database usage fetch error:', dbError);
      // Use fallback counter if database fails
      console.log('Using fallback counter for usage fetch');
      const fallbackUsage = fallbackCounter.getUsage(parseInt(userId));
      console.log('Fallback usage result:', fallbackUsage);
      return NextResponse.json(fallbackUsage);
    }
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
    let canGenerate = true;
    try {
      canGenerate = await db.canGenerateCaption(userId);
    } catch (error) {
      console.error('Error checking canGenerateCaption in POST:', error);
      canGenerate = fallbackCounter.canGenerateCaption(userId);
    }
    
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Usage limit reached', canGenerate: false },
        { status: 403 }
      );
    }

    // Increment usage
    try {
      await db.incrementUsage(userId);
      const usage = await db.getUserUsage(userId);
      return NextResponse.json({ 
        usage, 
        canGenerate: true 
      });
    } catch (error) {
      console.error('Error incrementing usage in POST:', error);
      // Use fallback counter if database fails
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
