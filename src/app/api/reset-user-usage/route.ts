import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Reset the user's usage in Supabase
    const { error } = await supabase
      .from('users')
      .update({ free_captions_used: 0 })
      .eq('id', userId);

    if (error) {
      console.error('Error resetting user usage:', error);
      return NextResponse.json(
        { error: 'Failed to reset user usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: `User ${userId} usage reset to 0`,
      success: true 
    });
  } catch (error) {
    console.error('Reset user usage error:', error);
    return NextResponse.json(
      { error: 'Failed to reset user usage' },
      { status: 500 }
    );
  }
}
