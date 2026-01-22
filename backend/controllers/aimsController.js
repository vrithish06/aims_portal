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
  const userId = req.user?.user_id;

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
    // Get instructor_id from user_id
    const { data: instructorData, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id")
      .eq('user_id', userId)
      .single();

    if (instructorError || !instructorData) {
      return res.status(404).json({
        success: false,
        message: "Instructor record not found"
      });
    }

    const { data, error } = await supabase
      .from("course")
      .insert({
        code,
        title,
        ltp,
        status,
        has_lab,
        pre_req,
        author_id: instructorData.instructor_id
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
  const { user_id, branch, year_joined } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required"
    });
  }

  try {
    const { data, error } = await supabase
      .from("instructor")
      .insert({ 
        user_id, 
        branch, 
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
  const { branch, cgpa, total_credits_completed, degree } = req.body;
  
  try {
    const { data, error } = await supabase
      .from("student")
      .update({ branch, cgpa, total_credits_completed, degree })
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

    console.log('[ENROLLMENT] Received data:', { enrol_type, enrol_status, offeringId, userId });

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

    console.log('[ENROLLMENT] Database response:', { data, error });

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
  const userId = req.user?.user_id;
  const { courseId } = req.params;
  try{
  const {
    degree,
    dept_name,
    acad_session,
    status,
    slot,
    section,
    is_coordinator
  } = req.body;

  // Get instructor_id from user_id
  const { data: instructorData, error: instructorError } = await supabase
    .from("instructor")
    .select("instructor_id")
    .eq('user_id', userId)
    .single();

  if (instructorError || !instructorData) {
    return res.status(404).json({
      success: false,
      message: "Instructor record not found"
    });
  }

  const {data , error} = await supabase
    .from("course_offering")
    .insert({
      course_id: parseInt(courseId),
      degree: degree,
      dept_name: dept_name,
      acad_session: acad_session,
      status: status,
      slot: slot,
      section: section,
      instructor_id: instructorData.instructor_id,
      is_coordinator: is_coordinator || false
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

    return res.status(201).json({
      success: true,
      data
    });
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

  console.log("[LOGIN] Incoming cookies:", req.headers.cookie || "none");
  console.log(
    "[LOGIN] Session exists:",
    !!req.session,
    "SessionID:",
    req.sessionID
  );

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    /* -----------------------------
       1️⃣ Fetch user from DB
    ------------------------------ */
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /* -----------------------------
       2️⃣ Verify password
    ------------------------------ */
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hashed
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    /* -----------------------------
       3️⃣ CREATE SESSION (CRITICAL)
    ------------------------------ */
    req.session.user = {
      user_id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    /* -----------------------------
       4️⃣ FORCE SESSION SAVE
       (guarantees Set-Cookie)
    ------------------------------ */
    req.session.save((err) => {
      if (err) {
        console.error("[LOGIN] Session save error:", err);
        return res.status(500).json({
          success: false,
          message: "Session creation failed",
        });
      }

      console.log(
        "[LOGIN] Session saved successfully. SID:",
        req.sessionID
      );
      console.log(
        "[LOGIN] Cookie config:",
        JSON.stringify(req.sessionID, null, 2)
      );
      console.log(
        "[LOGIN] Set-Cookie header will be sent by express-session"
      );

      /* -----------------------------
         5️⃣ Respond AFTER save
      ------------------------------ */
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: req.session.user,
      });
    });
  } catch (err) {
    console.error("[LOGIN] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get enrolled courses for a student
export const getEnrolledCourses = async (req, res) => {
  const userId = req.user?.user_id;

  try {
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

    const { data, error } = await supabase
      .from("course_enrollment")
      .select(`
        enrollment_id,
        enrol_type,
        enrol_status,
        grade,
        offering_id,
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
    console.log('[getCourseOfferings] Fetching course offerings...');
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
          instructor_id,
          user_id
        )
      `);

    if (error) {
      console.error('[getCourseOfferings] Error:', error);
      throw error;
    }

    console.log('[getCourseOfferings] Success! Found', data?.length || 0, 'offerings');

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("getCourseOfferings error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Unknown error'
    });
  }
};

// Get my offerings (for instructors)
export const getMyOfferings = async (req, res) => {
  const user_id = req.user?.user_id;

  try {
    // First, get the instructor record for this user
    const { data: instructorData, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id")
      .eq('user_id', user_id)
      .single();

    if (instructorError || !instructorData) {
      return res.status(404).json({
        success: false,
        message: "Instructor record not found"
      });
    }

    // Now get the course offerings for this instructor
    const { data, error } = await supabase
      .from("course_offering")
      .select(`
        *,
        course:course_id (
          code,
          title,
          ltp
        ),
        enrollments:course_enrollment(
          enrollment_id,
          student_id,
          enrol_type,
          enrol_status
        )
      `)
      .eq('instructor_id', instructorData.instructor_id);

    if (error) throw error;

    // Add enrollment count to each offering
    const enrichedData = data.map(offering => ({
      ...offering,
      _count: {
        enrollments: offering.enrollments?.length || 0
      }
    }));

    return res.status(200).json({
      success: true,
      data: enrichedData
    });

  } catch (err) {
    console.error("getMyOfferings error:", err);
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

    // Get all enrollments for this offering with explicit field selection
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from("course_enrollment")
      .select(`
        enrollment_id,
        student_id,
        offering_id,
        enrol_type,
        enrol_status,
        grade,
        is_deleted
      `)
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

    // Get student details for each enrollment
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
      enrollment_id: enrollment.enrollment_id,
      student_id: enrollment.student_id,
      offering_id: enrollment.offering_id,
      enrol_type: enrollment.enrol_type,  // Explicitly include enrollment type
      enrol_status: enrollment.enrol_status,
      grade: enrollment.grade || 'N/A',
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

