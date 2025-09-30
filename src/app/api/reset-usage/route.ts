import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Direct database update using fetch to Supabase REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        free_captions_used: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase update error:', errorText);
      return NextResponse.json(
        { error: 'Failed to update user usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `User ${userId} usage reset to 0` 
    });
    
  } catch (error) {
    console.error('Reset user usage error:', error);
    return NextResponse.json(
      { error: 'Failed to reset user usage' },
      { status: 500 }
    );
  }
}
