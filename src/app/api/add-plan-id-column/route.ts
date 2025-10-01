import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Adding plan_id column to users table...');

    // Add the plan_id column to the users table
    const { data, error } = await supabase.rpc('add_plan_id_column');

    if (error) {
      console.error('Error adding plan_id column:', error);
      
      // If the RPC doesn't exist, try a direct SQL approach
      // Note: This might not work depending on Supabase permissions
      console.log('RPC failed, trying alternative approach...');
      
      return NextResponse.json({
        success: false,
        error: 'Could not add plan_id column automatically',
        message: 'Please manually add a plan_id column (text) to your users table in Supabase dashboard',
        details: error.message
      });
    }

    console.log('plan_id column added successfully:', data);

    return NextResponse.json({ 
      success: true, 
      message: 'plan_id column added successfully to users table',
      data 
    });
  } catch (error) {
    console.error('Add plan_id column error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add plan_id column',
      message: 'Please manually add a plan_id column (text) to your users table in Supabase dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
