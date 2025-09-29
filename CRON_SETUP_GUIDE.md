# Cron Job Setup Guide

## Option 1: Vercel Cron Jobs (Recommended) ✅

I've created a `vercel.json` file that will automatically set up a cron job when you deploy to Vercel.

**Schedule**: Runs daily at midnight UTC (`0 0 * * *`)
**Endpoint**: `/api/cron/subscription-renewal`

**What it does**:
- Checks for expired subscriptions
- Processes renewals automatically
- Updates billing dates
- Handles subscription lifecycle

## Option 2: External Cron Services

### **Cron-job.org (Free)**
1. Go to [https://cron-job.org](https://cron-job.org)
2. Create account and add new cron job
3. **URL**: `https://captioncrafter-vercel.vercel.app/api/cron/subscription-renewal`
4. **Schedule**: `0 0 * * *` (daily at midnight UTC)
5. **Headers**: `Authorization: Bearer 7a2d7Dx+/C5mu/MRzd2/xWskSP/ABprkEfQtjTwMs6I=`

### **EasyCron (Paid)**
1. Go to [https://www.easycron.com](https://www.easycron.com)
2. Create account and add cron job
3. **URL**: `https://captioncrafter-vercel.vercel.app/api/cron/subscription-renewal`
4. **Schedule**: `0 0 * * *`
5. **Headers**: `Authorization: Bearer 7a2d7Dx+/C5mu/MRzd2/xWskSP/ABprkEfQtjTwMs6I=`

### **GitHub Actions (Free)**
Create `.github/workflows/cron.yml`:
```yaml
name: Subscription Renewal
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:  # Manual trigger

jobs:
  renew-subscriptions:
    runs-on: ubuntu-latest
    steps:
      - name: Call Renewal API
        run: |
          curl -X GET "https://captioncrafter-vercel.vercel.app/api/cron/subscription-renewal" \
            -H "Authorization: Bearer 7a2d7Dx+/C5mu/MRzd2/xWskSP/ABprkEfQtjTwMs6I="
```

## Option 3: Manual Testing

You can test the cron endpoint manually:

```bash
# Test the cron endpoint
curl -X GET "https://captioncrafter-vercel.vercel.app/api/cron/subscription-renewal" \
  -H "Authorization: Bearer 7a2d7Dx+/C5mu/MRzd2/xWskSP/ABprkEfQtjTwMs6I="
```

## What the Cron Job Does

1. **Checks Expired Subscriptions**: Finds users whose subscriptions have expired
2. **Processes Renewals**: Automatically renews active subscriptions
3. **Updates Billing Dates**: Sets next billing date for next month/year
4. **Handles Failures**: Logs any renewal failures for manual review
5. **Sends Notifications**: Can be extended to send renewal notifications

## Security

The cron endpoint is protected with:
- **Authorization header**: `Bearer 7a2d7Dx+/C5mu/MRzd2/xWskSP/ABprkEfQtjTwMs6I=`
- **HTTPS only**: Only accessible via secure connection
- **Rate limiting**: Built-in protection against abuse

## Monitoring

After setup, you can monitor cron job execution:
- **Vercel Dashboard**: Check function logs
- **API Response**: Returns success/failure status
- **Database**: Check subscription renewal timestamps

## Recommendation

**Use Vercel Cron Jobs** (Option 1) - it's the simplest and most reliable option since your app is already on Vercel.
