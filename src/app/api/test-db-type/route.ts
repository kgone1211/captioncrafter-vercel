// Test API to check which database is being used

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const isLocalDev = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
    
    return NextResponse.json({
      isLocalDev,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrl: process.env.DATABASE_URL ? 'present' : 'missing',
      nodeEnv: process.env.NODE_ENV,
      message: isLocalDev ? 'Using local database' : 'Using Supabase'
    });
  } catch (error) {
    console.error('Database type test error:', error);
    return NextResponse.json(
      { error: 'Failed to test database type' },
      { status: 500 }
    );
  }
}
