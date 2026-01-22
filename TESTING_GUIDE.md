# AIMS Portal - Complete Testing Guide

This document provides step-by-step instructions for testing all implemented features across the Student, Teacher/Instructor, and Admin modules.

## Environment Setup

### Prerequisites
- Node.js and npm installed
- Backend running: `npm start` (port 3000)
- Frontend running: `npm run dev` (port 5173)
- Supabase database configured and accessible

### Test Accounts Needed
Create or verify the following test accounts in your database:

```
Student Account:
- Email: student@iitrpr.ac.in
- Password: test123
- Role: student

Instructor Account:
- Email: instructor@iitrpr.ac.in
- Password: test123
- Role: instructor

Admin Account:
- Email: admin@iitrpr.ac.in
- Password: test123
- Role: admin
```

---

## Module 1: STUDENT MODULE

### Test 1.1: My Courses Page (EnrolledCoursesPage)

**Feature: Display Instructor Names**
1. Login as student
2. Navigate to "My Courses" page
3. View enrolled courses
4. **Verify:** Each course card displays instructor name and email
5. **Expected:** Shows "Instructor: [Name] ([Email])"

**Feature: Filter by Status**
1. On "My Courses" page, locate filter section
2. Toggle status filters (Enrolled, Completed, Withdrawn, Dropped)
3. **Verify:** Course list updates to show only selected statuses
4. **Expected:** List refills dynamically without page reload

**Feature: Filter by Session**
1. On "My Courses" page, locate session filter section
2. Select one or more academic sessions
3. **Verify:** Course list shows only courses from selected sessions
4. **Expected:** Sessions appear in chronological order

**Feature: Withdraw from Course**
1. Find an enrolled course (enrol_status = "enrolled")
2. Click on the course card to expand details
3. Look for "Withdraw" button (should be visible only for enrolled courses)
4. Click "Withdraw" button
5. **Verify:** Confirmation dialog appears asking "Are you sure you want to withdraw?"
6. Click "OK" to confirm
7. **Expected:** 
   - Toast notification: "Course withdrawal successful"
   - Enrollment status changes to "withdrawn"
   - Course disappears from "Enrolled" filter view

**Feature: Drop Course**
1. Find an enrolled course (enrol_status = "enrolled")
2. Click on the course card to expand details
3. Look for "Drop" button (should be visible only for enrolled courses)
4. Click "Drop" button
5. **Verify:** Confirmation dialog appears asking "Are you sure you want to drop?"
6. Click "OK" to confirm
7. **Expected:**
   - Toast notification: "Course dropped successfully"
   - Enrollment status changes to "dropped"
   - Course disappears from "Enrolled" filter view

**Endpoint Testing (Withdrawal):**
```bash
curl -X POST http://localhost:3000/offering/1/withdraw \
  -H "Cookie: aims.sid=[session-id]" \
  -H "Content-Type: application/json"
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully withdrawn from course",
  "data": { "enrollment_id": 1, "enrol_status": "withdrawn", ... }
}
```

---

### Test 1.2: Student Record Page (StudentRecordPage)

**Feature: CGPA Calculator**
1. Navigate to "Student Record" page
2. Locate "Academic Summary" or "GPA Statistics" section
3. **Verify:** CGPA is displayed with 2 decimal precision
4. **Test Cases:**
   - Student with no grades: CGPA should show 0.00
   - Student with all A's: CGPA should be 4.00
   - Student with mixed grades: Calculate manually and verify
5. **Formula Check:**
   - A = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, B- = 2.7
   - C+ = 2.3, C = 2.0, C- = 1.7, D+ = 1.3, D = 1.0, F = 0.0

**Feature: Session-Grouped Course Display**
1. On "Student Record" page, scroll to course records section
2. **Verify:** Courses are grouped by academic session
3. **Expected:** Each session shown as expandable/collapsible section
4. **Example:**
   ```
   ▼ 2024-1 (SGPA: 3.85)
     - Course 1: A (Grade)
     - Course 2: B+ (Grade)
   ▼ Fall-2024 (SGPA: 3.92)
     - Course 3: A- (Grade)
     - Course 4: A (Grade)
   ```

**Feature: SGPA Calculation**
1. Open session group on Student Record page
2. Check SGPA value displayed for that session
3. **Manual Verification:**
   - Add up grade points for all courses in session
   - Divide by number of courses
   - Verify against displayed SGPA
4. **Test Case:** Session with 3 courses [A (4.0), B (3.0), A- (3.7)]
   - SGPA = (4.0 + 3.0 + 3.7) / 3 = 3.57

---

### Test 1.3: Course Offerings Page (CourseOfferingsPage)

