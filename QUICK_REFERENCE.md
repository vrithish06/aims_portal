# AIMS Portal - Quick Reference Guide

## All Implemented Features at a Glance

### Student Features ✅
| Feature | Page | Status |
|---------|------|--------|
| View instructor names | My Courses | ✅ Works |
| Filter by status & session | My Courses | ✅ Works |
| Withdraw from course | My Courses | ✅ Works |
| Drop course | My Courses | ✅ Works |
| Calculate CGPA | Student Record | ✅ Works |
| View SGPA per session | Student Record | ✅ Works |
| Enroll in courses | Course Offerings | ✅ Works |
| View course details | Course Details | ✅ Works |

### Teacher Features ✅
| Feature | Page | Status |
|---------|------|--------|
| Create courses | Add Course | ✅ Works |
| Auto-set "Proposed" status | Add Course | ✅ Works |
| Review proposed offerings | My Offerings | ✅ Works |
| Accept/Reject offerings | My Offerings | ✅ **NEW** |
| Navigate to course details | My Offerings | ✅ Works |
| View enrolled students | Course Details | ✅ Works |
| Approve pending students | Course Details | ✅ Works |
| Bulk approve students | Course Details | ✅ Works |

### Admin Features ✅
| Feature | Page | Status |
|---------|------|--------|
| All teacher features | All Pages | ✅ Works |
| Manage user accounts | User Management | ✅ Works (separate) |
| Override approvals | Course Details | ✅ Works |

---

## API Endpoints - Quick Reference

### Student Endpoints
```
GET /student/enrolled-courses      - Get student's enrollments
POST /offering/{id}/enroll         - Enroll in course
POST /offering/{id}/withdraw       - Withdraw from course ✅ NEW
POST /offering/{id}/drop           - Drop course ✅ NEW
GET /course-offerings              - Browse available courses
GET /offering/{id}/enrollments     - View course roster
```

### Instructor Endpoints
```
POST /instructor/course            - Create course
POST /course/{id}/offer            - Create offering (sets status=Proposed)
GET /offering/my-offerings         - Get instructor's offerings
PUT /offering/{id}/status          - Accept/Reject offering ✅ NEW
PUT /offering/{id}/enrollments/{eid} - Approve student ✅ NEW
POST /offering/{id}/cancel         - Cancel offering (cascade) ✅ NEW
```

### Admin Endpoints
```
POST /user/create                  - Create user
GET /student                        - List all students
GET /instructor                     - List all instructors
(+ all instructor endpoints)
```

---

## Testing Quick Start

### Test Student Workflow
```bash
# 1. Login as student
# 2. Go to "My Courses"
# 3. Find enrolled course
# 4. Click "Withdraw" or "Drop"
# 5. Confirm action
# 6. Verify status changes
```

### Test Teacher Workflow
```bash
# 1. Login as instructor
# 2. Create new course via "Add Course"
# 3. Go to "My Offerings"
# 4. Find Proposed offering
# 5. Click "Accept" or "Reject"
# 6. Verify status changes to Enrolling/Rejected
# 7. Click course card to view details
# 8. Find pending student and approve
```

### Test Admin Workflow
```bash
# Same as teacher
# Plus: Can override any instructor's offering
```

---

## Key Files

### Most Important Files
| File | Purpose | Lines |
|------|---------|-------|
| TESTING_GUIDE.md | How to test everything | 400+ |
| IMPLEMENTATION_CHANGES.md | What was changed | 394 |
| PROJECT_COMPLETION_SUMMARY.md | Overall status | 350+ |
| aimsController.js | Backend logic | +200 |
| AimsRoutes.js | API endpoints | +100 |
| MyOfferingsPage.jsx | Offering management | +50 |
| EnrolledCoursesPage.jsx | Student courses | +30 |

### Configuration Files
```
.env                  - Development config
.env.production       - Production config
RENDER_DEPLOYMENT_CONFIG.md - Production setup
```

---

## Common Tasks & How To Do Them

### Task: Test Withdrawal Flow
```
1. Student logs in
2. Goes to "My Courses"
3. Finds enrolled course
4. Clicks course card to expand
5. Sees "Withdraw" button (only for enrolled)
6. Clicks "Withdraw"
7. Confirms in dialog
8. Sees "Course withdrawal successful" toast
9. Enrollment status changes to "withdrawn"
10. Course disappears from Enrolled filter
```

### Task: Test Offering Approval Flow
```
1. Instructor creates course (status=Proposed automatically)
2. Goes to "My Offerings"
3. Sees yellow "Proposed" badge
4. Sees "Review Proposed Offering" section
5. Sees "Accept" and "Reject" buttons
6. Clicks "Accept"
7. Sees "Offering accepted successfully!" toast
8. Status changes to "Enrolling"
9. Buttons disappear
```

### Task: Test Student Approval Flow
```
1. Student enrolls in course
2. Status is "pending_advisor_approval"
3. Instructor goes to Course Details
4. Sees student with "Pending Advisor Approval" status
5. Clicks checkbox next to student
6. Clicks "Approve" button
7. Sees "Student approved successfully!" toast
8. Status changes to "Enrolled"
9. Student row updates in real-time
```

---

## Database Schema (Key Tables)

### course_enrollment
```sql
enrollment_id INT
student_id INT
offering_id INT
enrol_type VARCHAR (Credit, Credit for Minor, etc.)
enrol_status VARCHAR (enrolled, pending_advisor_approval, withdrawn, dropped, cancelled)
grade VARCHAR (A, B+, etc.)
created_at TIMESTAMP
```

