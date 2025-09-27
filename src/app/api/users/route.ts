// API route for user operations

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, whopUserId, subscriptionStatus } = await request.json();
    
    console.log('User creation API called with:', { email, whopUserId, subscriptionStatus });
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await db.initDatabase();
    console.log('Database initialized for user creation');
    
    const userId = await db.upsertUser(email, whopUserId, subscriptionStatus);
    console.log('User created/updated with ID:', userId);

    return NextResponse.json({ userId });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
