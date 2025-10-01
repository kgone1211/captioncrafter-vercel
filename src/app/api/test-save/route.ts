import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, platform, topic, tone, text, hashtags, charCount } = await request.json();

    if (!userId || !platform || !topic || !tone || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Testing save caption with:', { userId, platform, topic, tone, charCount });

    // Test saving a caption
    const captionId = await supabaseDb.saveCaption(
      parseInt(userId),
      platform,
      topic,
      tone,
      text,
      hashtags || ['#test'],
      charCount || text.length
    );

    console.log('Caption saved with ID:', captionId);

    return NextResponse.json({
      success: true,
      message: 'Caption saved successfully',
      captionId
    });
  } catch (error) {
    console.error('Test save error:', error);
    return NextResponse.json(
      { error: 'Failed to save caption', details: error },
      { status: 500 }
    );
  }
}
