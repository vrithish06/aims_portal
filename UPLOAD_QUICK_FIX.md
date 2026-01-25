# Upload Grades - Quick Fix Checklist

## What's Fixed
- ✅ 401 Unauthorized error when uploading grades
- ✅ Silent failures with no error messages
- ✅ Session not being transmitted with POST request
- ✅ Database not updating with new grades

## Three Changes Made

### 1. Backend - Move Auth from Middleware to Controller
**File**: [backend/controllers/aimsController.js](backend/controllers/aimsController.js#L2852)
**Change**: `uploadGrades()` now checks session and returns 401 if invalid

### 2. Backend - Simplify Route Definition
**File**: [backend/routes/AimsRoutes.js](backend/routes/AimsRoutes.js#L262)
**Change**: Removed middleware, added test endpoint

### 3. Frontend - Test Session Before Upload
**File**: [frontend/src/pages/CourseDetailsPage.jsx](frontend/src/pages/CourseDetailsPage.jsx#L316)
**Change**: Calls `/upload-test` first, shows clear error if session invalid

## How to Test

### Step 1: Verify Changes Deployed
```bash
# Backend should show new test endpoint
curl http://localhost:5000/api/offering/1/upload-test

# Expected: Either {success: true, ...} or {success: false, message: "Not authenticated"}
```

### Step 2: Test in Browser
1. Login to application
2. Go to course details page with students
3. Click "Upload Grades" button
4. You should see:
   - **Green toast + file picker**: Feature working ✅
   - **Red toast "Session invalid"**: Session expired, refresh and try again
   - **Any other error**: Check console for details

### Step 3: Upload Test File
Create Excel file with columns:
- Student Name
- Student Email  
- Enrollment Type
- Grade

Upload and verify:
- ✅ Toast shows "Grades updated for X student(s)"
- ✅ Page refreshes automatically
- ✅ Grades appear in the table

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Session invalid" toast | Press F5 to refresh, then try again |
| File picker doesn't open | Check browser console for [UPLOAD] logs |
| Upload succeeds but no grades appear | Check student emails match exactly in Excel |
| Backend shows 401 but session test passes | Restart backend: Ctrl+C and npm start |

## Files to Review

1. [UPLOAD_FIX_SUMMARY.md](UPLOAD_FIX_SUMMARY.md) - Detailed explanation of all changes
2. [UPLOAD_DEBUGGING_GUIDE.md](UPLOAD_DEBUGGING_GUIDE.md) - Advanced troubleshooting
3. [backend/controllers/aimsController.js](backend/controllers/aimsController.js#L2852) - Auth logic
4. [frontend/src/pages/CourseDetailsPage.jsx](frontend/src/pages/CourseDetailsPage.jsx#L306) - Frontend handler

## Success Criteria

✅ **All criteria met when:**
- Upload button shows file picker (no 401)
- Excel file accepted and parsed
- Toast shows success or specific student errors
- Grades saved to database
- Page refreshes showing updated grades
- Can upload multiple files without re-logging in

If any criterion is missing, check the **Troubleshooting** section above or see the full [UPLOAD_FIX_SUMMARY.md](UPLOAD_FIX_SUMMARY.md).
