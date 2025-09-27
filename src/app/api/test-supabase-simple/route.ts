// Simple Supabase test API

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    return NextResponse.json({
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseKey ? 'present' : 'missing',
      message: 'Environment variables check'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check environment variables' },
      { status: 500 }
    );
  }
}
