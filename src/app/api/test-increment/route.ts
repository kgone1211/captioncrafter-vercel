import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    console.log('Testing increment for userId:', userId);
    
    // Get usage before increment
    const usageBefore = await db.getUserUsage(userId);
    console.log('Usage before increment:', usageBefore);
    
    // Increment usage
    await db.incrementUsage(userId);
    console.log('Usage incremented');
    
    // Get usage after increment
    const usageAfter = await db.getUserUsage(userId);
    console.log('Usage after increment:', usageAfter);
    
    return NextResponse.json({ 
      userId,
      usageBefore,
      usageAfter,
      message: 'Increment test completed'
    });
  } catch (error) {
    console.error('Increment test error:', error);
    return NextResponse.json(
      { error: 'Failed to test increment' },
      { status: 500 }
    );
  }
}

