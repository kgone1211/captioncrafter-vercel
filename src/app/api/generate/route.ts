// API route for caption generation

import { NextRequest, NextResponse } from 'next/server';
import { CaptionGenerator } from '@/lib/ai';
import { CaptionGenerationRequest } from '@/types';
import { Database } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body: CaptionGenerationRequest = await request.json();
    
    // Validate request
    if (!body.platform || !body.topic || !body.tone) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, topic, tone' },
        { status: 400 }
      );
    }

    // Check if user can generate captions (usage limit)
    if (body.userId) {
      const db = new Database();
      const canGenerate = await db.canGenerateCaption(body.userId);
      
      if (!canGenerate) {
        return NextResponse.json(
          { 
            error: 'Usage limit reached', 
            message: 'You have used all 10 free captions. Please upgrade to continue.',
            canGenerate: false 
          },
          { status: 403 }
        );
      }
    }

    const generator = new CaptionGenerator();
    const captions = await generator.generateCaptions(body);

    // Increment usage after successful generation
    if (body.userId) {
      const db = new Database();
      await db.incrementUsage(body.userId);
    }

    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Caption generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate captions' },
      { status: 500 }
    );
  }
}
