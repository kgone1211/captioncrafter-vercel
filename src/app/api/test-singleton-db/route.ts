import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test if the database singleton is working by checking the instance
    const instance1 = db;
    const instance2 = db;
    
    // Test if the database is working by creating a user and then checking it
    console.log('Creating test user...');
    const userId = await db.upsertUser('test2@example.com', 'test_user2', 'active');
    console.log('User created with ID:', userId);
    
    // Get all users
    const allUsers = await db.getAllUsers();
    console.log('All users:', allUsers);
    
    return NextResponse.json({ 
      isSingleton: instance1 === instance2,
      instance1: instance1.constructor.name,
      instance2: instance2.constructor.name,
      userId,
      allUsers,
      message: 'Database singleton test completed'
    });
  } catch (error) {
    console.error('Database singleton test error:', error);
    return NextResponse.json(
      { error: 'Failed to test database singleton' },
      { status: 500 }
    );
  }
}

