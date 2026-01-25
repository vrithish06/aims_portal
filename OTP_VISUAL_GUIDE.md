# OTP Login - Visual Implementation Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AIMS PORTAL LOGIN SYSTEM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐      ┌─────────────────────────┐ │
│  │   FRONTEND (React)       │      │   BACKEND (Node.js)     │ │
│  ├──────────────────────────┤      ├─────────────────────────┤ │
│  │                          │      │                         │ │
│  │ LoginPage.jsx            │      │ Routes/AimsRoutes.js   │ │
│  │ ├─ Step 1: Email input   │      │ ├─ /send-otp          │ │
│  │ └─ Step 2: OTP input     │      │ └─ /verify-otp        │ │
│  │                          │      │                         │ │
│  │ authStore.js             │      │ Controllers/           │ │
│  │ ├─ sendOTP()            │      │ aimsController.js      │ │
│  │ └─ verifyOTP()          │      │ ├─ sendOTP()          │ │
│  │                          │      │ └─ verifyOTP()        │ │
│  │                          │      │                         │ │
│  └──────────────────────────┘      └─────────────────────────┘ │
│           │                              │    │                │
│           │ axios POST                   │    │                │
│           ├─────────────────────────────>│    │                │
│           │  /send-otp { email }        │    │                │
│           │<─────────────────────────────┤    │                │
│           │  { success: true }          │    │                │
│           │                              │    │                │
│           │                              │    │ OTP Utils      │
│           │                              │    │ ├─ generateOTP │
│           │                              │    │ ├─ getExpiry   │
│           │                              │    │ └─ isValid     │
│           │                              │    │                │
│           │                              │    │ Mailer Config  │
│           │                              │    │ └─ sendEmail   │
│           │                              │    │                │
│           │                              ├───┤ Database       │
│           │ axios POST                   │    │ └─ otp_codes   │
│           ├─────────────────────────────>│    │                │
│           │ /verify-otp { email, otp }  │    │                │
│           │<─────────────────────────────┤    │                │
│           │ { success: true, data: {...}}   │                │
│           │ + Session Cookie            │    │ Email Service  │
│           │                              │    │ └─ Gmail/etc   │
│           │                              │    │                │
│  ┌─ REDIRECT TO DASHBOARD                                      │
│  │                                                              │
│  └──────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Login Flow Diagram

```
START
  │
  ▼
┌─────────────────────────────┐
│ User visits login page      │
└──────────────┬──────────────┘
               │
               ▼
        ┌────────────────────┐
        │ STEP 1: EMAIL      │
        ├────────────────────┤
        │ Input: email       │
        │ [Enter Email]      │
        │ [Send OTP]         │
        └────────┬───────────┘
                 │
        BACKEND PROCESSING
        ┌────────▼──────────┐
        │ Validate email    │
        │ Generate OTP      │
        │ Store in DB       │
        │ Send via email    │
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │ Email sent to     │
        │ user's inbox      │
        └────────┬──────────┘
                 │
               ▼
        ┌────────────────────┐
        │ STEP 2: OTP        │
        ├────────────────────┤
        │ Input: 6-dig OTP   │
        │ [Enter OTP]        │
        │ [Verify & Login]   │
        │ [Back]             │
        └────────┬───────────┘
                 │
        BACKEND VERIFICATION
        ┌────────▼──────────────┐
        │ Validate OTP          │
        │ Check expiry          │
        │ Check not already used│
        │ Create session        │
        └────────┬──────────────┘
                 │
         SUCCESS │       ERROR
           │     │         │
           ▼     ▼         ▼
        ✓ OK   ✗ FAIL  ERROR MSG
           │             │
           │         Go back to
           │         email form
           │
           ▼
        SET COOKIE
        REDIRECT
        
           │
           ▼
        DASHBOARD
        
DONE
```

---

## Database Flow

```
┌─────────────────────────────────────────────┐
│          otp_codes TABLE                    │
├─────────────────────────────────────────────┤
│ id     | email          | otp_code | ...    │
├────────┼────────────────┼──────────┼────────┤
│        │                │          │        │
│ ▲      │ ▲              │ ▲        │ ▲      │
│ │      │ │              │ │        │ │      │
│ │      │ │              │ │        │ │      │
│ 1      │ 2              │ 3        │ 4      │
│        │                │          │        │
└────────┼────────────────┼──────────┼────────┘
         │                │          │
         ▼                ▼          ▼
   1. Auto-increment   2. From      3. Random 6-digit
      ID assigned         request   4. Generated +
                                       10 min expiry
                       
     5. Mark as used after verification
     6. Delete old expired records (optional)
```

---

## Component Interaction Flow

