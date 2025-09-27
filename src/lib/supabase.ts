import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not found. Using fallback configuration.');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseKey || 'your-anon-key'
)

// Database helper functions
export class SupabaseDatabase {
  async initDatabase(): Promise<void> {
    console.log('Initializing Supabase database...');
    
    // For now, we'll assume the tables exist or will be created manually
    // In a production setup, you would run these SQL commands in the Supabase SQL editor:
    /*
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      whop_user_id VARCHAR(255),
      subscription_status VARCHAR(20) DEFAULT 'inactive',
      free_captions_used INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS captions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      platform VARCHAR(50) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      tone VARCHAR(100) NOT NULL,
      text TEXT NOT NULL,
      hashtags TEXT[] NOT NULL,
      char_count INTEGER NOT NULL,
      is_favorite BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      caption_id INTEGER NOT NULL REFERENCES captions(id),
      platform VARCHAR(50) NOT NULL,
      scheduled_at TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      notify_via VARCHAR(20) DEFAULT 'None',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    */
    
    console.log('Supabase database initialization completed (tables should be created manually)');
  }

  async upsertUser(email: string, whopUserId?: string, subscriptionStatus?: string): Promise<number> {
    console.log('Supabase upsertUser called with:', { email, whopUserId, subscriptionStatus });

    try {
      // Check if user exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id, whop_user_id, subscription_status')
        .or(`email.eq.${email}${whopUserId ? `,whop_user_id.eq.${whopUserId}` : ''}`)
        .single();

      if (existingUser && !selectError) {
        console.log('Found existing user:', existingUser);
        
        // Update user if needed
        if (whopUserId || subscriptionStatus) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              whop_user_id: whopUserId || existingUser.whop_user_id,
              subscription_status: subscriptionStatus || existingUser.subscription_status
            })
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('Error updating user:', updateError);
          }
        }
        
        return existingUser.id;
      }

      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email,
          whop_user_id: whopUserId,
          subscription_status: subscriptionStatus || 'inactive',
          free_captions_used: 0
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }

      console.log('Created new user with ID:', newUser.id);
      return newUser.id;
    } catch (error) {
      console.error('Supabase upsertUser error:', error);
      throw error;
    }
  }

  async getUserUsage(userId: number): Promise<{ freeCaptionsUsed: number; subscriptionStatus: string }> {
    console.log('Supabase getUserUsage called with userId:', userId);

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('free_captions_used, subscription_status')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.log('User not found, returning default usage');
        return { freeCaptionsUsed: 0, subscriptionStatus: 'inactive' };
      }

      console.log('Supabase usage result:', user);
      return {
        freeCaptionsUsed: user.free_captions_used || 0,
        subscriptionStatus: user.subscription_status || 'inactive'
      };
    } catch (error) {
      console.error('Supabase getUserUsage error:', error);
      return { freeCaptionsUsed: 0, subscriptionStatus: 'inactive' };
    }
  }

  async incrementUsage(userId: number): Promise<void> {
    console.log('Supabase incrementUsage called with userId:', userId);

    try {
      // First get current usage
      const { data: user, error: selectError } = await supabase
        .from('users')
        .select('free_captions_used')
        .eq('id', userId)
        .single();

      if (selectError || !user) {
        console.error('Error getting user for increment:', selectError);
        throw selectError || new Error('User not found');
      }

      // Increment usage
      const { error: updateError } = await supabase
        .from('users')
        .update({
          free_captions_used: (user.free_captions_used || 0) + 1
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error incrementing usage:', updateError);
        throw updateError;
      }

      console.log('Usage incremented successfully');
    } catch (error) {
      console.error('Supabase incrementUsage error:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all users:', error);
        return [];
      }

      console.log('Supabase getAllUsers result:', users);
      return users || [];
    } catch (error) {
      console.error('Supabase getAllUsers error:', error);
      return [];
    }
  }
}

export const supabaseDb = new SupabaseDatabase();
