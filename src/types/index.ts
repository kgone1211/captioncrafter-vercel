// Types for CaptionCrafter

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Caption {
  id: number;
  user_id: number;
  platform: string;
  topic: string;
  tone: string;
  text: string;
  hashtags: string[];
  char_count: number;
  is_favorite: boolean;
  created_at: string;
}

export interface ScheduledPost {
  id: number;
  user_id: number;
  caption_id: number;
  platform: string;
  scheduled_at: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  notify_via: 'None' | 'Email';
  created_at: string;
  caption?: Caption;
  email?: string;
  text?: string;
  hashtags?: string[];
  topic?: string;
  tone?: string;
}

export interface CaptionGenerationRequest {
  platform: string;
  topic: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  num_variants: number;
  keywords?: string;
  cta?: string;
  include_emojis: boolean;
}

export interface CaptionGenerationResponse {
  caption: string;
  hashtags: string[];
  char_count: number;
}

export interface PlatformConfig {
  char_limit: number;
  optimal_chars: [number, number];
  hashtag_range: [number, number];
  style: string;
  cta_friendly: boolean;
  emoji_friendly: boolean;
}

export interface UserStats {
  total_captions: number;
  favorite_captions: number;
  scheduled_posts: number;
  sent_posts: number;
}