**Feature: Conditional Enrollment Based on Status**
1. Navigate to "Course Offerings" page
2. Find courses with different statuses (Proposed, Enrolling, Running, Cancelled, Rejected)
3. **Verify:**
   - Status = "Enrolling" → Shows enrollment dropdown with options:
     - Credit
     - Credit for Minor
     - Credit for Concentration
     - Credit for Audit
   - Status ≠ "Enrolling" → Shows "Enrollment Not Available" badge
   - Status = "Cancelled" → Shows "Enrollment Cancelled" badge (red)
   - If already enrolled → Shows "Enrolled as [Type]" badge (green)

**Feature: Credit Display**
1. On course offerings list
2. **Verify:** Each course shows credit hours
3. **Expected:** Credit value visible (e.g., "3 Credits")

---

### Test 1.4: Course Details Page (Student View)

**Feature: Horizontal Layout**
1. Navigate to Course Details from Enrolled Courses
2. **Verify:** Page uses side-by-side layout with:
   - Left sidebar: Course information (sticky)
   - Right area: Student list and filters
3. **Test Responsiveness:**
   - Desktop (1024px+): Side-by-side layout
   - Tablet (768px): Stacked layout
   - Mobile (320px): Responsive design

---

## Module 2: TEACHER/INSTRUCTOR MODULE

### Test 2.1: Course Add Page (CourseAddPage)

**Feature: No Course Status Field**
1. Login as instructor
2. Navigate to "Add Course" page
3. **Verify:** Course status dropdown is NOT visible in form
4. **Verify:** Form contains these fields:
   - Course Code
   - Course Title
   - L-T-P Credits
   - Has Lab (checkbox)
   - Degree
   - Department
   - Academic Session
   - Slot
   - Section
   - Prerequisites (add/remove)

**Feature: Offering Status Defaults to "Proposed"**
1. Create a new course with all required fields
2. Submit form
3. **Verify:** New course offering is created with status = "Proposed"
4. **Check:** Go to My Offerings page
5. **Verify:** Newly created offering shows "Proposed" badge (yellow/warning)

---

### Test 2.2: My Offerings Page (MyOfferingsPage)

**Feature: Offering Status Dropdown for Proposed Courses**
1. Login as instructor
2. Navigate to "My Offerings" page
3. Find a course with status = "Proposed"
4. **Verify:** Course card shows:
   - Yellow/warning badge: "Proposed"
   - Two buttons: "Accept" and "Reject"
   - Message: "Review Proposed Offering"
5. **Test Accept Action:**
   - Click "Accept" button
   - **Verify:** Toast notification "Offering accepted successfully!"
   - **Verify:** Status changes from "Proposed" to "Enrolling"
   - **Verify:** Accept/Reject buttons disappear
6. **Test Reject Action:**
   - Create another Proposed offering
   - Click "Reject" button
   - **Verify:** Toast notification "Offering rejected successfully!"
   - **Verify:** Status changes to "Rejected"
   - **Verify:** Accept/Reject buttons disappear

**Feature: Clickable Course Cards**
1. On "My Offerings" page, click on any course card (except buttons)
2. **Verify:** Navigates to `/course/[offeringId]` (Course Details page)
3. **Verify:** Offering details load in the page

**Feature: Running Status Checkmark**
1. On "My Offerings" page
2. Find a course with status = "Running"
3. **Verify:** Green checkmark icon appears in top-right corner of card
4. **Verify:** Checkmark only shows for "Running" status

**Feature: Filters Remain Enabled**
1. On "My Offerings" page
2. **Verify:** Filters are visible:
   - Session filter
   - Department filter
   - Degree filter
   - Slot filter
3. Apply various filter combinations
4. **Verify:** Course list updates based on filters

---

### Test 2.3: Course Details Page (Teacher View)

**Feature: Horizontal Layout**
1. Login as instructor
2. Navigate to one of your course offerings
3. **Verify:** Page layout is horizontal with:
   - Left sticky sidebar: Course details
   - Right main area: Student list

**Feature: Student Approval Workflow**
1. In Course Details, find "Enrolled Students" section
2. Look for students with status = "Pending Advisor Approval"
3. **Verify:** Each pending student has:
   - Checkbox (unchecked by default)
   - Enrollment type displayed
   - Status showing "Pending Advisor Approval"
   - "Approve" button (disabled until action)
4. **Test Individual Approval:**
   - Click checkbox next to a pending student
   - Click "Approve" button
   - **Verify:** Toast notification "Student approved successfully"
   - **Verify:** Status changes to "Enrolled"
   - **Verify:** Student row updates in real-time

