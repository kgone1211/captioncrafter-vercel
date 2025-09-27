// Debug API route to test database singleton
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { localDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG DATABASE SINGLETON ===');
    
    // Test the main database singleton
    await db.initDatabase();
    const allUsers = await db.getAllUsers();
    console.log('Main db.getAllUsers():', allUsers);
    
    // Test the local database directly
    const localUsers = await localDb.getAllUsers();
    console.log('Local db.getAllUsers():', localUsers);
    
    // Test usage for user 1
    const usage = await db.getUserUsage(1);
    console.log('Usage for user 1:', usage);
    
    // Test increment
    console.log('Incrementing usage for user 1...');
    await db.incrementUsage(1);
    
    // Check usage again
    const usageAfter = await db.getUserUsage(1);
    console.log('Usage after increment:', usageAfter);
    
    return NextResponse.json({
      mainDbUsers: allUsers,
      localDbUsers: localUsers,
      usageBefore: usage,
      usageAfter: usageAfter
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
