import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

console.log('Supabase configuration check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  url: supabaseUrl ? 'present' : 'missing',
  key: supabaseKey ? 'present' : 'missing',
  usingServiceRole: !!(process.env.SUPABASE_SERVICE_ROLE_KEY)
});

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

  async upsertUser(email: string, whopUserId?: string, subscriptionStatus?: string, username?: string, planId?: string): Promise<number> {
    console.log('Supabase upsertUser called with:', { email, whopUserId, subscriptionStatus, username, planId });

    try {
      // Check if user exists by email
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id, whop_user_id, subscription_status')
        .eq('email', email)
        .single();

      if (existingUser && !selectError) {
        console.log('Found existing user:', existingUser);
        
        // Update user if needed
        if (whopUserId || subscriptionStatus || planId) {
          const updateData: any = {};
          if (whopUserId) updateData.whop_user_id = whopUserId;
          if (subscriptionStatus) updateData.subscription_status = subscriptionStatus;
          if (planId) updateData.plan_id = planId;
          if (username) updateData.username = username;
          
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('Error updating user:', updateError);
          }
        }
        
        return existingUser.id;
      }

      // Create new user only if not found
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email,
          whop_user_id: whopUserId,
          subscription_status: subscriptionStatus || 'inactive',
          plan_id: planId,
          username: username,
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

  async getUserUsage(userId: number): Promise<{ freeCaptionsUsed: number; subscriptionStatus: string; planId?: string }> {
    console.log('Supabase getUserUsage called with userId:', userId);

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('free_captions_used, subscription_status, plan_id')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.log('User not found, returning default usage');
        return { freeCaptionsUsed: 0, subscriptionStatus: 'inactive' };
      }

      console.log('Supabase usage result:', user);
      return {
        freeCaptionsUsed: user.free_captions_used || 0,
        subscriptionStatus: user.subscription_status || 'inactive',
        planId: user.plan_id
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

  async canGenerateCaption(userId: number): Promise<boolean> {
    console.log('Supabase canGenerateCaption called with userId:', userId);
    try {
      const usage = await this.getUserUsage(userId);
      console.log('Usage for canGenerateCaption:', usage);
      
      // Check if user has an active subscription
      if (usage.subscriptionStatus === 'active') {
        console.log('User has active subscription - unlimited captions');
        return true;
      }
      
      // For free users, check usage limit
      const canGenerate = usage.freeCaptionsUsed < 3;
      console.log('Can generate caption:', canGenerate, '(used:', usage.freeCaptionsUsed, '/3)');
      console.log('Supabase canGenerateCaption:', canGenerate);
      return canGenerate;
    } catch (error) {
      console.error('Supabase canGenerateCaption error:', error);
      return false;
    }
  }

  async saveCaption(
    userId: number,
    platform: string,
    topic: string,
    tone: string,
    text: string,
    hashtags: string[],
    charCount: number
  ): Promise<number> {
    console.log('Supabase saveCaption called with:', { userId, platform, topic, tone, charCount });
    
    try {
      const { data, error } = await supabase
        .from('captions')
        .insert({
          user_id: userId,
          platform,
          topic,
          tone,
          text,
          hashtags: JSON.stringify(hashtags),
          char_count: charCount
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving caption:', error);
        throw error;
      }

      console.log('Supabase saveCaption result:', data);
      return data.id;
    } catch (error) {
      console.error('Supabase saveCaption error:', error);
      throw error;
    }
  }

  async schedulePost(
    userId: number,
    captionId: number,
    platform: string,
    scheduledAt: string,
    notifyVia: string
  ): Promise<number> {
    console.log('Supabase schedulePost called with:', { userId, captionId, platform, scheduledAt, notifyVia });
    
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: userId,
          caption_id: captionId,
          platform,
          scheduled_at: scheduledAt,
          notify_via: notifyVia,
          status: 'scheduled'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error scheduling post:', error);
        throw error;
      }

      console.log('Supabase schedulePost result:', data);
      return data.id;
    } catch (error) {
      console.error('Supabase schedulePost error:', error);
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

  async clearDatabase(): Promise<{ success: boolean; message: string; errors?: string[] }> {
    console.log('Clearing Supabase database...');
    const errors: string[] = [];
    
    try {
      // Clear all tables in order (respecting foreign key constraints)
      const { error: captionsError } = await supabase
        .from('captions')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (captionsError) {
        console.log('Error clearing captions (might not exist):', captionsError.message);
        errors.push(`Captions: ${captionsError.message}`);
      } else {
        console.log('Captions table cleared');
      }

      const { error: scheduledError } = await supabase
        .from('scheduled_posts')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (scheduledError) {
        console.log('Error clearing scheduled_posts (might not exist):', scheduledError.message);
        errors.push(`Scheduled posts: ${scheduledError.message}`);
      } else {
        console.log('Scheduled posts table cleared');
      }

      const { error: usersError } = await supabase
        .from('users')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (usersError) {
        console.log('Error clearing users:', usersError.message);
        errors.push(`Users: ${usersError.message}`);
        return { success: false, message: 'Failed to clear users table', errors };
      } else {
        console.log('Users table cleared');
      }

      return { 
        success: true, 
        message: 'Supabase database cleared successfully',
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Supabase clearDatabase error:', error);
      return { 
        success: false, 
        message: 'Failed to clear database', 
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

export const supabaseDb = new SupabaseDatabase();
