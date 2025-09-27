// Test the counter system step by step

import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = parseInt(url.searchParams.get('userId') || '1');
    const action = url.searchParams.get('action') || 'status';
    
    console.log(`Test counter - userId: ${userId}, action: ${action}`);
    
    let result: any = {
      userId,
      action,
      timestamp: new Date().toISOString()
    };
    
    if (action === 'increment') {
      console.log('Incrementing fallback counter...');
      fallbackCounter.incrementUsage(userId);
      console.log('Fallback counter incremented');
    }
    
    // Get fallback counter status
    const fallbackUsage = fallbackCounter.getUsage(userId);
    result.fallbackCounter = fallbackUsage;
    result.canGenerateFallback = fallbackCounter.canGenerateCaption(userId);
    
    // Test database
    try {
      await db.initDatabase();
      const dbUsage = await db.getUserUsage(userId);
      result.databaseUsage = dbUsage;
      result.canGenerateDb = await db.canGenerateCaption(userId);
    } catch (dbError) {
      result.databaseError = dbError instanceof Error ? dbError.message : 'Unknown error';
    }
    
    // Test increment in database
    if (action === 'increment-db') {
      try {
        await db.initDatabase();
        await db.incrementUsage(userId);
        const newDbUsage = await db.getUserUsage(userId);
        result.databaseAfterIncrement = newDbUsage;
      } catch (dbError) {
        result.databaseIncrementError = dbError instanceof Error ? dbError.message : 'Unknown error';
      }
    }
    
    console.log('Test result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Counter test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
