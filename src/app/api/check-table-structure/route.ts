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
    console.log('Checking table structure...');

    // Try to get table schema information
    const { data: captionsData, error: captionsError } = await supabase
      .from('captions')
      .select('*')
      .limit(1);

    const { data: scheduledPostsData, error: scheduledPostsError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      tables: {
        captions: {
          exists: !captionsError,
          error: captionsError?.message || null,
          sampleData: captionsData?.[0] || null
        },
        scheduled_posts: {
          exists: !scheduledPostsError,
          error: scheduledPostsError?.message || null,
          sampleData: scheduledPostsData?.[0] || null
        }
      },
      message: 'Table structure checked successfully'
    });
  } catch (error) {
    console.error('Error checking table structure:', error);
    return NextResponse.json(
      { error: 'Failed to check table structure', details: error },
      { status: 500 }
    );
  }
}
