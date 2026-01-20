# Session-Based Authentication Setup Guide

## Overview
Your application now uses session-based authentication instead of localStorage. Sessions are stored in your Supabase PostgreSQL database.

## Database Setup

### 1. Create Sessions Table
Run the following SQL in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Create sessions table for express-session with connect-pg-simple
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Create index on session ID for faster lookups
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Create index on session ID
CREATE INDEX IF NOT EXISTS IDX_session_sid ON sessions(sid);

-- Add primary key constraint
ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Optional: Add a comment to the table
COMMENT ON TABLE sessions IS 'Session store for express-session with connect-pg-simple';
```

### 2. Environment Variables
Make sure your `.env` file has:
```
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-aims-portal-2025
FRONTEND_URL=http://localhost:5173
```

## How It Works

### Backend Changes:
- **Session Creation**: When users log in, a session is created and stored in the database
- **Session Cookie**: The session ID is sent as an `httpOnly` cookie to the client
- **Session Validation**: Protected routes check for valid sessions
- **Session Destruction**: Logout destroys the session and clears the cookie

### Frontend Changes:
- **Cookie-Based**: Authentication now relies on HTTP cookies instead of localStorage
- **API Calls**: Login/logout happen through API calls that set/clear cookies
- **Session Check**: App initialization checks current session status

## API Endpoints

### Authentication Endpoints:
- `POST /login` - Creates session and sets cookie
- `POST /logout` - Destroys session and clears cookie
- `GET /me` - Returns current user if authenticated

### Protected Routes:
Add `requireAuth` middleware to any route that needs authentication:

```javascript
import { requireAuth } from './controllers/aimsController.js';

// Protected route example
router.get('/protected', requireAuth, (req, res) => {
  // req.user contains the authenticated user data
  res.json({ message: 'Protected content' });
});
```

## Security Features:
- **HttpOnly Cookies**: Session cookies cannot be accessed by JavaScript
- **Secure Sessions**: Sessions expire after 24 hours
- **Automatic Cleanup**: Expired sessions are automatically removed
- **CSRF Protection**: CORS configured for your frontend domain

## Testing:
1. Start your backend: `npm run dev`
2. Start your frontend: `npm run dev`
3. Login through the login page
4. Check browser DevTools → Application → Cookies to see the session cookie
5. Refresh the page - you should stay logged in
6. Logout and refresh - you should be logged out

## Production Considerations:
- Change `SESSION_SECRET` to a strong, random secret
- Set `cookie.secure = true` when using HTTPS
- Consider shorter session timeouts for sensitive applications
- Implement session rotation for security