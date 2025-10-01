// API route for caption generation

import { NextRequest, NextResponse } from 'next/server';
import { CaptionGenerator } from '@/lib/ai';
import { CaptionGenerationRequest } from '@/types';
import { db } from '@/lib/db';
import { supabaseDb } from '@/lib/supabase';

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
          console.log('Checking generation permissions for user:', body.userId);
          
          // Use Supabase database to check usage limits
          const canGenerate = await supabaseDb.canGenerateCaption(body.userId);
          console.log('Supabase canGenerateCaption:', canGenerate);
          
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
          
          // Increment usage in Supabase database
          console.log('Incrementing usage in Supabase for userId:', body.userId);
          await supabaseDb.incrementUsage(body.userId);
          console.log('Usage incremented successfully');
        }

    console.log('Starting caption generation...');
    const generator = new CaptionGenerator();
    console.log('CaptionGenerator created, calling generateCaptions...');
    const captions = await generator.generateCaptions(body);
    console.log('Captions generated successfully:', captions.length, 'captions');

    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Caption generation error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Try to extract more info
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate captions',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
