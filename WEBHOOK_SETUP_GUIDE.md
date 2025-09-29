# 🔗 Whop Webhook Setup Guide

## 📋 **Step-by-Step Webhook Configuration**

### **Step 1: Access Your Whop Dashboard**
1. Go to [https://whop.com/dashboard](https://whop.com/dashboard)
2. Log in to your account
3. Navigate to your app

### **Step 2: Navigate to Webhooks Section**
1. In your app dashboard, look for **"Webhooks"** or **"Integrations"**
2. Click on **"Add Webhook"** or **"Create Webhook"**

### **Step 3: Configure Webhook Settings**

#### **Webhook URL:**
```
https://captioncrafter-vercel.vercel.app/api/webhooks
```

#### **Events to Subscribe To:**
Select these specific events:
- ✅ `payment.succeeded` - When a payment is completed
- ✅ `membership.went_valid` - When a membership becomes active
- ✅ `membership.went_invalid` - When a membership expires/cancels
- ✅ `membership.created` - When a new membership is created
- ✅ `membership.updated` - When membership details change

#### **Webhook Secret:**
Generate a secure random string (32+ characters). Example:
```
whop_webhook_secret_2024_secure_random_string_xyz789
```

### **Step 4: Test Webhook**
1. After creating the webhook, Whop will send a test event
2. Check your app logs to see if the webhook is received
3. Verify the webhook secret is working

### **Step 5: Environment Variables Setup**

Create a `.env.local` file in your project root with:

```env
# Whop Configuration
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here
WHOP_API_KEY=your_whop_api_key_here
WHOP_WEBHOOK_SECRET=whop_webhook_secret_2024_secure_random_string_xyz789
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id_here

# Access Pass IDs (Your Plans)
NEXT_PUBLIC_BASIC_ACCESS_PASS_ID=prod_OAeju0utHppI2
NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID=prod_xcU9zERSGgyNK

# Cron Job Security
CRON_SECRET=your_secure_random_string_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://captioncrafter-vercel.vercel.app
```

## 🔍 **Finding Your Whop Credentials**

### **App ID & API Key:**
1. Go to your app settings in Whop dashboard
2. Look for **"API Keys"** or **"Credentials"** section
3. Copy your **App ID** and **API Key**

### **Company ID:**
1. In your Whop dashboard, look at the URL
2. It should be something like: `https://whop.com/dashboard/company/biz_XXXXXX`
3. The `biz_XXXXXX` part is your Company ID

### **Agent User ID:**
1. This is usually your own Whop user ID
2. Found in your profile settings or account details

## 🧪 **Testing Your Webhook Setup**

### **Test 1: Check Webhook Endpoint**
```bash
curl -X POST "https://captioncrafter-vercel.vercel.app/api/webhooks" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### **Test 2: Test Subscription Creation**
```bash
curl -X POST "https://captioncrafter-vercel.vercel.app/api/subscription" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "action": "create", "planId": "prod_OAeju0utHppI2", "billingCycle": "monthly"}'
```

### **Test 3: Check Subscription Status**
```bash
curl "https://captioncrafter-vercel.vercel.app/api/subscription?userId=1"
```

## 📊 **Webhook Event Examples**

### **Payment Success Event:**
```json
{
  "action": "payment.succeeded",
  "data": {
    "id": "pay_123456789",
    "final_amount": 1999,
    "currency": "usd",
    "user_id": "12345",
    "plan_id": "prod_OAeju0utHppI2"
  }
}
```

### **Membership Valid Event:**
```json
{
  "action": "membership.went_valid",
  "data": {
    "user_id": "12345",
    "plan_id": "prod_OAeju0utHppI2",
    "status": "active"
  }
}
```

## 🚨 **Troubleshooting**

### **Webhook Not Receiving Events:**
1. Check webhook URL is correct
2. Verify webhook secret matches
3. Ensure your app is deployed and accessible
4. Check Whop dashboard for webhook delivery status

### **Authentication Errors:**
1. Verify all environment variables are set
2. Check API key permissions
3. Ensure webhook secret is correct

### **Database Errors:**
1. Check database connection
2. Verify environment variables for database
3. Check if database schema is created

## ✅ **Verification Checklist**

- [ ] Webhook URL configured in Whop dashboard
- [ ] All required events subscribed
- [ ] Webhook secret generated and set
- [ ] Environment variables configured
- [ ] App deployed and accessible
- [ ] Test webhook received successfully
- [ ] Subscription creation working
- [ ] Payment processing functional

## 🎯 **Next Steps After Setup**

1. **Deploy your app** to Vercel
2. **Test with real payments** using Whop's test mode
3. **Set up cron job** for subscription renewals
4. **Monitor webhook logs** for any issues
5. **Test subscription lifecycle** (create → renew → cancel)

Your webhook is now ready to handle real recurring payments! 🎉
