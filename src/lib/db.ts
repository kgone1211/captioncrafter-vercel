// Database operations using Vercel Postgres with local fallback

import { sql } from '@vercel/postgres';
import { Caption, ScheduledPost, UserStats } from '@/types';
import { Database as LocalDatabase } from './db-local';

// Check if we're in local development mode (no Vercel Postgres)
const isLocalDev = !process.env.POSTGRES_URL || process.env.POSTGRES_URL.includes('localhost');

// Use local database for development
const localDb = new LocalDatabase();

export class Database {
  async initDatabase(): Promise<void> {
    if (isLocalDev) {
      return localDb.initDatabase();
    }
    
    try {
      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  async upsertUser(email: string): Promise<number> {
    if (isLocalDev) {
      return localDb.upsertUser(email);
    }
    
    try {
      // Try to get existing user
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (existingUser.rows.length > 0) {
        return existingUser.rows[0].id;
      }

      // Create new user
      const newUser = await sql`
        INSERT INTO users (email) VALUES (${email}) RETURNING id
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
    if (isLocalDev) {
      return localDb.saveCaption(userId, platform, topic, tone, text, hashtags, charCount);
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
    if (isLocalDev) {
      return localDb.listCaptions(userId, platform, favoriteOnly);
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
    if (isLocalDev) {
      return localDb.toggleFavorite(captionId);
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
    if (isLocalDev) {
      return localDb.schedulePost(userId, captionId, platform, scheduledAt, notifyVia as 'None' | 'Email');
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
    if (isLocalDev) {
      return localDb.getUserStats(userId);
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
}
