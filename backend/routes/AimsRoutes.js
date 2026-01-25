import express from 'express';
import supabase from '../config/db.js';
import bcrypt from 'bcrypt';
import {
  getHelp,
  createUser,
  createCourse,
  getAllCourses,
  createInstructor,
  getInstructors,
  getInstructor,
  updateInstructor,
  deleteInstructor,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  createEnrollment,
  updateEnrollment,
  // createOffering,
  getAllowedEnrolTypes,
  loginUser,
  getEnrolledCourses,
  getStudentCredits,
  getStudentCGPA,
  getCourseOfferings,
  getMyOfferings,
  getAllOfferings,
  getOfferingEnrollments,
  updateOfferingStatus,
  updateEnrollmentStatus,
  withdrawCourse,
  dropCourse,
  cancelCourseOffering,
  getPendingInstructorEnrollments,
  createAdvisor,
  getAllAdvisors,
  deleteAdvisor,
  getPendingAdvisorEnrollments,
  updateAdvisorEnrollmentStatus,
  getAllAdvisees,
  getMyPendingWorks,
  getAlerts,
  createAlert,
  deleteAlert,
  searchCourses,
  createOfferingWithInstructors,
  getAllInstructors,
  getCourseOfferingInstructors,
  bulkApproveEnrollments
} from '../controllers/aimsController.js';
import { requireAuth, requireRole } from '../controllers/aimsController.js';

const router = express.Router();

// Help endpoint
router.get('/help', getHelp);



// List all users (for debugging)
router.get('/users-list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role");

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data?.length || 0,
      users: data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Debug endpoint - get all course enrollments
router.get('/enrollments-all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("course_enrollment")
      .select("*");

    if (error) throw error;

    res.status(200).json({
      success: true,
      total: data?.length || 0,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// Auth endpoints
router.post('/login', loginUser);
router.post('/logout', requireAuth, async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('[LOGOUT] Error destroying session:', err);
        return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      // Clear cookie
      res.clearCookie('aims.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (err) {
    console.error('[LOGOUT] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Could not log out' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  console.log('[/ME] Called - Session ID:', req.sessionID, 'User:', req.user?.email);
  res.json({ success: true, data: req.user });
});

// Instructor routes
// Instructor routes - identity derived from session
router.post('/instructor', requireRole('admin'), createInstructor);
router.get('/instructor', requireAuth, getInstructors);
router.get('/instructor/me', requireAuth, requireRole('instructor'), getInstructor);
router.put('/instructor/me', requireAuth, requireRole('instructor'), updateInstructor);
router.delete('/instructor/me', requireAuth, requireRole('instructor'), deleteInstructor);

//create user
router.post("/user/create", requireRole('admin'), createUser);
router.get('/student', requireRole('admin'), getStudents);
router.get('/student/me', requireAuth, getStudent);
router.put('/student/me', requireAuth, updateStudent);
router.delete('/student/me', requireAuth, deleteStudent);

// Enrolled courses
// Enrolled courses for the currently authenticated student
router.get('/student/enrolled-courses', requireAuth, getEnrolledCourses);

// Student credits - fetch from student_credit table (with SGPA from cgpa_table)
router.get('/student/credits', requireAuth, getStudentCredits);

// Student CGPA/SGPA - fetch from cgpa_table
router.get('/student/cgpa', requireAuth, getStudentCGPA);

// Course offerings - public read (no auth required to see available courses)
router.get('/course-offerings', getCourseOfferings);

// My offerings - for instructors
router.get('/offering/my-offerings', requireAuth, requireRole('instructor'), getMyOfferings);

// All offerings - for admin to manage all courses
router.get('/offering/all-offerings', requireAuth, requireRole('admin'), getAllOfferings);

router.get('/offering/:offeringId/enrollments', getOfferingEnrollments);

router.get('/enrollment/pending-instructor', requireAuth, getPendingInstructorEnrollments);
router.get('/enrollment/pending-advisor', requireAuth, getPendingAdvisorEnrollments);
router.get('/enrollment/advisees', requireAuth, getAllAdvisees);
router.get('/enrollment/my-pending-works', requireAuth, requireRole('instructor'), getMyPendingWorks);

// Advisor approval endpoint - for faculty advisors to approve/reject pending advisor approvals
router.put('/enrollment/:enrollmentId/advisor-approval', requireAuth, updateAdvisorEnrollmentStatus);

//create course
// Admin creates a course (uses session identity)
router.post('/admin/add-course', requireAuth, requireRole('admin'), createCourse);
router.get('/courses/all', requireAuth, getAllCourses);

// Enrollment endpoints - any authenticated user can enroll/update their enrollment
router.post('/offering/:offeringId/enroll', requireAuth, createEnrollment);
router.put('/offering/:offeringId/enroll', requireAuth, updateEnrollment);
router.get('/offering/:offeringId/allowed-enrol-types', requireAuth, getAllowedEnrolTypes);

// Student withdrawal and drop endpoints
router.post('/offering/:offeringId/withdraw', requireAuth, withdrawCourse);
router.post('/offering/:offeringId/drop', requireAuth, dropCourse);

// Instructor/Admin update specific enrollment status for approvals
router.put('/offering/:offeringId/enrollments/:enrollmentId', requireAuth, updateEnrollmentStatus);

// New endpoints for AddOfferingPage
router.get('/courses/search', searchCourses);
router.get('/instructors/all', requireAuth, getAllInstructors);
router.get('/course/offering/instructors', requireAuth, getCourseOfferingInstructors);

// Advisor management endpoints
router.post('/admin/add-advisor', requireAuth, requireRole('admin'), createAdvisor);
router.get('/admin/advisors', requireAuth, requireRole('admin'), getAllAdvisors);
router.delete('/admin/advisors/:advisorId', requireAuth, requireRole('admin'), deleteAdvisor);

router.post('/offering/create-with-instructors', requireAuth, requireRole('instructor'), createOfferingWithInstructors);

// Bulk Actions
router.post('/enrollment/bulk-approve', requireRole('instructor'), bulkApproveEnrollments);

// Course offering status management (accept/reject proposed offerings)
router.put('/offering/:offeringId/status', requireAuth, updateOfferingStatus);

// Instructor cancels course offering (cascades to enrollments)
router.post('/offering/:offeringId/cancel', requireAuth, requireRole('instructor'), cancelCourseOffering);

// Admin endpoint to fix/hash passwords (use with caution!)
router.post('/admin/fix-password/:email/:plainPassword', requireRole('admin'), async (req, res) => {
  try {
    const { email, plainPassword } = req.params;

    console.log(`[ADMIN] Fixing password for: ${email}`);

    // Hash the plain password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Update in database
    const { data, error } = await supabase
      .from('users')
      .update({ password_hashed: hashedPassword })
      .eq('email', email)
      .select();

    if (error) {
      console.error('[ADMIN] Error updating password:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    console.log(`[ADMIN] Password fixed for: ${email}`);
    res.status(200).json({
      success: true,
      message: `Password updated for ${email}`,
      updated: data
    });
  } catch (err) {
    console.error('[ADMIN] Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// --- ALERT ROUTES ---
router.get('/alerts', getAlerts); // Public read
router.post('/alerts', requireAuth, requireRole('admin'), createAlert); // Admin create
router.delete('/alerts/:id', requireAuth, requireRole('admin'), deleteAlert); // Admin delete

export default router;