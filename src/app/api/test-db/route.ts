import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test if the database is working by creating a user and then checking it
    console.log('Creating test user...');
    const userId = await db.upsertUser('test@example.com', 'test_user', 'active');
    console.log('User created with ID:', userId);
    
    // Get all users
    const allUsers = await db.getAllUsers();
    console.log('All users:', allUsers);
    
    // Get usage
    const usage = await db.getUserUsage(userId);
    console.log('Usage:', usage);
    
    return NextResponse.json({ 
      userId,
      allUsers,
      usage,
      message: 'Database test completed'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Failed to test database' },
      { status: 500 }
    );
  }
}

