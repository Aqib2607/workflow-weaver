# FlowBuilder API Keys Setup Guide

This document provides step-by-step instructions for obtaining all API keys required for FlowBuilder's integrations and AI features.

## 🤖 AI Providers

### OpenAI API Key (Primary AI Provider)

**Required for**: AI Workflow Assistant, text generation, voice-to-workflow conversion

1. **Sign up/Login**: Go to [OpenAI Platform](https://platform.openai.com/)
2. **Navigate to API Keys**: Click on your profile → "View API keys"
3. **Create New Key**: Click "Create new secret key"
4. **Copy Key**: Save the key (starts with `sk-`)
5. **Set Usage Limits**: Go to "Usage" → "Limits" to set monthly spending limits

**Environment Variable**:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

**Pricing**: Pay-per-use, ~$0.002/1K tokens for GPT-3.5-turbo

### Hugging Face API Key (Alternative AI Provider)

**Required for**: Alternative AI text generation

1. **Sign up**: Go to [Hugging Face](https://huggingface.co/)
2. **Access Tokens**: Profile → Settings → "Access Tokens"
3. **Create Token**: Click "New token" → Select "Read" role
4. **Copy Token**: Save the token (starts with `hf_`)

**Environment Variable**:

```env
HUGGINGFACE_API_KEY=hf_your-huggingface-token-here
```

**Pricing**: Free tier available, paid plans start at $9/month

---

## 📧 Email Services

### SendGrid API Key

**Required for**: Sending emails via SendGrid

1. **Sign up**: Go to [SendGrid](https://sendgrid.com/)
2. **Create API Key**: Settings → API Keys → "Create API Key"
3. **Set Permissions**: Choose "Full Access" or "Restricted Access"
4. **Copy Key**: Save the key (starts with `SG.`)

**Environment Variables**:

```env
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="FlowBuilder"
```

### Mailgun API Key

**Required for**: Sending emails via Mailgun

1. **Sign up**: Go to [Mailgun](https://www.mailgun.com/)
2. **Get API Key**: Dashboard → Settings → API Keys
3. **Copy Private Key**: Save the private API key

**Environment Variables**:

```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=your-domain.mailgun.org
MAILGUN_SECRET=your-mailgun-private-key
MAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### SMTP Credentials (Gmail, Outlook, etc.)

**Required for**: Direct SMTP email sending

**For Gmail**:

1. **Enable 2FA**: Google Account → Security → 2-Step Verification
2. **App Password**: Security → App passwords → Generate password
3. **Use App Password**: Use generated password, not your regular password

**Environment Variables**:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
```

---

## 💬 Slack Integration

### Slack API Key

**Required for**: Sending Slack messages, posting to channels

1. **Create Slack App**: Go to [Slack API](https://api.slack.com/apps)
2. **Create New App**: "Create New App" → "From scratch"
3. **App Name & Workspace**: Enter app name and select workspace
4. **OAuth & Permissions**: Add scopes:
   - `chat:write` (Send messages)
   - `channels:read` (List channels)
   - `users:read` (List users)
5. **Install App**: Install to workspace
6. **Copy Token**: Copy "Bot User OAuth Token" (starts with `xoxb-`)

**Environment Variables**:

```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Webhook URL** (Alternative):

1. **Incoming Webhooks**: In your Slack app → "Incoming Webhooks"
2. **Activate**: Turn on "Activate Incoming Webhooks"
3. **Add Webhook**: "Add New Webhook to Workspace"
4. **Select Channel**: Choose channel and authorize
5. **Copy URL**: Save the webhook URL

---

## 🗄️ Database Credentials

### MySQL Database

**Required for**: Database query nodes, data storage

**Local Development**:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=flowbuilder
DB_USERNAME=root
DB_PASSWORD=your-mysql-password
```

**Production (e.g., AWS RDS)**:

```env
DB_CONNECTION=mysql
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_DATABASE=flowbuilder_prod
DB_USERNAME=admin
DB_PASSWORD=your-secure-password
```

### PostgreSQL Database

**Required for**: Alternative database option

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=flowbuilder
DB_USERNAME=postgres
DB_PASSWORD=your-postgres-password
```

---

## 🌐 Third-Party API Keys

### Google APIs

**Required for**: Google Sheets, Google Drive, Gmail integrations

1. **Google Cloud Console**: Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create Project**: Create new project or select existing
3. **Enable APIs**: APIs & Services → Library → Enable required APIs:
   - Google Sheets API
   - Google Drive API
   - Gmail API
4. **Create Credentials**: APIs & Services → Credentials → "Create Credentials"
5. **Service Account**: Choose "Service Account" for server-to-server
6. **Download JSON**: Download the service account JSON file

**Environment Variables**:

```env
GOOGLE_SERVICE_ACCOUNT_JSON=path/to/service-account.json
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### GitHub API

**Required for**: GitHub integrations, repository access

1. **GitHub Settings**: GitHub → Settings → Developer settings
2. **Personal Access Tokens**: "Personal access tokens" → "Tokens (classic)"
3. **Generate Token**: "Generate new token (classic)"
4. **Select Scopes**: Choose required permissions:
   - `repo` (Repository access)
   - `user` (User information)
5. **Copy Token**: Save the token (starts with `ghp_`)

**Environment Variables**:

```env
GITHUB_TOKEN=ghp_your-github-token
GITHUB_CLIENT_ID=your-github-app-client-id
GITHUB_CLIENT_SECRET=your-github-app-secret
```

### Stripe API (for payments)

**Required for**: Payment processing, subscription management

1. **Stripe Dashboard**: Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **API Keys**: Developers → API keys
3. **Copy Keys**: Save both publishable and secret keys

**Environment Variables**:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### Twilio API (for SMS)

**Required for**: SMS notifications, phone integrations

1. **Twilio Console**: Go to [Twilio Console](https://console.twilio.com/)
2. **Account Info**: Dashboard → Account Info
3. **Copy Credentials**: Save Account SID and Auth Token
4. **Phone Number**: Buy a Twilio phone number

**Environment Variables**:

```env
TWILIO_SID=your-twilio-account-sid
TWILIO_TOKEN=your-twilio-auth-token
TWILIO_FROM=+1234567890
```

---

## 🔐 Security Best Practices

### Environment File Setup

1. **Never commit .env files** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** (every 90 days recommended)
4. **Set usage limits** on all API keys
5. **Monitor usage** regularly for unusual activity

### Key Management

```bash
# Create .env file
cp .env.example .env

# Set restrictive permissions
chmod 600 .env

# Generate Laravel app key
php artisan key:generate
```

### Production Deployment

```bash
# Use environment variables instead of .env file
export OPENAI_API_KEY="sk-your-key"
export SENDGRID_API_KEY="SG.your-key"

# Or use Docker secrets, AWS Parameter Store, etc.
```

---

## 📋 Complete .env Template

```env
# Application
APP_NAME=FlowBuilder
APP_ENV=production
APP_KEY=base64:your-generated-app-key
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=flowbuilder
DB_USERNAME=root
DB_PASSWORD=

# AI Providers
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-3.5-turbo
HUGGINGFACE_API_KEY=hf_your-huggingface-key
AI_PROVIDER=openai
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7

# Email Services
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-key
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="FlowBuilder"

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Google APIs
GOOGLE_SERVICE_ACCOUNT_JSON=storage/app/google-service-account.json
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub Integration
GITHUB_TOKEN=ghp_your-github-token
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# SMS/Phone
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_FROM=+1234567890

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

---

## 🚀 Quick Setup Checklist

- [ ] OpenAI API key obtained and added to .env
- [ ] Email service configured (SendGrid/Mailgun/SMTP)
- [ ] Slack integration setup (if needed)
- [ ] Database credentials configured
- [ ] Google APIs enabled (if using Google integrations)
- [ ] GitHub token created (if using GitHub features)
- [ ] All keys tested in development environment
- [ ] Production keys configured separately
- [ ] Usage limits set on all API keys
- [ ] Monitoring setup for key usage

---

## 💡 Cost Estimation

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| OpenAI | $5 credit | ~$0.002/1K tokens |
| SendGrid | 100 emails/day | $14.95/month |
| Slack | Free for small teams | $7.25/user/month |
| Google APIs | Generous free quotas | Pay per use |
| GitHub | Free for public repos | $4/user/month |
| Stripe | No monthly fee | 2.9% + 30¢ per transaction |
| Twilio | Free trial credit | ~$0.0075 per SMS |

**Estimated monthly cost for small business**: $50-200/month depending on usage.
