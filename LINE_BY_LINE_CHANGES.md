# Line-by-Line Code Changes

## File 1: backend/controllers/aimsController.js

### Change 1.1: Add Debug Logging for Advisor Setup (After Line 1240)

**Location**: `getPendingAdvisorEnrollments` function - Advisor record retrieval  
**Purpose**: Debug why advisor is not found

```diff
    if (instructorError || !instructorData) {
+     console.log("Advisor check - No instructor found for user_id:", userId);
      return res.status(404).json({
        success: false,
        message: "Instructor record not found"
      });
    }

    const { data: advisorData, error: advisorError } = await supabase
      .from("faculty_advisor")
      .select("for_degree, batch")
      .eq('instructor_id', instructorData.instructor_id)
      .single();

    if (advisorError || !advisorData) {
+     console.log("Advisor check - No faculty advisor record found for instructor_id:", instructorData.instructor_id);
      return res.status(404).json({
        success: false,
        message: "Faculty advisor record not found. You are not assigned as an advisor."
      });
    }

    const { for_degree, batch } = advisorData;
+   console.log("Advisor info - degree:", for_degree, "batch:", batch);
```

---

### Change 1.2: Add Logging for Found Offerings (Line 1269)

**Location**: `getPendingAdvisorEnrollments` function - After fetching offerings

```diff
    const offeringIds = offerings.map(o => o.offering_id);
+   console.log("Found offerings for advisor batch/degree:", offeringIds);
```

---

### Change 1.3: Add Logging for Enrollments (Lines 1319-1320)

**Location**: `getPendingAdvisorEnrollments` function - After fetching enrollments

```diff
    if (enrollmentsError) throw enrollmentsError;

+   console.log("Total enrollments found with pending advisor approval:", enrollments?.length || 0);
+   console.log("Raw enrollments data:", JSON.stringify(enrollments, null, 2));

    // Filter enrollments to only include students in the advisor's batch/degree
```

---

### Change 1.4: Add Degree Filtering (Lines 1325-1335)

**Location**: `getPendingAdvisorEnrollments` function - Critical fix

```diff
    // Get enrollments with pending advisor approval for students in this batch/degree
-   const { data: enrollments, error: enrollmentsError } = await supabase
-     .from("course_enrollment")
-     .select(`...`)
-     .in('offering_id', offeringIds)
-     .eq('enrol_status', 'pending advisor approval')
-     .eq('is_deleted', false);

-   if (enrollmentsError) throw enrollmentsError;

-   // Flatten the response
-   const flattenedEnrollments = (enrollments || []).map(enrollment => ({
+   if (enrollmentsError) throw enrollmentsError;

+   console.log("Total enrollments found with pending advisor approval:", enrollments?.length || 0);
+   console.log("Raw enrollments data:", JSON.stringify(enrollments, null, 2));

+   // Filter enrollments to only include students in the advisor's batch/degree
+   const filteredEnrollments = (enrollments || []).filter(enrollment => {
+     const student = enrollment.student;
+     return student && student.degree === for_degree;
+   });

+   console.log("Filtered enrollments (matching degree):", filteredEnrollments.length);

+   // Flatten the response
+   const flattenedEnrollments = filteredEnrollments.map(enrollment => ({
      ...enrollment,
      offering: enrollment.course_offering,
      course: enrollment.course_offering?.course
    }));
```

---

### Change 1.5: Fix Withdraw Status Value (Line 1106)

**Location**: `withdrawCourse` function  
**Critical**: Database constraint requires exact string match

```diff
    // Update enrollment status to withdrawn
    const { data, error } = await supabase
      .from("course_enrollment")
-     .update({ enrol_status: 'withdrawn' })
+     .update({ enrol_status: 'student withdrawn' })
      .eq('enrollment_id', enrollment.enrollment_id)
      .select()
      .single();
```

---

### Change 1.6: Fix Drop Status Value (Line 1161)

**Location**: `dropCourse` function  
**Critical**: Database constraint requires exact string match

```diff
    // Update enrollment status to dropped
    const { data, error } = await supabase
      .from("course_enrollment")
-     .update({ enrol_status: 'dropped' })
+     .update({ enrol_status: 'student dropped' })
      .eq('enrollment_id', enrollment.enrollment_id)
      .select()
      .single();
```

