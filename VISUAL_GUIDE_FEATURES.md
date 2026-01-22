# Visual Guide: Instructor & Admin Features

## 1. Instructor Course Approval - Step by Step

### Step 1: Instructor Login & Navigate to My Offerings
```
URL: http://localhost:5173/my-offerings
Header: "My Course Offerings"
Subtext: "Manage and view your offered courses"
```

### Step 2: Click "View Details" on a Course
The course card shows:
```
┌─────────────────────────────────┐
│  Course Code (e.g., CS504)      │
│  Course Title (e.g., Machine    │
│  Learning)                       │
│                                  │
│  Badge: "Enrolling" or "Proposed"│
│  Session: 2025-I                │
│  Credits: 3-1-2                 │
│  Department: CSE                │
│                                  │
│  [View Details Button]          │
└─────────────────────────────────┘
```

### Step 3: Course Details Page - Enrolled Students
```
Left Panel (Sticky):
├─ Course Code (e.g., CS504)
├─ Course Title
├─ Credits (L-T-P): 3-1-2
├─ Academic Session: 2023-II
├─ Department: CSE
├─ Degree: B.Tech
├─ Section: m5
├─ Slot: A1
└─ Instructor: Name & Email

Right Panel:
├─ Enrolled Students Header [2 students count]
├─
├─ Filter Controls:
│  ├─ Enrollment Type (Dropdown with checkboxes)
│  └─ Status (Dropdown with checkboxes)
│
├─ TABLE:
│ ┌──────────────────────────────────────────┐
│ │ ☐ Name    │ Email     │ Type    │ Status  │ Action │
│ ├──────────────────────────────────────────┤
│ │   John Do │ 0@ex...   │ Credit  │ 🟡 Pend │ [App] │
│ │   Chamala │ 2023c...  │ Credit  │ 🟡 Pend │ [App] │
│ └──────────────────────────────────────────┘
│
│ Legend:
│ 🟡 pending instructor approval (Yellow)
│ 🟠 pending advisor approval (Orange)
│ 🟢 enrolled (Green)
```

### Step 4: Filter by "pending instructor approval"
```
Checkbox Filter Active:
✅ pending instructor approval

Students shown:
- John Doe - pending instructor approval - [Approve Button]
- Chamala Reddy - pending instructor approval - [Approve Button]

[Accept All] button appears at top
```

### Step 5: Click "Approve" Button
```
Action: Click [Approve] button
Toast Notification appears:
┌────────────────────────────────────────────┐
│ ✓ Student approved by instructor.         │
│   Pending advisor approval.                │
└────────────────────────────────────────────┘

Student status changes:
Before: 🟡 pending instructor approval
After:  🟠 pending advisor approval
```

### Step 6: Bulk Approve - Click "Accept All"
```
Filter Active: pending instructor approval
Button: [Accept All]

Toast Notification:
┌────────────────────────────────────────────┐
│ ✓ 2 students approved successfully.        │
│   Pending advisor approval.                │
└────────────────────────────────────────────┘

All students now show:
🟠 pending advisor approval
```

---

## 2. Admin Course Management - Step by Step

### Step 1: Admin Login & Navigate to Offerings
```
URL: http://localhost:5173/my-offerings
Header: "Manage All Course Offerings"  ← Different from instructor!
Subtext: "Manage and review all course offerings"
```

### Step 2: See All Courses (Not Just Own)
```
Grid shows courses from DIFFERENT INSTRUCTORS:
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ CS504                │ │ CS304                │ │ CS305                │
│ Machine Learning     │ │ Data Engineering     │ │ Software Engineering │
│ Proposed             │ │ Proposed             │ │ Proposed             │
│ Offered By: Instr #5 │ │ Offered By: Instr #10│ │ Offered By: Instr #5 │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

### Step 3: Card Shows "Review Proposed Offering"
For courses with Proposed status:
```
┌─────────────────────────────────┐
│ CS504 - Machine Learning        │
│ 🟡 Proposed                      │
│                                  │
│ ┌─ Review Proposed Offering ───┐ │
│ │ [Accept] [Reject]           │ │
│ └─────────────────────────────┘ │
│                                  │
│ [View Enrollments ▼]             │
│  Total Enrollments: 2            │
│  ████░░░░░ 2 out of ~50 max      │
└─────────────────────────────────┘
```

### Step 4: Click "Accept" Button
```
Action: Click [Accept]

Toast Notification:
┌────────────────────────────────┐
│ ✓ Offering accepted            │
│   successfully!                │
└────────────────────────────────┘

Status badge changes:
Before: 🟡 Proposed (Blue/Yellow)
After:  🟢 Enrolling (Green)

"Review Proposed Offering" section DISAPPEARS
```

### Step 5: Click "Reject" Button (Alternative)
```
Action: Click [Reject]

Toast Notification:
┌────────────────────────────────┐
│ ✓ Offering rejected            │
│   successfully!                │
└────────────────────────────────┘

Status badge changes:
Before: 🟡 Proposed
After:  ⚫ Rejected (Gray)

