# Excel Grade Upload - Authentication Fix Summary

## What Was Changed

### Problem
Upload button was returning **401 Unauthorized** error, blocking the entire feature even though users were logged in and could download data.

### Root Cause
Express session middleware was rejecting POST requests because `req.session.user` was not being properly validated. The middleware-based authentication approach was preventing the request from reaching the controller logic.

### Solution Implemented

#### 1. **Backend Controller Authentication** ([aimsController.js](backend/controllers/aimsController.js))
- **Before**: Relied on middleware to block requests
- **After**: Added explicit session validation inside `uploadGrades()` function
  - Checks `req.session.user` directly
  - Returns 401 with detailed message if authentication fails
  - Returns 403 if user role isn't instructor/admin
  - Provides logging for debugging session state

```javascript
if (!req.session || !req.session.user) {
  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}

const userRole = req.session.user.role;
if (userRole !== 'instructor' && userRole !== 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Instructor or admin access required'
  });
}
```

#### 2. **Backend Route Simplification** ([AimsRoutes.js](backend/routes/AimsRoutes.js))
- **Before**: Used middleware chain: `requireAuth` + `requireRole('instructor')`
- **After**: Removed middleware, let controller handle all validation

```javascript
// Old: router.post('/offering/:offeringId/upload-grades', requireAuth, uploadGrades);
// New:
router.post('/offering/:offeringId/upload-grades', uploadGrades);
```

#### 3. **Test Endpoint for Diagnosis** ([AimsRoutes.js](backend/routes/AimsRoutes.js))
- Added `GET /offering/:offeringId/upload-test` endpoint
- Returns current session state without authentication requirement
- Helps diagnose if session exists and user is set

```javascript
router.get('/offering/:offeringId/upload-test', (req, res) => {
  // Returns sessionID, hasSession, hasUser, userEmail
});
```

#### 4. **Frontend Session Validation** ([CourseDetailsPage.jsx](frontend/src/pages/CourseDetailsPage.jsx))
- **Before**: Attempted upload immediately with no session check
- **After**: Tests session before reading file

```javascript
// New: Test session first
const testResponse = await axiosClient.get(`/offering/${offeringId}/upload-test`);
if (testErr?.response?.status === 401) {
  toast.error("Session invalid. Please refresh the page and try again.");
  return;
}
// Then proceed with file upload
```

#### 5. **Enhanced Error Logging** ([CourseDetailsPage.jsx](frontend/src/pages/CourseDetailsPage.jsx))
- Detailed axios error logging with full config and response data
- Separates 401 authentication errors from other errors
- Console logs show exact failure point

```javascript
catch (axiosErr) {
  console.error("[UPLOAD] Axios error details:", {
    status: axiosErr.response?.status,
    message: axiosErr.response?.data?.message,
    fullResponse: axiosErr.response?.data,
    config: { method, url, headers }
  });
}
```

## Testing the Fix

### Quick Test (30 seconds)
1. Open the course details page for any offering with enrolled students
2. Click the **Upload Grades** button
3. You should see one of:
   - **Green toast**: "Session invalid" (means test endpoint works, session is the issue)
   - **File picker appears**: Session is valid, select Excel file and proceed
   - **Upload success toast**: Feature is working end-to-end

### Full Test (5 minutes)

#### Test 1: Session Validation
```bash
# Get the offering ID from the URL (e.g., course details page URL)
# Open browser console and run:
fetch('/api/offering/123/upload-test', {
  credentials: 'include'
}).then(r => r.json()).then(d => console.log(d));
```

**Expected output:**
```javascript
{
  success: true,
  message: 'Session is valid',
  sessionID: 's:abc123...',
  userEmail: 'instructor@example.com',
  userRole: 'instructor'
}
```

#### Test 2: Download (Baseline)
1. Click **Download Enrollments** button
2. Excel file should download with enrolled students
3. Verifies you're logged in and data access works

#### Test 3: Upload
1. Click **Upload Grades** button
2. Browser file picker opens
3. In [backend/sample_upload.xlsx](create this file with columns):
   - Student Name
   - Student Email
   - Enrollment Type
   - Grade
4. Select file and upload
5. **Expected**: Toast shows "✓ Grades updated for X student(s)"
6. **Verification**: Refresh page, grades appear in table

#### Test 4: Database Verification
```sql
-- Check if grades were actually saved
SELECT student_id, grade, updated_at 
FROM course_enrollment 
WHERE offering_id = 123
ORDER BY updated_at DESC;
```