**Feature: Bulk Approval (Accept All)**
1. In Course Details, with multiple pending students
2. **Verify:** "Accept All" button is visible (only if pending students exist)
3. Click "Accept All" button
4. **Verify:** Confirmation dialog shows number of students to approve
5. Confirm action
6. **Verify:**
   - Toast notification showing all students approved
   - All pending students now show "Enrolled" status
   - Checkboxes are cleared

**Feature: Status Filters**
1. In Course Details student list, find filter dropdowns
2. **Verify:** Filters available:
   - Enrollment Type filter
   - Status filter
3. Apply filters
4. **Verify:** Student list updates to match selections

---

## Module 3: ADMIN MODULE

### Test 3.1: Course Offerings Page (Admin View)

**Feature: Offering Status Dropdown (Same as Instructor)**
1. Login as admin
2. Navigate to "Course Offerings" page
3. Find courses with status = "Proposed"
4. **Verify:** Accept/Reject buttons appear
5. Follow same testing as Teacher Module Test 2.2

---

### Test 3.2: Course Details Page (Admin View)

**Feature: Student Approval Workflow (Same as Instructor)**
1. Login as admin
2. Navigate to any course offering details
3. **Verify:** Can see and approve pending students (same as teacher workflow)
4. Test individual approval
5. Test bulk approval

---

## Integration Tests

### Test 4.1: End-to-End Enrollment Flow

**Scenario:** Student enrolls, gets approved, withdraws

1. **Step 1: Enroll as Student**
   - Login as student
   - Go to "Course Offerings"
   - Find an Enrolling course
   - Click enrollment dropdown
   - Select "Credit"
   - **Verify:** Enrollment created with status = "pending_advisor_approval"

2. **Step 2: Approve as Instructor**
   - Login as instructor (course owner)
   - Go to Course Details
   - Find student in pending list
   - Click Approve button
   - **Verify:** Status changes to "Enrolled"

3. **Step 3: Withdraw as Student**
   - Login as student
   - Go to "My Courses"
   - Find newly enrolled course
   - Click Withdraw button
   - **Verify:** Enrollment status changes to "withdrawn"

4. **Step 4: Verify in Course Details (Instructor)**
   - Login as instructor
   - Go to Course Details
   - Find student in enrolled list
   - **Verify:** Status shows "Withdrawn"

---

### Test 4.2: Course Offering Lifecycle

**Scenario:** Create → Review → Accept → Open for Enrollment → Close

1. **Create (Instructor)**
   - Create new course offering
   - Verify status = "Proposed"

2. **Review (Instructor)**
   - Go to My Offerings
   - See Accept/Reject buttons

3. **Accept (Instructor)**
   - Click Accept
   - Verify status = "Enrolling"

4. **Enroll (Student)**
   - Student enrolls in course
   - Verify enrollment appears

5. **Approve Students (Instructor/Admin)**
   - Approve pending students
   - Verify status updates

6. **Cancel (Optional)**
   - Instructor cancels offering
   - All enrollments cascade to "cancelled"

---

## API Testing

### Test 5.1: Withdrawal Endpoint

**Request:**
```bash
curl -X POST http://localhost:3000/offering/1/withdraw \
  -H "Cookie: aims.sid=[session-id]" \
  -H "Content-Type: application/json"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Successfully withdrawn from course",
  "data": {
    "enrollment_id": 1,
    "student_id": 1,
    "offering_id": 1,
    "enrol_status": "withdrawn",
    "enrol_type": "Credit"
  }
}
```

**Expected Response (Student Not Found):**
```json
{
  "success": false,
  "message": "Student record not found"
}
```

---

### Test 5.2: Drop Endpoint

**Request:**
```bash
curl -X POST http://localhost:3000/offering/1/drop \
  -H "Cookie: aims.sid=[session-id]" \
  -H "Content-Type: application/json"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Successfully dropped from course",
  "data": {
    "enrollment_id": 1,
    "student_id": 1,
    "offering_id": 1,
    "enrol_status": "dropped",
    "enrol_type": "Credit"
  }
}
```

---

### Test 5.3: Offering Status Update Endpoint

**Request:**
```bash
curl -X PUT http://localhost:3000/offering/1/status \
  -H "Cookie: aims.sid=[session-id]" \
  -H "Content-Type: application/json" \
  -d '{"status": "Accepted"}'
```

**Expected Response (Accept):**
```json
{
  "success": true,
  "message": "Offering status updated successfully",
  "data": {
    "offering_id": 1,
    "status": "Enrolling"
  }
}
```

**Expected Response (Reject):**
```json
{
  "success": true,
  "message": "Offering status updated successfully",
  "data": {
    "offering_id": 1,
    "status": "Rejected"
  }
}
```

---

### Test 5.4: Enrollment Status Update Endpoint

