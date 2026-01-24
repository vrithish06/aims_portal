# Advisor Approval Flow - Visual Guide

## Step 1: Advisor Login
```
┌─────────────────────────────────┐
│   AIMS Portal - Login            │
│                                   │
│   Email: [instructor_email]      │
│   Password: [****]               │
│                                   │
│   [Login Button]                 │
└─────────────────────────────────┘
        │
        └─→ Instructor has role='instructor' in users table
            Instructor has entry in instructor table
            Instructor has entry in faculty_advisor table with:
            - for_degree = 'BTech'
            - batch = '2023'
```

## Step 2: Navigate to Advisor Actions
```
┌─────────────────────────────────────────┐
│   AIMS Portal - Navigation Menu         │
│                                           │
│   [Home] [Courses] [MyOfferings]        │
│   [Advisor Actions] ← CLICK HERE        │
│   [Logout]                              │
└─────────────────────────────────────────┘
        │
        └─→ Checks user.role === 'instructor'
            Fetches GET /enrollment/pending-advisor
            Backend validates faculty_advisor record exists
```

## Step 3: Advisor Actions Page - List View
```
┌──────────────────────────────────────────────────────────┐
│   Advisor Actions                                         │
│                                                            │
│   Approve or reject pending student enrollment requests   │
│                                                            │
│   ┌─────────────────────────────────────────────────┐   │
│   │ Degree: BTech | Batch: 2023                      │   │
│   └─────────────────────────────────────────────────┘   │
│                                                            │
│   ┌──────────────────────────────────────────────────┐  │
│   │ 📚 Data Structures                     PENDING: 3│  │
│   │ CS201                                      LTP: 3│  │
│   │                                                   │  │
│   │ Session: 2023-24 | Section: A                  │  │
│   │ [Review Requests]                               │  │
│   └──────────────────────────────────────────────────┘  │
│                                                            │
│   ┌──────────────────────────────────────────────────┐  │
│   │ 📚 Algorithms                          PENDING: 2│  │
│   │ CS301                                      LTP: 4│  │
│   │                                                   │  │
│   │ Session: 2023-24 | Section: B                  │  │
│   │ [Review Requests]                               │  │
│   └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

KEY POINTS:
✓ Only shows courses with 'pending advisor approval' requests
✓ Shows advisor's assigned degree (BTech) and batch (2023)
✓ Displays count of pending requests per course
✓ Filters out completed/rejected/student withdrawn enrollments
```

## Step 4: Advisor Actions Detail Page
```
┌──────────────────────────────────────────────────────────┐
│   ← Back to Advisor Actions                              │
│                                                            │
│   ┌────────────────────────────────────────────────┐    │
│   │ Data Structures                                │    │
│   │                                                │    │
│   │ Code: CS201  | LTP: 3                         │    │
│   │ Session: 2023-24 | Section: A                 │    │
│   └────────────────────────────────────────────────┘    │
│                                                            │
│   PENDING STUDENT REQUESTS:                             │
│                                                            │
│   ┌──────────────────────────────────────────────┐      │
│   │ Raj Kumar                                    │      │
│   │ raj.kumar@college.ac.in                      │      │
│   │                                               │      │
│   │ [Credit] [Degree: BTech]                    │      │
│   │ Status: pending advisor approval (orange)    │      │
│   │                                               │      │
│   │  [✓ Approve] [✗ Reject]                     │      │
│   └──────────────────────────────────────────────┘      │
│                                                            │
│   ┌──────────────────────────────────────────────┐      │
│   │ Priya Singh                                  │      │
│   │ priya.singh@college.ac.in                    │      │
│   │                                               │      │
│   │ [Credit] [Degree: BTech]                    │      │
│   │ Status: pending advisor approval (orange)    │      │
│   │                                               │      │
│   │  [✓ Approve] [✗ Reject]                     │      │
│   └──────────────────────────────────────────────┘      │
│                                                            │
│   ┌──────────────────────────────────────────────┐      │
│   │ Arun Sharma                                  │      │
│   │ arun.sharma@college.ac.in                    │      │
│   │                                               │      │
│   │ [Credit] [Degree: BTech]                    │      │
│   │ Status: pending advisor approval (orange)    │      │
│   │                                               │      │
│   │  [✓ Approve] [✗ Reject]                     │      │
│   └──────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘

KEY POINTS:
✓ Shows ONLY students with 'pending advisor approval' status
✓ Displays student name and email
✓ Shows enrollment type (Credit/Audit/etc)
✓ Shows student's degree for batch verification
✓ Shows current status in orange badge
✓ Each student has Approve/Reject buttons
```

