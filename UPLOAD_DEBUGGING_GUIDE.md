# Upload Grades - 401 Authentication Error Debugging Guide

## Issue Summary
When uploading grades Excel file, the request returns **401 Unauthorized** error before reaching the backend controller. This indicates the authentication middleware is rejecting the request.

## Root Cause Analysis
The POST request to `/offering/:offeringId/upload-grades` is being rejected by Express session validation because:
1. Session cookies are not being sent with the POST request, OR
2. The session store (memory) doesn't have the session data, OR
3. The session ID in the cookie doesn't match what's in the session store

## Step-by-Step Debugging

### Step 1: Verify Browser Cookies Are Being Sent
1. Open Chrome DevTools: **F12 or Cmd+Option+I**
2. Go to **Network** tab
3. Attempt to upload an Excel file with grades
4. Find the POST request to `/offering/*/upload-grades`
5. Click on the request
6. Go to **Request Headers** section
7. Look for **Cookie** header

**Expected:**
```
Cookie: aims.sid=s%3A...
```

**If missing:**
- The browser isn't sending the session cookie with POST requests
- This could be a CORS or SameSite cookie issue
- Check if the login was successful (download should work if logged in)

### Step 2: Check Console Logs for Detailed Error Info
1. Open Chrome DevTools: **F12**
2. Go to **Console** tab
3. Attempt to upload again
4. Look for logs with `[UPLOAD]` prefix
5. Check for `[AXIOS]` logs showing request/response details

**Expected to see:**
```
[UPLOAD] File read successfully, size: 12345
[UPLOAD] Workbook parsed, sheets: ["Sheet1"]
[UPLOAD] Data parsed, rows: 5
[UPLOAD] Sending grades data to backend: {offeringId: "123", count: 5, ...}
[UPLOAD] Making axios POST request...
[AXIOS] ❌ POST /api/offering/123/upload-grades - Status: 401
[UPLOAD] Axios error details: {status: 401, message: "Authentication required", ...}
```

### Step 3: Check Backend Logs
1. Open the terminal where backend server is running
2. Look for logs with `[SESSION-DEBUG]` prefix
3. Attempt upload and watch the logs

**Expected to see:**
```
[SESSION-DEBUG] POST /api/offering/123/upload-grades
  - Session ID: s:abc123...
  - Has Session: true
  - Has User: true
```

**If you see:**
```
[SESSION-DEBUG] POST /api/offering/123/upload-grades
  - Session ID: s:abc123...
  - Has Session: true
  - Has User: false
```

This means the session exists but `req.session.user` is undefined, indicating the login session wasn't properly created.

### Step 4: Test Download First
1. Try downloading the grades (Download button should work)
2. Check if download works - this uses a GET request which is more forgiving
3. If download works but upload doesn't, the issue is specifically with POST requests or session cookies

**Note:** Download uses GET `/offering/:offeringId/enrollments` which doesn't require authentication.

### Step 5: Verify Login Session
1. Login to the application fresh
2. Navigate to a course offering with students
3. Check if you can see the student list (proves you're logged in)
4. Open DevTools Console
5. Type: `document.cookie`
6. You should see: `aims.sid=s%3A...` in the output

**If missing:**
- The login didn't properly set the session cookie
- Try logging out and logging in again
- Check if browser has cookies enabled

### Step 6: Compare GET vs POST
Compare a successful GET request with the failing POST:

**Successful GET (Download):**
```
GET /api/offering/123/enrollments HTTP/1.1
Host: localhost:5000
Cookie: aims.sid=s%3A...
```

**Failing POST (Upload):**
```
POST /api/offering/123/upload-grades HTTP/1.1
Host: localhost:5000
Cookie: [CHECK IF THIS EXISTS]
Content-Type: application/json
```

## Quick Fixes to Try

### Fix 1: Clear Browser Cache and Cookies
1. Go to Chrome Settings > Privacy and security > Clear browsing data
2. Select "Cookies and other site data"
3. Click Clear
4. Reload the application
5. Login again
6. Try upload again

### Fix 2: Restart Backend Server
1. Kill the backend process: `Ctrl+C` in the terminal
2. Restart: `cd backend && npm start` or `npm run dev`
3. Try upload again

### Fix 3: Check CORS Configuration
Ensure CORS is allowing credentials. In [server.js](backend/server.js):

```javascript
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,  // ✅ This MUST be true
  })
);
```

## Testing the Fix

Once the 401 error is resolved:

1. **Verify no error toast appears** - You should see a success message
2. **Check database** - Run this SQL:
   ```sql
   SELECT enrollment_id, grade, updated_at 
   FROM course_enrollment 
   WHERE offering_id = 123
   ORDER BY updated_at DESC 
   LIMIT 10;
   ```
3. **Refresh page** - Grades should appear in the table
4. **Check console** - Backend logs should show `[UPLOAD-GRADES] ✓ Updated grade for...`

## Contact Backend API Directly

If frontend still fails, test the backend directly:

```bash
# Get a session token first by logging in
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@example.com","password":"your_password"}' \
  -c cookies.txt  # Save cookies to file

# Now try uploading with the session
curl -X POST http://localhost:5000/api/offering/123/upload-grades \
  -H "Content-Type: application/json" \
  -b cookies.txt \  # Use saved cookies
  -d '{
    "grades": [
      {"student_email": "student1@example.com", "grade": "A"}
    ]
  }'
```

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 with no session in backend logs | Browser not sending cookies | Check CORS credentials:true, clear cookies, re-login |
| 401 with session but no user | Login session didn't set req.session.user | Re-login, check login controller sets session |
| CORS error in console | CORS not allowing credentials | Verify credentials: true in cors config |
| "Authentication required" message | requireAuth middleware failing | Check req.session and req.session.user exist |
| Silent failure | Catch block executing, error not displayed | Check browser console for [UPLOAD] logs |

## Files Modified for Debugging

- [frontend/src/pages/CourseDetailsPage.jsx](frontend/src/pages/CourseDetailsPage.jsx#L306) - Added detailed [UPLOAD] logging
- [backend/controllers/aimsController.js](backend/controllers/aimsController.js) - Added auth check inside uploadGrades function  
- [backend/routes/AimsRoutes.js](backend/routes/AimsRoutes.js) - Removed middleware auth, let controller check
- [backend/server.js](backend/server.js) - Session middleware with debug logging

## Next Steps
1. Follow Steps 1-3 above to gather diagnostic info
2. Run the curl commands to test backend directly
3. Share the backend log output showing [SESSION-DEBUG] entries
4. This will reveal exactly where the authentication is failing
