// Test API to check which database is being used

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const isLocalDev = !process.env.POSTGRES_URL || process.env.POSTGRES_URL.includes('localhost');
    
    return NextResponse.json({
      isLocalDev,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      postgresUrl: process.env.POSTGRES_URL ? 'present' : 'missing',
      nodeEnv: process.env.NODE_ENV,
      message: isLocalDev ? 'Using local database' : 'Using Vercel Postgres'
    });
  } catch (error) {
    console.error('Database type test error:', error);
    return NextResponse.json(
      { error: 'Failed to test database type' },
      { status: 500 }
    );
  }
}
