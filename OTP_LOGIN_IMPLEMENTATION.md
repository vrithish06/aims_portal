# OTP-Based Login Implementation Guide

## Overview
The login functionality has been changed from email/password authentication to **email-based OTP (One-Time Password) verification** using Node-Mailer. Users now login by:
1. Entering their email address
2. Receiving a 6-digit OTP via email
3. Entering the OTP to complete login

---

## Backend Changes

### 1. **New Dependencies**
- `nodemailer` - For sending OTP emails

Installed via: `npm install nodemailer`

### 2. **New Files Created**

#### `/backend/config/mailer.js`
- Configures nodemailer transporter
- Exports `sendOTPEmail()` function to send OTP emails
- Uses environment variables:
  - `EMAIL_SERVICE` - Email service provider (default: gmail)
  - `EMAIL_USER` - Email address to send from
  - `EMAIL_PASSWORD` - Email app password

#### `/backend/utils/otpUtils.js`
- `generateOTP()` - Generates random 6-digit OTP
- `getOTPExpiryTime()` - Returns 10-minute expiry timestamp
- `isOTPValid()` - Checks if OTP is still valid

### 3. **New Database Usage**

The existing `otp_codes` table is used to store OTP records:
```sql
create table public.otp_codes (
  id serial not null,
  email character varying(255) not null,
  otp_code character varying(6) not null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  expires_at timestamp without time zone not null,
  is_used boolean null default false,
  used_at timestamp without time zone null,
  created_ip character varying(45) null,
  constraint otp_codes_pkey primary key (id),
  constraint otp_codes_email_fkey foreign KEY (email) references users (email) on delete CASCADE
) TABLESPACE pg_default;
```

### 4. **New API Endpoints**

#### `POST /send-otp`
Sends OTP to user's email.

**Request:**
```json
{
  "email": "user@iitrpr.ac.in"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

#### `POST /verify-otp`
Verifies OTP and creates session.

**Request:**
```json
{
  "email": "user@iitrpr.ac.in",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 1,
    "email": "user@iitrpr.ac.in",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid OTP" | "OTP expired. Please request a new one."
}
```

### 5. **Controller Changes**

**File:** `/backend/controllers/aimsController.js`

New exports:
- `sendOTP(req, res)` - Handles OTP sending
- `verifyOTP(req, res)` - Handles OTP verification and session creation

**Process:**
1. **Send OTP:**
   - Verify user exists in database
   - Generate 6-digit OTP
   - Store OTP in `otp_codes` table with 10-minute expiry
   - Send OTP via email
   - Return success/error response

2. **Verify OTP:**
   - Get latest unused OTP for email
   - Check if OTP matches and is not expired
   - Mark OTP as used
   - Create user session
   - Return user data and set session cookie

### 6. **Route Changes**

**File:** `/backend/routes/AimsRoutes.js`

Added routes:
```javascript
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
```

The old `/login` endpoint still exists for backward compatibility.

---

## Frontend Changes

### 1. **AuthStore Updates**

**File:** `/frontend/src/store/authStore.js`

New state properties:
- `otpSent` - Boolean flag indicating if OTP has been sent
- `userEmail` - Temporarily stores email during OTP flow

New methods:
- `sendOTP(email)` - Sends OTP to email
- `verifyOTP(email, otp)` - Verifies OTP and logs in
- `resetOTPState()` - Clears OTP-related state

Old `login()` method kept for backward compatibility.

### 2. **LoginPage Component Updates**

**File:** `/frontend/src/pages/LoginPage.jsx`

**Two-Step Flow:**

**Step 1: Email Entry**
- User enters email
- Clicks "Send OTP" button
- OTP is sent to their email

**Step 2: OTP Verification**
- User sees message: "Enter the 6-digit code sent to [email]"
- Input accepts only digits (0-9)
- Maximum 6 characters
- Click "Verify & Login" to complete login
- "Back" button returns to email entry

**Features:**
- Form validation
- Toast notifications for success/error
- Loading states during API calls
- Input validation (OTP must be 6 digits)
- Automatic digit-only filtering

---

## Environment Setup

### Required Environment Variables

Add these to your `.env` file in the backend:

```bash
# Email Configuration (for Node-Mailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # NOT your regular password

