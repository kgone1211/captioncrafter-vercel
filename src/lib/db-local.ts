// Local development database using in-memory storage
// This is a fallback when Vercel Postgres is not available

import { Caption, ScheduledPost, UserStats } from '@/types';

// Global in-memory storage for local development
// Use globalThis to ensure data persists across different execution contexts
const globalData = globalThis as any;

if (!globalData.__captionCrafterDb) {
  globalData.__captionCrafterDb = {
    users: [],
    captions: [],
    scheduledPosts: [],
    nextUserId: 1,
    nextCaptionId: 1,
    nextPostId: 1
  };
  console.log('Global database initialized');
}

const { users, captions, scheduledPosts, nextUserId, nextCaptionId, nextPostId } = globalData.__captionCrafterDb;

// Create singleton instance - global
let databaseInstance: Database | null = null;

export class Database {
  static getInstance(): Database {
    if (!databaseInstance) {
      databaseInstance = new Database();
      console.log('Created new LocalDatabase singleton instance');
    } else {
      console.log('Reusing existing LocalDatabase singleton instance');
    }
    return databaseInstance;
  }

  // Ensure we always use the same global data
  private get globalData() {
    return globalData;
  }

  async initDatabase(): Promise<void> {
    // No-op for local development
    console.log('Using in-memory database for local development');
  }

