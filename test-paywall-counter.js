#!/usr/bin/env node

/**
 * Test script to verify the free caption counter and paywall trigger
 * This tests the production API to ensure:
 * 1. Counter starts at 0
 * 2. Increments after each generation
 * 3. Blocks at 3 and shows paywall (403 error)
 */

const BASE_URL = process.env.TEST_URL || 'https://captioncrafter-vercel.vercel.app';

// Test user - you can change this to a real user ID
const TEST_USER_ID = process.env.TEST_USER_ID || 3;

console.log('🧪 Testing CaptionCrafter Paywall System');
console.log('==========================================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test User ID: ${TEST_USER_ID}`);
console.log('');

async function checkUsage() {
  console.log('📊 Checking current usage...');
  try {
    const response = await fetch(`${BASE_URL}/api/usage?userId=${TEST_USER_ID}`);
    const data = await response.json();
    
    console.log('Current usage:', {
      freeCaptionsUsed: data.freeCaptionsUsed,
      subscriptionStatus: data.subscriptionStatus,
      planId: data.planId,
      remaining: 3 - data.freeCaptionsUsed
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error checking usage:', error.message);
    return null;
  }
}

async function generateCaption(attemptNumber) {
  console.log(`\n🎯 Attempt ${attemptNumber}: Generating caption...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        platform: 'instagram',
        topic: `Test Caption ${attemptNumber}`,
        tone: 'Casual',
        length: 'medium',
        num_variants: 1,
        include_emojis: true
      })
    });

    const data = await response.json();

    if (response.status === 403) {
      console.log('🚫 PAYWALL TRIGGERED (403)');
      console.log('Response:', {
        error: data.error,
        message: data.message,
        canGenerate: data.canGenerate
      });
      return { blocked: true, data };
    }

    if (response.ok) {
      console.log('✅ Caption generated successfully');
      console.log('Generated:', data.captions?.[0]?.caption?.substring(0, 50) + '...');
      return { success: true, data };
    }

    console.log('⚠️  Unexpected response:', response.status);
    console.log('Response:', data);
    return { error: true, data };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return { error: true, message: error.message };
  }
}

async function testPaywallFlow() {
  console.log('\n🔍 Starting Paywall Test Flow\n');
  
  // Step 1: Check initial usage
  console.log('Step 1: Check initial usage');
  console.log('─'.repeat(50));
  const initialUsage = await checkUsage();
  
  if (!initialUsage) {
    console.log('\n❌ Failed to get initial usage. Aborting test.');
    return;
  }

  const startingUsage = initialUsage.freeCaptionsUsed || 0;
  console.log(`Starting with ${startingUsage} captions used`);
  console.log(`Should be able to generate ${3 - startingUsage} more captions\n`);

  // Step 2: Generate captions until blocked
  console.log('\nStep 2: Generate captions until paywall triggers');
  console.log('─'.repeat(50));
  
  let attemptNumber = 1;
  let blocked = false;
  const maxAttempts = 5; // Safety limit

  while (!blocked && attemptNumber <= maxAttempts) {
    const result = await generateCaption(attemptNumber);
    
    if (result.blocked) {
      blocked = true;
      console.log('\n✅ Paywall correctly triggered after limit reached!');
      break;
    }
    
    if (result.error) {
      console.log('\n⚠️  Error occurred, checking usage...');
      await checkUsage();
      break;
    }

    // Check usage after each generation
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    await checkUsage();
    
    attemptNumber++;
  }

  // Step 3: Verify final state
  console.log('\n\nStep 3: Final verification');
  console.log('─'.repeat(50));
  const finalUsage = await checkUsage();
  
  if (finalUsage) {
    const totalGenerated = finalUsage.freeCaptionsUsed - startingUsage;
    console.log(`\n📈 Test Results:`);
    console.log(`   - Started with: ${startingUsage} used`);
    console.log(`   - Generated in test: ${totalGenerated} captions`);
    console.log(`   - Final usage: ${finalUsage.freeCaptionsUsed}/3`);
    console.log(`   - Paywall ${blocked ? '✅ WORKING' : '❌ NOT TRIGGERED'}`);
    
    if (blocked && finalUsage.freeCaptionsUsed >= 3) {
      console.log('\n✅ PAYWALL SYSTEM WORKING CORRECTLY!');
    } else if (finalUsage.freeCaptionsUsed >= 3) {
      console.log('\n⚠️  Limit reached but paywall not triggered - check frontend');
    } else {
      console.log('\n⚠️  More testing needed - limit not yet reached');
    }
  }

  console.log('\n==========================================');
  console.log('Test complete!');
}

// Run the test
testPaywallFlow().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});