# Existing variables (keep these)
NODE_ENV=development|production
VITE_API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-secret-key
```

### Gmail Setup

To use Gmail for sending OTPs:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an **App Password** (not your regular password):
   - Go to myaccount.google.com
   - Security → App passwords
   - Select Mail and Device (Windows Computer)
   - Copy the generated 16-character password
3. Use this password in `EMAIL_PASSWORD`

### Alternative Email Services

To use a different email service, update `EMAIL_SERVICE` in `.env`:
- `gmail` - Gmail
- `outlook` - Outlook/Hotmail
- `yahoo` - Yahoo Mail
- `aol` - AOL
- Or provide SMTP configuration in `mailer.js`

---

## How It Works

### Login Flow

```
User Visits Login Page
        ↓
User Enters Email
        ↓
User Clicks "Send OTP"
        ↓
Backend:
  1. Verify user exists
  2. Generate OTP
  3. Store in database with 10-min expiry
  4. Send via email
        ↓
Frontend: Show OTP Entry Screen
        ↓
User Receives Email with OTP
        ↓
User Enters OTP
        ↓
User Clicks "Verify & Login"
        ↓
Backend:
  1. Validate OTP
  2. Check expiry
  3. Mark as used
  4. Create session
        ↓
Frontend: Redirect to Dashboard
```

### OTP Expiration

- **OTP expires in:** 10 minutes
- **Expired OTP marked as used:** Cannot be re-used
- **User must request new OTP:** By going back and re-entering email

### Security Features

- OTP stored in database (not in frontend)
- OTP marked as used after successful verification
- Expired OTPs rejected
- IP address logged when OTP is created
- Each email can have multiple OTP records, but only latest unused one is valid

---

## Database Schema

### otp_codes Table

```
id (serial) - Primary key
email (varchar) - Foreign key to users.email
otp_code (varchar) - 6-digit OTP
created_at (timestamp) - When OTP was created
expires_at (timestamp) - When OTP expires (10 minutes)
is_used (boolean) - Whether OTP was already used
used_at (timestamp) - When OTP was used
created_ip (varchar) - IP address that requested OTP
```

---

## Testing the Implementation

### Step 1: Start Backend
```bash
cd backend
npm install  # if nodemailer not installed yet
npm run dev
```

### Step 2: Configure Email
- Set `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 4: Test Login
1. Go to login page
2. Enter an existing user's email (e.g., `student@iitrpr.ac.in`)
3. Click "Send OTP"
4. Check email for OTP code
5. Enter OTP on login page
6. Should redirect to dashboard

### Step 5: Test Error Cases
- **Invalid email:** User not found error
- **Wrong OTP:** Invalid OTP error
- **Expired OTP:** Request new OTP (after 10 minutes)
- **Reuse OTP:** Cannot re-use already used OTP

---

## Backward Compatibility

- Old `/login` endpoint still works (email/password)
- If you want to keep password login option, update LoginPage to show both options
- All existing sessions and authentication middleware unchanged

---

## Troubleshooting

### Email Not Sending
1. Check `EMAIL_USER` and `EMAIL_PASSWORD` are correct
2. If using Gmail, verify App Password (not regular password)
3. Check console logs for mailer connection errors
4. Verify firewall/network allows SMTP connections

### OTP Not Validating
1. Check OTP is exactly 6 digits
2. Verify OTP hasn't expired (10 minute limit)
3. Check database has `otp_codes` table
4. Check email in request matches stored email

### Session Not Created
1. Verify backend session middleware is running
2. Check `SESSION_SECRET` is set
3. Check browser allows cookies
4. Check CORS settings allow credentials

---

## Files Modified/Created

### Created:
- `/backend/config/mailer.js` - Nodemailer configuration
- `/backend/utils/otpUtils.js` - OTP utility functions

### Modified:
- `/backend/package.json` - Added nodemailer dependency
- `/backend/controllers/aimsController.js` - Added sendOTP & verifyOTP
- `/backend/routes/AimsRoutes.js` - Added /send-otp & /verify-otp routes
- `/frontend/src/store/authStore.js` - Added OTP methods
- `/frontend/src/pages/LoginPage.jsx` - Converted to 2-step OTP flow

---

## Future Enhancements

- [ ] Resend OTP button (with rate limiting)
- [ ] SMS OTP option
- [ ] Multi-factor authentication
- [ ] OTP attempt rate limiting
- [ ] Account lockout after multiple failed attempts
- [ ] Email template customization

