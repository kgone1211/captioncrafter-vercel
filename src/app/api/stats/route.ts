// API route for user statistics

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = new Database();
    const stats = await db.getUserStats(userId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get user stats' },
      { status: 500 }
    );
  }
}
