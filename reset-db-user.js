#!/usr/bin/env node

/**
 * Direct database reset - bypasses API
 * Resets user to new user state
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const userId = process.argv[2];
const isEmail = userId && userId.includes('@');

if (!userId) {
  console.error('❌ Please provide a user ID or email');
  console.log('Usage: node reset-db-user.js <userId>');
  console.log('   or: node reset-db-user.js <email>');
  process.exit(1);
}

console.log('🗑️  Resetting user data directly in database...');
console.log(`${isEmail ? 'Email' : 'User ID'}: ${userId}`);
console.log('');

async function resetUser() {
  try {
    let userIdToReset = userId;

    // If email provided, get user ID first
    if (isEmail) {
      const { data: userData, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userId)
        .single();

      if (lookupError || !userData) {
        console.error('❌ User not found with email:', userId);
        return;
      }

      userIdToReset = userData.id;
      console.log(`Found user ID: ${userIdToReset}`);
    }

    // Delete captions
    const { error: captionsError } = await supabase
      .from('captions')
      .delete()
      .eq('user_id', userIdToReset);

    if (captionsError) {
      console.warn('⚠️  Error deleting captions:', captionsError.message);
    } else {
      console.log('✅ Deleted all captions');
    }

    // Delete scheduled posts
    const { error: postsError } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('user_id', userIdToReset);

    if (postsError) {
      console.warn('⚠️  Error deleting scheduled posts:', postsError.message);
    } else {
      console.log('✅ Deleted all scheduled posts');
    }

    // Reset user data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        free_captions_used: 0,
        subscription_status: 'inactive',
        plan_id: null
      })
      .eq('id', userIdToReset);

    if (updateError) {
      console.error('❌ Error resetting user:', updateError.message);
      return;
    }

    console.log('✅ Reset user data');
    console.log('');
    console.log('User state:');
    console.log('  - Free captions used: 0');
    console.log('  - Subscription status: inactive');
    console.log('  - Plan ID: null');
    console.log('  - All captions: deleted');
    console.log('  - All scheduled posts: deleted');
    console.log('');
    console.log('✨ User is now in fresh/new user state!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetUser();

