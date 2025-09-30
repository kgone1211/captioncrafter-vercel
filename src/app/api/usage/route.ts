import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Usage API called for userId:', userId);

    // Get user usage from Supabase
    const usage = await supabaseDb.getUserUsage(parseInt(userId));
    
    console.log('Usage API returning:', usage);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage data' },
      { status: 500 }
    );
  }
}