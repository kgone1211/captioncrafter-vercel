// Database operations using Vercel Postgres with local fallback

import { sql } from '@vercel/postgres';
import { Caption, ScheduledPost, UserStats } from '@/types';
import { Database as LocalDatabase } from './db-local';
import { supabaseDb } from './supabase';

// Check if we're in local development mode (no database URL)
function isLocalDev(): boolean {
  return !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
}

// Check if Supabase is available
function hasSupabase(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
}

// Use local database for development - create singleton
let localDbInstance: LocalDatabase | null = null;

function getLocalDb(): LocalDatabase {
  if (!localDbInstance) {
    localDbInstance = LocalDatabase.getInstance();
    console.log('Created new LocalDatabase singleton instance');
  } else {
    console.log('Reusing existing LocalDatabase singleton instance');
  }
  return localDbInstance;
}

// Export the local database instance for direct access - create once
export const localDb = (() => {
  if (!localDbInstance) {
    localDbInstance = LocalDatabase.getInstance();
    console.log('Created new LocalDatabase singleton instance for export');
  }
  return localDbInstance;
})();

export class Database {
  private static instance: Database | null = null;

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Use the shared localDb instance
  private get localDb() {
    return getLocalDb();
  }

  async initDatabase(): Promise<void> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    console.log('Database init called. isLocalDev:', localDev, 'hasSupabase:', supabaseAvailable, 'DATABASE_URL:', process.env.DATABASE_URL ? 'present' : 'missing');
    
    if (supabaseAvailable) {
      console.log('Using Supabase database');
      return supabaseDb.initDatabase();
    }
    
    if (localDev) {
      console.log('Using local database');
      return this.localDb.initDatabase();
    }
    
    console.log('Using Vercel Postgres database');
    
    try {
      // Create users table with recurring billing support
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          whop_user_id VARCHAR(255),
          subscription_status VARCHAR(20) DEFAULT 'inactive',
          free_captions_used INTEGER DEFAULT 0,
          plan_id VARCHAR(50),
          billing_cycle VARCHAR(20) DEFAULT 'monthly',
          next_billing_date TIMESTAMP,
          subscription_start_date TIMESTAMP,
          payment_method_id VARCHAR(100),
          whop_subscription_id VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create captions table
      await sql`
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
        )
      `;

      // Create scheduled_posts table
      await sql`
        CREATE TABLE IF NOT EXISTS scheduled_posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          caption_id INTEGER NOT NULL REFERENCES captions(id),
          platform VARCHAR(50) NOT NULL,
          scheduled_at TIMESTAMP NOT NULL,
          status VARCHAR(20) DEFAULT 'DRAFT',
          notify_via VARCHAR(20) DEFAULT 'None',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async upsertUser(
    email: string, 
    whopUserId?: string, 
    subscriptionStatus?: string, 
    username?: string,
    planId?: string,
    billingCycle?: string,
    nextBillingDate?: Date,
    subscriptionStartDate?: Date,
    paymentMethodId?: string,
    whopSubscriptionId?: string
  ): Promise<number> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    console.log('upsertUser called with:', { 
      email, whopUserId, subscriptionStatus, username, planId, billingCycle, 
      nextBillingDate, subscriptionStartDate, paymentMethodId, whopSubscriptionId,
      isLocalDev: localDev, hasSupabase: supabaseAvailable 
    });
    
    if (supabaseAvailable) {
      console.log('Using Supabase for upsertUser');
      return supabaseDb.upsertUser(email, whopUserId, subscriptionStatus, username);
    }
    
    if (localDev) {
      console.log('Using local database for upsertUser');
      return this.localDb.upsertUser(email, whopUserId, subscriptionStatus);
    }
    
    console.log('Using Vercel Postgres for upsertUser');
    
    try {
      // Try to get existing user by email or whop_user_id
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email} OR whop_user_id = ${whopUserId || ''}
      `;

      if (existingUser.rows.length > 0) {
        const userId = existingUser.rows[0].id;
        
        // Update user info with billing fields
        await sql`
          UPDATE users 
          SET 
            whop_user_id = COALESCE(${whopUserId}, whop_user_id),
            subscription_status = COALESCE(${subscriptionStatus}, subscription_status),
            plan_id = COALESCE(${planId}, plan_id),
            billing_cycle = COALESCE(${billingCycle}, billing_cycle),
            next_billing_date = COALESCE(${nextBillingDate?.toISOString()}, next_billing_date),
            subscription_start_date = COALESCE(${subscriptionStartDate?.toISOString()}, subscription_start_date),
            payment_method_id = COALESCE(${paymentMethodId}, payment_method_id),
            whop_subscription_id = COALESCE(${whopSubscriptionId}, whop_subscription_id),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `;
        
        return userId;
      }

      // Create new user with billing fields
      const newUser = await sql`
        INSERT INTO users (
          email, whop_user_id, subscription_status, plan_id, billing_cycle,
          next_billing_date, subscription_start_date, payment_method_id, whop_subscription_id
        ) 
        VALUES (
          ${email}, 
          ${whopUserId || null}, 
          ${subscriptionStatus || 'inactive'},
          ${planId || null},
          ${billingCycle || 'monthly'},
          ${nextBillingDate?.toISOString() || null},
          ${subscriptionStartDate?.toISOString() || null},
          ${paymentMethodId || null},
          ${whopSubscriptionId || null}
        ) 
        RETURNING id
      `;

      return newUser.rows[0].id;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
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
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      console.log('Using Supabase for saveCaption');
      return supabaseDb.saveCaption(userId, platform, topic, tone, text, hashtags, charCount);
    }
    
