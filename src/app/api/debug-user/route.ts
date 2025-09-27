// Debug API route to check user data

import { NextRequest, NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { getWhopAuth } from '@/lib/whop-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug User API called');
    
    // Get Whop authentication
    const auth = await getWhopAuth();
    console.log('Auth result:', auth);
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({
        error: 'Not authenticated',
        auth
      });
    }

    const userId = auth.userId;
    console.log('User ID from auth:', userId);

    // Load the user's public profile information
    const whopUser = await whopSdk.getUser({ userId: userId });
    console.log('Whop User from SDK:', whopUser);

    // Initialize database
    await db.initDatabase();
    console.log('Database initialized');

    // Create/update user in our database
    const dbUserId = await db.upsertUser(
      whopUser.email, 
      whopUser.id, 
      whopUser.subscription_status
    );
    console.log('Database user ID:', dbUserId);

    // Get all users to see what's in the database
    const allUsers = await db.getAllUsers();
    console.log('All users in database:', allUsers);

    // Get usage for this user
    const usage = await db.getUserUsage(dbUserId);
    console.log('Usage for user:', usage);

    // Check if user can generate captions
    const canGenerate = await db.canGenerateCaption(dbUserId);
    console.log('Can generate captions:', canGenerate);

    return NextResponse.json({
      auth,
      whopUser,
      dbUserId,
      allUsers,
      usage,
      canGenerate,
      environment: {
        TEST_USERNAME: process.env.TEST_USERNAME,
        TEST_EMAIL: process.env.TEST_EMAIL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