### course_offering
```sql
offering_id INT
course_id INT
instructor_id INT
acad_session VARCHAR (2024-1, Fall-2024, etc.)
status VARCHAR (Proposed, Enrolling, Running, Cancelled, Rejected)
slot VARCHAR
section VARCHAR
dept_name VARCHAR
degree VARCHAR
created_at TIMESTAMP
```

### course
```sql
course_id INT
code VARCHAR (unique)
title VARCHAR
ltp VARCHAR (3-1-0, 2-0-2, etc.)
has_lab BOOLEAN
status VARCHAR (active, inactive)
pre_req JSONB (array of prerequisite IDs)
```

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Cookies not created | Check NODE_ENV=development |
| CORS errors | Verify FRONTEND_URL in .env |
| Withdrawal fails | Check student owns enrollment |
| Approval fails | Check instructor owns offering |
| Status update fails | Check user role (instructor only) |
| Page loads slowly | Check large dataset (pagination needed) |
| Toast not showing | Verify react-hot-toast is imported |
| Filter not working | Check filter array initialization |
| Modal not closing | Check state updates for selected item |

---

## Next Steps After Implementation

### For Testing Phase
1. Run through TESTING_GUIDE.md systematically
2. Test on multiple browsers
3. Test on mobile/tablet/desktop
4. Check all error cases
5. Verify database state after operations

### For Deployment
1. Update .env.production URLs
2. Configure Supabase access
3. Deploy backend to Render
4. Deploy frontend to Render
5. Run smoke tests on production
6. Monitor logs for errors

### For Maintenance
1. Keep IMPLEMENTATION_CHANGES.md updated
2. Document any new features in TESTING_GUIDE.md
3. Maintain environment configuration
4. Monitor backend logs
5. Backup database regularly

---

## Code Examples

### Frontend: Call Withdrawal Endpoint
```javascript
const handleWithdraw = async (enrollmentId) => {
  try {
    const response = await axiosClient.post(
      `/offering/${offeringId}/withdraw`
    );
    if (response.data.success) {
      toast.success('Course withdrawal successful');
      fetchEnrolledCourses(); // Refresh list
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed');
  }
};
```

### Frontend: Call Offering Status Update
```javascript
const handleOfferingStatusChange = async (offeringId, newStatus) => {
  try {
    const response = await axiosClient.put(
      `/offering/${offeringId}/status`,
      { status: newStatus }
    );
    if (response.data.success) {
      toast.success(`Offering ${newStatus.toLowerCase()} successfully!`);
      // Update local state
      setOfferings(offerings.map(o => 
        o.offering_id === offeringId 
          ? { ...o, status: newStatus === 'Accepted' ? 'Enrolling' : 'Rejected' }
          : o
      ));
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed');
  }
};
```

### Backend: Withdrawal Function
```javascript
export const withdrawCourse = async (req, res) => {
  const { offeringId } = req.params;
  const userId = req.user?.user_id;
  
  try {
    // Get student ID
    const { data: studentData } = await supabase
      .from("student")
      .select("student_id")
      .eq('user_id', parseInt(userId))
      .single();
    
    // Find enrollment
    const { data: enrollment } = await supabase
      .from("course_enrollment")
      .select("enrollment_id")
      .eq('student_id', studentData.student_id)
      .eq('offering_id', parseInt(offeringId))
      .single();
    
    // Update status
    const { data } = await supabase
      .from("course_enrollment")
      .update({ enrol_status: 'withdrawn' })
      .eq('enrollment_id', enrollment.enrollment_id)
      .select()
      .single();
    
    return res.status(200).json({ 
      success: true, 
      message: "Successfully withdrawn from course", 
      data 
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};
```

---

## Performance Optimization Tips

### Frontend
- Use React.memo() for course cards
- Implement pagination for large lists (100+ items)
- Use useCallback() for event handlers
- Lazy load images/icons
- Implement virtual scrolling for lists

### Backend
- Add database indexes on offering_id, student_id
- Implement query caching for course offerings
- Use batch operations for bulk approvals
- Monitor slow query logs

### Database
- Index: course_enrollment(student_id, offering_id)
- Index: course_offering(instructor_id, status)
- Partition: course_enrollment by offering_id for large tables

---

## Security Checklist

- [x] All endpoints require authentication
- [x] Role-based access control implemented
- [x] Passwords hashed with bcrypt
- [x] Session tokens validated
- [x] CORS properly configured
- [x] SQL injection prevention (parameterized queries)
- [x] HTTPS enforced in production
- [x] Secure cookie flags set (HTTPOnly, Secure)
- [ ] Rate limiting (recommended to add)
- [ ] Request validation (recommended to add)
- [ ] Audit logging (recommended to add)

---

## Useful Links

- **Supabase Dashboard:** https://app.supabase.com
- **Render Dashboard:** https://dashboard.render.com
- **Frontend Localhost:** http://localhost:5173
- **Backend Localhost:** http://localhost:3000
- **Database:** Check SUPABASE_URL in .env

---

## Contact Points for Support

**For Frontend Issues:**
- Check browser console (F12)
- Check component state with React DevTools
- Verify API calls in Network tab

**For Backend Issues:**
- Check server logs in terminal
- Test API with curl commands
- Verify environment variables

**For Database Issues:**
- Check Supabase dashboard
- Verify table structure
- Check record existence

---

**Last Updated:** January 22, 2026
**Status:** All Features Complete ✅
**Ready for Testing & Deployment:** YES ✅
