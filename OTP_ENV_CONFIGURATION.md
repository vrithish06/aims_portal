# OTP Login - Environment Configuration Template

## Backend .env Template

Copy this to `/backend/.env` and fill in your values:

```bash
# ========================================
# EMAIL CONFIGURATION (REQUIRED FOR OTP)
# ========================================

# Email service provider
# Options: gmail, outlook, yahoo, aol, or custom SMTP
EMAIL_SERVICE=gmail

# Your email address (from which OTP will be sent)
# Example: your-email@gmail.com
EMAIL_USER=your-email@gmail.com

# Email password or app-specific password
# ⚠️  FOR GMAIL: Use App Password (16 chars), NOT regular password
# Generate at: https://myaccount.google.com → Security → App passwords
EMAIL_PASSWORD=your-app-password-here

# ========================================
# SESSION CONFIGURATION
# ========================================

# Secret key for session encryption
# ⚠️  Change this to a strong random string in production
# Generate: openssl rand -base64 32
SESSION_SECRET=dev-secret-key-change-in-production

# ========================================
# NODE ENVIRONMENT
# ========================================

# Development or production
# Options: development, production
NODE_ENV=development

# ========================================
# API CONFIGURATION
# ========================================

# Backend API URL (what frontend uses to call backend)
VITE_API_BASE_URL=http://localhost:3000

# Frontend URL (for CORS configuration)
FRONTEND_URL=http://localhost:5173

# ========================================
# DATABASE CONFIGURATION (EXISTING)
# ========================================

# Supabase connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# ========================================
# OPTIONAL CONFIGURATIONS
# ========================================

# Custom SMTP (if not using predefined services)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false

# Logging level
# Options: error, warn, info, debug
# LOG_LEVEL=info

# OTP Settings (if you want to customize)
# OTP_LENGTH=6                    # Default: 6 digits
# OTP_EXPIRY_MINUTES=10           # Default: 10 minutes

# ========================================
# NOTES
# ========================================
# 1. Never commit this file to git
# 2. Add .env to .gitignore
# 3. Each environment (dev, staging, prod) needs its own .env
# 4. Keep EMAIL_PASSWORD secure - use environment variables in production
# 5. Never log or expose sensitive values
```

---

## Gmail Setup Instructions

### Step 1: Enable 2-Factor Authentication
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in left menu
3. Scroll to "2-Step Verification"
4. Click "Enable" and follow prompts
5. Verify your phone number
6. Save backup codes safely

### Step 2: Generate App Password
1. After 2FA is enabled, go back to Security
2. Scroll to "App passwords" (appears after 2FA)
3. Select "Mail" and "Windows Computer" (or your OS)
4. Click "Generate"
5. Copy the 16-character password
6. Use this in `EMAIL_PASSWORD`

### Step 3: Test Configuration
```bash
# Test email sending (Node.js)
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password-16-chars'
  }
});

transporter.verify((err, success) => {
  if (err) console.log('ERROR:', err);
  else console.log('✓ Email configured correctly');
});
"
```

---

## Alternative Email Services

### Outlook/Microsoft
```bash
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
```

### Yahoo Mail
```bash
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password  # Generate in Yahoo account settings
```

### AOL
```bash
EMAIL_SERVICE=aol
EMAIL_USER=your-email@aol.com
EMAIL_PASSWORD=your-password
```

### Custom SMTP Server
```bash
EMAIL_SERVICE=gmail  # Can be anything, nodemailer won't use it
# Add to mailer.js configuration:
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@example.com
# SMTP_PASSWORD=your-password
```

---

## Production Environment Variables

For production deployment:

```bash
# ========================================
# PRODUCTION SETTINGS
# ========================================

NODE_ENV=production
VITE_API_BASE_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com

# ========================================
# SECURITY IN PRODUCTION
# ========================================

# STRONG random session secret
SESSION_SECRET=generate-with-openssl-rand-base64-32

# Use production email credentials
EMAIL_USER=production-email@yourcompany.com
EMAIL_PASSWORD=production-app-password

# Database production credentials
SUPABASE_URL=production-supabase-url
SUPABASE_KEY=production-supabase-key

# ========================================
# OPTIONAL: MONITORING & LOGGING
# ========================================

# Log level (less verbose in production)
LOG_LEVEL=warn

# Email tracking (optional)
TRACK_EMAIL_OPENS=true
TRACK_EMAIL_CLICKS=true

# Sentry error tracking (optional)
SENTRY_DSN=your-sentry-dsn

# ========================================
# RATE LIMITING (RECOMMENDED)
# ========================================

# Max OTP requests per email per hour
MAX_OTP_REQUESTS_PER_HOUR=5

# Max OTP verification attempts per OTP
MAX_OTP_VERIFY_ATTEMPTS=5

# Block after X failed attempts
BLOCK_AFTER_FAILED_ATTEMPTS=10
```

---

## Environment Variable Checklist

### Required Variables
- [ ] `EMAIL_SERVICE`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `SESSION_SECRET`
- [ ] `NODE_ENV`
- [ ] `VITE_API_BASE_URL`
- [ ] `FRONTEND_URL`