```
┌────────────────────────────────────────────────────┐
│                  LoginPage.jsx                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  const [step, setStep] = useState("email")         │
│  const [email, setEmail] = useState("")            │
│  const [otp, setOtp] = useState("")                │
│  const [loading, setLoading] = useState(false)     │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │  if (step === "email")                   │     │
│  ├──────────────────────────────────────────┤     │
│  │  ┌─────────────────┐                     │     │
│  │  │ Email Input     │                     │     │
│  │  │ [text input]    │                     │     │
│  │  └────────┬────────┘                     │     │
│  │           │                              │     │
│  │           ▼                              │     │
│  │  [SEND OTP BUTTON]                      │     │
│  │           │                              │     │
│  │           ▼                              │     │
│  │  const sendOTP = useAuthStore()         │     │
│  │  await sendOTP(email)                   │     │
│  │           │                              │     │
│  │           ▼                              │     │
│  │  setStep("otp")  ◄─── STATE CHANGE      │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │  else if (step === "otp")                │     │
│  ├──────────────────────────────────────────┤     │
│  │  ┌─────────────────┐                     │     │
│  │  │ OTP Input       │                     │     │
│  │  │ [6 digits]      │                     │     │
│  │  │ Filters to      │                     │     │
│  │  │ numbers only    │                     │     │
│  │  └────────┬────────┘                     │     │
│  │           │                              │     │
│  │           ▼                              │     │
│  │  [VERIFY & LOGIN BUTTON]                │     │
│  │  [BACK BUTTON]                          │     │
│  │           │                              │     │
│  │           ▼                              │     │
│  │  const verifyOTP = useAuthStore()       │     │
│  │  await verifyOTP(email, otp)            │     │
│  │           │                              │     │
│  │           ▼                              │     │
│  │  Session created ✓                      │     │
│  │  Redirect to dashboard                  │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## State Management (Zustand)

```
┌──────────────────────────────────────────────────┐
│         useAuthStore (Zustand)                   │
├──────────────────────────────────────────────────┤
│                                                  │
│  STATE:                                          │
│  ├─ user: {user_id, email, role, ...}          │
│  ├─ isAuthenticated: boolean                    │
│  ├─ isLoading: boolean                          │
│  ├─ otpSent: boolean          (NEW)             │
│  └─ userEmail: string         (NEW)             │
│                                                  │
│  METHODS:                                        │
│  ├─ initializeAuth()           (existing)       │
│  ├─ login(email, password)     (backward compat)│
│  ├─ logout()                   (existing)       │
│  ├─ clearAuth()                (existing)       │
│  ├─ setUser(user)              (existing)       │
│  ├─ sendOTP(email)             (NEW)            │
│  ├─ verifyOTP(email, otp)      (NEW)            │
│  └─ resetOTPState()            (NEW)            │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## API Endpoint Communication

### Request/Response Flow: Send OTP

```
Frontend                          Backend
   │                                │
   │  POST /send-otp               │
   │  {                             │
   │    "email": "user@..."         │
   │  }                             │
   ├───────────────────────────────>│
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Validate user   │
   │                            │ exists in DB    │
   │                            └──┬──────────────┘
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Generate OTP    │
   │                            │ (6 digits)      │
   │                            └──┬──────────────┘
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Store in otp_   │
   │                            │ codes table     │
   │                            │ (10 min expiry) │
   │                            └──┬──────────────┘
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Send email      │
   │                            │ via nodemailer  │
   │                            └──┬──────────────┘
   │                                │
   │  200 OK                        │
   │  {                             │
   │    "success": true,            │
   │    "message": "OTP sent"       │
   │  }                             │
   │<───────────────────────────────┤
   │                                │
   ▼                                ▼
Show OTP               Email delivered
Input Form            to user's inbox
```

### Request/Response Flow: Verify OTP

```
Frontend                          Backend
   │                                │
   │  POST /verify-otp             │
   │  {                             │
   │    "email": "user@...",        │
   │    "otp": "123456"             │
   │  }                             │
   ├───────────────────────────────>│
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Get latest      │
   │                            │ unused OTP      │
   │                            │ for email       │
   │                            └──┬──────────────┘
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Validate OTP    │
   │                            │ - exists        │
   │                            │ - not expired   │
   │                            │ - matches       │
   │                            └──┬──────────────┘
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Mark as used    │
   │                            │ in DB           │
   │                            └──┬──────────────┘
   │                                │
   │                            ┌──┴──────────────┐
   │                            │ Create session  │
   │                            │ Store user data │
   │                            └──┬──────────────┘
   │                                │
   │  200 OK                        │
   │  {                             │
   │    "success": true,            │
   │    "data": {                   │
   │      "user_id": 42,            │
   │      "email": "user@...",      │
   │      "first_name": "...",      │
   │      "role": "student"         │
   │    }                           │
   │  }                             │
   │  + Set-Cookie header           │
   │<───────────────────────────────┤
   │                                │
   ▼                                ▼
Login successful          Session established
Redirect to               User authenticated
dashboard
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────┐
│         Error Scenarios                  │
├──────────────────────────────────────────┤
│                                          │
│ SEND OTP ERRORS:                        │
│ ├─ Email empty        → "Email required"│
│ └─ User not found     → "User not found"│
│                                          │
│ VERIFY OTP ERRORS:                      │
│ ├─ Email empty        → "Email required"│
│ ├─ OTP empty          → "OTP required"  │
│ ├─ OTP not 6 digits   → "Must be 6 dig."│
│ ├─ OTP expired        → "Expired"       │
│ ├─ OTP not found      → "Invalid OTP"   │
│ ├─ OTP doesn't match  → "Invalid OTP"   │
│ └─ Session creation   → "Session error" │
│                                          │
│ NETWORK ERRORS:                         │
│ ├─ Backend unreachable→ "Not reachable" │
│ └─ Server error       → "Server error"  │
│                                          │
│ Each error shows:                       │
│ ├─ User-friendly message                │
│ ├─ Toast notification                   │
│ └─ Logged to console                    │
│                                          │
└──────────────────────────────────────────┘
```