---

## File 2: frontend/src/pages/EnrolledCoursesPage.jsx

### Change 2.1: Fix handleWithdraw Handler Signature (Lines 71-87)

**Location**: EnrolledCoursesPage component  
**Purpose**: Accept enrollment object instead of ID

```diff
- const handleWithdraw = async (enrollmentId) => {
+ const handleWithdraw = async (enrollment) => {
    if (!window.confirm('Are you sure you want to withdraw from this course?')) return;
    
    try {
-     setWithdrawing(enrollmentId);
-     const response = await axiosClient.post(`/offering/${selectedEnrollment.offering_id}/withdraw`);
+     setWithdrawing(enrollment.enrollment_id);
+     const response = await axiosClient.post(`/offering/${enrollment.offering_id}/withdraw`);
      
      if (response.data.success) {
        toast.success('Course withdrawal successful');
        fetchEnrolledCourses();
        setSelectedEnrollment(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to withdraw from course');
      console.error('Withdraw error:', error);
    } finally {
      setWithdrawing(null);
    }
  };
```

---

### Change 2.2: Fix handleDrop Handler Signature (Lines 91-107)

**Location**: EnrolledCoursesPage component  
**Purpose**: Accept enrollment object instead of ID

```diff
- const handleDrop = async (enrollmentId) => {
+ const handleDrop = async (enrollment) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    
    try {
-     setDropping(enrollmentId);
-     const response = await axiosClient.post(`/offering/${selectedEnrollment.course_offering.offering_id}/drop`);
+     setDropping(enrollment.enrollment_id);
+     const response = await axiosClient.post(`/offering/${enrollment.offering_id}/drop`);
      
      if (response.data.success) {
        toast.success('Course dropped successfully');
        fetchEnrolledCourses();
        setSelectedEnrollment(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to drop course');
      console.error('Drop error:', error);
    } finally {
      setDropping(null);
    }
  };
```

---

### Change 2.3: Fix Course Card React Key (Line 240)

**Location**: Course grid map function  
**Purpose**: Use unique identifier from database

```diff
            {filteredCourses.map((enrollment) => {
              const course = enrollment.course_offering?.course;
              const offering = enrollment.course_offering;
              const instructor = offering?.instructor?.users;
              
              return (
-               <div key={enrollment.id} className="...">
+               <div key={enrollment.enrollment_id} className="...">
```

---

### Change 2.4: Add Status Styling in Card (Lines 265-273)

**Location**: Course card status badge  
**Purpose**: Display withdrawn/dropped states with red color

```diff
                      <p className="text-gray-800">
                        <span className="font-bold text-gray-900">STATUS</span> 
                        <span className={`ml-1 font-bold px-2 py-0.5 rounded ${
                          enrollment.enrol_status === 'enrolled' ? 'text-green-600 bg-green-100' : 
                          enrollment.enrol_status === 'completed' ? 'text-blue-600 bg-blue-100' :
                          enrollment.enrol_status === 'pending instructor approval' ? 'text-yellow-600 bg-yellow-100' :
                          enrollment.enrol_status === 'pending advisor approval' ? 'text-orange-600 bg-orange-100' :
+                         enrollment.enrol_status === 'student withdrawn' ? 'text-red-600 bg-red-100' :
+                         enrollment.enrol_status === 'student dropped' ? 'text-red-600 bg-red-100' :
                          'text-gray-600 bg-gray-100'
                        }`}>
                          {enrollment.enrol_status ? enrollment.enrol_status.charAt(0).toUpperCase() + enrollment.enrol_status.slice(1) : 'Pending'}
                        </span>
                      </p>
```

---

### Change 2.5: Fix Withdraw Button Handler Call (Lines 284-294)

**Location**: Action buttons on course card  
**Purpose**: Pass enrollment object, use correct field for disabled state

```diff
                    {/* Action Buttons for Enrolled Status */}
                    {enrollment.enrol_status === 'enrolled' && (
                      <div className="flex gap-2 mb-2">
                        <button 
                          className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
-                           handleWithdraw(enrollment.id);
+                           handleWithdraw(enrollment);
                          }}
-                         disabled={withdrawing === enrollment.id}
+                         disabled={withdrawing === enrollment.enrollment_id}
                        >
-                         {withdrawing === enrollment.id ? 'Withdrawing...' : 'Withdraw'}
+                         {withdrawing === enrollment.enrollment_id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
```

