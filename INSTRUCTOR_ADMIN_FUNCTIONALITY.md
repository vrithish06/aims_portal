# Instructor & Admin Functionality Implementation Guide

## Overview
This document describes the implementation of instructor course approval and admin course management features for the AIMS portal.

---

## 1. Database Status Values

### Important: Correct Status Naming
The database uses **spaces** in status names, NOT underscores:
- ✅ Correct: `"pending instructor approval"` 
- ❌ Wrong: `"pending_instructor_approval"`

Valid enrollment status values in `course_enrollment` table:
- `enrolled`
- `pending instructor approval` (Instructors approve these)
- `pending advisor approval` (Advisors approve these)
- `instructor rejected`
- `advisor rejected`
- `student dropped`
- `student withdrawn`

---

## 2. Instructor Functionality: Course Approval Workflow

### Workflow
1. **Student enrolls** → Status: `"pending instructor approval"`
2. **Instructor reviews** in CourseDetailsPage
3. **Instructor clicks "Approve"** → Status: `"pending advisor approval"`
4. **Admin/Advisor reviews** → Status: `"enrolled"`

### Frontend: CourseDetailsPage.jsx

#### Key Changes:
1. **Filter by "pending instructor approval"** - Shows students waiting for instructor approval
2. **Action Button** - "Approve" button appears only for `pending instructor approval` status
3. **Status Display** - Shows current enrollment status with color coding
4. **Bulk Approval** - "Accept All" button to approve multiple students at once

#### UI Elements:
```jsx
// Single approval
<button onClick={() => handleApproveStudent(enrollment)}>
  Approve
</button>

// Filter by pending instructor approval status
{enrollment.enrol_status === 'pending instructor approval' && (
  <button>Approve</button>
)}

// Bulk approval
{statusFilter.includes('pending instructor approval') && 
 filteredStudents.some(s => s.enrol_status === 'pending instructor approval') && (
  <button onClick={handleApproveAll}>Accept All</button>
)}
```

#### Status Color Coding:
- `pending instructor approval` → Yellow (bg-yellow-100)
- `pending advisor approval` → Orange (bg-orange-100)
- `enrolled` → Green (bg-green-100)

### Backend: aimsController.js

#### Updated Functions:

**1. updateEnrollmentStatus()**
```javascript
// Converts underscore format to database space format
const dbEnrolStatus = enrol_status.replace(/_/g, ' ');
// Updates enrollment status
await supabase
  .from("course_enrollment")
  .update({ enrol_status: dbEnrolStatus })
  .eq('enrollment_id', enrollmentId)
```

**Authorization**: 
- Instructors can only approve enrollments for their own courses
- Admins can approve any enrollment

---

## 3. Admin Functionality: Course Status Management

### Workflow
1. **Admin logs in**
2. **Admin goes to "Manage All Course Offerings"**
3. **Admin sees all courses with "Proposed" status**
4. **Admin clicks "Accept" or "Reject"**
5. **Course status changes**: 
   - Accept: `Proposed` → `Enrolling`
   - Reject: `Proposed` → `Rejected`

### Frontend: MyOfferingsPage.jsx

#### Key Changes:
1. **Role Check** - Now allows both `instructor` and `admin` roles
2. **Endpoint Selection**:
   - Instructor: Fetches from `/offering/my-offerings` (only their courses)
   - Admin: Fetches from `/offering/all-offerings` (all courses)
3. **Header Title**:
   - Instructor: "My Course Offerings"
   - Admin: "Manage All Course Offerings"
4. **Status Buttons** - Accept/Reject buttons appear for `Proposed` courses

#### Code Changes:
```javascript
// Endpoint selection based on role
const endpoint = user?.role === 'admin' 
  ? '/offering/all-offerings' 
  : '/offering/my-offerings';

// Status change handler (same for both instructor and admin)
const handleOfferingStatusChange = async (offeringId, newStatus) => {
  const response = await axiosClient.put(
    `/offering/${offeringId}/status`,
    { status: newStatus } // 'Accepted' or 'Rejected'
  );
};
```

### Backend: aimsController.js & Routes

#### New Function: getAllOfferings()
```javascript
export const getAllOfferings = async (req, res) => {
  // Fetches all course offerings with enrollment counts
  // Used exclusively by admins
};
```

#### Updated Function: updateOfferingStatus()
```javascript
// Now checks authorization:
if (userRole !== 'admin') {
  // Verify instructor owns the offering
  // Reject if not owner
}
// Admin can update any offering
```

#### New Route:
```javascript
router.get('/offering/all-offerings', 
  requireAuth, 
  requireRole('admin'), 
  getAllOfferings);
```

#### Updated Route:
```javascript
// Now allows both instructors and admins
router.put('/offering/:offeringId/status', 
  requireAuth,  // No longer restricted to instructors only
  updateOfferingStatus);
```

---

## 4. API Endpoints Summary

### Instructor Endpoints

**GET /offering/my-offerings**
- **Auth**: Required (Instructor role)
- **Purpose**: Get courses offered by current instructor
- **Response**: Array of offerings with enrollment counts

**PUT /offering/:offeringId/status**
- **Auth**: Required
- **Role**: Instructor (owns offering) or Admin
- **Body**: `{ status: "Accepted" | "Rejected" }`
- **Purpose**: Accept/Reject proposed course offerings
- **Response**: Updated offering object

