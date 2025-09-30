import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    
    // Debug environment variables
    console.log('Environment variables debug:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Test 1: Check if we can connect to Supabase
    const testUser = await supabaseDb.upsertUser(
      'test@example.com',
      'test_whop_user',
      'inactive',
      'Test User'
    );
    
    console.log('Test user created/retrieved with ID:', testUser);
    
    // Test 2: Get user usage
    const usage = await supabaseDb.getUserUsage(testUser);
    console.log('Test user usage:', usage);
    
    // Test 3: Check if user can generate captions
    const canGenerate = await supabaseDb.canGenerateCaption(testUser);
    console.log('Can generate caption:', canGenerate);
    
    // Test 4: Get all users
    const allUsers = await supabaseDb.getAllUsers();
    console.log('All users:', allUsers);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      testResults: {
        testUserId: testUser,
        usage: usage,
        canGenerate: canGenerate,
        totalUsers: allUsers.length,
        users: allUsers
      },
      instructions: [
        '1. Supabase is now connected and working',
        '2. Data will persist between server restarts',
        '3. User subscriptions will be properly tracked',
        '4. Usage counters will persist across sessions'
      ]
    });
    
  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Supabase connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        instructions: [
          '1. Make sure to uncomment Supabase URLs in .env.local',
          '2. Run the SQL schema in Supabase SQL Editor',
          '3. Check that SUPABASE_SERVICE_ROLE_KEY is correct'
        ]
      },
      { status: 500 }
    );
  }
}