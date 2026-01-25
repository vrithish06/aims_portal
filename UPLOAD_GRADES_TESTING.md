# Upload Grades - Troubleshooting & Testing Guide

## Changes Made

### Frontend (CourseDetailsPage.jsx)
✅ Fixed async/await issue in file reader
✅ Added comprehensive console logging
✅ Improved error messages with checkmarks and detailed feedback
✅ Better error handling for file reading
✅ Shows partial success (updated count + failed count)

### Backend (aimsController.js)
✅ Improved student lookup - now queries from course_enrollment directly
✅ Maps enrolled students by email for accurate matching
✅ Better error messages showing which students failed
✅ Enhanced logging at each step
✅ Uses enrollment_id directly for updates (more reliable)

---

## How to Test

### Step 1: Download Enrolled Students
1. Go to Course Details page
2. Click **Enrollments** tab
3. Click **Download** button
4. File downloads with only enrolled students

### Step 2: Prepare Excel File for Upload
1. Open downloaded Excel file
2. Add a new column: **Grade** (exactly this spelling)
3. Fill in grades for each student:
   - A, A-, B+, B, B-, C+, C, D, F
   - Or any grade format you use
4. Save file

### Step 3: Upload Grades
1. Go back to Enrollments tab
2. Click **Upload Grades** button
3. Select your modified Excel file
4. Watch console (Open DevTools: F12 or Right-click → Inspect → Console)
5. You should see:
   - ✓ File read successfully
   - ✓ Data parsed
   - ✓ Validation passed
   - ✓ Sending to backend
   - ✓ Response from backend

### Step 4: Check Results
- Look for toast notification (top right)
  - Green: ✓ Grades updated for X student(s)
  - Red: ✗ Error message
- Check browser console for detailed logs
- Check database directly or refresh page to see grades

---

## Console Logs to Expect

### Successful Upload
```
[UPLOAD] File read successfully, size: 2048
[UPLOAD] Workbook parsed, sheets: ['Enrollments']
[UPLOAD] Data parsed, rows: 3
[UPLOAD] First row: {Student Name: 'John Doe', Student Email: 'john@college.edu', ...}
[UPLOAD] Validation passed, all columns present
[UPLOAD] Sending grades data to backend: {...}
[UPLOAD] Response: {success: true, updatedCount: 3, ...}
✓ Grades updated for 3 student(s)
```

### Backend Logs
```
[UPLOAD-GRADES] Processing 3 grade records for offering 123
[UPLOAD-GRADES] Validation passed, processing 3 valid records
[UPLOAD-GRADES] Found 5 enrolled students
[UPLOAD-GRADES] Mapped john@college.edu -> student_id 456
[UPLOAD-GRADES] Student map created with 5 entries
[UPLOAD-GRADES] Updating grade for student john@college.edu: A
[UPLOAD-GRADES] ✓ Updated grade for john@college.edu
[UPLOAD-GRADES] Completed: 3 updated, 0 errors
```

---

## Common Issues & Solutions

### Issue: "Excel file is empty"
**Cause:** File has no data rows
**Solution:**
- Make sure you have student rows (not just headers)
- Re-download and try again

### Issue: "Missing columns: Grade"
**Cause:** Column name is not exactly "Grade"
**Solution:**
- Check spelling (case-sensitive)
- Column must be named: **Grade**
- Not "grade", "GRADE", "Grades"

### Issue: "No students found in response"
**Cause:** Console shows but no toast message appears
**Solution:**
- Check browser console (F12)
- Look for [UPLOAD] logs
- Check network tab (F12 → Network)
- Verify API endpoint is being called

### Issue: "Student not found or not enrolled"
**Cause:** Email in Excel doesn't match database
**Solution:**
- Download fresh list to get exact emails
- Copy emails from downloaded file
- Check for extra spaces or typos
- Email must match exactly