---

### Change 2.6: Fix Drop Button Handler Call (Lines 294-304)

**Location**: Action buttons on course card  
**Purpose**: Pass enrollment object, use correct field for disabled state

```diff
                        <button 
                          className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
-                           handleDrop(enrollment.id);
+                           handleDrop(enrollment);
                          }}
-                         disabled={dropping === enrollment.id}
+                         disabled={dropping === enrollment.enrollment_id}
                        >
-                         {dropping === enrollment.id ? 'Dropping...' : 'Drop'}
+                         {dropping === enrollment.enrollment_id ? 'Dropping...' : 'Drop'}
                        </button>
```

---

### Change 2.7: Add Status Styling in Modal (Lines 335-341)

**Location**: Enrollment details modal  
**Purpose**: Display withdrawn/dropped states with red color

```diff
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Status</p>
                  <span className={`font-bold px-3 py-1 rounded ${
                    selectedEnrollment.enrol_status === 'enrolled' ? 'text-green-600 bg-green-100' : 
                    selectedEnrollment.enrol_status === 'completed' ? 'text-blue-600 bg-blue-100' :
+                   selectedEnrollment.enrol_status === 'student withdrawn' ? 'text-red-600 bg-red-100' :
+                   selectedEnrollment.enrol_status === 'student dropped' ? 'text-red-600 bg-red-100' :
                    'text-yellow-600 bg-yellow-100'
                  }`}>
                    {selectedEnrollment.enrol_status ? selectedEnrollment.enrol_status.charAt(0).toUpperCase() + selectedEnrollment.enrol_status.slice(1) : 'Pending'}
                  </span>
                </div>
```

---

### Change 2.8: Fix Modal Withdraw Button (Lines 376-384)

**Location**: Modal course actions section  
**Purpose**: Pass enrollment object, use correct field for disabled state

```diff
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                      onClick={() => {
-                       handleWithdraw(selectedEnrollment.id);
+                       handleWithdraw(selectedEnrollment);
                      }}
-                     disabled={withdrawing === selectedEnrollment.id}
+                     disabled={withdrawing === selectedEnrollment.enrollment_id}
                    >
-                     {withdrawing === selectedEnrollment.id ? 'Withdrawing...' : 'Withdraw'}
+                     {withdrawing === selectedEnrollment.enrollment_id ? 'Withdrawing...' : 'Withdraw'}
                    </button>
```

---

### Change 2.9: Fix Modal Drop Button (Lines 384-392)

**Location**: Modal course actions section  
**Purpose**: Pass enrollment object, use correct field for disabled state

```diff
                    <button 
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                      onClick={() => {
-                       handleDrop(selectedEnrollment.id);
+                       handleDrop(selectedEnrollment);
                      }}
-                     disabled={dropping === selectedEnrollment.id}
+                     disabled={dropping === selectedEnrollment.enrollment_id}
                    >
-                     {dropping === selectedEnrollment.id ? 'Dropping...' : 'Drop'}
+                     {dropping === selectedEnrollment.enrollment_id ? 'Dropping...' : 'Drop'}
                    </button>
```

---

## Summary of Changes

| File | Changes | Reason |
|------|---------|--------|
| `aimsController.js` | 6 changes | Fix status values, add filtering, add logging |
| `EnrolledCoursesPage.jsx` | 9 changes | Fix handlers, keys, styling |
| **Total** | **15 changes** | Complete fix for all 3 issues |

---

## Verification Checklist

After applying changes:

- [ ] Backend starts without errors: `npm start` in backend folder
- [ ] Frontend starts without errors: `npm run dev` in frontend folder
- [ ] No null reference errors in browser console
- [ ] Withdraw button changes status to "Student Withdrawn"
- [ ] Drop button changes status to "Student Dropped"
- [ ] Status is red for withdrawn/dropped courses
- [ ] Buttons disappear after withdraw/drop
- [ ] Advisor sees pending requests when logged in
- [ ] Database values match DB schema constraints
- [ ] Debug logs appear in backend console

