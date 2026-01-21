import express from 'express';
import supabase from '../config/db.js';
import bcrypt from 'bcrypt';
import { 
  getHelp,
  createUser,
  createCourse,
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
  createOffering,
  loginUser,
  getEnrolledCourses,
  getCourseOfferings,
  getOfferingEnrollments
} from '../controllers/aimsController.js';
import { requireAuth, requireRole } from '../controllers/aimsController.js';

const router = express.Router();

// Help endpoint
router.get('/help', getHelp);

// Test endpoint
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is working!'
  });
});

// Debug endpoint - check if user exists
router.get('/check-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`[DEBUG] Checking user: ${email}`);
    
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role")
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `User not found with email: ${email}`,
        error: error?.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User found',
      user: data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

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
    const sid = req.sessionID;
    // Remove session row from DB if present
    if (sid) {
      const { error: delErr } = await supabase.from('sessions').delete().eq('sid', sid);
      if (delErr) console.error('[LOGOUT] Error deleting session row:', delErr);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('[LOGOUT] Error destroying session:', err);
        return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      // Clear cookie using server's session name
      res.clearCookie(process.env.SESSION_COOKIE_NAME || 'aims.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } catch (err) {
    console.error('[LOGOUT] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Could not log out' });
  }
});
router.get('/me', requireAuth, (req, res) => {
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
router.post("/user.add", requireRole('admin'), createUser);
router.get('/student', requireRole('admin'), getStudents);
router.get('/student/me', requireAuth, getStudent);
router.put('/student/me', requireAuth, updateStudent);
router.delete('/student/me', requireAuth, deleteStudent);

// Enrolled courses
// Enrolled courses for the currently authenticated student
router.get('/student/enrolled-courses', requireAuth, getEnrolledCourses);

// Course offerings - public read (no auth required to see available courses)
router.get('/course-offerings', getCourseOfferings);
router.get('/offering/:offeringId/enrollments', getOfferingEnrollments);

//create course
// Instructor creates a course (uses session identity)
router.post('/instructor/course', requireAuth, requireRole('instructor'), createCourse);

// Enrollment endpoints - any authenticated user can enroll/update their enrollment
router.post('/offering/:offeringId/enroll', requireAuth, createEnrollment);
router.put('/offering/:offeringId/enroll', requireAuth, updateEnrollment);

// Instructor creates offerings for their courses
router.post('/course/:courseId/offer', requireAuth, requireRole('instructor'), createOffering);

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

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("aims.sid");
    res.json({ success: true });
  });
});

export default router;
//kumarnaidu//tharun//"rithish"