### Issue: No change in database
**Cause:** Multiple possible reasons
**Solution:**
1. Check console logs for errors
2. Verify student email matches enrolled students
3. Check that enrollment has "enrolled" status
4. Check database directly with SQL:
   ```sql
   SELECT * FROM course_enrollment 
   WHERE offering_id = YOUR_OFFERING_ID
   ORDER BY student_id;
   ```
5. Check grade column:
   ```sql
   SELECT enrollment_id, student_id, grade 
   FROM course_enrollment 
   WHERE offering_id = YOUR_OFFERING_ID 
   AND grade IS NOT NULL;
   ```

---

## Advanced Testing

### Test 1: Check Student Email Format
Before uploading, verify emails in your database:

```sql
SELECT DISTINCT st.email 
FROM student st
JOIN course_enrollment ce ON st.student_id = ce.student_id
WHERE ce.offering_id = YOUR_OFFERING_ID
ORDER BY st.email;
```

Then ensure your Excel file has exact matches (case-insensitive, but spacing matters).

### Test 2: Verify API Endpoint
Open browser DevTools (F12) → Network tab:
1. Click Upload Grades
2. Look for POST request to `/offering/{id}/upload-grades`
3. Check Request tab for correct JSON structure
4. Check Response tab for success/error message

### Test 3: Check Database Trigger
The grade update should trigger automatic sync:

```sql
-- Check if grades were inserted
SELECT enrollment_id, student_id, grade, updated_at 
FROM course_enrollment 
WHERE offering_id = YOUR_OFFERING_ID 
AND grade IS NOT NULL
LIMIT 5;

-- Check if student_credit was updated
SELECT * FROM student_credit 
WHERE enrollment_id IN (...)
ORDER BY credit_id DESC;
```

---

## Debug Checklist

- [ ] Downloaded file shows only "enrolled" students
- [ ] Added "Grade" column (exact spelling, case-sensitive)
- [ ] File saved as .xlsx format
- [ ] No empty rows in data
- [ ] Student emails match exactly (copy from download)
- [ ] Opened browser console (F12)
- [ ] Upload button triggers file picker
- [ ] Console shows [UPLOAD] logs
- [ ] Toast message appears (success or error)
- [ ] Check network tab shows API request
- [ ] Check response shows success or errors
- [ ] Refresh page to see grades in table
- [ ] Query database to verify grades saved

---

## Quick SQL Queries for Testing

### View all enrolled students for a course
```sql
SELECT 
  ce.enrollment_id,
  ce.student_id,
  st.email,
  st.user_id,
  u.email as user_email,
  ce.enrol_status,
  ce.grade
FROM course_enrollment ce
JOIN student st ON ce.student_id = st.student_id
JOIN users u ON st.user_id = u.id
WHERE ce.offering_id = 123
AND ce.enrol_status = 'enrolled'
ORDER BY st.email;
```

### Check which students received grades
```sql
SELECT 
  st.email,
  ce.grade,
  ce.updated_at
FROM course_enrollment ce
JOIN student st ON ce.student_id = st.student_id
WHERE ce.offering_id = 123
AND ce.grade IS NOT NULL
ORDER BY st.email;
```

### View all data for an enrollment
```sql
SELECT * FROM course_enrollment 
WHERE enrollment_id = YOUR_ENROLLMENT_ID;
```

---

## Contact System Admin

If issues persist:
1. Share console logs (F12 → Console → Right-click → Save As)
2. Share network request/response (F12 → Network → Find POST request)
3. Check backend logs for [UPLOAD-GRADES] messages
4. Verify database connection is working
5. Verify xlsx package is installed

---

## Success Indicators

You'll know it's working when:
✅ Toast shows "✓ Grades updated for X student(s)"
✅ Console shows [UPLOAD-GRADES] logs on backend
✅ Refresh page and grades appear in enrollment table
✅ Database query returns updated grades
✅ Partial failures show specific error messages

---

**Last Updated:** January 25, 2026
**Status:** Ready for Testing
