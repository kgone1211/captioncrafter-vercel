import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Creating required tables...');

    // Create captions table
    const captionsSQL = `
      CREATE TABLE IF NOT EXISTS captions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        topic TEXT NOT NULL,
        tone TEXT NOT NULL,
        text TEXT NOT NULL,
        hashtags TEXT NOT NULL,
        char_count INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create scheduled_posts table
    const scheduledPostsSQL = `
      CREATE TABLE IF NOT EXISTS scheduled_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        caption_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        notify_via TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Try to execute the SQL (this might not work due to permissions)
    try {
      const { data: captionsResult, error: captionsError } = await supabase.rpc('exec_sql', {
        sql: captionsSQL
      });

      const { data: scheduledPostsResult, error: scheduledPostsError } = await supabase.rpc('exec_sql', {
        sql: scheduledPostsSQL
      });

      return NextResponse.json({
        success: true,
        message: 'Tables created successfully',
        results: {
          captions: { success: !captionsError, error: captionsError?.message },
          scheduled_posts: { success: !scheduledPostsError, error: scheduledPostsError?.message }
        }
      });
    } catch (sqlError) {
      // If RPC doesn't work, provide manual instructions
      return NextResponse.json({
        success: false,
        message: 'Could not create tables automatically. Please create them manually in Supabase dashboard.',
        instructions: {
          captions: {
            sql: captionsSQL,
            description: 'Create captions table for storing user-generated captions'
          },
          scheduled_posts: {
            sql: scheduledPostsSQL,
            description: 'Create scheduled_posts table for storing scheduled posts'
          }
        },
        error: sqlError
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating tables:', error);
    return NextResponse.json(
      { error: 'Failed to create tables', details: error },
      { status: 500 }
    );
  }
}