### Database Variables (Existing)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_KEY`

### Optional Variables
- [ ] `OTP_EXPIRY_MINUTES` (default: 10)
- [ ] `MAX_OTP_REQUESTS_PER_HOUR` (default: unlimited)
- [ ] `LOG_LEVEL` (default: info)

---

## Testing Your Configuration

### Test 1: Email Connection
```bash
cd backend
npm install nodemailer  # if not done
node -e "require('dotenv').config(); const nodemailer = require('nodemailer'); const t = nodemailer.createTransport({service: process.env.EMAIL_SERVICE, auth: {user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD}}); t.verify((e,s) => console.log(e ? '❌ ' + e : '✅ Email configured'));"
```

### Test 2: Backend Server
```bash
cd backend
npm run dev
# Should see: [MAILER] ✅ Server is ready to send emails
```

### Test 3: Login Flow
1. Start frontend: `cd frontend && npm run dev`
2. Go to http://localhost:5173/login
3. Enter valid user email
4. Click "Send OTP"
5. Check email for OTP
6. Enter OTP and verify

---

## Common Configuration Issues

### Issue: Email not sending
**Solution:**
- Verify `EMAIL_PASSWORD` is correct (use Gmail App Password)
- Check `EMAIL_USER` is correct email address
- Verify internet connection
- Check backend logs for errors
- Try Gmail account: less strict than others

### Issue: SMTP error
**Solution:**
- Wrong service name? Check it's supported by nodemailer
- Wrong port? Standard is 587 (TLS) or 465 (SSL)
- Firewall blocking? Try different port
- App password instead of regular password? (for Gmail)

### Issue: .env not being read
**Solution:**
- Verify `.env` file is in `/backend` directory
- No quotes around values (unless needed)
- Check no extra spaces: `KEY=value` not `KEY = value`
- Restart server after changing .env
- Check `.env` is not in `.gitignore` blocking it

### Issue: Session not working
**Solution:**
- Change `SESSION_SECRET` to a strong random string
- Restart server
- Clear browser cookies
- Check backend logs for session errors

---

## Security Best Practices

✅ **DO:**
- Use strong `SESSION_SECRET` (32+ characters)
- Use Gmail App Password instead of regular password
- Set `NODE_ENV=production` in production
- Use HTTPS URLs in production
- Store .env securely (never commit to git)
- Rotate `EMAIL_PASSWORD` periodically
- Use different credentials for each environment
- Monitor email sending logs

❌ **DON'T:**
- Hardcode secrets in code
- Commit `.env` file to git
- Use simple passwords for `SESSION_SECRET`
- Use regular Gmail password (use App Password)
- Log sensitive values
- Share `.env` file via email or chat
- Use same credentials across environments
- Leave email credentials in version control

---

## Multiple Environments

### Development Environment
```bash
# .env.development
NODE_ENV=development
EMAIL_USER=your-personal-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
SESSION_SECRET=dev-secret-123456789
VITE_API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Staging Environment
```bash
# .env.staging
NODE_ENV=staging
EMAIL_USER=staging-email@company.com
EMAIL_PASSWORD=staging-app-password
SESSION_SECRET=staging-secret-long-random-string
VITE_API_BASE_URL=https://staging-api.company.com
FRONTEND_URL=https://staging.company.com
```

### Production Environment
```bash
# .env.production (never commit this!)
NODE_ENV=production
EMAIL_USER=production-email@company.com
EMAIL_PASSWORD=production-app-password
SESSION_SECRET=production-secret-very-long-random-string
VITE_API_BASE_URL=https://api.company.com
FRONTEND_URL=https://company.com
```

Load different .env based on NODE_ENV:
```javascript
// In server.js
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});
```

---

## Generating Secure Secrets

### Using OpenSSL (Recommended)
```bash
# Generate 32-character random secret
openssl rand -base64 32

# Example output:
# XvZ8d3K9qL2pM5nR7tS1vW4xY6zB8cD9eF0gH1jK2lM3=
```

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Using Python
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Verification Checklist

Before starting the server:

```bash
# 1. Check .env file exists
ls -la backend/.env

# 2. Check required variables are set
grep "EMAIL_SERVICE\|EMAIL_USER\|EMAIL_PASSWORD\|SESSION_SECRET" backend/.env

# 3. Verify values are not empty
cat backend/.env | grep -v "^#" | grep -v "^$"

# 4. Check nodemailer is installed
npm list nodemailer

# 5. Start server and check logs
npm run dev
```

Should see in logs:
```
[MAILER] ✅ Server is ready to send emails
```

---

## Support

If you have configuration issues:

1. Check this template matches your setup
2. Review [OTP_QUICK_START.md](OTP_QUICK_START.md)
3. Check [OTP_LOGIN_IMPLEMENTATION.md](OTP_LOGIN_IMPLEMENTATION.md) troubleshooting
4. Review backend logs for specific errors
5. Verify email credentials one more time
6. Test email connection directly with Node.js script above

---

**Save this file as reference for setting up OTP login configuration.**
