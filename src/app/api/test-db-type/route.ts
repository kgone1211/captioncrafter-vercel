// Test API to check which database is being used

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const isLocalDev = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
    const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    
    let message = 'Using local database';
    if (hasSupabase) {
      message = 'Using Supabase';
    } else if (!isLocalDev) {
      message = 'Using Vercel Postgres';
    }
    
    return NextResponse.json({
      isLocalDev,
      hasSupabase,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      databaseUrl: process.env.DATABASE_URL ? 'present' : 'missing',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
      nodeEnv: process.env.NODE_ENV,
      message
    });
  } catch (error) {
    console.error('Database type test error:', error);
    return NextResponse.json(
      { error: 'Failed to test database type' },
      { status: 500 }
    );
  }
}
