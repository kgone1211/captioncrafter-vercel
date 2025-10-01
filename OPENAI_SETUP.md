# OpenAI API Key Setup - CaptionCrafter

## ✅ Issue Identified
Caption generation was failing in production because the `OPENAI_API_KEY` environment variable was missing.

## 🔧 Fix Steps

### Step 1: Add to Vercel (REQUIRED for Production)
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your **captioncrafter-vercel** project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your actual OpenAI API key (starts with `sk-...`)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### Step 2: Redeploy
After adding the environment variable:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Select **Redeploy**
4. Or push a new commit to trigger automatic redeployment

### Step 3: Test
After redeployment:
1. Go to your production app: https://captioncrafter-vercel.vercel.app
2. Try generating a caption
3. It should now work with AI-generated captions!

## 📝 Local Testing
Your local `.env.local` now has the OpenAI key. To test locally:

```bash
cd /Users/zekegonzalez/captioncrafter-vercel
npm run dev
# Open http://localhost:3000
# Test caption generation
```

## 🔍 How It Works

### With OpenAI API Key:
- Uses GPT-3.5-turbo to generate smart, contextual captions
- Better quality and more variety
- Respects tone, length, and platform requirements
- Costs: ~$0.002 per caption generation (very cheap)

### Without OpenAI API Key (Fallback):
- Uses pre-built templates
- Still functional but less varied
- No API costs
- Good for testing

## ⚠️ Important Notes

1. **Keep your OpenAI API key secret** - don't commit it to git
2. The key should start with `sk-...`
3. You can get a key at: https://platform.openai.com/api-keys
4. OpenAI charges per API call (but it's very cheap for this use case)
5. Set usage limits in OpenAI dashboard to avoid unexpected charges

## 💰 Cost Estimate

With GPT-3.5-turbo:
- Input: ~200 tokens per request
- Output: ~300 tokens per request
- Cost: ~$0.002 per caption generation
- 1000 captions = ~$2

## 🐛 Troubleshooting

If captions still don't work after adding the key:

1. **Check Vercel Logs**:
   - Go to Deployments → Click on latest → View Function Logs
   - Look for OpenAI errors

2. **Verify Key is Active**:
   - Go to https://platform.openai.com/api-keys
   - Make sure the key hasn't been revoked

3. **Check OpenAI Account**:
   - Ensure you have credits/billing set up
   - New accounts get $5 free credit

4. **Test Locally First**:
   ```bash
   npm run dev
   # If it works locally but not in production, it's a Vercel env var issue
   ```

Your caption generation should work now once you add the key to Vercel! 🎉

