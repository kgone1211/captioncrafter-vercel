// API route to clear the database (for development only)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabaseDb } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Clear database API called');
    
    // Only allow in development or with special key
    const authKey = request.headers.get('x-clear-key');
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev && authKey !== 'clear-db-2024') {
      return NextResponse.json(
        { error: 'Unauthorized - only allowed in development or with proper key' },
        { status: 401 }
      );
    }

    // Initialize database
    await db.initDatabase();
    console.log('Database initialized');

    // Check which database we're using
    const isLocalDev = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    
    console.log('Database type check:', { isLocalDev, hasSupabase });

    let result = {};

    if (hasSupabase) {
      result = await supabaseDb.clearDatabase();
    } else if (isLocalDev) {
      console.log('Clearing local database...');
      // For local database, we can't easily clear it, but we can reset the counter
      result = { message: 'Local database - cannot clear in-memory data' };
    } else {
      result = { message: 'Using Vercel Postgres - not clearing' };
    }

    return NextResponse.json({
      success: true,
      databaseType: { isLocalDev, hasSupabase },
      result
    });
  } catch (error) {
    console.error('Clear database error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
