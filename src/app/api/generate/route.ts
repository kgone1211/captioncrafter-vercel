// API route for caption generation

import { NextRequest, NextResponse } from 'next/server';
import { CaptionGenerator } from '@/lib/ai';
import { CaptionGenerationRequest } from '@/types';
import { db } from '@/lib/db';
import { fallbackCounter } from '@/lib/fallback-counter';

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
          
          // First, try to get subscription status from database
          let hasActiveSubscription = false;
          try {
            const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://captioncrafter-vercel.vercel.app'}/api/subscription?userId=${body.userId}`);
            if (subscriptionResponse.ok) {
              const subscriptionData = await subscriptionResponse.json();
              hasActiveSubscription = subscriptionData.subscription?.status === 'active';
              console.log('Database subscription status:', subscriptionData.subscription?.status);
            }
          } catch (error) {
            console.log('Could not fetch subscription from database, using fallback counter');
          }
          
          // Use fallback counter for consistency
          const canGenerate = fallbackCounter.canGenerateCaption(body.userId);
          console.log('Fallback canGenerateCaption:', canGenerate);
          
          // If user has active subscription, override the fallback counter
          if (hasActiveSubscription) {
            console.log('User has active subscription, allowing generation');
            // Update fallback counter to reflect active subscription
            fallbackCounter.upgradeToSubscription(body.userId, 'active');
          } else if (!canGenerate) {
            return NextResponse.json(
              { 
                error: 'Usage limit reached', 
                message: 'You have used all 3 free captions. Please upgrade to continue.',
                canGenerate: false 
              },
              { status: 403 }
            );
          }
          
          // Increment fallback counter (only for free users)
          console.log('Before increment - fallback usage:', fallbackCounter.getUsage(body.userId));
          fallbackCounter.incrementUsage(body.userId);
          console.log('After increment - fallback usage:', fallbackCounter.getUsage(body.userId));
          console.log(`Fallback usage incremented for userId: ${body.userId}`);
        }

    console.log('Starting caption generation...');
    const generator = new CaptionGenerator();
    console.log('CaptionGenerator created, calling generateCaptions...');
    const captions = await generator.generateCaptions(body);
    console.log('Captions generated successfully:', captions.length, 'captions');

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
