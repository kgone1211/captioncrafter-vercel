import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionStatus, planId } = await request.json();
    
    if (!userId || !subscriptionStatus) {
      return NextResponse.json(
        { error: 'User ID and subscription status are required' },
        { status: 400 }
      );
    }

    console.log('Updating subscription for userId:', userId, 'status:', subscriptionStatus, 'planId:', planId);

    // Direct update to Supabase
    const updateData: any = {
      subscription_status: subscriptionStatus
    };
    
    if (planId) {
      updateData.plan_id = planId;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription', details: error.message },
        { status: 500 }
      );
    }

    console.log('Subscription updated successfully:', data);

    // Get updated usage to verify
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('free_captions_used, subscription_status, plan_id')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated user:', fetchError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully',
      user: user || data[0]
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
