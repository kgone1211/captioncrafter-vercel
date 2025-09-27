import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    
    console.log('Testing usage for userId:', userId);
    
    // Get all users first
    const allUsers = await db.getAllUsers();
    console.log('All users:', allUsers);
    
    // Get usage
    const usage = await db.getUserUsage(userId);
    console.log('Usage result:', usage);
    
    return NextResponse.json({ 
      userId,
      allUsers,
      usage,
      message: 'Usage test completed'
    });
  } catch (error) {
    console.error('Usage test error:', error);
    return NextResponse.json(
      { error: 'Failed to test usage' },
      { status: 500 }
    );
  }
}

