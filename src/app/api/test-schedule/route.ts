import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, captionId, platform, scheduledAt, notifyVia } = await request.json();

    if (!userId || !captionId || !platform || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Testing schedule post with:', { userId, captionId, platform, scheduledAt, notifyVia });

    // Test scheduling a post
    const scheduledPostId = await supabaseDb.schedulePost(
      parseInt(userId),
      parseInt(captionId),
      platform,
      scheduledAt,
      notifyVia || 'email'
    );

    console.log('Post scheduled with ID:', scheduledPostId);

    return NextResponse.json({
      success: true,
      message: 'Post scheduled successfully',
      scheduledPostId
    });
  } catch (error) {
    console.error('Test schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post', details: error },
      { status: 500 }
    );
  }
}
