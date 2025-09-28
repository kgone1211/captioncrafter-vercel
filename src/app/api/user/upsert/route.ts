import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, whopUserId, subscriptionStatus, username } = await request.json();

    if (!email || !whopUserId) {
      return NextResponse.json(
        { error: 'Email and Whop User ID are required' },
        { status: 400 }
      );
    }

    console.log('API: Upserting user:', { email, whopUserId, subscriptionStatus, username });

    // Initialize database
    await db.initDatabase();

    // Upsert user
    const userId = await db.upsertUser(
      email,
      whopUserId,
      subscriptionStatus || 'inactive',
      username
    );

    console.log('API: User upserted with ID:', userId);

    return NextResponse.json({ userId });
  } catch (error) {
    console.error('API: Error upserting user:', error);
    return NextResponse.json(
      { error: 'Failed to upsert user' },
      { status: 500 }
    );
  }
}
