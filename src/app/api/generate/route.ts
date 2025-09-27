// API route for caption generation

import { NextRequest, NextResponse } from 'next/server';
import { CaptionGenerator } from '@/lib/ai';
import { CaptionGenerationRequest } from '@/types';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body: CaptionGenerationRequest = await request.json();
    
    // Initialize database if needed
    await db.initDatabase();
    
    // Validate request
    if (!body.platform || !body.topic || !body.tone) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, topic, tone' },
        { status: 400 }
      );
    }

    // Check if user can generate captions (usage limit)
    if (body.userId) {
      let canGenerate = true; // Default to true for fallback
      try {
        canGenerate = await db.canGenerateCaption(body.userId);
        console.log('Can generate captions:', canGenerate);
      } catch (error) {
        console.error('Error checking canGenerateCaption:', error);
        // Use fallback logic - allow generation if database fails
        canGenerate = true;
      }
      
      if (!canGenerate) {
        return NextResponse.json(
          { 
            error: 'Usage limit reached', 
            message: 'You have used all 3 free captions. Please upgrade to continue.',
            canGenerate: false 
          },
          { status: 403 }
        );
      }
    }

    console.log('Starting caption generation...');
    const generator = new CaptionGenerator();
    console.log('CaptionGenerator created, calling generateCaptions...');
    const captions = await generator.generateCaptions(body);
    console.log('Captions generated successfully:', captions.length, 'captions');

    // Increment usage after successful generation
    if (body.userId) {
      console.log(`Incrementing usage for userId: ${body.userId}`);
      try {
        await db.incrementUsage(body.userId);
        console.log(`Usage incremented for userId: ${body.userId}`);
      } catch (error) {
        console.error('Error incrementing usage:', error);
        // Continue even if usage increment fails
        console.log('Usage increment failed, but continuing...');
      }
    }

    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Caption generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate captions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
