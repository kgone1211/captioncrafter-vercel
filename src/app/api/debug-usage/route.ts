// Debug API route for usage tracking issues

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

    console.log('Debug Usage API called with userId:', userId);
    
    // Initialize database
    await db.initDatabase();
    console.log('Database initialized');
    
    // Check which database we're using
    const isLocalDev = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    console.log('Database type check:', { isLocalDev, hasSupabase });
    
    // Get all users to see what's in the database
    const allUsers = await db.getAllUsers();
    console.log('All users in database:', allUsers);
    
    // Try to get usage for the specific user
    const usage = await db.getUserUsage(parseInt(userId));
    console.log('Usage for user:', usage);
    
    // Try to increment usage
    console.log('Attempting to increment usage...');
    await db.incrementUsage(parseInt(userId));
    console.log('Usage incremented');
    
    // Get usage again
    const usageAfter = await db.getUserUsage(parseInt(userId));
    console.log('Usage after increment:', usageAfter);

    return NextResponse.json({
      userId: parseInt(userId),
      allUsers,
      usageBefore: usage,
      usageAfter: usageAfter,
      databaseType: { isLocalDev, hasSupabase },
      message: 'Debug completed successfully'
    });
  } catch (error) {
    console.error('Debug usage error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
