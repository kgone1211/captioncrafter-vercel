# 🎯 CaptionCrafter - Vercel Edition

**AI-powered social media caption generator with smart scheduling - Built for Vercel**

CaptionCrafter is a modern, serverless application that helps content creators generate engaging social media captions using AI, schedule posts, and manage their content calendar. Built with Next.js and optimized for Vercel deployment.

## ✨ Features

- 🤖 **AI-Powered Caption Generation** - Uses OpenAI GPT-3.5 for intelligent, platform-optimized captions
- 📱 **Multi-Platform Support** - Optimized for Instagram, X (Twitter), and TikTok
- 📅 **Smart Scheduling** - Schedule posts with Vercel Cron jobs
- 🎨 **Multiple Tones** - From ECA to Savage, Warm Coach, and more
- 📚 **Caption Library** - Save, organize, and favorite your best captions
- 📊 **Real-time Stats** - Track your content creation progress
- 🔔 **Email Notifications** - Get reminded when posts are ready (optional)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Vercel account

### Local Development

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd captioncrafter-vercel
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Set up Vercel Postgres**
   - Go to Vercel Dashboard
   - Add Postgres database
   - Copy connection strings to environment variables

3. **Configure environment variables**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add POSTGRES_URL
   vercel env add CRON_SECRET
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

## ⚙️ Configuration

### Required Environment Variables

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Vercel Postgres (Required)
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_prisma_url_here
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling_here
POSTGRES_USER=your_postgres_user_here
POSTGRES_HOST=your_postgres_host_here
POSTGRES_PASSWORD=your_postgres_password_here
POSTGRES_DATABASE=your_postgres_database_here

# Cron Job Security (Required)
CRON_SECRET=your_random_secret_string_here

# Whop Integration (Required for Whop deployment)
WHOP_API_KEY=your_whop_api_key_here
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id
```

### Optional Environment Variables

```env
# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

## 🏗️ Architecture

### Frontend
- **Next.js 15** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **API Routes** for serverless functions
- **Vercel Postgres** for database
- **Vercel Cron** for scheduled jobs
- **OpenAI API** for AI generation

### Key Components
- `CaptionGenerator` - AI caption generation interface
- `ContentCalendar` - Post scheduling and management
- `CaptionLibrary` - Saved captions organization
- `UserLogin` - Simple email-based authentication

## 📱 Usage

### 1. Login
- Enter your email address (no password required)
- Simple authentication system

### 2. Generate Captions
- Choose platform (Instagram, X, TikTok)
- Enter topic/niche
- Select tone and length
- Generate 1-20 caption variants
- Add optional keywords and CTAs

### 3. Manage Content
- Save captions to your library
- Schedule posts with date/time
- Set up email notifications
- Track your content statistics

### 4. Export & Analytics
- View content calendar
- Track posting schedule
- Monitor engagement metrics

## 🔧 API Endpoints

### Caption Generation
- `POST /api/generate` - Generate captions with AI

### User Management
- `POST /api/users` - Create/get user by email

### Caption Operations
- `POST /api/captions` - Save caption
- `GET /api/captions` - List user captions
- `POST /api/captions/[id]/favorite` - Toggle favorite

### Scheduled Posts
- `POST /api/scheduled-posts` - Schedule post
- `GET /api/scheduled-posts` - List scheduled posts
- `DELETE /api/scheduled-posts/[id]` - Delete scheduled post

### Statistics
- `GET /api/stats` - Get user statistics

### Cron Jobs
- `GET /api/cron/process-posts` - Process due posts (Vercel Cron)

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import from GitHub/GitLab
   - Vercel auto-detects Next.js

2. **Add Database**
   - Add Vercel Postgres
   - Copy connection strings

3. **Set Environment Variables**
   - OpenAI API key
   - Postgres credentials
   - Cron secret

4. **Deploy**
   - Automatic deployment on push
   - Preview deployments for PRs

### Other Platforms

- **Railway** - Full-stack deployment
- **Render** - Web service deployment
- **DigitalOcean** - App Platform deployment

## 💰 Pricing & Limits

### Vercel Hobby (Free)
- 100GB bandwidth/month
- 100 serverless function executions/day
- 1 Vercel Postgres database

### Vercel Pro ($20/month)
- 1TB bandwidth/month
- 1M serverless function executions/day
- Unlimited Postgres databases
- Advanced analytics

### OpenAI Costs
- GPT-3.5-turbo: ~$0.002 per caption
- Typical usage: $5-20/month

## 🔒 Security

- **Environment Variables** - All secrets in env vars
- **Cron Security** - Secret token for cron jobs
- **Input Validation** - All inputs validated
- **SQL Injection Protection** - Parameterized queries
- **Rate Limiting** - Built-in Vercel limits

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

- **Documentation** - Check this README
- **Issues** - GitHub Issues
- **Discussions** - GitHub Discussions

## 🔮 Roadmap

- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] Custom AI models
- [ ] API for third-party integrations
- [ ] Mobile app
- [ ] Advanced scheduling
- [ ] Performance tracking

---

**Built with ❤️ for content creators who want to scale their social media presence efficiently.**# Trigger deployment
# Force deployment for Supabase env vars
