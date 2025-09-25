// Local development database using in-memory storage
// This is a fallback when Vercel Postgres is not available

import { Caption, ScheduledPost, UserStats } from '@/types';

// In-memory storage for local development
const users: Array<{ id: number; email: string; created_at: string }> = [];
const captions: Array<Caption> = [];
const scheduledPosts: Array<ScheduledPost> = [];
let nextUserId = 1;
let nextCaptionId = 1;
let nextPostId = 1;

export class Database {
  async initDatabase(): Promise<void> {
    // No-op for local development
    console.log('Using in-memory database for local development');
  }

  async upsertUser(email: string): Promise<number> {
    try {
      // Check if user already exists
      const existingUser = users.find(user => user.email === email);
      
      if (existingUser) {
        return existingUser.id;
      }

      // Create new user
      const newUser = {
        id: nextUserId++,
        email,
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
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
        id: nextCaptionId++,
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
      
      captions.push(newCaption);
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
      let filteredCaptions = captions.filter(caption => caption.user_id === userId);
      
      if (platform) {
        filteredCaptions = filteredCaptions.filter(caption => caption.platform === platform);
      }
      
      if (favoriteOnly) {
        filteredCaptions = filteredCaptions.filter(caption => caption.is_favorite);
      }
      
      return filteredCaptions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error listing captions:', error);
      throw error;
    }
  }

  async toggleFavorite(captionId: number): Promise<boolean> {
    try {
      const caption = captions.find(c => c.id === captionId);
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
      const caption = captions.find(c => c.id === captionId);
      if (!caption) {
        throw new Error('Caption not found');
      }

      const newPost: ScheduledPost = {
        id: nextPostId++,
        user_id: userId,
        caption_id: captionId,
        platform,
        scheduled_at: scheduledAt,
        status: 'SCHEDULED',
        notify_via: notifyVia,
        created_at: new Date().toISOString(),
        caption: caption, // Include caption data
        email: users.find(u => u.id === userId)?.email,
        text: caption.text,
        hashtags: caption.hashtags,
        topic: caption.topic,
        tone: caption.tone,
      };
      
      scheduledPosts.push(newPost);
      return newPost.id;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  }

  async listScheduledPosts(userId: number, status?: string): Promise<ScheduledPost[]> {
    try {
      let filteredPosts = scheduledPosts.filter(post => post.user_id === userId);
      
      if (status) {
        filteredPosts = filteredPosts.filter(post => post.status === status);
      }
      
      // Join with caption data
      const postsWithCaptions = filteredPosts.map(post => {
        const caption = captions.find(c => c.id === post.caption_id);
        return {
          ...post,
          text: caption?.text,
          hashtags: caption?.hashtags,
          topic: caption?.topic,
          tone: caption?.tone
        };
      });
      
      return postsWithCaptions.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    } catch (error) {
      console.error('Error listing scheduled posts:', error);
      throw error;
    }
  }

  async markPostSent(postId: number): Promise<boolean> {
    try {
      const post = scheduledPosts.find(p => p.id === postId);
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
      const index = scheduledPosts.findIndex(p => p.id === postId);
      if (index !== -1) {
        scheduledPosts.splice(index, 1);
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
      const userCaptions = captions.filter(c => c.user_id === userId);
      const userScheduledPosts = scheduledPosts.filter(p => p.user_id === userId);
      
      return {
        total_captions: userCaptions.length,
        scheduled_posts: userScheduledPosts.filter(p => p.status === 'SCHEDULED').length,
        sent_posts: userScheduledPosts.filter(p => p.status === 'SENT').length,
        favorite_captions: userCaptions.filter(c => c.is_favorite).length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}