**Request:**
```bash
curl -X PUT http://localhost:3000/offering/1/enrollments/5 \
  -H "Cookie: aims.sid=[session-id]" \
  -H "Content-Type: application/json" \
  -d '{"enrol_status": "enrolled"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Enrollment status updated to enrolled",
  "data": {
    "enrollment_id": 5,
    "student_id": 2,
    "offering_id": 1,
    "enrol_status": "enrolled"
  }
}
```

---

### Test 5.5: Cancel Offering Endpoint

**Request:**
```bash
curl -X POST http://localhost:3000/offering/1/cancel \
  -H "Cookie: aims.sid=[session-id]" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Course offering cancelled and all enrollments updated"
}
```

**Verify in Database:**
- course_offering.status = "Cancelled"
- All course_enrollment records for offering_id = "cancelled"

---

## Error Testing

### Test 6.1: Authorization Errors

**Test: Unauthorized Withdrawal**
1. Student A tries to withdraw from Student B's enrollment
2. **Expected:** 403 Forbidden or 404 Not Found

**Test: Unauthorized Approval**
1. Instructor A tries to approve students in Instructor B's course
2. **Expected:** 403 Forbidden error

**Test: Unauthorized Status Update**
1. Student tries to update offering status
2. **Expected:** 403 Forbidden error

---

### Test 6.2: Validation Errors

**Test: Withdraw from Non-Existent Enrollment**
1. Request withdrawal for offering student isn't enrolled in
2. **Expected:** 404 Enrollment not found

**Test: Drop Already Dropped Course**
1. Drop same course twice
2. **Expected:** Should fail or show warning

---

## Browser Compatibility Testing

Test these features on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Check:**
- Layout responsiveness (mobile, tablet, desktop)
- Toast notifications visibility
- Form input functionality
- Button click handlers
- Modal dialogs display

---

## Performance Testing

### Test 7.1: Large Dataset Handling

1. Student with 30+ enrolled courses
2. Course with 100+ enrolled students
3. **Verify:**
   - Page loads within 2 seconds
   - Filters work smoothly
   - Sorting/pagination functional

---

## Deployment Testing

### Test 8.1: Production Environment (Render)

1. Deploy frontend to Render
2. Deploy backend to Render
3. Update `FRONTEND_URL` and `BACKEND_URL` in backend env
4. Test all features with HTTPS
5. **Verify:** Cookies created with secure flag
6. **Check:** CORS headers properly configured

---

## Test Results Summary

Use this checklist to track test completion:

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Display Instructor Names | ⬜ | |
| 1.2 | Filter by Status | ⬜ | |
| 1.3 | Filter by Session | ⬜ | |
| 1.4 | Withdraw Course | ⬜ | |
| 1.5 | Drop Course | ⬜ | |
| 1.6 | CGPA Calculator | ⬜ | |
| 1.7 | Session Grouping | ⬜ | |
| 1.8 | SGPA Calculation | ⬜ | |
| 1.9 | Enrollment Conditional | ⬜ | |
| 2.1 | No Course Status Field | ⬜ | |
| 2.2 | Offering Default "Proposed" | ⬜ | |
| 2.3 | Status Dropdown | ⬜ | |
| 2.4 | Clickable Cards | ⬜ | |
| 2.5 | Running Checkmark | ⬜ | |
| 2.6 | Teacher Student Approval | ⬜ | |
| 3.1 | Admin Student Approval | ⬜ | |
| 4.1 | E2E Enrollment Flow | ⬜ | |
| 4.2 | Course Lifecycle | ⬜ | |
| 5.1 | Withdrawal API | ⬜ | |
| 5.2 | Drop API | ⬜ | |
| 5.3 | Status Update API | ⬜ | |
| 5.4 | Approval API | ⬜ | |
| 5.5 | Cancel Offering API | ⬜ | |
| 6.1 | Authorization Errors | ⬜ | |
| 6.2 | Validation Errors | ⬜ | |
| 7.1 | Large Dataset | ⬜ | |
| 8.1 | Production Deployment | ⬜ | |

**Legend:** ✅ Passed | ❌ Failed | ⚠️ Partial | ⬜ Not Tested

---

## Known Issues & Workarounds

### Issue: Cookies not created on localhost
**Workaround:** Ensure `NODE_ENV=development` in `.env`

### Issue: CORS errors
**Workaround:** Verify `FRONTEND_URL` matches exactly in backend `.env`

### Issue: Session expires too quickly
**Workaround:** Adjust `SESSION_TIMEOUT` in server.js if needed

---

## Contact & Support

For issues or questions during testing:
1. Check browser console for error messages
2. Check backend logs for API errors
3. Verify database records using Supabase dashboard
4. Check environment variables configuration

---

**Last Updated:** January 22, 2026
**Tested By:** [Name]
**Date Tested:** [Date]
