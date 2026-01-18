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
      .select("user_id, email, first_name, last_name, role")
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

// Instructor routes
router.post('/instructor', createInstructor);
router.get('/instructor', getInstructors);
router.get('/instructor/:user_id', getInstructor);
router.put('/instructor/:user_id', updateInstructor);
router.delete('/instructor/:user_id', deleteInstructor);

//create user
router.post("/user.add",createUser);
router.get('/student', getStudents);
router.get('/student/:user_id', getStudent);
router.put('/student/:user_id', updateStudent);
router.delete('/student/:user_id', deleteStudent);

// Enrolled courses
router.get('/student/:studentId/enrolled-courses', getEnrolledCourses);

// Course offerings
router.get('/course-offerings', getCourseOfferings);
router.get('/offering/:offeringId/enrollments', getOfferingEnrollments);

//create course
router.post("/instructor/:instructorId/course",createCourse);
//create course enrollment
router.post("/student/:studentId/:offeringId/enroll", (req, res, next) => {
  console.log('[ENROLL] Route hit!', req.params);
  next();
}, createEnrollment);
router.put("/student/:studentId/:offeringId/enroll",updateEnrollment);
//create course offering
router.post("/instructor/:instructorId/course/:courseId/offer",createOffering);

// Admin endpoint to fix/hash passwords (use with caution!)
router.post('/admin/fix-password/:email/:plainPassword', async (req, res) => {
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

export default router;
//kumarnaidu//tharun//"rithish"