import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: NextRequest) {
  try {
    console.log('Checking if required tables exist...');

    // Check if captions table exists
    const { data: captionsData, error: captionsError } = await supabase
      .from('captions')
      .select('id')
      .limit(1);

    // Check if scheduled_posts table exists
    const { data: scheduledPostsData, error: scheduledPostsError } = await supabase
      .from('scheduled_posts')
      .select('id')
      .limit(1);

    const results = {
      captions: {
        exists: !captionsError,
        error: captionsError?.message || null
      },
      scheduled_posts: {
        exists: !scheduledPostsError,
        error: scheduledPostsError?.message || null
      }
    };

    console.log('Table check results:', results);

    return NextResponse.json({
      success: true,
      tables: results,
      message: 'Tables checked successfully'
    });
  } catch (error) {
    console.error('Error checking tables:', error);
    return NextResponse.json(
      { error: 'Failed to check tables', details: error },
      { status: 500 }
    );
  }
}