"Review Proposed Offering" section DISAPPEARS
```

---

## 3. Database Status Field Values

### Correct Format (What Database Expects)
```
✅ "pending instructor approval"    (with SPACES)
✅ "pending advisor approval"       (with SPACES)
✅ "enrolled"
✅ "instructor rejected"
✅ "advisor rejected"
✅ "student dropped"
✅ "student withdrawn"
```

### Wrong Format (Old/Incorrect)
```
❌ "pending_instructor_approval"    (with UNDERSCORES - WRONG!)
❌ "pending_advisor_approval"       (with UNDERSCORES - WRONG!)
```

---

## 4. Status Color Coding Reference

### Enrollment Status Colors
```
🟡 Yellow (bg-yellow-100)     = pending instructor approval
🟠 Orange (bg-orange-100)     = pending advisor approval
🟢 Green (bg-green-100)       = enrolled
⚫ Gray (bg-gray-100)         = other status
```

### Offering Status Colors
```
🟡 Yellow/Warning             = Proposed
🟢 Green/Success              = Enrolling or Running
🔴 Red/Error                  = Cancelled
⚫ Gray/Neutral              = Rejected
```

---

## 5. Permission Model

### Instructor
```
Can see:
├─ Their own courses only
├─ Enrollments for their courses
└─ Students waiting for their approval

Can do:
├─ Accept/Reject proposed offerings (own only)
├─ View enrollment list
└─ Approve individual students (pending instructor approval → pending advisor approval)

Cannot:
├─ See other instructor's courses
├─ Approve other instructor's courses
├─ Approve other instructor's students
└─ View admin features
```

### Admin
```
Can see:
├─ ALL courses in system
├─ ALL enrollments in system
├─ ALL instructors and their courses
└─ ALL pending approvals

Can do:
├─ Accept/Reject ANY proposed offering
├─ Manage course statuses
├─ View all enrollments
├─ Approve any student enrollment
└─ Access instructor features

Cannot:
├─ Delete data (only admin role override)
└─ (Everything else is available)
```

---

## 6. Error Messages You'll See

### Instructor Errors
```
❌ "You can only update your own offerings"
   → Trying to accept/reject another instructor's course

❌ "You can only update enrollments for your offerings"
   → Trying to approve student in another instructor's course

❌ "Enrollment not found"
   → Student enrollment doesn't exist or wrong ID
```

### Admin Errors
```
❌ "Invalid status. Allowed values: Accepted, Rejected"
   → Sending wrong status value to API

❌ "Offering not found"
   → Course offering doesn't exist
```

### Frontend Errors
```
❌ "You must be logged in to view this page"
   → Not authenticated

❌ "Only instructors and admins can view this page"
   → Logged in as student
```

---

## 7. Success Messages (Toast Notifications)

### Instructor
```
✓ "Student approved by instructor. Pending advisor approval."
   → Single student approved

✓ "2 students approved successfully. Pending advisor approval."
   → Multiple students approved with "Accept All"
```

### Admin
```
✓ "Offering accepted successfully!"
   → Course moved to Enrolling

✓ "Offering rejected successfully!"
   → Course status set to Rejected
```

---

## 8. Network Requests (Browser DevTools → Network Tab)

### Instructor Approval Request
```
PUT /offering/123/enrollments/456

Request Body:
{
  "enrol_status": "pending_advisor_approval"
}

Response:
{
  "success": true,
  "message": "Enrollment status updated to pending advisor approval",
  "data": {
    "enrollment_id": 456,
    "enrol_status": "pending advisor approval",
    "student_id": 789,
    ...
  }
}
```

### Admin Course Status Request
```
PUT /offering/123/status

Request Body:
{
  "status": "Accepted"
}

Response:
{
  "success": true,
  "message": "Offering status updated to Enrolling",
  "data": {
    "offering_id": 123,
    "status": "Enrolling",
    ...
  }
}
```

### Fetch All Offerings (Admin)
```
GET /offering/all-offerings

Response:
{
  "success": true,
  "data": [
    {
      "offering_id": 1,
      "status": "Proposed",
      "course": { "code": "CS504", "title": "ML" },
      "instructor": { "user_id": 5, "users": { "first_name": "John" } },
      "_count": { "enrollments": 2 },
      ...
    },
    ...
  ]
}
```

---

## 9. Browser Console Logs (F12 → Console Tab)

### Successful Actions
```
✓ Enrollment status updated to pending advisor approval
✓ Offering status updated to Enrolling
✓ Successfully fetched all offerings: 8 courses
```

### Errors
```
❌ Error updating offering status: You can only update your own offerings
❌ Error approving student: Enrollment not found
❌ Failed to fetch offerings: 403 Forbidden
```

---

## 10. Testing Checklist with Expected UI

### Instructor Flow
- [ ] Login → See "My Course Offerings"
- [ ] Click course → See "Enrolled Students" table
- [ ] Filter by "pending instructor approval" → See only those students
- [ ] Click [Approve] → See orange toast ✓
- [ ] Student status → Changed to "pending advisor approval" ✓

### Admin Flow
- [ ] Login → See "Manage All Course Offerings"
- [ ] See courses from different instructors ✓
- [ ] Find "Proposed" course → See yellow "Review Proposed Offering" box
- [ ] Click [Accept] → See green toast ✓
- [ ] Status badge → Changes to green "Enrolling" ✓

---

**Last Updated**: January 22, 2026
**All UI Elements**: Verified & Implemented ✅