---

## Email Template Flow

```
┌────────────────────────────────────────┐
│        HTML Email Template              │
├────────────────────────────────────────┤
│                                        │
│  AIMS Portal - Login Verification     │
│  ┌──────────────────────────────────┐ │
│  │ Hello,                            │ │
│  │                                   │ │
│  │ Use this OTP to complete login:  │ │
│  │                                   │ │
│  │   ┌────────────────────┐         │ │
│  │   │    123 456         │         │ │
│  │   └────────────────────┘         │ │
│  │                                   │ │
│  │ ⚠️ Expires in 10 minutes         │ │
│  │                                   │ │
│  │ If you didn't request this,      │ │
│  │ ignore this email.                │ │
│  │                                   │ │
│  │ ---                              │ │
│  │ Automated message. Do not reply. │ │
│  └──────────────────────────────────┘ │
│                                        │
│ From: your-email@gmail.com            │
│ To: user@iitrpr.ac.in                 │
│ Subject: Your AIMS Login OTP          │
│                                        │
└────────────────────────────────────────┘
```

---

## Security Flow

```
┌─────────────────────────────────────────────────┐
│        Security Measures in Place               │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. OTP Generation                              │
│    └─ Random 6-digit number (100,000-999,999)  │
│                                                 │
│ 2. OTP Storage                                 │
│    └─ Stored in database (not frontend)        │
│    └─ Never returned to user                   │
│                                                 │
│ 3. OTP Delivery                                │
│    └─ Sent via email only                      │
│    └─ Not transmitted in API response          │
│                                                 │
│ 4. OTP Validation                              │
│    ├─ Check OTP exists in DB                  │
│    ├─ Check not already used                  │
│    ├─ Check not expired (10 min)              │
│    └─ Check matches exactly                   │
│                                                 │
│ 5. OTP Usage                                   │
│    └─ Marked as used after verification       │
│    └─ Cannot be reused                        │
│                                                 │
│ 6. Session Security                            │
│    ├─ Session created only after valid OTP    │
│    ├─ httpOnly cookies (JS cannot access)     │
│    ├─ Secure flag (HTTPS only in production)  │
│    └─ Expiry: 24 hours                        │
│                                                 │
│ 7. IP Tracking                                 │
│    └─ IP logged when OTP generated            │
│                                                 │
│ 8. Rate Limiting (Recommended)                │
│    └─ Max X OTPs per email per hour           │
│    └─ Max Y attempts to verify OTP            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│              PRODUCTION DEPLOYMENT                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  FRONTEND (Deployed)                         │ │
│  │  ├─ React App (Static)                      │ │
│  │  ├─ CORS: Allow backend domain             │ │
│  │  └─ HTTPS enforced                          │ │
│  └──────────────┬───────────────────────────────┘ │
│                 │                                  │
│        HTTPS   │                                  │
│                ▼                                  │
│  ┌──────────────────────────────────────────────┐ │
│  │  BACKEND (Node.js)                          │ │
│  │  ├─ Express Server                          │ │
│  │  ├─ Routes: /send-otp, /verify-otp         │ │
│  │  ├─ Nodemailer (Email)                     │ │
│  │  └─ Session Management                      │ │
│  └──────────────┬───────────────────────────────┘ │
│                 │                                  │
│        QUERY   │                                  │
│                ▼                                  │
│  ┌──────────────────────────────────────────────┐ │
│  │  DATABASE (Supabase/PostgreSQL)             │ │
│  │  ├─ users table                             │ │
│  │  └─ otp_codes table                         │ │
│  └──────────────────────────────────────────────┘ │
│                 │                                  │
│        SMTP    │                                  │
│                ▼                                  │
│  ┌──────────────────────────────────────────────┐ │
│  │  EMAIL SERVICE                              │ │
│  │  ├─ Gmail SMTP                              │ │
│  │  └─ Other providers (Outlook, etc.)        │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

This visual guide shows the complete OTP login implementation from user interaction through backend processing to database storage and email delivery.