**PUT /offering/:offeringId/enrollments/:enrollmentId**
- **Auth**: Required
- **Body**: `{ enrol_status: "pending advisor approval" }`
- **Purpose**: Approve student enrollment (move from instructor → advisor approval)
- **Response**: Updated enrollment object

**GET /offering/:offeringId/enrollments**
- **Auth**: Not required
- **Purpose**: Get all enrollments for a course (shows student names and emails)
- **Response**: Array of enrollments with student details

---

### Admin Endpoints

**GET /offering/all-offerings**
- **Auth**: Required (Admin role)
- **Purpose**: Get all course offerings in the system
- **Response**: Array of all offerings

**PUT /offering/:offeringId/status**
- **Auth**: Required (Admin role)
- **Body**: `{ status: "Accepted" | "Rejected" }`
- **Purpose**: Accept/Reject any course offering
- **Response**: Updated offering object

---

## 5. Testing Guide

### Test Case 1: Instructor Course Approval

**Setup**:
1. Create a student and instructor account
2. Student enrolls in a course (creates enrollment with `pending instructor approval`)

**Test Steps**:
1. Log in as instructor
2. Go to course details (click "View Details" on course)
3. Filter by status: "pending instructor approval"
4. Verify the "Approve" button appears
5. Click "Approve" button
6. Verify status changes to "pending advisor approval"
7. Verify success toast notification

**Expected Result**: ✅ Enrollment status updated to "pending advisor approval"

### Test Case 2: Instructor Bulk Approval

**Setup**: Same as Test Case 1 with multiple students

**Test Steps**:
1. Log in as instructor
2. Go to course details
3. Filter by status: "pending instructor approval"
4. Click "Accept All" button
5. Verify all pending students are approved at once

**Expected Result**: ✅ All students moved to "pending advisor approval"

### Test Case 3: Admin Course Status Management

**Setup**:
1. Create a proposed course offering
2. Admin account exists

**Test Steps**:
1. Log in as admin
2. Go to "Manage All Course Offerings" (MyOfferingsPage)
3. Find a course with status "Proposed"
4. Click "Accept" button
5. Verify status changes to "Enrolling"

**Expected Result**: ✅ Course status updated to "Enrolling"

### Test Case 4: Admin Reject Course

**Test Steps**:
1. Log in as admin
2. Go to "Manage All Course Offerings"
3. Find a course with status "Proposed"
4. Click "Reject" button
5. Verify status changes to "Rejected"

**Expected Result**: ✅ Course status updated to "Rejected"

### Test Case 5: Permission Validation

**Test**: Instructor cannot approve other instructor's courses

**Steps**:
1. Create 2 instructor accounts
2. Instructor A creates a course with students waiting for approval
3. Log in as Instructor B
4. Try to navigate to Instructor A's course
5. Verify you cannot approve their enrollments

**Expected Result**: ✅ "You can only update enrollments for your offerings" error

---

## 6. Important Notes

### Status Conversion
The frontend uses underscores (`pending_instructor_approval`) but the database uses spaces (`pending instructor approval`). The backend automatically converts:

```javascript
const dbEnrolStatus = enrol_status.replace(/_/g, ' ');
```

### User Roles
- **Student**: Can view enrolled courses, withdraw, drop
- **Instructor**: Can create courses, accept/reject proposed offerings, approve enrollments
- **Admin**: Can manage all courses, approve any enrollment

### Authorization Flow
1. Student enrolls → `pending instructor approval`
2. Instructor approves → `pending advisor approval`  
3. Admin/Advisor approves → `enrolled`
4. OR → `instructor rejected` / `advisor rejected`

---

## 7. Troubleshooting

### Issue: "Approve" button not showing

**Causes**:
- Enrollment status is not exactly `pending instructor approval` (check database)
- Using underscore format instead of space format
- Not filtered by correct status

**Fix**: 
```javascript
// Verify database has correct status
SELECT enrol_status FROM course_enrollment WHERE enrollment_id = ...;
// Should show: "pending instructor approval" (with spaces)
```

### Issue: "Access Denied" error

**Causes**:
- Not logged in (no auth token)
- User role doesn't match required role
- Instructor trying to approve other instructor's course

**Fix**:
- Verify user is logged in and role is correct
- Check which course's enrollments you're trying to approve

### Issue: Status not updating

**Causes**:
- Browser cache showing old status
- Database not receiving update
- Backend validation failing

**Fix**:
- Clear browser cache
- Check browser console for error messages
- Verify backend is running: `npm start`
- Check terminal for error logs

---

## 8. Files Modified

### Frontend
- `src/pages/CourseDetailsPage.jsx` - Updated enrollment approval UI and logic
- `src/pages/MyOfferingsPage.jsx` - Added admin support and course status management

### Backend
- `controllers/aimsController.js` - Added `getAllOfferings()`, updated `updateOfferingStatus()` and `updateEnrollmentStatus()`
- `routes/AimsRoutes.js` - Added new route for admin course management, updated authorization checks

### Documentation
- `INSTRUCTOR_ADMIN_FUNCTIONALITY.md` - This file

---

## 9. Next Steps

1. ✅ Implement instructor approval workflow
2. ✅ Implement admin course management
3. ✅ Test all scenarios
4. Deploy to production
5. Monitor error logs

---

**Last Updated**: January 22, 2026  
**Status**: ✅ Implementation Complete
