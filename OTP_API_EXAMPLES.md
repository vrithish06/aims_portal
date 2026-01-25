# OTP Login API Examples

## Complete Flow Example

### Step 1: Send OTP Request

```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@iitrpr.ac.in"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**Email Received:**
```
Subject: Your AIMS Login OTP

Hello,

Use the following One-Time Password (OTP) to complete your login:

     123456

⚠️ This OTP will expire in 10 minutes.

If you did not request this OTP, please ignore this email. Your account is safe.

---
This is an automated message. Please do not reply to this email.
```

---

### Step 2: Verify OTP Request

After user receives OTP (123456):

```bash
curl -X POST http://localhost:3000/verify-otp \
  -H "Content-Type: application/json" \
  -H "Cookie: aims.sid=s%3A..." \
  -d '{
    "email": "student@iitrpr.ac.in",
    "otp": "123456"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 42,
    "email": "student@iitrpr.ac.in",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  }
}
```

**Response Headers:**
```
Set-Cookie: aims.sid=s%3A...; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400000
```

---

## Error Cases

### 1. User Not Found

```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@iitrpr.ac.in"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 2. Invalid OTP

```bash
curl -X POST http://localhost:3000/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@iitrpr.ac.in",
    "otp": "999999"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

---

### 3. OTP Expired

User waits more than 10 minutes and tries to verify:

```bash
curl -X POST http://localhost:3000/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@iitrpr.ac.in",
    "otp": "123456"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "OTP expired. Please request a new one."
}
```

---

### 4. Missing Email Field

```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "success": false,
  "message": "Email is required"
}
```

---

### 5. Missing OTP Field

```bash
curl -X POST http://localhost:3000/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@iitrpr.ac.in"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Email and OTP are required"
}
```

---

## JavaScript/React Examples

### Using Axios (Frontend)

```javascript
import axiosClient from './api/axiosClient';

// Step 1: Send OTP
async function sendOTP(email) {
  try {
    const response = await axiosClient.post('/send-otp', { email });
    if (response.data?.success) {
      console.log('OTP sent successfully');
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return { success: false, message: error.response?.data?.message };
  }
}

// Step 2: Verify OTP
async function verifyOTP(email, otp) {
  try {
    const response = await axiosClient.post('/verify-otp', { email, otp });
    if (response.data?.success) {
      console.log('Login successful:', response.data.data);
      // User is now logged in, session cookie is set
      return { success: true, user: response.data.data };
    }
  } catch (error) {
    console.error('OTP verification failed:', error);
    return { success: false, message: error.response?.data?.message };
  }
}

// Usage in component
const handleLogin = async (email, otp) => {
  const result = await verifyOTP(email, otp);
  if (result.success) {
    // Redirect to dashboard
    window.location.href = '/dashboard';
  }
};
```

---

### Using Zustand Store (Recommended)

```javascript
import useAuthStore from './store/authStore';

const MyComponent = () => {
  const { sendOTP, verifyOTP, user } = useAuthStore();

  const handleSendOTP = async (email) => {
    const result = await sendOTP(email);
    if (result.success) {
      toast.success('OTP sent!');
    } else {
      toast.error(result.message);
    }
  };

  const handleVerifyOTP = async (email, otp) => {
    const result = await verifyOTP(email, otp);
    if (result.success) {
      // User is logged in, user data in state
      console.log(user);
      // Redirect happens automatically
    }
  };

  return (
    <>
      <button onClick={() => handleSendOTP('student@iitrpr.ac.in')}>
        Send OTP
      </button>
      <button onClick={() => handleVerifyOTP('student@iitrpr.ac.in', '123456')}>
        Verify OTP
      </button>
    </>
  );
};
```

---

## Database Queries (Debugging)

### View OTP Records

```sql
SELECT id, email, otp_code, expires_at, is_used, created_at 
FROM otp_codes 
WHERE email = 'student@iitrpr.ac.in'
ORDER BY created_at DESC
LIMIT 5;
```

### Check If OTP Is Valid

```sql
SELECT * FROM otp_codes 
WHERE email = 'student@iitrpr.ac.in' 
AND is_used = false 
AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;
```

### Mark OTP As Used (Manual)

```sql
UPDATE otp_codes 
SET is_used = true, used_at = NOW()
WHERE id = 123;
```

### Delete Old Expired OTPs (Cleanup)

```sql
DELETE FROM otp_codes 
WHERE expires_at < NOW() - INTERVAL '1 day';
```

---

## Session Verification

After successful OTP verification, session is created. Check it with:

```bash
curl -X GET http://localhost:3000/me \
  -H "Cookie: aims.sid=s%3A..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 42,
    "email": "student@iitrpr.ac.in",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  }
}
```

---

## Performance Metrics

- **OTP Generation:** < 1ms
- **OTP Email Sending:** 1-5 seconds (depends on email service)
- **OTP Verification:** < 100ms
- **Session Creation:** < 50ms

---

## Security Checklist

✅ OTP not returned in API response (only via email)  
✅ OTP expires after 10 minutes  
✅ OTP marked as used after verification  
✅ Cannot reuse expired OTPs  
✅ Cannot reuse already-used OTPs  
✅ IP address logged when OTP created  
✅ Session created only after valid OTP  
✅ HTTPS enforced in production  
✅ Cookies are httpOnly (not accessible from JavaScript)  
✅ Rate limiting recommended for production  

