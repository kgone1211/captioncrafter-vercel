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
    
    // Create users table
    const { error: usersError } = await supabase.rpc('create_users_table_if_not_exists');
    if (usersError) {
      console.log('Users table might already exist or error creating:', usersError.message);
    }

    // Create captions table
    const { error: captionsError } = await supabase.rpc('create_captions_table_if_not_exists');
    if (captionsError) {
      console.log('Captions table might already exist or error creating:', captionsError.message);
    }

    // Create scheduled_posts table
    const { error: postsError } = await supabase.rpc('create_scheduled_posts_table_if_not_exists');
    if (postsError) {
      console.log('Scheduled posts table might already exist or error creating:', postsError.message);
    }

    console.log('Supabase database initialization completed');
  }

  async upsertUser(email: string, whopUserId?: string, subscriptionStatus?: string): Promise<number> {
    console.log('Supabase upsertUser called with:', { email, whopUserId, subscriptionStatus });

    try {
      // Check if user exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
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
      const { error } = await supabase.rpc('increment_user_usage', {
        user_id: userId
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        throw error;
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
