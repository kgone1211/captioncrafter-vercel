// API route for scheduled post operations

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, captionId, platform, scheduledAt, notifyVia } = await request.json();
    
    if (!userId || !captionId || !platform || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = new Database();
    const postId = await db.schedulePost(
      userId,
      captionId,
      platform,
      scheduledAt,
      notifyVia || 'None'
    );

    return NextResponse.json({ postId });
  } catch (error) {
    console.error('Schedule post error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const status = searchParams.get('status') || undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = new Database();
    const posts = await db.listScheduledPosts(userId, status);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Scheduled posts list error:', error);
    return NextResponse.json(
      { error: 'Failed to list scheduled posts' },
      { status: 500 }
    );
  }
}