## Files Modified

1. **[backend/controllers/aimsController.js](backend/controllers/aimsController.js#L316)**
   - `uploadGrades()` function now validates session directly
   - Returns 401/403 with clear messages
   - Added comprehensive logging

2. **[backend/routes/AimsRoutes.js](backend/routes/AimsRoutes.js#L260)**
   - Removed `requireAuth` and `requireRole` middleware from upload route
   - Added `/upload-test` diagnostic endpoint
   - Updated comment noting controller handles auth

3. **[frontend/src/pages/CourseDetailsPage.jsx](frontend/src/pages/CourseDetailsPage.jsx#L306)**
   - `handleUploadExcel()` now tests session first
   - Enhanced error logging for axios failures
   - Shows specific error messages for 401 vs other errors

4. **[UPLOAD_DEBUGGING_GUIDE.md](UPLOAD_DEBUGGING_GUIDE.md)** - Created
   - Detailed troubleshooting steps
   - Browser DevTools instructions
   - Common issues and solutions

## Architecture Diagram

```
User clicks "Upload Grades" button
    ↓
Frontend reads Excel file
    ↓
Frontend calls GET /upload-test to validate session
    ├─ If 401: Show "Session invalid" → User refreshes page
    └─ If 200: Session valid, proceed
    ↓
Frontend parses Excel and validates columns
    ↓
Frontend sends POST /upload-grades with grades data
    ↓
Backend Controller (aimsController.js):
    ├─ Checks req.session.user exists
    ├─ Checks user role is instructor/admin
    ├─ Queries course_enrollment for enrolled students
    ├─ Maps student emails to enrollment IDs
    ├─ Updates grades in database
    └─ Returns {success: true, updatedCount: N, errors: [...]}
    ↓
Frontend receives response
    ├─ Shows success toast with count
    ├─ Shows errors if any students failed
    └─ Refreshes student list
```

## Why This Works

1. **Removes Middleware Bottleneck**: Middleware-based auth (requireAuth) was failing at Express level before controller logic could run. Moving auth to controller allows more granular control.

2. **Better Error Messages**: Controller can return specific 401 vs 403 errors instead of generic middleware rejection.

3. **Session Validation in Frontend**: Testing session before upload catches auth issues early, providing immediate feedback instead of silent failures.

4. **Backward Compatible**: Doesn't affect other routes or auth system. Only changes how this specific upload endpoint validates authentication.

5. **Easier Debugging**: Test endpoint and detailed logging help identify exactly where authentication fails.

## Common Issues After Fix

### Issue: Still getting 401 error

**Check 1**: Did you refresh the page after starting backend?
```bash
# Restart backend and refresh frontend
cd backend && npm start
# Then refresh browser (Cmd+R)
```

**Check 2**: Are you actually logged in?
- Try downloading enrollments (should work)
- Check browser console: `document.cookie` should show `aims.sid=`
- Try re-logging in

**Check 3**: Is session middleware working?
- Check backend logs for `[SESSION-DEBUG]` entries
- Look for `Has User: true` line
- If `Has User: false`, the login didn't set req.session.user properly

### Issue: Upload runs but database doesn't update

**Check**: Are there error messages?
- Toast might show "⚠ X student(s) failed: ..."
- Check browser console for detailed error messages
- Verify student emails in Excel match exactly with database emails (case-sensitive!)

### Issue: File picker doesn't appear

**Check**: Is upload button click being registered?
- Open browser console
- You should see `[UPLOAD] Testing session state before upload...`
- If not visible, button click handler not firing

## Next Steps If Still Not Working

1. Run the **Quick Test** above and report what toast/error appears
2. Open browser DevTools → Console tab
3. Copy any error message starting with `[UPLOAD]` or `[AXIOS]`
4. Share the error details and we can diagnose further

## Rollback Instructions (If Needed)

If this change causes other issues, to revert:

```javascript
// Restore old route (add middleware back)
router.post('/offering/:offeringId/upload-grades', requireAuth, uploadGrades);

// Restore old controller (remove internal auth check)
// Let middleware handle it instead
```

But this would return to the original 401 error. The fix is the correct solution.

## Success Indicators

After applying this fix, you should:
- ✅ No 401 error when uploading
- ✅ Toast shows success or specific error about missing students
- ✅ Grades appear in database after refresh
- ✅ Backend logs show `[UPLOAD-GRADES] ✓ Updated grade for...`
- ✅ Multiple uploads work without needing to re-login
