#!/usr/bin/env node

/**
 * Reset user to new user state (clears all data)
 * Usage: 
 *   node reset-my-user.js <userId>
 *   node reset-my-user.js <email>
 */

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID or email');
  console.log('Usage: node reset-my-user.js <userId>');
  console.log('   or: node reset-my-user.js <email>');
  process.exit(1);
}

const isEmail = userId.includes('@');
const apiUrl = process.env.API_URL || 'http://localhost:3000';

console.log('🗑️  Resetting user to new user state...');
console.log(`${isEmail ? 'Email' : 'User ID'}: ${userId}`);
console.log('');

async function resetUser() {
  try {
    const response = await fetch(`${apiUrl}/api/reset-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(isEmail ? { email: userId } : { userId: parseInt(userId) })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ User reset successfully!');
      console.log('');
      console.log('Reset details:');
      console.log('  - Free captions used: 0');
      console.log('  - Subscription status: inactive');
      console.log('  - Plan ID: null');
      console.log('  - All captions deleted');
      console.log('  - All scheduled posts deleted');
      console.log('');
      console.log('✨ User is now in fresh/new user state!');
    } else {
      console.error('❌ Failed to reset user');
      console.error('Error:', data.error);
      if (data.details) {
        console.error('Details:', data.details);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetUser();

