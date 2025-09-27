// API route for caption operations

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, platform, topic, tone, text, hashtags, charCount } = await request.json();
    
    if (!userId || !platform || !topic || !tone || !text || !hashtags || !charCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = new Database();
    const captionId = await db.saveCaption(
      userId,
      platform,
      topic,
      tone,
      text,
      hashtags,
      charCount
    );

    return NextResponse.json({ captionId });
  } catch (error) {
    console.error('Caption save error:', error);
    return NextResponse.json(
      { error: 'Failed to save caption' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0');
    const platform = searchParams.get('platform') || undefined;
    const favoriteOnly = searchParams.get('favoriteOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = new Database();
    const captions = await db.listCaptions(userId, platform, favoriteOnly);

    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Caption list error:', error);
    return NextResponse.json(
      { error: 'Failed to list captions' },
      { status: 500 }
    );
  }
}

