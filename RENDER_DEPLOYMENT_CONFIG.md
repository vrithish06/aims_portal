# Render Deployment Configuration

## Problem
Cookies are not being created on the deployed Render website. This is due to missing environment variables and incorrect cookie configuration.

## Solution
Set the following environment variables on your Render deployment:

### Backend Service Environment Variables (on Render Dashboard)

```env
# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-aims-portal-2025
NODE_ENV=production

# CRITICAL: Frontend URL - Update with your actual Render frontend URL
FRONTEND_URL=https://your-frontend-app.onrender.com

# CRITICAL: Backend URL - The URL of your backend service on Render
BACKEND_URL=https://aims-portal-iitrpr.onrender.com

# Database
SUPABASE_URL=https://txzkywzjuogxswwsyjsh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4emt5d3pqdW9neHN3d3N5anNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NzgxNiwiZXhwIjoyMDg0MTQzODE2fQ.qFy6MwTiqNmTVh9ECGQXiYevDPwrNipPTk0vuuCy6pw
```

## Step-by-Step Instructions

### 1. Go to Render Dashboard
- Navigate to https://dashboard.render.com
- Select your backend service

### 2. Go to Environment Variables
- Click on "Environment" tab
- Add/Update the following variables:

| Variable Name | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enable HTTPS-only cookies |
| `FRONTEND_URL` | `https://your-frontend-url.onrender.com` | Your frontend Render URL |
| `BACKEND_URL` | `https://aims-portal-iitrpr.onrender.com` | Your backend Render URL |
| `SESSION_SECRET` | `<secure-random-string>` | Use a strong secret key |
| `SUPABASE_URL` | `https://txzkywzjuogxswwsyjsh.supabase.co` | Keep existing |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-key>` | Keep existing |

### 3. How Cookies Work Now

**Local Development (http://localhost)**
- `secure: false` - Cookies sent over HTTP
- `sameSite: lax` - Allow same-site requests
- No domain restriction

**Production on Render (https://)**
- `secure: true` - Cookies only sent over HTTPS
- `sameSite: none` - Allow cross-site requests (needed for frontend/backend on different Render URLs)
- Domain set to backend hostname (e.g., `aims-portal-iitrpr.onrender.com`)

### 4. Testing Cookie Creation

1. Log in on your deployed site
2. Open Browser DevTools → Application → Cookies
3. You should see `aims.sid` cookie with:
   - ✅ HTTPS-only (Secure flag)
   - ✅ Domain: `aims-portal-iitrpr.onrender.com`
   - ✅ Path: `/`
   - ✅ SameSite: None

### 5. Verify with Network Tab
1. Open DevTools → Network tab
2. Make login request
3. Check Response Headers for: `Set-Cookie: aims.sid=...`

## Troubleshooting

### Cookies Still Not Appearing?
1. **Check CORS**: Verify `FRONTEND_URL` matches exactly (case-sensitive, including https://)
2. **Check Environment Variables**: Confirm all 3 variables are set (NODE_ENV=production, FRONTEND_URL, BACKEND_URL)
3. **Check Backend Logs**: Look for `[CORS]` messages - should show allowed origin
4. **Browser Cache**: Hard refresh (Cmd+Shift+R on Mac)

### Common Issues
- ❌ `sameSite: none` without `secure: true` → Cookies rejected by browser
- ❌ CORS mismatch → Login response blocked, cookies not sent
- ❌ NODE_ENV != production → Cookies sent with secure: false (rejected on HTTPS)
- ❌ Missing BACKEND_URL → Domain not set on cookie

## Frontend Configuration

Your `.env.production` should have:
```env
VITE_API_BASE_URL=https://aims-portal-iitrpr.onrender.com
```

This is already configured and should work once backend environment variables are set.
