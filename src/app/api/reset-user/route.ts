import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    // Reset user data in Supabase
    if (userId) {
      const { error } = await supabase
        .from('users')
        .update({
          free_captions_used: 0,
          subscription_status: 'inactive',
          plan_id: null
        })
        .eq('id', userId);

      if (error) {
        console.error('Error resetting user:', error);
        return NextResponse.json(
          { error: 'Failed to reset user', details: error.message },
          { status: 500 }
        );
      }

      // Delete captions and scheduled posts
      await supabase.from('captions').delete().eq('user_id', userId);
      await supabase.from('scheduled_posts').delete().eq('user_id', userId);

      return NextResponse.json({
        success: true,
        message: `User ${userId} has been reset to new user state`,
        userId
      });
    }

    if (email) {
      const { error } = await supabase
        .from('users')
        .update({
          free_captions_used: 0,
          subscription_status: 'inactive',
          plan_id: null
        })
        .eq('email', email);

      if (error) {
        console.error('Error resetting user:', error);
        return NextResponse.json(
          { error: 'Failed to reset user', details: error.message },
          { status: 500 }
        );
      }

      // Get user ID to delete related data
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userData) {
        await supabase.from('captions').delete().eq('user_id', userData.id);
        await supabase.from('scheduled_posts').delete().eq('user_id', userData.id);
      }

      return NextResponse.json({
        success: true,
        message: `User with email ${email} has been reset to new user state`,
        userId: userData?.id
      });
    }

  } catch (error) {
    console.error('Error in reset-user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      );
    }

    // Delete all user data
    if (userId) {
      await supabase.from('captions').delete().eq('user_id', userId);
      await supabase.from('scheduled_posts').delete().eq('user_id', userId);
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
          { error: 'Failed to delete user', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `User ${userId} and all associated data has been deleted`
      });
    }

    if (email) {
      // Get user ID first
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userData) {
        await supabase.from('captions').delete().eq('user_id', userData.id);
        await supabase.from('scheduled_posts').delete().eq('user_id', userData.id);
      }

      const { error } = await supabase.from('users').delete().eq('email', email);

      if (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
          { error: 'Failed to delete user', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `User with email ${email} and all associated data has been deleted`
      });
    }

  } catch (error) {
    console.error('Error in delete user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