## Step 5a: Advisor Approves Request
```
User clicks [✓ Approve] button
        │
        ├─→ Frontend: setActionUpdating(enrollmentId)
        │
        ├─→ API Call: PUT /enrollment/{enrollmentId}/advisor-approval
        │   Body: { enrol_status: 'enrolled' }
        │
        ├─→ Backend Validation:
        │   ✓ Check instructor exists in instructor table
        │   ✓ Check faculty_advisor record exists
        │   ✓ Check student.degree === faculty_advisor.for_degree
        │   ✓ Check enrollment.enrol_status === 'pending advisor approval'
        │
        └─→ Database Update:
            UPDATE course_enrollment 
            SET enrol_status = 'enrolled'
            WHERE enrollment_id = {enrollmentId}

RESULT:
✓ Toast: "Enrollment approved! Student is now enrolled."
✓ Request removed from advisor's list
✓ Student can now see course as 'enrolled' in their view
✓ Student can withdraw (but not drop) from course
```

## Step 5b: Advisor Rejects Request
```
User clicks [✗ Reject] button
        │
        ├─→ Frontend: setActionUpdating(enrollmentId)
        │
        ├─→ API Call: PUT /enrollment/{enrollmentId}/advisor-approval
        │   Body: { enrol_status: 'advisor rejected' }
        │
        ├─→ Backend Validation: (same as approval)
        │   ✓ Check instructor exists
        │   ✓ Check faculty_advisor record exists
        │   ✓ Check student degree matches
        │   ✓ Check status is 'pending advisor approval'
        │
        └─→ Database Update:
            UPDATE course_enrollment 
            SET enrol_status = 'advisor rejected'
            WHERE enrollment_id = {enrollmentId}

RESULT:
✓ Toast: "Enrollment rejected!"
✓ Request removed from advisor's list
✓ Student sees 'advisor rejected' status (cannot enroll)
✓ Student must seek advisor approval for re-enrollment
```

## Data Flow Diagram

```
┌──────────────────┐
│   Student        │
│   (degree=BTech) │
└────────┬─────────┘
         │
         │ Enrolls in course with
         │ enrol_status='pending advisor approval'
         │
         ▼
┌──────────────────────────────────────┐
│  course_enrollment table              │
│  ├─ enrollment_id: 123                │
│  ├─ student_id: 45                    │
│  ├─ offering_id: 67                   │
│  ├─ enrol_status: pending advisor ... │
│  └─ enrol_type: Credit                │
└────────┬─────────────────────────────┘
         │
         │ AdvisorActionsPage fetches
         │ GET /enrollment/pending-advisor
         │
         ▼
┌──────────────────────────────────────┐
│  Backend Validation                   │
│  ├─ Find instructor by user_id        │
│  ├─ Check faculty_advisor exists      │
│  │  WHERE instructor_id = XXX         │
│  │  AND is_deleted = false            │
│  ├─ Verify student.degree ===         │
│  │  faculty_advisor.for_degree        │
│  └─ Verify enrol_status ===           │
│     'pending advisor approval'        │
└────────┬────────────────────────────┘
         │
         │ If valid, show in list
         │ If not valid, reject with error
         │
         ▼
┌──────────────────────────────────────┐
│  AdvisorActionsPage Display           │
│  ├─ Shows only valid pending requests │
│  ├─ Shows student degree              │
│  ├─ Shows advisor's batch/degree      │
│  └─ Provides Approve/Reject buttons   │
└────────┬────────────────────────────┘
         │
         │ Advisor clicks Approve/Reject
         │
         ▼
┌──────────────────────────────────────┐
│  API Call                             │
│  PUT /enrollment/:enrollmentId/       │
│      advisor-approval                 │
│  { enrol_status: 'enrolled'|'advisor  │
│    rejected' }                        │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Backend Updates Database             │
│  UPDATE course_enrollment             │
│  SET enrol_status = new_status        │
│  WHERE enrollment_id = XXX            │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Student View Updated                 │
│  ├─ If approved: 'enrolled'           │
│  │  (can withdraw, gets credit)       │
│  └─ If rejected: 'advisor rejected'   │
│     (cannot enroll)                   │
└──────────────────────────────────────┘
```

