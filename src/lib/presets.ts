// Platform presets and configuration constants for CaptionCrafter

import { PlatformConfig } from '@/types';

export const PLATFORM_LIMITS: Record<string, PlatformConfig> = {
  instagram: {
    char_limit: 2200,
    optimal_chars: [125, 2200],
    hashtag_range: [5, 15],
    style: 'conversational',
    cta_friendly: true,
    emoji_friendly: true
  },
  x: {
    char_limit: 240,
    optimal_chars: [50, 240],
    hashtag_range: [1, 4],
    style: 'punchy',
    cta_friendly: true,
    emoji_friendly: true
  },
  tiktok: {
    char_limit: 300,
    optimal_chars: [50, 300],
    hashtag_range: [5, 10],
    style: 'friendly',
    cta_friendly: true,
    emoji_friendly: true
  },
  threads: {
    char_limit: 500,
    optimal_chars: [100, 500],
    hashtag_range: [3, 8],
    style: 'conversational',
    cta_friendly: true,
    emoji_friendly: true
  },
  linkedin: {
    char_limit: 3000,
    optimal_chars: [150, 3000],
    hashtag_range: [3, 5],
    style: 'professional',
    cta_friendly: true,
    emoji_friendly: false
  },
  facebook: {
    char_limit: 63206,
    optimal_chars: [100, 2000],
    hashtag_range: [2, 5],
    style: 'conversational',
    cta_friendly: true,
    emoji_friendly: true
  },
  telegram: {
    char_limit: 4096,
    optimal_chars: [100, 1000],
    hashtag_range: [2, 6],
    style: 'friendly',
    cta_friendly: true,
    emoji_friendly: true
  }
};

export const TONE_PRESETS = [
  'Casual',
  'Professional',
  'Friendly',
  'Motivational',
  'Inspirational',
  'Educational',
  'Humorous',
  'Authoritative',
  'Conversational',
  'Trendy',
  'Authentic',
  'Bold',
  'Warm',
  'Confident',
  'Playful'
];

export const BEST_TIMES: Record<string, string[]> = {
  instagram: [
    '6:00 AM - 9:00 AM',
    '12:00 PM - 2:00 PM', 
    '5:00 PM - 7:00 PM'
  ],
  x: [
    '8:00 AM - 10:00 AM',
    '12:00 PM - 1:00 PM',
    '5:00 PM - 6:00 PM'
  ],
  tiktok: [
    '6:00 AM - 10:00 AM',
    '7:00 PM - 9:00 PM'
  ],
  threads: [
    '7:00 AM - 9:00 AM',
    '12:00 PM - 2:00 PM',
    '6:00 PM - 8:00 PM'
  ],
  linkedin: [
    '8:00 AM - 10:00 AM',
    '12:00 PM - 2:00 PM',
    '5:00 PM - 6:00 PM'
  ],
  facebook: [
    '9:00 AM - 10:00 AM',
    '3:00 PM - 4:00 PM',
    '6:00 PM - 9:00 PM'
  ],
  telegram: [
    '8:00 AM - 10:00 AM',
    '1:00 PM - 3:00 PM',
    '7:00 PM - 9:00 PM'
  ]
};

export const LENGTH_PRESETS: Record<string, Record<string, number>> = {
  instagram: {
    short: 100,
    medium: 300,
    long: 800
  },
  x: {
    short: 50,
    medium: 100,
    long: 200
  },
  tiktok: {
    short: 50,
    medium: 100,
    long: 150
  },
  threads: {
    short: 80,
    medium: 200,
    long: 400
  },
  linkedin: {
    short: 150,
    medium: 500,
    long: 1200
  },
  facebook: {
    short: 100,
    medium: 300,
    long: 800
  },
  telegram: {
    short: 100,
    medium: 300,
    long: 600
  }
};

export function getPlatformConfig(platform: string): PlatformConfig {
  return PLATFORM_LIMITS[platform.toLowerCase()] || PLATFORM_LIMITS.instagram;
}

export function getBestTimes(platform: string): string[] {
  return BEST_TIMES[platform.toLowerCase()] || BEST_TIMES.instagram;
}

export function getLengthPresets(platform: string): Record<string, number> {
  return LENGTH_PRESETS[platform.toLowerCase()] || LENGTH_PRESETS.instagram;
}

export function validatePlatform(platform: string): boolean {
  return platform.toLowerCase() in PLATFORM_LIMITS;
}

export function validateTone(tone: string): boolean {
  return TONE_PRESETS.includes(tone);
}
