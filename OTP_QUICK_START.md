# Quick Start: OTP Login Setup

## 1. Environment Configuration

Create a `.env` file in the `/backend` directory with:

```bash
# Email Configuration (Required for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Session Configuration
SESSION_SECRET=your-secure-session-secret

# API Configuration
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database (existing)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

## 2. Gmail App Password Setup

If using Gmail:
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Select Security → App passwords
3. Choose "Mail" and "Windows Computer"
4. Copy the generated 16-character password
5. Use this in `EMAIL_PASSWORD` (NOT your regular Gmail password)

## 3. Backend Setup

```bash
cd backend
npm install nodemailer
npm run dev
```

## 4. Frontend Setup

```bash
cd frontend
npm run dev
```

## 5. Test Login

1. Navigate to http://localhost:5173
2. Enter a registered user's email (e.g., student@iitrpr.ac.in)
3. Click "Send OTP"
4. Check your email for the OTP code
5. Enter OTP and click "Verify & Login"
6. You should be redirected to the dashboard

---

## What Changed

### Backend
- ✅ Added `/send-otp` endpoint - sends OTP to email
- ✅ Added `/verify-otp` endpoint - verifies OTP and creates session
- ✅ Uses existing `otp_codes` table in database
- ✅ OTP valid for 10 minutes
- ✅ Session management unchanged

### Frontend
- ✅ LoginPage now has 2-step flow (email → OTP)
- ✅ AuthStore has new `sendOTP()` and `verifyOTP()` methods
- ✅ Better UX with clear instructions

---

## API Endpoints

### Send OTP
```
POST /send-otp
Content-Type: application/json

{
  "email": "student@iitrpr.ac.in"
}
```

### Verify OTP
```
POST /verify-otp
Content-Type: application/json

{
  "email": "student@iitrpr.ac.in",
  "otp": "123456"
}
```

---

## Features

✅ 6-digit OTP generation  
✅ 10-minute expiration  
✅ Email delivery via Node-Mailer  
✅ Database storage with validation  
✅ Session-based authentication  
✅ Cookie management  
✅ Error handling & user feedback  
✅ Form validation  
✅ Mobile-friendly UI  

---

## Troubleshooting

**Email not sending?**
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- Check backend logs for mailer connection errors
- Ensure Gmail App Password is used (not regular password)

**OTP validation fails?**
- OTP must be exactly 6 digits
- Check OTP hasn't expired (10 minute limit)
- Verify database connection

**Can't login?**
- Check user exists in database
- Verify email is correct
- Check browser allows cookies

---

For detailed documentation, see [OTP_LOGIN_IMPLEMENTATION.md](OTP_LOGIN_IMPLEMENTATION.md)
