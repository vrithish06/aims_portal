import supabase from "../config/db.js";
import bcrypt from "bcrypt";

// Authentication middleware
export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  // Attach user to request object for use in controllers
  req.user = req.session.user;
  next();
};

// Role-based authorization middleware
// Usage: requireRole('instructor') or requireRole('admin')
export const requireRole = (role) => (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  req.user = req.session.user;
  const userRole = req.user.role;
  if (!userRole) return res.status(403).json({ success: false, message: 'Forbidden' });
  // allow admin to bypass specific role checks
  if (userRole !== role && userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

//help endpoint
export const getHelp = async (req, res) => {
  res.status(200).json({
    message: "This is help endpoint from aimsController",
    helpLink:
      "https://docs.google.com/document/d/e/2PACX-1vR4cB5IKv1YEAiZUgKt4ZnzznaMdeG-VjIU_NBmxzej54YWlHEMwuHK4l2JzXPiyJAteAsxbkSPugFE/pub"
  });
};
//creating the users by admin
export const createUser = async (req, res) => {
  const {
    email,
    password,
    first_name,
    last_name,
    role,
    branch,
    gender
  } = req.body;

  // basic validation
  if (!email || !password || !first_name || !last_name || !role) {
    return res.status(400).json({
      success: false,
      message: "email, password, first_name, last_name and role are required"
    });
  }

  try {
    // hash password
    const password_hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hashed,
        first_name,
        last_name,
        role,
        branch,
        gender
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("creaters error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
//creating course
export const createCourse = async (req, res) => {
  // Identity comes from session; do not trust params/body for instructor identity
  const instructorId = req.user?.user_id;

  const {
    code,
    title,
    ltp,
    status,
    has_lab,
    pre_req
  } = req.body;

  // basic validation
  if (!code || !title) {
    return res.status(400).json({
      success: false,
      message: "course code and title are required"
    });
  }

  try {
    const { data, error } = await supabase
      .from("course")
      .insert({
        code,
        title,
        ltp,
        status,
        has_lab,
        pre_req,
        author_id: instructorId
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("createCourse error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
// Create instructor
export const createInstructor = async (req, res) => {
  const { user_id, instructor_number, branch, year_joined } = req.body;

  if (!user_id || !instructor_number) {
    return res.status(400).json({
      success: false,
      message: "user_id and instructor_number are required"
    });
  }

  try {
    const { data, error } = await supabase
      .from("instructor")
      .insert({ 
        user_id, 
        instructor_number, 
        branch, 
        // salary,  // Remove this if column doesn't exist
        year_joined 
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("createInstructor error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all instructors
export const getInstructors = async (req, res) => {
  try {
    const { data, error } = await supabase.from("instructor").select("*");
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getInstructors error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get single instructor
export const getInstructor = async (req, res) => {
  // Use session identity for instructor lookup
  const user_id = req.user?.user_id;
  try {
    const { data, error } = await supabase
      .from("instructor")
      .select("*")
      .eq('user_id', user_id)
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Instructor not found" });
  }
};

// Update instructor
export const updateInstructor = async (req, res) => {
  // Use session identity for which instructor is being updated
  const user_id = req.user?.user_id;
  const { instructor_number, branch, salary, year_joined } = req.body;
  try {
    const { data, error } = await supabase
      .from("instructor")
      .update({ instructor_number, branch, salary, year_joined })
      .eq('user_id', user_id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Delete instructor
export const deleteInstructor = async (req, res) => {
  // Use session identity for deleting instructor record
  const user_id = req.user?.user_id;
  try {
    const { error } = await supabase.from("instructor").delete().eq('user_id', user_id);
    if (error) throw error;
    return res.status(200).json({ success: true, message: "Instructor deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
export const getStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("student")
      .select(`
        *,
        users:user_id (
          email,
          first_name,
          last_name,
          gender
        )
      `);
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getStudents error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get single student
export const getStudent = async (req, res) => {
  // Use session identity to fetch the student record
  const user_id = req.user?.user_id;
  try {
    const { data, error } = await supabase
      .from("student")
      .select(`
        *,
        users:user_id (
          email,
          first_name,
          last_name,
          gender
        )
      `)
      .eq('user_id', user_id)
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Student not found" });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  // Use session identity for updates
  const user_id = req.user?.user_id;
  const { roll_number, branch, cgpa, total_credits_completed, degree } = req.body;
  
  try {
    const { data, error } = await supabase
      .from("student")
      .update({ roll_number, branch, cgpa, total_credits_completed, degree })
      .eq('user_id', user_id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  // Use session identity for delete
  const user_id = req.user?.user_id;
  try {
    const { error } = await supabase.from("student").delete().eq('user_id', user_id);
    if (error) throw error;
    return res.status(200).json({ success: true, message: "Student deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// add course enrollment
export const createEnrollment = async (req, res) => {
  // Student identity must come from session; offeringId comes from URL
  const offeringId = req.params.offeringId;
  const userId = req.user?.user_id;

  try {
    const {
      enrol_type,
      enrol_status
    } = req.body;

    if (!enrol_status || !enrol_type) {
      return res.status(400).json({
        success: false,
        message: "enrol_status and enrol_type are required"
      });
    }

    // Get student_id from session user_id
    const { data: studentData, error: studentError } = await supabase
      .from("student")
      .select("student_id")
      .eq('user_id', parseInt(userId))
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({
        success: false,
        message: "Student record not found"
      });
    }

    const { data, error } = await supabase
      .from("course_enrollment")
      .insert({
        student_id: studentData.student_id,
        offering_id: parseInt(offeringId),
        enrol_type,
        enrol_status
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    console.error("createEnrollment error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

//create course offering
export const createOffering = async (req, res) => {
  // Instructor identity must come from session; courseId comes from URL
  const instructorId = req.user?.user_id;
  const { courseId } = req.params;
  try{
  const {
    degree,
    dept_name,
    acad_session,
    status,
    slot,
    section
  } = req.body;

  const {data , error} = await supabase
    .from("course_offering")
    .insert({
      course_id: courseId,
      degree: degree,
      dept_name: dept_name,
      acad_session: acad_session,
      status: status,
      slot: slot,
      section: section,
      instructor_id: instructorId
    })
    .select()
    .single();

    if (error) {
      console.error("createOffering error:", error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  } catch (err) {
    console.error("createOffering error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

//update course enrollment
export const updateEnrollment = async (req, res) => {
  // Derive student from session; offeringId from URL
  const offeringId = req.params.offeringId;
  const userId = req.user?.user_id;
  try {
    const {
      enrol_status,
      grade
    } = req.body;

    // Get student_id from session user_id
    const { data: studentData, error: studentError } = await supabase
      .from("student")
      .select("student_id")
      .eq('user_id', parseInt(userId))
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({
        success: false,
        message: "Student record not found"
      });
    }

    const { data, error } = await supabase
      .from("course_enrollment")
      .update({
        enrol_status,
        grade
      })
      .eq('student_id', studentData.student_id)
      .eq('offering_id', parseInt(offeringId))
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error("updateEnrollment error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Login endpoint
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log('[LOGIN] Request cookies:', req.headers.cookie || 'none');
  console.log('[LOGIN] req.session exists at handler start:', !!req.session, 'sessionID:', req.sessionID || 'none');

  console.log(`[LOGIN] Attempting login for email: ${email}`);

  if (!email || !password) {
    console.log("[LOGIN] Missing email or password");
    return res.status(400).json({
      success: false,
      message: "email and password are required"
    });
  }

  try {
    console.log(`[LOGIN] Querying database for email: ${email}`);
    
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq('email', email)
      .single();

    console.log(`[LOGIN] Database query result:`, { exists: !!data, error });

    if (error) {
      console.log(`[LOGIN] Database error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!data) {
      console.log(`[LOGIN] User not found with email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log(`[LOGIN] User found. Password hash exists: ${!!data.password_hashed}`);
    
    // Verify password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, data.password_hashed);
      console.log(`[LOGIN] Password comparison result: ${isPasswordValid}`);
    } catch (bcryptErr) {
      console.log(`[LOGIN] Bcrypt error: ${bcryptErr.message}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!isPasswordValid) {
      console.log(`[LOGIN] Password invalid for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log(`[LOGIN] Login successful for email: ${email}`);

    // Ensure session middleware is available
    if (!req.session) {
      console.error('[LOGIN] req.session is undefined; session middleware may not be attached');
      return res.status(500).json({
        success: false,
        message: 'Server session middleware not available. Check server configuration.'
      });
    }

    // Create session
    req.session.user = {
      user_id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role
    };

    console.log(`[LOGIN] Session created for user: ${data.email}`);

    // Persist session to the database (sessions table)
    try {
      const sid = req.sessionID;
      // Make a plain JSON-safe copy of the session
      const sessObj = JSON.parse(JSON.stringify(req.session));
      const expire = new Date(Date.now() + (req.session.cookie?.maxAge || 24 * 60 * 60 * 1000));

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .upsert([
          {
            sid: sid,
            sess: sessObj,
            expire: expire
          }
        ]);

      if (sessionError) {
        console.error('[LOGIN] Error saving session to DB:', sessionError);
      } else {
        console.log('[LOGIN] Session saved to DB for sid:', sid);
      }
    } catch (saveErr) {
      console.error('[LOGIN] Unexpected error saving session to DB:', saveErr);
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user_id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role
      }
    });

  } catch (err) {
    console.error(`[LOGIN] Unexpected error:`, err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get enrolled courses for a student
export const getEnrolledCourses = async (req, res) => {
  // Derive student from session; do not trust URL params for identity
  const userId = req.user?.user_id;

  try {
    // First, get the student record to find their student_id
    const { data: studentData, error: studentError } = await supabase
      .from("student")
      .select("student_id")
      .eq('user_id', userId)
      .single();

    if (studentError || !studentData) {
      console.log("Student not found for user_id:", userId);
      return res.status(404).json({
        success: false,
        message: "Student record not found"
      });
    }

    // Now get enrollments using student_id
    const { data, error } = await supabase
      .from("course_enrollment")
      .select(`
        *,
        course_offering:offering_id (
          *,
          course:course_id (
            code,
            title,
            ltp
          ),
          instructor:instructor_id (
            user_id,
            users:user_id (
              first_name,
              last_name,
              email
            )
          )
        )
      `)
      .eq('student_id', studentData.student_id)
      .eq('is_deleted', false);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (err) {
    console.error("getEnrolledCourses error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

//  Get all course offerings
export const getCourseOfferings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("course_offering")
      .select(`
        *,
        course:course_id (
          code,
          title,
          ltp
        ),
        instructor:instructor_id (
          users:user_id (
            first_name,
            last_name
          )
        )
      `);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("getCourseOfferings error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get enrollments for a specific offering
export const getOfferingEnrollments = async (req, res) => {
  const { offeringId } = req.params;

  try {
    console.log(`[ENROLLMENTS] Fetching enrollments for offering: ${offeringId}`);

    // First get all enrollments for this offering
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from("course_enrollment")
      .select("*")
      .eq('offering_id', parseInt(offeringId))
      .eq('is_deleted', false);

    console.log(`[ENROLLMENTS] Raw enrollment count: ${enrollmentData?.length || 0}`, enrollmentError);

    if (enrollmentError) {
      console.error(`[ENROLLMENTS] Error fetching enrollments:`, enrollmentError);
      throw enrollmentError;
    }

    if (!enrollmentData || enrollmentData.length === 0) {
      console.log(`[ENROLLMENTS] No enrollments found for offering ${offeringId}`);
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Now get student details for each enrollment
    const studentIds = enrollmentData.map(e => e.student_id);
    const { data: studentData, error: studentError } = await supabase
      .from("student")
      .select(`
        student_id,
        user_id,
        users:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .in('student_id', studentIds);

    console.log(`[ENROLLMENTS] Student data fetched:`, studentData?.length || 0);

    if (studentError) {
      console.error(`[ENROLLMENTS] Error fetching student data:`, studentError);
      throw studentError;
    }

    // Create a map of student data by student_id
    const studentMap = {};
    studentData?.forEach(student => {
      studentMap[student.student_id] = student;
    });

    // Combine enrollment and student data
    const transformedData = enrollmentData.map(enrollment => ({
      ...enrollment,
      student_name: studentMap[enrollment.student_id]?.users ? 
        `${studentMap[enrollment.student_id].users.first_name} ${studentMap[enrollment.student_id].users.last_name}` : 'N/A',
      student_email: studentMap[enrollment.student_id]?.users?.email || 'N/A'
    }));

    console.log(`[ENROLLMENTS] Returning ${transformedData.length} enrollments for offering ${offeringId}`);

    return res.status(200).json({
      success: true,
      count: transformedData.length,
      data: transformedData
    });

  } catch (err) {
    console.error("getOfferingEnrollments error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};