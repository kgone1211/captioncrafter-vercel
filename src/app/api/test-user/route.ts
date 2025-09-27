import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, whopUserId, subscriptionStatus } = await request.json();
    
    console.log('Creating user with:', { email, whopUserId, subscriptionStatus });
    
    const userId = await db.upsertUser(email, whopUserId, subscriptionStatus);
    
    console.log('User created with ID:', userId);
    
    // Get all users to verify
    const allUsers = await db.getAllUsers();
    console.log('All users after creation:', allUsers);
    
    return NextResponse.json({ 
      userId,
      allUsers,
      message: 'User creation test completed'
    });
  } catch (error) {
    console.error('User creation test error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