    if (localDev) {
      return this.localDb.saveCaption(userId, platform, topic, tone, text, hashtags, charCount);
    }

    try {
      const result = await sql`
        INSERT INTO captions (user_id, platform, topic, tone, text, hashtags, char_count)
        VALUES (${userId}, ${platform}, ${topic}, ${tone}, ${text}, ${JSON.stringify(hashtags)}, ${charCount})
        RETURNING id
      `;

      return result.rows[0].id;
    } catch (error) {
      console.error('Error saving caption:', error);
      throw error;
    }
  }

  async listCaptions(
    userId: number,
    platform?: string,
    favoriteOnly?: boolean
  ): Promise<Caption[]> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      // TODO: Implement Supabase listCaptions
      return this.localDb.listCaptions(userId, platform, favoriteOnly);
    }
    
    if (localDev) {
      return this.localDb.listCaptions(userId, platform, favoriteOnly);
    }

    try {
      if (platform && favoriteOnly) {
        const result = await sql`
          SELECT * FROM captions 
          WHERE user_id = ${userId} AND platform = ${platform} AND is_favorite = true
          ORDER BY created_at DESC
        `;
        return result.rows as Caption[];
      } else if (platform) {
        const result = await sql`
          SELECT * FROM captions 
          WHERE user_id = ${userId} AND platform = ${platform}
          ORDER BY created_at DESC
        `;
        return result.rows as Caption[];
      } else if (favoriteOnly) {
        const result = await sql`
          SELECT * FROM captions 
          WHERE user_id = ${userId} AND is_favorite = true
          ORDER BY created_at DESC
        `;
        return result.rows as Caption[];
      } else {
        const result = await sql`
          SELECT * FROM captions 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;
        return result.rows as Caption[];
      }
    } catch (error) {
      console.error('Error listing captions:', error);
      throw error;
    }
  }

  async toggleFavorite(captionId: number): Promise<boolean> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      // TODO: Implement Supabase toggleFavorite
      return this.localDb.toggleFavorite(captionId);
    }
    
    if (localDev) {
      return this.localDb.toggleFavorite(captionId);
    }
    
    try {
      const result = await sql`
        UPDATE captions 
        SET is_favorite = NOT is_favorite 
        WHERE id = ${captionId}
        RETURNING is_favorite
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  async schedulePost(
    userId: number,
    captionId: number,
    platform: string,
    scheduledAt: string,
    notifyVia: string = 'None'
  ): Promise<number> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      console.log('Using Supabase for schedulePost');
      return supabaseDb.schedulePost(userId, captionId, platform, scheduledAt, notifyVia as 'None' | 'Email');
    }
    
    if (localDev) {
      return this.localDb.schedulePost(userId, captionId, platform, scheduledAt, notifyVia as 'None' | 'Email');
    }
    
    try {
      const result = await sql`
        INSERT INTO scheduled_posts (user_id, caption_id, platform, scheduled_at, notify_via)
        VALUES (${userId}, ${captionId}, ${platform}, ${scheduledAt}, ${notifyVia})
        RETURNING id
      `;

      return result.rows[0].id;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  }

  async listScheduledPosts(userId: number, status?: string): Promise<ScheduledPost[]> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      // TODO: Implement Supabase listScheduledPosts
      return this.localDb.listScheduledPosts(userId, status);
    }
    
    if (localDev) {
      return this.localDb.listScheduledPosts(userId, status);
    }
    
    try {
      if (status) {
        const result = await sql`
          SELECT sp.*, c.text, c.hashtags, c.topic, c.tone
          FROM scheduled_posts sp
          JOIN captions c ON sp.caption_id = c.id
          WHERE sp.user_id = ${userId} AND sp.status = ${status}
          ORDER BY sp.scheduled_at ASC
        `;
        return result.rows as ScheduledPost[];
      } else {
        const result = await sql`
          SELECT sp.*, c.text, c.hashtags, c.topic, c.tone
          FROM scheduled_posts sp
          JOIN captions c ON sp.caption_id = c.id
          WHERE sp.user_id = ${userId}
          ORDER BY sp.scheduled_at ASC
        `;
        return result.rows as ScheduledPost[];
      }
    } catch (error) {
      console.error('Error listing scheduled posts:', error);
      throw error;
    }
  }

  async getDuePosts(): Promise<ScheduledPost[]> {
    try {
      const result = await sql`
        SELECT sp.*, c.text, c.hashtags, u.email
        FROM scheduled_posts sp
        JOIN captions c ON sp.caption_id = c.id
        JOIN users u ON sp.user_id = u.id
        WHERE sp.status = 'SCHEDULED' 
        AND sp.scheduled_at <= NOW()
      `;

      return result.rows as ScheduledPost[];
    } catch (error) {
      console.error('Error getting due posts:', error);
      throw error;
    }
  }

  async markPostSent(postId: number): Promise<boolean> {
    try {
      const result = await sql`
        UPDATE scheduled_posts 
        SET status = 'SENT' 
        WHERE id = ${postId}
        RETURNING id
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error marking post as sent:', error);
      throw error;
    }
  }

  async deleteScheduledPost(postId: number): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM scheduled_posts WHERE id = ${postId}
        RETURNING id
      `;

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      throw error;
    }
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      // TODO: Implement Supabase getUserStats
      return this.localDb.getUserStats(userId);
    }
    
    if (localDev) {
      return this.localDb.getUserStats(userId);
    }
    
    try {
      const [totalCaptions, favoriteCaptions, scheduledPosts, sentPosts] = await Promise.all([
        sql`SELECT COUNT(*) FROM captions WHERE user_id = ${userId}`,
        sql`SELECT COUNT(*) FROM captions WHERE user_id = ${userId} AND is_favorite = true`,
        sql`SELECT COUNT(*) FROM scheduled_posts WHERE user_id = ${userId}`,
        sql`SELECT COUNT(*) FROM scheduled_posts WHERE user_id = ${userId} AND status = 'SENT'`
      ]);

      return {
        total_captions: parseInt(totalCaptions.rows[0].count),
        favorite_captions: parseInt(favoriteCaptions.rows[0].count),
        scheduled_posts: parseInt(scheduledPosts.rows[0].count),
        sent_posts: parseInt(sentPosts.rows[0].count)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getUserUsage(userId: number): Promise<{ 
    freeCaptionsUsed: number; 
    subscriptionStatus: string;
    planId?: string;
    billingCycle?: string;
    nextBillingDate?: Date;
    subscriptionStartDate?: Date;
    paymentMethodId?: string;
    whopSubscriptionId?: string;
  }> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    console.log('getUserUsage called with userId:', userId, 'isLocalDev:', localDev, 'hasSupabase:', supabaseAvailable);
    
    if (supabaseAvailable) {
      console.log('Using Supabase for getUserUsage');
      return supabaseDb.getUserUsage(userId);
    }
    
    if (localDev) {
      console.log('Using local database for getUserUsage');
      return this.localDb.getUserUsage(userId);
    }
    
    console.log('Using Vercel Postgres for getUserUsage');

    try {
      const result = await sql`
        SELECT 
          free_captions_used, 
          subscription_status,
          plan_id,
          billing_cycle,
          next_billing_date,
          subscription_start_date,
          payment_method_id,
          whop_subscription_id
        FROM users 
        WHERE id = ${userId}
      `;

      if (result.rows.length === 0) {
        return { freeCaptionsUsed: 0, subscriptionStatus: 'inactive' };
      }

      const row = result.rows[0];
      return {
        freeCaptionsUsed: row.free_captions_used || 0,
        subscriptionStatus: row.subscription_status || 'inactive',
        planId: row.plan_id,
        billingCycle: row.billing_cycle,
        nextBillingDate: row.next_billing_date,
        subscriptionStartDate: row.subscription_start_date,
        paymentMethodId: row.payment_method_id,
        whopSubscriptionId: row.whop_subscription_id
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw error;
    }
  }

  async incrementUsage(userId: number): Promise<void> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      console.log('Using Supabase for incrementUsage');
      return supabaseDb.incrementUsage(userId);
    }
    
    if (localDev) {
      return this.localDb.incrementUsage(userId);
    }

    try {
      await sql`
        UPDATE users 
        SET free_captions_used = free_captions_used + 1 
        WHERE id = ${userId}
      `;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }

  async canGenerateCaption(userId: number): Promise<boolean> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      console.log('Using Supabase for canGenerateCaption');
      return supabaseDb.canGenerateCaption(userId);
    }
    
    if (localDev) {
      return this.localDb.canGenerateCaption(userId);
    }

    try {
      const usage = await this.getUserUsage(userId);
      
      // For now, implement freemium model for ALL users
      // TODO: In the future, check for actual paid subscription status
      // For now, everyone gets 3 free captions regardless of Whop subscription status
      
      // If user has used less than 3 free captions, they can generate more
      return usage.freeCaptionsUsed < 3;
    } catch (error) {
      console.error('Error checking caption generation permission:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<any[]> {
    const localDev = isLocalDev();
    const supabaseAvailable = hasSupabase();
    
    if (supabaseAvailable) {
      return supabaseDb.getAllUsers();
    }
    
    if (localDev) {
      return this.localDb.getAllUsers();
    }
    
    try {
      const result = await sql`SELECT * FROM users ORDER BY created_at DESC`;
      return result.rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}

// Export singleton instance - create once and reuse
let dbInstance: Database | null = null;

export const db = (() => {
  if (!dbInstance) {
    dbInstance = Database.getInstance();
    console.log('Created new Database singleton instance');
  }
  return dbInstance;
})();
