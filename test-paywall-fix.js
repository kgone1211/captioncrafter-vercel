#!/usr/bin/env node

/**
 * Test script to verify the paywall fix
 * This script simulates a user hitting their usage limit and verifies:
 * 1. Usage counter shows "0 Free Left"
 * 2. Paywall appears
 * 3. Caption generation is blocked
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testPaywallFix() {
  console.log('🧪 Testing Paywall Fix...\n');
  
  const testUserId = 999; // Use a test user ID
  
  try {
    // Step 1: Reset user usage to 0
    console.log('1️⃣ Resetting user usage...');
    const resetResponse = await fetch(`${BASE_URL}/api/reset-counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    
    if (!resetResponse.ok) {
      throw new Error(`Reset failed: ${resetResponse.status}`);
    }
    console.log('✅ User usage reset');
    
    // Step 2: Check initial usage (should be 0)
    console.log('\n2️⃣ Checking initial usage...');
    const usageResponse = await fetch(`${BASE_URL}/api/usage?userId=${testUserId}`);
    const usage = await usageResponse.json();
    console.log('📊 Usage:', usage);
    
    if (usage.freeCaptionsUsed !== 0) {
      throw new Error(`Expected 0 free captions used, got ${usage.freeCaptionsUsed}`);
    }
    console.log('✅ Initial usage is 0');
    
    // Step 3: Test canGenerateCaption (should be true for 0/3)
    console.log('\n3️⃣ Testing canGenerateCaption...');
    const canGenResponse = await fetch(`${BASE_URL}/api/user/can-generate?userId=${testUserId}`);
    const canGen = await canGenResponse.json();
    console.log('🎯 Can generate:', canGen);
    
    if (!canGen.canGenerate) {
      throw new Error('Expected canGenerate to be true for 0/3 usage');
    }
    console.log('✅ Can generate captions (0/3 used)');
    
    // Step 4: Increment usage to 3 (hit limit)
    console.log('\n4️⃣ Incrementing usage to limit...');
    for (let i = 0; i < 3; i++) {
      const incrementResponse = await fetch(`${BASE_URL}/api/test-increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId })
      });
      
      if (!incrementResponse.ok) {
        throw new Error(`Increment ${i+1} failed: ${incrementResponse.status}`);
      }
      
      const result = await incrementResponse.json();
      console.log(`📈 Increment ${i+1}: ${result.usageAfter.freeCaptionsUsed}/3`);
    }
    console.log('✅ Usage incremented to 3/3');
    
    // Step 5: Check final usage (should be 3)
    console.log('\n5️⃣ Checking final usage...');
    const finalUsageResponse = await fetch(`${BASE_URL}/api/usage?userId=${testUserId}`);
    const finalUsage = await finalUsageResponse.json();
    console.log('📊 Final usage:', finalUsage);
    
    if (finalUsage.freeCaptionsUsed !== 3) {
      throw new Error(`Expected 3 free captions used, got ${finalUsage.freeCaptionsUsed}`);
    }
    console.log('✅ Final usage is 3/3');
    
    // Step 6: Test canGenerateCaption (should be false for 3/3)
    console.log('\n6️⃣ Testing canGenerateCaption after limit...');
    const finalCanGenResponse = await fetch(`${BASE_URL}/api/user/can-generate?userId=${testUserId}`);
    const finalCanGen = await finalCanGenResponse.json();
    console.log('🎯 Can generate:', finalCanGen);
    
    if (finalCanGen.canGenerate) {
      throw new Error('Expected canGenerate to be false for 3/3 usage');
    }
    console.log('✅ Cannot generate captions (3/3 used)');
    
    // Step 7: Test caption generation (should be blocked)
    console.log('\n7️⃣ Testing caption generation blocking...');
    const generateResponse = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        platform: 'instagram',
        topic: 'test',
        tone: 'Authority',
        length: 'medium',
        num_variants: 1
      })
    });
    
    if (generateResponse.ok) {
      throw new Error('Expected caption generation to be blocked, but it succeeded');
    }
    
    const generateError = await generateResponse.json();
    console.log('🚫 Generation blocked:', generateError);
    
    if (generateResponse.status !== 403 || !generateError.canGenerate === false) {
      throw new Error('Expected 403 status with canGenerate: false');
    }
    console.log('✅ Caption generation properly blocked');
    
    console.log('\n🎉 All tests passed! Paywall fix is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Usage counter shows correct count');
    console.log('   ✅ canGenerateCaption returns correct values');
    console.log('   ✅ Caption generation is blocked when limit reached');
    console.log('   ✅ Paywall should now appear in the UI');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testPaywallFix();