  async getAllUsers(): Promise<any[]> {
    try {
      console.log('getAllUsers called, returning all users:', this.globalData.__captionCrafterDb.users);
      return this.globalData.__captionCrafterDb.users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async upsertUser(email: string, whopUserId?: string, subscriptionStatus?: string): Promise<number> {
    try {
      console.log('upsertUser called with:', { email, whopUserId, subscriptionStatus });
      
      // Check if user already exists by email or whop_user_id
      const existingUser = this.globalData.__captionCrafterDb.users.find((user: any) => 
        user.email === email || (whopUserId && user.whop_user_id === whopUserId)
      );
      
      if (existingUser) {
        console.log('Found existing user:', existingUser);
        // Update user info if provided
        if (whopUserId) existingUser.whop_user_id = whopUserId;
        if (subscriptionStatus) existingUser.subscription_status = subscriptionStatus;
        console.log('Updated user:', existingUser);
        return existingUser.id;
      }

      // Create new user
      const newUser = {
        id: this.globalData.__captionCrafterDb.nextUserId++,
        email,
        whop_user_id: whopUserId,
        subscription_status: subscriptionStatus || 'inactive',
        free_captions_used: 0,
        created_at: new Date().toISOString()
      };
      
      console.log('Creating new user:', newUser);
      this.globalData.__captionCrafterDb.users.push(newUser);
      console.log('All users:', this.globalData.__captionCrafterDb.users);
      return newUser.id;
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
    try {
      const newCaption: Caption = {
        id: this.globalData.__captionCrafterDb.nextCaptionId++,
        user_id: userId,
        platform,
        topic,
        tone,
        text,
        hashtags,
        char_count: charCount,
        is_favorite: false,
        created_at: new Date().toISOString()
      };
      
      this.globalData.__captionCrafterDb.captions.push(newCaption);
      return newCaption.id;
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
    try {
      let filteredCaptions = this.globalData.__captionCrafterDb.captions.filter((caption: any) => caption.user_id === userId);
      
      if (platform) {
        filteredCaptions = filteredCaptions.filter((caption: any) => caption.platform === platform);
      }
      
      if (favoriteOnly) {
        filteredCaptions = filteredCaptions.filter((caption: any) => caption.is_favorite);
      }
      
      return filteredCaptions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error listing captions:', error);
      throw error;
    }
  }

  async toggleFavorite(captionId: number): Promise<boolean> {
    try {
      const caption = this.globalData.__captionCrafterDb.captions.find((c: any) => c.id === captionId);
      if (caption) {
        caption.is_favorite = !caption.is_favorite;
        return true;
      }
      return false;
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
    notifyVia: 'None' | 'Email' = 'None'
  ): Promise<number> {
    try {
      const caption = this.globalData.__captionCrafterDb.captions.find((c: any) => c.id === captionId);
      if (!caption) {
        throw new Error('Caption not found');
      }

      const newPost: ScheduledPost = {
        id: this.globalData.__captionCrafterDb.nextPostId++,
        user_id: userId,
        caption_id: captionId,
        platform,
        scheduled_at: scheduledAt,
        status: 'SCHEDULED',
        notify_via: notifyVia,
        created_at: new Date().toISOString(),
        caption: caption, // Include caption data
        email: this.globalData.__captionCrafterDb.users.find((u: any) => u.id === userId)?.email,
        text: caption.text,
        hashtags: caption.hashtags,
        topic: caption.topic,
        tone: caption.tone,
      };
      
      this.globalData.__captionCrafterDb.scheduledPosts.push(newPost);
      return newPost.id;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  }

  async listScheduledPosts(userId: number, status?: string): Promise<ScheduledPost[]> {
    try {
      let filteredPosts = this.globalData.__captionCrafterDb.scheduledPosts.filter((post: any) => post.user_id === userId);
      
      if (status) {
        filteredPosts = filteredPosts.filter((post: any) => post.status === status);
      }
      
      // Join with caption data
      const postsWithCaptions = filteredPosts.map((post: any) => {
        const caption = this.globalData.__captionCrafterDb.captions.find((c: any) => c.id === post.caption_id);
        return {
          ...post,
          text: caption?.text,
          hashtags: caption?.hashtags,
          topic: caption?.topic,
          tone: caption?.tone
        };
      });
      
      return postsWithCaptions.sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    } catch (error) {
      console.error('Error listing scheduled posts:', error);
      throw error;
    }
  }

  async markPostSent(postId: number): Promise<boolean> {
    try {
      const post = this.globalData.__captionCrafterDb.scheduledPosts.find((p: any) => p.id === postId);
      if (post) {
        post.status = 'SENT';
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking post as sent:', error);
      throw error;
    }
  }

  async deleteScheduledPost(postId: number): Promise<boolean> {
    try {
      const index = this.globalData.__captionCrafterDb.scheduledPosts.findIndex((p: any) => p.id === postId);
      if (index !== -1) {
        this.globalData.__captionCrafterDb.scheduledPosts.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      throw error;
    }
  }

  async getUserStats(userId: number): Promise<UserStats> {
    try {
      const userCaptions = this.globalData.__captionCrafterDb.captions.filter((c: any) => c.user_id === userId);
      const userScheduledPosts = this.globalData.__captionCrafterDb.scheduledPosts.filter((p: any) => p.user_id === userId);
      
      return {
        total_captions: userCaptions.length,
        scheduled_posts: userScheduledPosts.filter((p: any) => p.status === 'SCHEDULED').length,
        sent_posts: userScheduledPosts.filter((p: any) => p.status === 'SENT').length,
        favorite_captions: userCaptions.filter((c: any) => c.is_favorite).length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getUserUsage(userId: number): Promise<{ freeCaptionsUsed: number; subscriptionStatus: string }> {
    try {
      console.log('getUserUsage called with userId:', userId);
      console.log('All users in getUserUsage:', this.globalData.__captionCrafterDb.users);
      const user = this.globalData.__captionCrafterDb.users.find((u: any) => u.id === userId);
      console.log('Found user:', user);
      if (!user) {
        console.log('User not found, returning default');
        return { freeCaptionsUsed: 0, subscriptionStatus: 'inactive' };
      }

      const result = {
        freeCaptionsUsed: user.free_captions_used,
        subscriptionStatus: user.subscription_status
      };
      console.log('Returning usage:', result);
      return result;
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw error;
    }
  }

  async incrementUsage(userId: number): Promise<void> {
    try {
      const user = this.globalData.__captionCrafterDb.users.find((u: any) => u.id === userId);
      if (user) {
        user.free_captions_used++;
        console.log(`User ${userId} usage incremented to: ${user.free_captions_used}`);
      } else {
        console.warn(`User ${userId} not found for usage increment.`);
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }

  async canGenerateCaption(userId: number): Promise<boolean> {
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

}
