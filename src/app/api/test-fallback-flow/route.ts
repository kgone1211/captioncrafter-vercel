// Test the complete fallback counter flow

import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = parseInt(url.searchParams.get('userId') || '1');
    const action = url.searchParams.get('action') || 'get';
    
    console.log(`Test fallback flow - userId: ${userId}, action: ${action}`);
    
    if (action === 'increment') {
      console.log('Incrementing fallback counter...');
      fallbackCounter.incrementUsage(userId);
      console.log('Fallback counter incremented');
    }
    
    const usage = fallbackCounter.getUsage(userId);
    console.log('Current fallback usage:', usage);
    
    return NextResponse.json({
      userId,
      action,
      usage,
      canGenerate: fallbackCounter.canGenerateCaption(userId),
      message: 'Fallback counter test completed'
    });
  } catch (error) {
    console.error('Fallback flow test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
