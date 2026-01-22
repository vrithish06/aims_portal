# Quick Test Checklist: Instructor & Admin Features

## Pre-Test Setup
- [ ] Backend running: `npm start` (should see "Server running on port 3000")
- [ ] Frontend running: `npm run dev` (should see "Local: http://localhost:5173")
- [ ] Test data available (courses, students, instructors)

---

## Instructor Approval Testing

### 1. View Pending Approvals
- [ ] Log in as **instructor**
- [ ] Click "My Offerings" in navigation
- [ ] Click "View Details" on any course
- [ ] See "Enrolled Students" table
- [ ] Filter by status: **"pending instructor approval"**
- [ ] Verify students with this status appear

### 2. Approve Single Student
- [ ] With filter applied (see above)
- [ ] Click **"Approve"** button next to a student
- [ ] See toast: "Student approved by instructor. Pending advisor approval."
- [ ] Student status changes to **"pending advisor approval"** (orange badge)

### 3. Approve All Students
- [ ] With "pending instructor approval" filter applied
- [ ] See **"Accept All"** button at top
- [ ] Click **"Accept All"**
- [ ] See toast: "X students approved successfully. Pending advisor approval."
- [ ] All filtered students now show **"pending advisor approval"**

### 4. Try Unapproved Access
- [ ] Log in as **different instructor**
- [ ] Go to course details of first instructor's course
- [ ] Try to click "Approve" for their students
- [ ] Should see error: "You can only update enrollments for your offerings"

---

## Admin Course Management Testing

### 1. View All Courses
- [ ] Log in as **admin**
- [ ] Click "My Offerings" in navigation
- [ ] See title: **"Manage All Course Offerings"**
- [ ] See ALL courses in system (not just own)
- [ ] See courses from different instructors

### 2. Accept Proposed Course
- [ ] Find a course with status **"Proposed"** (blue badge)
- [ ] See yellow section: "Review Proposed Offering"
- [ ] Click **"Accept"** button
- [ ] See toast: "Offering accepted successfully!"
- [ ] Course status changes to **"Enrolling"** (green badge)

### 3. Reject Proposed Course
- [ ] Find another course with status **"Proposed"**
- [ ] Click **"Reject"** button
- [ ] See toast: "Offering rejected successfully!"
- [ ] Course status changes to **"Rejected"** (gray badge)

---

## Status Value Verification

### Correct Status Names (with spaces)
```
✅ "pending instructor approval"  (not pending_instructor_approval)
✅ "pending advisor approval"     (not pending_advisor_approval)
✅ "instructor rejected"
✅ "advisor rejected"
✅ "student dropped"
✅ "student withdrawn"
✅ "enrolled"
```

### Check Database
```sql
SELECT DISTINCT enrol_status FROM course_enrollment;
-- Should show status names WITH SPACES, not underscores
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No "Approve" button | Wrong status name | Check database - must have spaces |
| "Access Denied" error | Not logged in | Log in first |
| Can't see other courses | Instructor, not admin | Log in as admin account |
| Status not updating | Backend offline | Check `npm start` terminal |
| Old status still showing | Browser cache | Refresh page (Ctrl+F5) |

---

## Quick Debugging

### Check Backend Health
```powershell
# In backend terminal
# Should see: "✓ Server running on port 3000"
```

### Check Browser Console
- Press `F12` to open developer tools
- Go to "Console" tab
- Look for error messages in red
- Check "Network" tab for failed requests

### Check Database Status
```sql
-- Check if enrollment has correct status
SELECT enrollment_id, student_id, enrol_status 
FROM course_enrollment 
LIMIT 5;
```

---

## Success Criteria

✅ **Instructor Can**:
- [x] See students waiting for approval
- [x] Approve individual students
- [x] Bulk approve multiple students
- [x] Only approve their own course's enrollments

✅ **Admin Can**:
- [x] See all course offerings
- [x] Accept proposed courses
- [x] Reject proposed courses
- [x] Manage any course regardless of owner

✅ **Database**:
- [x] Enrollment status uses spaces (not underscores)
- [x] Status values match constraint check
- [x] Status updates persist after page refresh

---

**Ready to Test!** 🚀

Follow the checklist above to verify all features work correctly.
