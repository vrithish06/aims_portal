# Quick Testing Guide

## Backend Running?
Check terminal output shows:
```
✅ Server running on port 3000
```

## Frontend Running?
Check terminal output shows:
```
➜  Local:   http://localhost:5173/
```

---

## Test 1: Withdraw/Drop Functionality ✅

### Steps:
1. Open http://localhost:5173
2. Login as a **student**
3. Go to "My Courses"
4. Find an enrolled course (GREEN status)
5. Click either **Withdraw** or **Drop** button
6. Confirm the action
7. Status should change to red (Student Withdrawn/Student Dropped)
8. Buttons should disappear

### Expected Result:
- ✅ Status updates immediately
- ✅ Buttons disappear after action
- ✅ Refreshing page shows the change persisted

### Debug Output (in Backend Console):
Look for messages like:
```
withdrawCourse error: [if there's an error]
dropCourse error: [if there's an error]
```

---

## Test 2: Advisor Pending Requests ✅

### Steps:
1. Open http://localhost:5173
2. Login as an **instructor** (advisor)
3. Go to "My Work"
4. Click "Advisor Actions"
5. Should see pending enrollment requests from students

### Expected Result:
- ✅ Page loads without "not assigned as an advisor" error
- ✅ Shows course cards with students pending advisor approval
- ✅ Can see student names, courses, and approval status

### Debug Output (in Backend Console):
When advisor loads the page, you should see:
```
Advisor info - degree: [degree] batch: [batch]
Found offerings for advisor batch/degree: [offering_ids]
Total enrollments found with pending advisor approval: [count]
Filtered enrollments (matching degree): [count]
```

---

## Common Issues & Fixes

### Issue: "Withdraw error: Cannot read properties of null"
**Fix**: Make sure you're passing the enrollment object, not just an ID. Already fixed in code.

### Issue: Status doesn't update after withdraw/drop
**Possible Causes**:
- Status value was invalid (should be 'student withdrawn'/'student dropped')
- API request failed silently
- **Fix**: Check backend logs, restart backend with `npm start`

### Issue: Advisor sees "Faculty advisor record not found"
**Possible Causes**:
- User is not set up as an advisor in database
- Instructor record doesn't exist for this user
- Faculty advisor record is missing
- **Fix**: Contact admin to verify advisor assignment in database

### Issue: Advisor sees no pending requests
**Possible Causes**:
- No students in your batch have pending advisor approval
- Students' degree doesn't match advisor's assigned degree
- No course offerings exist for your batch/degree
- **Fix**: Check debug logs to see what's being queried

---

## API Endpoints Reference

### For Students:
- `GET /student/enrolled-courses` - Get all enrolled courses
- `POST /offering/{offeringId}/withdraw` - Withdraw from course
- `POST /offering/{offeringId}/drop` - Drop course

### For Advisors:
- `GET /enrollment/pending-advisor` - Get pending enrollment requests for advisor

### For Instructors:
- `GET /enrollment/pending-instructor` - Get pending requests from their courses

---

## Database Commands (if needed)

### Check if advisor is assigned:
```sql
SELECT fa.*, i.user_id FROM faculty_advisor fa
JOIN instructor i ON fa.instructor_id = i.instructor_id
WHERE i.user_id = [user_id];
```

### Check pending advisor enrollments:
```sql
SELECT ce.*, co.degree, co.acad_session 
FROM course_enrollment ce
JOIN course_offering co ON ce.offering_id = co.offering_id
WHERE ce.enrol_status = 'pending advisor approval'
AND ce.is_deleted = false;
```

---

## Status Codes Reference
- `enrolled` - Green, can withdraw/drop
- `completed` - Blue, no action available
- `pending instructor approval` - Yellow, no action available
- `pending advisor approval` - Orange, no action available
- `student withdrawn` - Red, final status
- `student dropped` - Red, final status
- `instructor rejected` - Red, final status
- `advisor rejected` - Red, final status

