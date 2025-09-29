# Recurring Billing System - Environment Variables Setup

## Required Environment Variables

Add these to your `.env.local` file for proper recurring billing:

```env
# Whop Configuration (Required)
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id
WHOP_API_KEY=your_whop_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id

# Cron Job Security (Required for subscription renewals)
CRON_SECRET=your_secure_random_string_here

# Database (Required)
DATABASE_URL=your_vercel_postgres_url
# OR
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Whop Dashboard Setup

### 1. Create Access Passes
- Go to your Whop dashboard
- Navigate to "Access Passes"
- Create access passes for your plans:
  - **Basic Plan**: $19/month
  - **Premium Plan**: $39/month

### 2. Configure Pricing Plans
- Within each access pass, add pricing plans
- Set billing cycle to "Monthly" for recurring payments
- Copy the plan IDs and access pass IDs

### 3. Set Up Webhooks
- Go to "Webhooks" in your Whop dashboard
- Add webhook URL: `https://your-app.vercel.app/api/webhooks`
- Select events:
  - `payment.succeeded`
  - `membership.went_valid`
  - `membership.went_invalid`
- Set webhook secret (use this in `WHOP_WEBHOOK_SECRET`)

## Cron Job Setup

### Option 1: Vercel Cron Jobs
Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/subscription-renewal",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Option 2: External Cron Service
Set up a cron job to call:
```
0 0 * * * curl -X GET "https://your-app.vercel.app/api/cron/subscription-renewal" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Database Migration

The system will automatically create the required database schema with these new columns:
- `plan_id` - The subscription plan ID
- `billing_cycle` - Monthly or yearly billing
- `next_billing_date` - When the next payment is due
- `subscription_start_date` - When the subscription started
- `payment_method_id` - Whop payment method ID
- `whop_subscription_id` - Whop subscription ID

## Testing the System

### 1. Test Subscription Creation
```bash
curl -X POST "http://localhost:3000/api/subscription" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "action": "create", "planId": "premium", "billingCycle": "monthly"}'
```

### 2. Test Subscription Status
```bash
curl "http://localhost:3000/api/subscription?userId=1"
```

### 3. Test Renewal
```bash
curl -X POST "http://localhost:3000/api/subscription" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "action": "renew"}'
```

## What's Now Working

✅ **Recurring Billing**: Monthly/yearly subscription cycles
✅ **Subscription Expiry**: Automatic expiration tracking
✅ **Renewal Notifications**: Shows days until renewal
✅ **Payment Processing**: Proper Whop integration
✅ **Webhook Handling**: Real-time subscription updates
✅ **Database Storage**: Complete billing information
✅ **Cron Jobs**: Automatic renewal processing
✅ **UI Updates**: Shows subscription status and expiry

## Next Steps

1. **Set up Whop access passes** with monthly billing
2. **Configure webhooks** in Whop dashboard
3. **Add environment variables** to your `.env.local`
4. **Set up cron job** for automatic renewals
5. **Test the system** with real payments

Your app now has a complete recurring billing system! 🎉
