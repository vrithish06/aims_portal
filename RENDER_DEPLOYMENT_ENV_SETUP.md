# Render Deployment - Environment Variables Setup

## Issue Fixed ✅
Cookie domain was restricted, preventing cross-origin cookie access from frontend to backend. Fixed by detecting Render deployments and setting cookie domain to `.onrender.com`.

## Required Environment Variables for Render Backend Service

Set these in your Render backend service environment variables:

### Essential Variables
```
PORT=3000
NODE_ENV=production
SESSION_SECRET=<generate-a-long-random-string>
```

### Database
```
DATABASE_URL=<your-postgres-connection-string>
SUPABASE_URL=https://txzkywzjuogxswwsyjsh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-key>
```

### URLs (CRITICAL FOR COOKIE FIX)
```
BACKEND_URL=https://aims-portal-iitrpr.onrender.com
FRONTEND_URL=https://aims-portal-j2pp.onrender.com
```

**Note:** 
- `BACKEND_URL` is used to extract the parent domain (`.onrender.com`) for cookie configuration
- `FRONTEND_URL` is used for CORS whitelisting
- Both URLs are on `.onrender.com` so cookies will be shared automatically

## Frontend Environment Variables
```
VITE_API_BASE_URL=https://aims-portal-iitrpr.onrender.com
```

## How the Fix Works

1. **Domain Detection**: Code detects `.onrender.com` deployment
2. **Parent Domain Extraction**: Sets cookie domain to `.onrender.com` instead of full subdomain
3. **Cookie Sharing**: Both frontend (`aims-portal-j2pp.onrender.com`) and backend (`aims-portal-iitrpr.onrender.com`) can access the same session cookie

## Deployment Steps

1. Go to Render backend service settings
2. Add/update environment variables (see above)
3. Deploy backend
4. Frontend should already be configured correctly
5. Clear browser cookies and test

## Testing
1. Log in at `https://aims-portal-j2pp.onrender.com`
2. Navigate to StudentRecord page
3. Verify you remain logged in ✅
4. Check DevTools > Application > Cookies for `aims.sid` with domain `.onrender.com`