## Database Relationships

```
ADVISOR PERSPECTIVE:
┌──────────────────────────────────────────────────┐
│  users table                                     │
│  ├─ id: 1001                                     │
│  ├─ email: advisor@college.ac.in                 │
│  ├─ role: 'instructor'                           │
│  └─ first_name: 'Dr. Amit'                       │
└────────┬─────────────────────────────────────────┘
         │ has
         ▼
┌──────────────────────────────────────────────────┐
│  instructor table                                │
│  ├─ instructor_id: 5                             │
│  ├─ user_id: 1001 (FK)                           │
│  └─ branch: 'CSE'                                │
└────────┬─────────────────────────────────────────┘
         │ advises (from)
         ▼
┌──────────────────────────────────────────────────┐
│  faculty_advisor table                           │
│  ├─ advisor_id: 10                               │
│  ├─ instructor_id: 5 (FK)                        │
│  ├─ for_degree: 'BTech'  ──────┐                │
│  ├─ batch: '2023'          ──┐  │                │
│  └─ is_deleted: false         │  │               │
└──────────────────────────────┬──┘  │              │
                               │     │              │
                               │  MUST MATCH      │
                               │     │              │
                               │     │              │
STUDENT PERSPECTIVE:          │     │              │
┌──────────────────────────────┴─────┴──────────┐ │
│  student table                                │ │
│  ├─ student_id: 45                            │ │
│  ├─ user_id: 2001                             │ │
│  ├─ degree: 'BTech'  ◄───────────────────────┘ │
│  ├─ branch: 'CSE'    (inferred from batch)     │
│  └─ email: student@college.ac.in              │
└────────┬─────────────────────────────────────┘
         │ enrolls in
         ▼
┌──────────────────────────────────────────────────┐
│  course_enrollment table                         │
│  ├─ enrollment_id: 123                           │
│  ├─ student_id: 45 (FK)                          │
│  ├─ offering_id: 67                              │
│  ├─ enrol_status: 'pending advisor approval'    │
│  └─ enrol_type: 'Credit'                         │
└─────────────────────────────────────────────────┘
```

## Success Indicators

After advisor approves an enrollment, you should see:

1. **In Advisor Actions Page**:
   - Request disappears from list
   - Toast notification shows "Enrollment approved!"
   - Pending count decreases

2. **In Student's Enrolled Courses Page**:
   - Course appears with status `'enrolled'`
   - Withdraw button appears (but not drop button)
   - Course counts toward credits

3. **In Database** (using query):
```sql
SELECT enrollment_id, enrol_status 
FROM course_enrollment 
WHERE enrollment_id = 123;
-- Result: | 123 | enrolled |
```

4. **In Browser Console**:
```
Approving enrollment: 123
PUT /enrollment/123/advisor-approval
Response: { success: true, message: "Enrollment approved" }
```

---

**Reference**: This workflow implements role-based access control where:
- Instructors see advisor requests only if they're in faculty_advisor table
- Advisors can only approve students matching their assigned batch/degree
- Status transitions are validated at backend to prevent unauthorized changes
