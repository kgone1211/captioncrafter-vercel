-- Supabase Database Schema for CaptionCrafter
-- Run this in your Supabase SQL Editor

-- Create users table with subscription support
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
  username VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create captions table
CREATE TABLE IF NOT EXISTS captions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  tone VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  char_count INTEGER NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption_id INTEGER NOT NULL REFERENCES captions(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT',
  notify_via VARCHAR(20) DEFAULT 'None',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_captions_user_id ON captions(user_id);
CREATE INDEX IF NOT EXISTS idx_captions_platform ON captions(platform);
CREATE INDEX IF NOT EXISTS idx_captions_favorite ON captions(is_favorite);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your security requirements)
-- For now, we'll allow all operations - you can tighten these later
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on captions" ON captions FOR ALL USING (true);
CREATE POLICY "Allow all operations on scheduled_posts" ON scheduled_posts FOR ALL USING (true);

-- Insert a test user (optional)
-- INSERT INTO users (email, whop_user_id, subscription_status, free_captions_used) 
-- VALUES ('test@example.com', 'test_whop_user', 'inactive', 0)
-- ON CONFLICT (email) DO NOTHING;
