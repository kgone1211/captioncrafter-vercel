import { NextRequest, NextResponse } from 'next/server';
import { fallbackCounter } from '@/lib/fallback-counter';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (userId) {
      fallbackCounter.resetUsage(userId);
      return NextResponse.json({ message: `Counter reset for user ${userId}` });
    } else {
      fallbackCounter.resetAll();
      return NextResponse.json({ message: 'All counters reset' });
    }
  } catch (error) {
    console.error('Reset counter error:', error);
    return NextResponse.json(
      { error: 'Failed to reset counter' },
      { status: 500 }
    );
  }
}
