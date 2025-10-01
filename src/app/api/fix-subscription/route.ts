import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fixing subscription for userId:', userId, 'planId:', planId);

    // Update user subscription status to active with the correct plan
    await supabaseDb.upsertUser(
      `user-${userId}@example.com`, // We'll use a placeholder email
      userId.toString(),
      'active',
      'officialkgg', // Your username
      planId || 'plan_cs24bg68DSLES' // Default to Basic plan
    );

    // Get updated usage to verify
    const usage = await supabaseDb.getUserUsage(parseInt(userId));
    
    console.log('Subscription fixed, new usage:', usage);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully',
      usage 
    });
  } catch (error) {
    console.error('Fix subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to fix subscription' },
      { status: 500 }
    );
  }
}
