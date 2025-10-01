import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '6');
    
    // Get user data from database
    const usage = await db.getUserUsage(userId);
    
    // Also try to get raw user data from Supabase
    const { supabase } = await import('@/lib/supabase');
    const { data: rawUserData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      userId,
      usage,
      rawUserData,
      error: error?.message,
      webhookLookup: {
        byWhopUserId: rawUserData?.whop_user_id || 'not_found',
        byEmail: rawUserData?.email || 'not_found'
      }
    });

  } catch (error) {
    console.error('Check user data error:', error);
    return NextResponse.json(
      { error: 'Failed to check user data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
