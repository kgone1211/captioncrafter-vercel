// Test API to check Supabase connection directly

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    
    console.log('Supabase connection successful, data:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0,
      message: 'Supabase connection successful'
    });
  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test Supabase connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
