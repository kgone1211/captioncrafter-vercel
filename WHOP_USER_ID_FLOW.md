# Whop User ID Flow

## How User IDs Work in CaptionCrafter

### 1. Whop Login
- User logs in via Whop
- Whop provides a user ID (string): `user_gCaSpxjHUnvqn`
- Whop provides email, username, etc.

### 2. Database User Creation (page.tsx)
```typescript
// This happens on page load
dbUserId = await db.upsertUser(
  whopUser.email,        // e.g., "user@example.com"
  whopUser.id,          // e.g., "user_gCaSpxjHUnvqn"
  whopUser.subscription_status,
  whopUser.username
);
```

### 3. What Should Happen
- Supabase should create/update user with Whop ID
- Return the database numeric ID
- This ID is used for caption generation

### 4. What's Actually Happening (Bug)
- If upsertUser fails, code falls back to hashed ID
- Hash: `Math.abs(userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0))`
- Example: "user_gCaSpxjHUnvqn" → hashed to number like 1247

### 5. The Problem
When caption generation happens:
- Uses the hashed fallback ID (e.g., 1247)
- incrementUsage tries to find user with ID 1247
- User doesn't exist in database
- Fails to increment counter
- Paywall doesn't trigger properly

### 6. The Fix
- incrementUsage now creates user if missing
- Uses the ID provided (even if it's a fallback hash)
- Ensures caption generation works even if initial upsert failed

### 7. Proper Solution (TODO)
Need to investigate why db.upsertUser() is failing in production:
- Check Supabase connection
- Check for permission issues
- Ensure email uniqueness constraints aren't blocking
- Add better error logging to upsertUser

### 8. Testing
To test if user is created properly:
```bash
curl "https://captioncrafter-vercel.vercel.app/api/check-user-data?userId=YOUR_ID"
```

Look for:
- `rawUserData` should have whop_user_id
- Should match logged-in Whop user ID
- If null, upsertUser is failing

