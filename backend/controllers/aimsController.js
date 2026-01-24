import supabase from "../config/db.js";
import bcrypt from "bcrypt";

// Authentication middleware
export const requireAuth = (req, res, next) => {
  console.log(`[AUTH-CHECK] Session ID: ${req.sessionID}`);
  console.log(`[AUTH-CHECK] Session exists: ${!!req.session}`);
  console.log(`[AUTH-CHECK] User in session: ${!!req.session?.user}`);
  console.log(`[AUTH-CHECK] User email: ${req.session?.user?.email || 'none'}`);
  console.log(`[AUTH-CHECK] Full session data:`, JSON.stringify(req.session, null, 2));

  if (!req.session || !req.session.user) {
    console.log(`[AUTH-CHECK] ❌ FAILED - No user in session`);
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Attach user to request object for use in controllers
  req.user = req.session.user;
  console.log(`[AUTH-CHECK] ✅ SUCCESS - User authenticated:`, req.user.email);
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
    //check if admin's user_id exists in users table
    // const { data: adminData, error: adminError } = await supabase
    //   .from("users")
    //   .select("user_id")
    //   .eq('user_id', userId)
    //   .single();

    // if (adminError || !adminData) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "admin record not found"
    //   });
    // }

    const { data, error } = await supabase
      .from("course")
      .insert({
        code,
        title,
        ltp,
        status,
        has_lab,
        pre_req,
        author_id: userId
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

// display all courses
export const getAllCourses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("course")
      .select("*")
      .eq("is_deleted", false)
      .order("course_id", { ascending: true });

    if (error) throw error;

    console.log("[getAllCourses] ✅ Fetched", data?.length || 0, "courses");

    return res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (err) {
    console.error("[getAllCourses] ❌ Error:", err.message);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Search courses by code
export const searchCourses = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || code.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Course code is required"
      });
    }

    const { data, error } = await supabase
      .from("course")
      .select("course_id, code, title, ltp, status")
      .eq("is_deleted", false)
      .ilike("code", `%${code}%`)
      .limit(10);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error("searchCourses error:", err);
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

// Get all instructors (for dropdown in AddOfferingPage)
export const getAllInstructors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("instructor")
      .select(`
        instructor_id,
        user_id,
        branch,
        is_advisor,
        users:user_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("is_deleted", false)
      .order("branch", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error("[getAllInstructors] ❌ Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all advisors with their assigned degree and batch
export const getAllAdvisors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("faculty_advisor")
      .select(`
        advisor_id,
        instructor_id,
        for_degree,
        batch,
        is_deleted,
        instructor:instructor_id (
          instructor_id,
          user_id,
          branch,
          users:user_id (
            id,
            email,
            first_name,
            last_name
          )
        )
      `)
      .eq("is_deleted", false)
      .order("for_degree", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error("[getAllAdvisors] ❌ Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create a new faculty advisor
export const createAdvisor = async (req, res) => {
  const { instructor_id, for_degree, batch } = req.body;

  // Validation
  if (!instructor_id || !for_degree || !batch) {
    return res.status(400).json({
      success: false,
      message: "instructor_id, for_degree, and batch are required"
    });
  }

  try {
    // First, check if instructor exists
    const { data: instructor, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id, user_id")
      .eq("instructor_id", instructor_id)
      .eq("is_deleted", false)
      .single();

    if (instructorError || !instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found"
      });
    }

    // Check if this instructor is already an advisor for this degree/batch
    const { data: existingAdvisor } = await supabase
      .from("faculty_advisor")
      .select("advisor_id")
      .eq("instructor_id", instructor_id)
      .eq("for_degree", for_degree)
      .eq("batch", batch)
      .eq("is_deleted", false)
      .single();

    if (existingAdvisor) {
      return res.status(400).json({
        success: false,
        message: "This instructor is already an advisor for this degree and batch"
      });
    }

    // Create faculty advisor record
    const { data: advisor, error: advisorError } = await supabase
      .from("faculty_advisor")
      .insert({
        instructor_id,
        for_degree,
        batch,
        is_deleted: false
      })
      .select()
      .single();

    if (advisorError) throw advisorError;

    console.log("[createAdvisor] ✅ Advisor created:", advisor.advisor_id);

    return res.status(201).json({
      success: true,
      message: "Faculty advisor created successfully",
      data: advisor
    });

  } catch (err) {
    console.error("[createAdvisor] ❌ Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Delete a faculty advisor (soft delete)
export const deleteAdvisor = async (req, res) => {
  const { advisorId } = req.params;

  try {
    const { data, error } = await supabase
      .from("faculty_advisor")
      .update({ is_deleted: true })
      .eq("advisor_id", advisorId)
      .select()
      .single();

    if (error) throw error;

    console.log("[deleteAdvisor] ✅ Advisor deleted:", advisorId);

    return res.status(200).json({
      success: true,
      message: "Faculty advisor removed successfully"
    });

  } catch (err) {
    console.error("[deleteAdvisor] ❌ Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message
    });
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

// Get students
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

// Get enrolled courses for a student (NEW SCHEMA)
export const getEnrolledCourses = async (req, res) => {
  const userId = req.user?.user_id;

  try {
    // 1️⃣ Get student_id
    const { data: studentData, error: studentError } = await supabase
      .from("student")
      .select("student_id")
      .eq("user_id", userId)
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({
        success: false,
        message: "Student record not found"
      });
    }

    // 2️⃣ Fetch enrollments with correct joins
    const { data, error } = await supabase
      .from("course_enrollment")
      .select(`
        enrollment_id,
        enrol_type,
        enrol_status,
        grade,
        offering_id,
        course_offering:offering_id (
          offering_id,
          acad_session,
          status,
          slot,
          section,
          course:course_id (
            code,
            title,
            ltp
          ),
          course_offering_instructor (
            is_coordinator,
            instructor:instructor_id (
              instructor_id,
              users:user_id (
                first_name,
                last_name,
                email
              )
            )
          )
        )
      `)
      .eq("student_id", studentData.student_id)
      .eq("is_deleted", false);

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    // Add dept_name to each course_offering by finding coordinator's branch
    const enrichedData = data.map(enrollment => ({
      ...enrollment,
      course_offering: {
        ...enrollment.course_offering,
        dept_name: (() => {
          const coordinators = enrollment.course_offering?.course_offering_instructor || [];
          const coordinator = coordinators.find(i => i.is_coordinator);
          return coordinator?.instructor?.branch || 'N/A';
        })()
      }
    }));

    return res.status(200).json({
      success: true,
      data: enrichedData || []
    });

  } catch (err) {
    console.error("getEnrolledCourses error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get student credit details from student_credit table
export const getStudentCredits = async (req, res) => {
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

    // Fetch student credit records
    const { data: credits, error: creditsError } = await supabase
      .from("student_credit")
      .select(`
        credit_id,
        student_id,
        acad_session,
        cred_earned,
        cred_registered,
        cred_earned_total,
        enrol_id,
        grade,
        is_deleted
      `)
      .eq('student_id', studentData.student_id)
      .eq('is_deleted', false)
      .order('acad_session', { ascending: true });

    if (creditsError) throw creditsError;

    // Fetch SGPA from cgpa_table for each session
    const { data: cgpaData, error: cgpaError } = await supabase
      .from("cgpa_table")
      .select(`
        id,
        student_id,
        cg,
        sg,
        semester,
        session
      `)
      .eq('student_id', studentData.student_id)
      .order('session', { ascending: true });

    if (cgpaError) throw cgpaError;

    // Create a map of SGPA by session for quick lookup
    const sgpaMap = {};
    cgpaData?.forEach(row => {
      sgpaMap[row.session] = {
        sg: row.sg,
        cg: row.cg,
        semester: row.semester
      };
    });

    // Enrich credits data with SGPA
    const enrichedCredits = credits?.map(credit => ({
      ...credit,
      sgpa: sgpaMap[credit.acad_session]?.sg || 0
    })) || [];

    return res.status(200).json({
      success: true,
      data: enrichedCredits
    });

  } catch (err) {
    console.error("getStudentCredits error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get CGPA and SGPA from cgpa_table
export const getStudentCGPA = async (req, res) => {
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
      .from("cgpa_table")
      .select(`
        id,
        student_id,
        cg,
        sg,
        semester,
        session
      `)
      .eq('student_id', studentData.student_id)
      .order('session', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (err) {
    console.error("getStudentCGPA error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Create course offering with multiple instructors
export const createOfferingWithInstructors = async (req, res) => {
  const {
    course_id,
    acad_session,
    status,
    slot,
    section,
    targets,
    instructors
  } = req.body;

  // Basic validation
  if (!course_id || !acad_session || !status || !Array.isArray(instructors) || instructors.length === 0) {
    return res.status(400).json({
      success: false,
      message: "course_id, acad_session, status, instructors are required"
    });
  }

  if (!Array.isArray(targets)) {
    return res.status(400).json({
      success: false,
      message: "targets must be an array"
    });
  }

  const coordinators = instructors.filter(i => i.is_coordinator);
  if (coordinators.length !== 1) {
    return res.status(400).json({
      success: false,
      message: "Exactly one instructor must be marked as coordinator"
    });
  }

  try {
    // Create offering
    const { data: offering, error: offeringError } = await supabase
      .from("course_offering")
      .insert({
        course_id,
        acad_session,
        status,
        slot: slot || null,
        section: section || null,
        targets, // ✅ JSONB insert
        is_deleted: false
      })
      .select()
      .single();

    if (offeringError) throw offeringError;

    // Insert instructors
    const instructorRows = instructors.map(i => ({
      offering_id: offering.offering_id,
      instructor_id: i.instructor_id,
      is_coordinator: i.is_coordinator
    }));

    const { error: instrError } = await supabase
      .from("course_offering_instructor")
      .insert(instructorRows);

    if (instrError) {
      await supabase
        .from("course_offering")
        .delete()
        .eq("offering_id", offering.offering_id);

      throw instrError;
    }

    return res.status(201).json({
      success: true,
      data: offering
    });
  } catch (err) {
    console.error("createOfferingWithInstructors error:", err);
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

    const { data: offerings, error } = await supabase
      .from('course_offering')
      .select(`
        offering_id,
        course_id,
        is_deleted,
        acad_session,
        status,
        slot,
        section,
        targets,
        course:course_id (
          code,
          title,
          ltp
        )
      `)
      .eq('is_deleted', false);

    if (error) {
      console.error('[getCourseOfferings] Error:', error);
      throw error;
    }

    // Fetch instructors for all offerings
    const { data: offeringInstructors, error: instrError } = await supabase
      .from('course_offering_instructor')
      .select(`
        offering_id,
        is_coordinator,
        instructor:instructor_id (
          instructor_id,
          branch,
          user_id,
          users:user_id (
            id,
            first_name,
            last_name,
            email
          )
        )
      `);

    if (instrError) {
      console.error('[getCourseOfferings] Instructors Error:', instrError);
    }

    // Build a map of offering_id to instructor data
    const instructorMap = {};
    if (offeringInstructors) {
      for (const row of offeringInstructors) {
        if (!instructorMap[row.offering_id]) {
          instructorMap[row.offering_id] = {
            coordinator: null,
            instructors: []
          };
        }

        const instructorData = {
          instructor_id: row.instructor.instructor_id,
          user_id: row.instructor.user_id,
          name: `${row.instructor.users.first_name} ${row.instructor.users.last_name}`,
          email: row.instructor.users.email,
          branch: row.instructor.branch,
          is_coordinator: row.is_coordinator
        };

        instructorMap[row.offering_id].instructors.push(instructorData);
        if (row.is_coordinator) {
          instructorMap[row.offering_id].coordinator = instructorData;
        }
      }
    }

    // Enrichment offerings with instructor and dept_name data
    const enrichedData = offerings.map(offering => {
      const info = instructorMap[offering.offering_id] || { coordinator: null, instructors: [] };
      return {
        ...offering,
        dept_name: info.coordinator?.branch || 'N/A',
        instructor: info.coordinator,
        instructors: info.instructors
      };
    });

    console.log(
      '[getCourseOfferings] Success! Found',
      enrichedData?.length || 0,
      'offerings'
    );

    return res.status(200).json({
      success: true,
      data: enrichedData || []
    });

  } catch (err) {
    console.error('getCourseOfferings error:', err.message || err);
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

    // Get offering IDs for this instructor from course_offering_instructor
    const { data: instructorOfferings, error: ioError } = await supabase
      .from("course_offering_instructor")
      .select("offering_id")
      .eq('instructor_id', instructorData.instructor_id);

    if (ioError) throw ioError;

    const offeringIds = instructorOfferings.map(io => io.offering_id);

    if (offeringIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
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
      .in('offering_id', offeringIds);


    if (error) throw error;

    // Fetch instructors for these offerings to get dept_name
    const { data: offeringInstructors } = await supabase
      .from('course_offering_instructor')
      .select(`
        offering_id,
        is_coordinator,
        instructor:instructor_id (
          branch
        )
      `)
      .in('offering_id', offeringIds);

    // Build a map of offering_id to branch
    const deptMap = {};
    if (offeringInstructors) {
      for (const row of offeringInstructors) {
        if (row.is_coordinator) {
          deptMap[row.offering_id] = row.instructor?.branch || 'N/A';
        }
      }
    }

    // Add enrollment count and dept_name to each offering
    const enrichedData = data.map(offering => ({
      ...offering,
      dept_name: deptMap[offering.offering_id] || 'N/A',
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

// Get all offerings (for admin to manage courses)
export const getAllOfferings = async (req, res) => {
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
        enrollments:course_enrollment(
          enrollment_id,
          student_id,
          enrol_type,
          enrol_status
        )
      `);

    if (error) throw error;

    // Fetch instructors for all offerings to get dept_name
    const { data: offeringInstructors } = await supabase
      .from('course_offering_instructor')
      .select(`
        offering_id,
        is_coordinator,
        instructor:instructor_id (
          branch
        )
      `);

    // Build a map of offering_id to branch
    const deptMap = {};
    if (offeringInstructors) {
      for (const row of offeringInstructors) {
        if (row.is_coordinator) {
          deptMap[row.offering_id] = row.instructor?.branch || 'N/A';
        }
      }
    }

    // Add enrollment count and dept_name to each offering
    const enrichedData = data.map(offering => ({
      ...offering,
      dept_name: deptMap[offering.offering_id] || 'N/A',
      _count: {
        enrollments: offering.enrollments?.length || 0
      }
    }));

    return res.status(200).json({
      success: true,
      data: enrichedData
    });

  } catch (err) {
    console.error("getAllOfferings error:", err);
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

    // Merge enrollment and student data
    const enrollmentDataWithStudents = enrollmentData.map(enrollment => {
      const student = studentMap[enrollment.student_id];
      return {
        ...enrollment,
        student_name: student ? `${student.users.first_name} ${student.users.last_name}` : 'Unknown',
        student_email: student ? student.users.email : 'Unknown'
      };
    });

    return res.status(200).json({
      success: true,
      count: enrollmentDataWithStudents.length,
      data: enrollmentDataWithStudents
    });
  } catch (err) {
    console.error("[ENROLLMENTS] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update course offering status
export const updateOfferingStatus = async (req, res) => {
  const { offeringId } = req.params;
  const { status } = req.body;
  const userId = req.user?.user_id;
  const userRole = req.user?.role;

  // Proposal decision mapping
  const proposalStatusMap = {
    Accepted: "Enrolling",
    Rejected: "Declined",
  };

  // Direct lifecycle statuses
  const directStatuses = [
    "Enrolling",
    "Running",
    "Completed",
    "Canceled",
    "Declined"
  ];

  try {
    // Fetch offering
    const { data: offering, error: offeringError } = await supabase
      .from("course_offering")
      .select("*")
      .eq("offering_id", offeringId)
      .single();

    if (offeringError || !offering) {
      return res.status(404).json({
        success: false,
        message: "Offering not found",
      });
    }

    // Authorization: admin OR owning instructor
    if (userRole !== "admin") {
      const { data: instructor, error: instructorError } = await supabase
        .from("instructor")
        .select("instructor_id")
        .eq("user_id", userId)
        .single();

      if (
        instructorError ||
        offering.instructor_id !== instructor.instructor_id
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own offerings",
        });
      }
    }

    // Decide final status
    let newStatus;

    if (proposalStatusMap[status]) {
      // Accepted / Rejected case
      newStatus = proposalStatusMap[status];
    } else if (directStatuses.includes(status)) {
      // Direct status update case
      newStatus = status;
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed values: Accepted, Rejected, Enrolling, Running, Completed, Canceled",
      });
    }

    // Update DB
    const { data, error } = await supabase
      .from("course_offering")
      .update({ status: newStatus })
      .eq("offering_id", offeringId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Offering status updated to ${newStatus}`,
      data,
    });
  } catch (err) {
    console.error("updateOfferingStatus error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Bulk Approve Enrollments
export const bulkApproveEnrollments = async (req, res) => {
  const { enrollmentIds } = req.body;
  const userId = req.user?.user_id;

  if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
    return res.status(400).json({ success: false, message: "No enrollments selected" });
  }

  try {
    // 1. Get instructor info
    const { data: instructor, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id, branch")
      .eq('user_id', userId)
      .single();

    if (instructorError || !instructor) {
      return res.status(403).json({ success: false, message: "Instructor record not found" });
    }

    // 2. Fetch all selected enrollments to verify ownership/status
    const { data: enrollments, error: fetchError } = await supabase
      .from("course_enrollment")
      .select(`
        enrollment_id, 
        offering_id, 
        enrol_status, 
        student_id,
        student:student_id(advisor_id)
      `)
      .in('enrollment_id', enrollmentIds);

    if (fetchError) throw fetchError;

    // 3. Prepare data for validation

    // 3a. Fetched taught offerings (for instructor approval)
    const { data: taughtOfferings } = await supabase
      .from("course_offering_instructor")
      .select("offering_id")
      .eq('instructor_id', instructor.instructor_id);
    const taughtOfferingIds = new Set((taughtOfferings || []).map(o => o.offering_id));

    // 3b. Fetch advisor info (for advisor approval)
    const { data: advisorData } = await supabase
      .from("faculty_advisor")
      .select("advisor_id")
      .eq('instructor_id', instructor.instructor_id)
      .eq('is_deleted', false)
      .maybeSingle();

    const updates = [];

    for (const enrollment of enrollments) {
      const { enrollment_id, enrol_status, offering_id, student } = enrollment;

      // Case A: Pending Instructor Approval
      if (enrol_status === 'pending instructor approval') {
        if (taughtOfferingIds.has(offering_id)) {
          updates.push({
            enrollment_id,
            enrol_status: 'pending advisor approval'
          });
        }
      }
      // Case B: Pending Advisor Approval
      else if (enrol_status === 'pending advisor approval') {
        if (advisorData && student?.advisor_id === advisorData.advisor_id) {
          updates.push({
            enrollment_id,
            enrol_status: 'enrolled'
          });
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No valid enrollments found to approve (maybe already approved or unauthorized)" });
    }

    // 4. Perform updates
    // We can't do a single batch update with different values easily in one query unless we use a CASE statement or multiple queries.
    // For simplicity with Supabase JS, we'll split by target status.

    const toAdvisorApproval = updates.filter(u => u.enrol_status === 'pending advisor approval').map(u => u.enrollment_id);
    const toEnrolled = updates.filter(u => u.enrol_status === 'enrolled').map(u => u.enrollment_id);

    if (toAdvisorApproval.length > 0) {
      const { error: err1 } = await supabase
        .from("course_enrollment")
        .update({ enrol_status: 'pending advisor approval' })
        .in('enrollment_id', toAdvisorApproval);
      if (err1) throw err1;
    }

    if (toEnrolled.length > 0) {
      const { error: err2 } = await supabase
        .from("course_enrollment")
        .update({ enrol_status: 'enrolled' })
        .in('enrollment_id', toEnrolled);
      if (err2) throw err2;
    }

    return res.status(200).json({
      success: true,
      message: `Successfully approved ${updates.length} enrollment(s)`
    });

  } catch (err) {
    console.error("Bulk approve error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateEnrollmentStatus = async (req, res) => {
  const { offeringId, enrollmentId } = req.params;
  const { enrol_status } = req.body;
  const userId = req.user?.user_id;

  try {
    // 1. Get the enrollment and student details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("course_enrollment")
      .select(`
        *,
        student:student_id (student_id, degree, batch, branch, advisor_id)
      `)
      .eq('enrollment_id', enrollmentId)
      .eq('offering_id', offeringId)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // 2. Authorization Check
    let isAuthorized = false;

    // Get instructor context
    const { data: instructor, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id, branch")
      .eq('user_id', userId)
      .single();

    if (instructorError || !instructor) {
      console.log("[UPDATE-ENROLLMENT] Instructor not found for user_id:", userId, instructorError);
      return res.status(403).json({ success: false, message: "Instructor record not found" });
    }

    console.log("[UPDATE-ENROLLMENT] Authorization check:", {
      enrollmentId,
      offeringId,
      currentStatus: enrollment.enrol_status,
      instructorId: instructor.instructor_id,
      studentId: enrollment.student_id
    });

    // Check if they are the Instructor for this offering
    const { data: isTeacher } = await supabase
      .from("course_offering_instructor")
      .select("id")
      .eq('offering_id', offeringId)
      .eq('instructor_id', instructor.instructor_id)
      .maybeSingle();

    if (isTeacher && enrollment.enrol_status === 'pending instructor approval') {
      console.log("[UPDATE-ENROLLMENT] ✅ Authorized as Instructor");
      isAuthorized = true;
    }

    // Check if they are the Advisor for this student
    if (enrollment.enrol_status === 'pending advisor approval') {
      // Get the advisor record to get advisor_id
      const { data: advisorRecord } = await supabase
        .from("faculty_advisor")
        .select("advisor_id, for_degree, batch")
        .eq('instructor_id', instructor.instructor_id)
        .eq('is_deleted', false)
        .maybeSingle();

      console.log("[UPDATE-ENROLLMENT] Advisor record:", advisorRecord);
      console.log("[UPDATE-ENROLLMENT] Student data:", enrollment.student);

      if (advisorRecord && enrollment.student) {
        // Check if student's advisor_id matches the instructor's advisor_id
        // AND verify degree/batch/branch match
        // Convert to strings/numbers for comparison to handle type mismatches
        const studentAdvisorId = enrollment.student.advisor_id ? parseInt(enrollment.student.advisor_id) : null;
        const advisorRecordId = advisorRecord.advisor_id ? parseInt(advisorRecord.advisor_id) : null;

        const advisorMatch = studentAdvisorId === advisorRecordId && studentAdvisorId !== null;
        const degreeMatch = enrollment.student.degree === advisorRecord.for_degree;
        const batchMatch = String(enrollment.student.batch) === String(advisorRecord.batch);
        const branchMatch = enrollment.student.branch === instructor.branch;

        console.log("[UPDATE-ENROLLMENT] Advisor checks:", {
          advisorMatch,
          degreeMatch,
          batchMatch,
          branchMatch,
          studentAdvisorId,
          advisorRecordId,
          studentDegree: enrollment.student.degree,
          advisorDegree: advisorRecord.for_degree,
          studentBatch: enrollment.student.batch,
          advisorBatch: advisorRecord.batch,
          studentBranch: enrollment.student.branch,
          instructorBranch: instructor.branch
        });

        if (advisorMatch && degreeMatch && batchMatch && branchMatch) {
          console.log("[UPDATE-ENROLLMENT] ✅ Authorized as Advisor");
          isAuthorized = true;
        } else {
          console.log("[UPDATE-ENROLLMENT] ❌ Advisor authorization failed - conditions not met");
        }
      } else {
        console.log("[UPDATE-ENROLLMENT] ❌ Advisor authorization failed - missing advisor record or student data");
      }
    }

    // Admin bypass
    if (req.user.role === 'admin') {
      console.log("[UPDATE-ENROLLMENT] ✅ Authorized as Admin");
      isAuthorized = true;
    }

    if (!isAuthorized) {
      console.log("[UPDATE-ENROLLMENT] ❌ Not authorized");
      return res.status(403).json({
        success: false,
        message: "You are not authorized to approve this request at its current stage."
      });
    }

    // 3. Update status (Convert underscores to spaces: e.g., 'advisor_rejected' -> 'advisor rejected')
    const dbEnrolStatus = enrol_status.replace(/_/g, ' ');
    const { data, error } = await supabase
      .from("course_enrollment")
      .update({ enrol_status: dbEnrolStatus })
      .eq('enrollment_id', enrollmentId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Enrollment status updated to ${dbEnrolStatus}`,
      data
    });
  } catch (err) {
    console.error("updateEnrollmentStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// Withdraw from course
export const withdrawCourse = async (req, res) => {
  const { offeringId } = req.params;
  const userId = req.user?.user_id;

  try {
    // Get student_id from session user_id
    const { data: studentData, error: studentError } = await supabase
      .from("student")
      .select("student_id")
      .eq('user_id', parseInt(userId))
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    // Find the enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("course_enrollment")
      .select("enrollment_id")
      .eq('student_id', studentData.student_id)
      .eq('offering_id', parseInt(offeringId))
      .single();

    if (enrollError || !enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // Update enrollment status to withdrawn
    const { data, error } = await supabase
      .from("course_enrollment")
      .update({ enrol_status: 'student withdrawn' })
      .eq('enrollment_id', enrollment.enrollment_id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, message: "Successfully withdrawn from course", data });
  } catch (err) {
    console.error("withdrawCourse error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Drop course
export const dropCourse = async (req, res) => {
  const { offeringId } = req.params;
  const userId = req.user?.user_id;

  try {
    // Get student_id from session user_id
    const { data: studentData, error: studentError } = await supabase
      .from("student")
      .select("student_id")
      .eq('user_id', parseInt(userId))
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    // Find the enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("course_enrollment")
      .select("enrollment_id")
      .eq('student_id', studentData.student_id)
      .eq('offering_id', parseInt(offeringId))
      .single();

    if (enrollError || !enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // Update enrollment status to dropped
    const { data, error } = await supabase
      .from("course_enrollment")
      .update({ enrol_status: 'student dropped' })
      .eq('enrollment_id', enrollment.enrollment_id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, message: "Successfully dropped from course", data });
  } catch (err) {
    console.error("dropCourse error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Handle course offering cancellation and cascade to enrollments
export const cancelCourseOffering = async (req, res) => {
  const { offeringId } = req.params;
  const userId = req.user?.user_id;

  try {
    // Verify instructor ownership
    const { data: instructor } = await supabase
      .from("instructor")
      .select("instructor_id")
      .eq('user_id', parseInt(userId))
      .single();

    if (!instructor) {
      return res.status(403).json({ success: false, message: "Only instructors can cancel offerings" });
    }

    const { data: offering } = await supabase
      .from("course_offering")
      .select("*")
      .eq('offering_id', parseInt(offeringId))
      .single();

    if (!offering) {
      return res.status(404).json({ success: false, message: "Offering not found" });
    }

    if (offering.instructor_id !== instructor.instructor_id) {
      return res.status(403).json({ success: false, message: "You do not own this offering" });
    }

    // Update offering status to Canceled
    const { error: updateOfferingError } = await supabase
      .from("course_offering")
      .update({ status: 'Canceled' })
      .eq('offering_id', parseInt(offeringId));

    if (updateOfferingError) throw updateOfferingError;

    // Cascade: Update all enrollments for this offering to Cancelled
    const { error: updateEnrollmentsError } = await supabase
      .from("course_enrollment")
      .update({ enrol_status: 'cancelled' })
      .eq('offering_id', parseInt(offeringId))
      .in('enrol_status', ['enrolled', 'pending instructor approval']);

    if (updateEnrollmentsError) throw updateEnrollmentsError;

    return res.status(200).json({ success: true, message: "Course offering cancelled and all enrollments updated" });
  } catch (err) {
    console.error("cancelCourseOffering error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// Get pending enrollments for advisor (pending advisor approval) for their batch/degree/branch
// Get pending enrollments for advisor (filtered by degree, batch, AND branch)
export const getPendingAdvisorEnrollments = async (req, res) => {
  const userId = req.user?.user_id;

  try {
    // 1. Get the instructor's ID and branch
    const { data: instructor, error: instError } = await supabase
      .from("instructor")
      .select("instructor_id, branch")
      .eq('user_id', userId)
      .single();

    if (instError || !instructor) {
      return res.status(404).json({ success: false, message: "Instructor record not found" });
    }

    // 2. Get the advisor's assigned degree and batch
    const { data: advisor, error: advError } = await supabase
      .from("faculty_advisor")
      .select("for_degree, batch")
      .eq('instructor_id', instructor.instructor_id)
      .eq('is_deleted', false)
      .single();

    if (advError || !advisor) {
      return res.status(404).json({ success: false, message: "No active faculty advisor assignment found" });
    }

    // 3. Fetch enrollments joining student and course details
    // Filtering by status and is_deleted at the DB level for performance
    const { data: enrollments, error: enrError } = await supabase
      .from("course_enrollment")
      .select(`
        enrollment_id,
        enrol_type,
        enrol_status,
        student:student_id (
          student_id,
          batch,
          degree,
          branch,
          users:user_id (first_name, last_name, email)
        ),
        course_offering:offering_id (
          offering_id,
          acad_session,
          course:course_id (code, title, ltp)
        )
      `)
      .eq('enrol_status', 'pending advisor approval')
      .eq('is_deleted', false)
      .order('enrollment_id', { ascending: false });

    if (enrError) throw enrError;

    // 4. Filter by the Advisor's "Batch + Degree + Branch" criteria
    const filtered = (enrollments || []).filter(e =>
      e.student?.batch === advisor.batch &&
      e.student?.degree === advisor.for_degree &&
      e.student?.branch === instructor.branch
    );

    return res.status(200).json({
      success: true,
      data: filtered,
      advisorInfo: {
        assigned_degree: advisor.for_degree,
        assigned_batch: advisor.batch,
        assigned_branch: instructor.branch
      }
    });
  } catch (err) {
    console.error("[PENDING-ADVISOR] Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// Advisor approval endpoint - only for advisors to approve/reject pending advisor approval requests
export const updateAdvisorEnrollmentStatus = async (req, res) => {
  const { enrollmentId } = req.params;
  const { enrol_status } = req.body; // Expecting 'enrolled' or 'advisor rejected'
  const userId = req.user?.user_id;

  try {
    // 1. Get Advisor Context
    const { data: instructor } = await supabase
      .from("instructor")
      .select("instructor_id, branch")
      .eq('user_id', userId)
      .single();

    const { data: advisor } = await supabase
      .from("faculty_advisor")
      .select("for_degree, batch")
      .eq('instructor_id', instructor?.instructor_id)
      .single();

    // 2. Get Enrollment & Student Details
    const { data: enrollment, error: enrError } = await supabase
      .from("course_enrollment")
      .select(`
        enrollment_id,
        enrol_status,
        student:student_id (degree, batch, branch)
      `)
      .eq('enrollment_id', enrollmentId)
      .single();

    if (enrError || !enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });

    // 3. Security Check: Does the student belong to this advisor?
    const isAuthorized =
      enrollment.student.degree === advisor.for_degree &&
      enrollment.student.batch === advisor.batch &&
      enrollment.student.branch === instructor.branch;

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Unauthorized: Student is not in your assigned batch/degree/branch" });
    }

    // 4. Update
    const dbStatus = enrol_status.replace(/_/g, ' ');
    const { data, error } = await supabase
      .from("course_enrollment")
      .update({ enrol_status: dbStatus })
      .eq('enrollment_id', enrollmentId)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, message: `Status updated to ${dbStatus}`, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// Get pending enrollments for instructor (pending instructor approval + pending advisor approval)
export const getPendingInstructorEnrollments = async (req, res) => {
  const userId = req.user?.user_id;

  try {
    console.log("[PENDING-INSTRUCTOR] Starting fetch for user_id:", userId);

    // First, get the instructor record for this user - INCLUDE BRANCH
    const { data: instructorData, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id, branch")
      .eq('user_id', userId)
      .single();

    if (instructorError || !instructorData) {
      console.log("[PENDING-INSTRUCTOR] Error: Instructor not found for user_id:", userId);
      return res.status(404).json({
        success: false,
        message: "Instructor record not found"
      });
    }

    console.log("[PENDING-INSTRUCTOR] Instructor found:", instructorData.instructor_id, "branch:", instructorData.branch);

    // PART 1: Get enrollments pending instructor approval from courses this instructor teaches
    const { data: offeringInstructors, error: offeringError } = await supabase
      .from("course_offering_instructor")
      .select("offering_id")
      .eq('instructor_id', instructorData.instructor_id);

    if (offeringError) throw offeringError;

    const offeringIds = offeringInstructors.map(o => o.offering_id);
    console.log("[PENDING-INSTRUCTOR] PART 1 - Courses taught, offering IDs:", offeringIds);

    let enrollments = [];

    // Get pending instructor approvals
    if (offeringIds.length > 0) {
      const { data: instructorApprovals, error: approvalError } = await supabase
        .from("course_enrollment")
        .select(`
          enrollment_id,
          student_id,
          offering_id,
          enrol_type,
          enrol_status,
          grade,
          course_offering:offering_id (
            offering_id,
            acad_session,
            slot,
            section,
            status,
            course:course_id (
              course_id,
              code,
              title,
              ltp
            )
          ),
          student:student_id (
            student_id,
            user_id,
            branch,
            degree,
            batch,
            users:user_id (
              first_name,
              last_name,
              email
            )
          )
        `)
        .in('offering_id', offeringIds)
        .eq('enrol_status', 'pending instructor approval')
        .eq('is_deleted', false);

      if (approvalError) throw approvalError;
      console.log("[PENDING-INSTRUCTOR] PART 1 - Found pending instructor approvals:", instructorApprovals?.length || 0);
      enrollments = [...enrollments, ...(instructorApprovals || [])];
    }

    // PART 2: Get enrollments pending advisor approval where this instructor is the advisor for that batch/degree/branch
    const { data: advisorAssignments, error: advisorError } = await supabase
      .from("faculty_advisor")
      .select("for_degree, batch")
      .eq('instructor_id', instructorData.instructor_id);

    if (advisorError) throw advisorError;
    console.log("[PENDING-INSTRUCTOR] PART 2 - Advisor assignments:", advisorAssignments);
    console.log("[PENDING-INSTRUCTOR] PART 2 - Instructor branch:", instructorData.branch);

    // For each degree/batch combination, find students and their pending advisor approvals
    if (advisorAssignments && advisorAssignments.length > 0) {
      for (const assignment of advisorAssignments) {
        console.log(`[PENDING-INSTRUCTOR] PART 2 - Checking advisor for degree: ${assignment.for_degree}, batch: ${assignment.batch}, branch: ${instructorData.branch}`);

        const { data: advisorPendings, error: pendingError } = await supabase
          .from("course_enrollment")
          .select(`
            enrollment_id,
            student_id,
            offering_id,
            enrol_type,
            enrol_status,
            grade,
            course_offering:offering_id (
              offering_id,
              acad_session,
              slot,
              section,
              status,
              course:course_id (
                course_id,
                code,
                title,
                ltp
              )
            ),
            student:student_id (
              student_id,
              user_id,
              branch,
              degree,
              batch,
              users:user_id (
                first_name,
                last_name,
                email
              )
            )
          `)
          .eq('enrol_status', 'pending advisor approval')
          .eq('is_deleted', false);

        if (pendingError) throw pendingError;
        console.log(`[PENDING-INSTRUCTOR] PART 2 - Total pending advisor approvals: ${advisorPendings?.length || 0}`);

        // Filter for students from this degree AND batch AND branch
        const advisorPendingsForBatch = (advisorPendings || []).filter(e => {
          const degreeMatch = e.student?.degree === assignment.for_degree;
          const batchMatch = e.student?.batch === assignment.batch;
          const branchMatch = e.student?.branch === instructorData.branch;
          const matches = degreeMatch && batchMatch && branchMatch;
          if (e.student) {
            console.log(`[PENDING-INSTRUCTOR] Checking student ${e.student.users?.email}: degree=${e.student.degree} (expect ${assignment.for_degree}), batch=${e.student.batch} (expect ${assignment.batch}), branch=${e.student.branch} (expect ${instructorData.branch}) => match=${matches}`);
          }
          return matches;
        });

        console.log(`[PENDING-INSTRUCTOR] PART 2 - Filtered for this assignment: ${advisorPendingsForBatch.length}`);
        enrollments = [...enrollments, ...advisorPendingsForBatch];
      }
    } else {
      console.log("[PENDING-INSTRUCTOR] PART 2 - No advisor assignments found");
    }

    // Remove duplicates based on enrollment_id
    const uniqueEnrollments = Array.from(
      new Map(enrollments.map(e => [e.enrollment_id, e])).values()
    );

    console.log("[PENDING-INSTRUCTOR] Total unique enrollments:", uniqueEnrollments.length);

    // Flatten the response
    const flattenedEnrollments = uniqueEnrollments.map(enrollment => ({
      ...enrollment,
      offering: enrollment.course_offering,
      course: enrollment.course_offering?.course
    }));

    return res.status(200).json({
      success: true,
      data: flattenedEnrollments
    });

  } catch (err) {
    console.error("getPendingInstructorEnrollments error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getCourseOfferingInstructors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('course_offering_instructor')
      .select(`
        offering_id,
        is_coordinator,
        instructor:instructor_id (
          instructor_id,
          user_id,
          users:user_id (
            id,
            first_name,
            last_name,
            email
          )
        )
      `);

    if (error) throw error;

    /*
      Transform into:
      {
        [offering_id]: {
          instructors: [...],
          coordinator: {...}
        }
      }
    */
    const result = {};

    for (const row of data || []) {
      if (!result[row.offering_id]) {
        result[row.offering_id] = {
          instructors: [],
          coordinator: null
        };
      }

      const instructorData = {
        instructor_id: row.instructor.instructor_id,
        user_id: row.instructor.user_id,
        name: `${row.instructor.users.first_name} ${row.instructor.users.last_name}`,
        email: row.instructor.users.email,
        is_coordinator: row.is_coordinator
      };

      result[row.offering_id].instructors.push(instructorData);

      if (row.is_coordinator) {
        result[row.offering_id].coordinator = instructorData;
      }
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('getCourseOfferingInstructors error:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get all advisees (students under a faculty advisor) - regardless of enrollment status
export const getAllAdvisees = async (req, res) => {
  const userId = req.user?.user_id;

  try {
    console.log("[GET-ADVISEES] Starting fetch for user_id:", userId);

    // Step 1: Get the instructor (advisor) record - INCLUDING BRANCH
    const { data: instructorData, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id, branch")
      .eq('user_id', userId)
      .single();

    if (instructorError || !instructorData) {
      console.log("[GET-ADVISEES] Error: Instructor not found for user_id:", userId);
      return res.status(404).json({
        success: false,
        message: "Instructor record not found"
      });
    }

    console.log("[GET-ADVISEES] Instructor found:", instructorData.instructor_id, "branch:", instructorData.branch);

    // Step 2: Get faculty advisor assignment
    const { data: advisorData, error: advisorError } = await supabase
      .from("faculty_advisor")
      .select("for_degree, batch")
      .eq('instructor_id', instructorData.instructor_id)
      .single();

    if (advisorError || !advisorData) {
      console.log("[GET-ADVISEES] Error: No faculty advisor record found");
      return res.status(404).json({
        success: false,
        message: "Faculty advisor record not found. You are not assigned as an advisor."
      });
    }

    const { for_degree, batch } = advisorData;
    const advisorBranch = instructorData.branch;
    console.log("[GET-ADVISEES] Advisor assigned to - degree:", for_degree, "batch:", batch, "branch:", advisorBranch);

    // Step 3: Get all students with this degree AND batch AND branch
    const { data: students, error: studentError } = await supabase
      .from("student")
      .select(`
        student_id,
        user_id,
        branch,
        degree,
        batch,
        cgpa,
        total_credits_completed,
        users:user_id (
          first_name,
          last_name,
          email
        ),
        enrollments:course_enrollment (
          enrollment_id,
          offering_id,
          enrol_type,
          enrol_status,
          course_offering:offering_id (
            course_id,
            acad_session,
            slot,
            course:course_id (
              code,
              title
            )
          )
        )
      `)
      .eq('degree', for_degree)
      .eq('batch', batch)
      .eq('branch', advisorBranch);

    if (studentError) throw studentError;

    console.log("[GET-ADVISEES] Found students:", students?.length || 0);

    return res.status(200).json({
      success: true,
      data: students || [],
      advisorInfo: {
        degree: for_degree,
        batch: batch,
        branch: advisorBranch
      }
    });

  } catch (err) {
    console.error("[GET-ADVISEES] Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// --- ALERTS CONTROLLER ---

// Get all alerts (Public)
export const getAlerts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getAlerts error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create an alert (Admin only)
export const createAlert = async (req, res) => {
  try {
    const { content } = req.body;
    const adminId = req.user.user_id; // from session

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert([{ content, admin_id: adminId }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('createAlert error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete an alert (Admin only)
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.user_id;

    // Delete only if id matches AND admin_id matches (ownership check)
    const { data, error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)
      .eq('admin_id', adminId)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: "Alert not found or you don't have permission to delete it" });
    }

    return res.status(200).json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    console.error('deleteAlert error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// Get pending enrollments for a specific student (for advisor to view/approve)
export const getStudentPendingEnrollments = async (req, res) => {
  const userId = req.user?.userid;
  const { studentId } = req.params;

  try {
    console.log('STUDENT-PENDING: Fetching for studentId:', studentId, 'by advisor userId:', userId);

    // Step 1: Get the instructor/advisor record
    const { data: instructorData, error: instructorError } = await supabase
      .from('instructor')
      .select('instructor_id, branch')
      .eq('user_id', userId)
      .single();

    if (instructorError || !instructorData) {
      return res.status(404).json({ success: false, message: 'Instructor record not found' });
    }

    // Step 2: Get faculty advisor record
    const { data: advisorData, error: advisorError } = await supabase
      .from('faculty_advisor')
      .select('for_degree, batch')
      .eq('instructor_id', instructorData.instructor_id)
      .eq('is_deleted', false)
      .single();

    if (advisorError || !advisorData) {
      return res.status(404).json({
        success: false,
        message: 'Faculty advisor record not found'
      });
    }

    // Step 3: Get the student and verify they belong to this advisor
    const { data: studentData, error: studentError } = await supabase
      .from('student')
      .select(`
        student_id,
        user_id,
        branch,
        degree,
        batch,
        cgpa,
        total_credits_completed,
        users!user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('student_id', studentId)
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Verify student belongs to this advisor
    if (
      studentData.degree !== advisorData.for_degree ||
      studentData.batch !== advisorData.batch ||
      studentData.branch !== instructorData.branch
    ) {
      return res.status(403).json({
        success: false,
        message: 'This student is not under your advisory'
      });
    }

    // Step 4: Get all enrollments for this student (all statuses to show full picture)
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollment')
      .select(`
        enrollment_id,
        student_id,
        offering_id,
        enrol_type,
        enrol_status,
        grade,
        course_offering!offering_id (
          offering_id,
          acad_session,
          slot,
          section,
          status,
          course!course_id (
            course_id,
            code,
            title,
            ltp
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('is_deleted', false)
      .order('enrollment_id', { ascending: false });

    if (enrollmentsError) {
      throw enrollmentsError;
    }

    console.log('STUDENT-PENDING: Found enrollments:', enrollments?.length || 0);

    // Flatten the response
    const flattenedEnrollments = enrollments.map(enrollment => ({
      ...enrollment,
      offering: enrollment.course_offering,
      course: enrollment.course_offering?.course
    }));

    return res.status(200).json({
      success: true,
      data: {
        student: studentData,
        enrollments: flattenedEnrollments
      }
    });

  } catch (err) {
    console.error('STUDENT-PENDING: Error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get My Pending Works - Separated by Instructor and Advisor roles
export const getMyPendingWorks = async (req, res) => {
  const userId = req.user?.user_id;

  try {
    console.log("[MY-PENDING-WORKS] Starting fetch for user_id:", userId);

    // 1. Get instructor record
    const { data: instructorData, error: instructorError } = await supabase
      .from("instructor")
      .select("instructor_id, branch")
      .eq('user_id', userId)
      .single();

    if (instructorError || !instructorData) {
      return res.status(404).json({
        success: false,
        message: "Instructor record not found"
      });
    }

    console.log("[MY-PENDING-WORKS] Instructor found:", instructorData.instructor_id);

    // 2. Check if instructor is also a faculty advisor
    const { data: advisorData, error: advisorError } = await supabase
      .from("faculty_advisor")
      .select("advisor_id, for_degree, batch")
      .eq('instructor_id', instructorData.instructor_id)
      .eq('is_deleted', false)
      .maybeSingle();

    const isAdvisor = !advisorError && advisorData !== null;
    console.log("[MY-PENDING-WORKS] Is advisor:", isAdvisor);

    // 3. Get pending as Instructor: enrollments with status "pending instructor approval" 
    //    for courses this instructor teaches
    const { data: offeringInstructors, error: offeringError } = await supabase
      .from("course_offering_instructor")
      .select("offering_id")
      .eq('instructor_id', instructorData.instructor_id);

    if (offeringError) throw offeringError;

    const offeringIds = offeringInstructors.map(o => o.offering_id);
    console.log("[MY-PENDING-WORKS] Courses taught, offering IDs:", offeringIds);

    let pendingAsInstructor = [];

    if (offeringIds.length > 0) {
      const { data: instructorApprovals, error: approvalError } = await supabase
        .from("course_enrollment")
        .select(`
          enrollment_id,
          student_id,
          offering_id,
          enrol_type,
          enrol_status,
          grade,
          course_offering:offering_id (
            offering_id,
            acad_session,
            slot,
            section,
            status,
            course:course_id (
              course_id,
              code,
              title,
              ltp
            )
          ),
          student:student_id (
            student_id,
            user_id,
            branch,
            degree,
            batch,
            advisor_id,
            users:user_id (
              first_name,
              last_name,
              email
            )
          )
        `)
        .in('offering_id', offeringIds)
        .eq('enrol_status', 'pending instructor approval')
        .eq('is_deleted', false);

      if (approvalError) throw approvalError;
      pendingAsInstructor = instructorApprovals || [];
      console.log("[MY-PENDING-WORKS] Pending as Instructor:", pendingAsInstructor.length);
    }

    // 4. Get pending as Advisor: enrollments with status "pending advisor approval"
    //    where the student's advisor_id matches this instructor's faculty_advisor.advisor_id
    let pendingAsAdvisor = [];

    if (isAdvisor && advisorData) {
      // Get all students with this advisor_id
      const { data: adviseeStudents, error: studentError } = await supabase
        .from("student")
        .select("student_id")
        .eq('advisor_id', advisorData.advisor_id);

      if (studentError) throw studentError;

      const studentIds = adviseeStudents.map(s => s.student_id);
      console.log("[MY-PENDING-WORKS] Advisee student IDs:", studentIds);

      if (studentIds.length > 0) {
        const { data: advisorApprovals, error: advisorApprovalError } = await supabase
          .from("course_enrollment")
          .select(`
            enrollment_id,
            student_id,
            offering_id,
            enrol_type,
            enrol_status,
            grade,
            course_offering:offering_id (
              offering_id,
              acad_session,
              slot,
              section,
              status,
              course:course_id (
                course_id,
                code,
                title,
                ltp
              )
            ),
            student:student_id (
              student_id,
              user_id,
              branch,
              degree,
              batch,
              advisor_id,
              users:user_id (
                first_name,
                last_name,
                email
              )
            )
          `)
          .in('student_id', studentIds)
          .eq('enrol_status', 'pending advisor approval')
          .eq('is_deleted', false);

        if (advisorApprovalError) throw advisorApprovalError;
        pendingAsAdvisor = advisorApprovals || [];
        console.log("[MY-PENDING-WORKS] Pending as Advisor:", pendingAsAdvisor.length);
      }
    }

    // Flatten the response
    const flattenEnrollment = (enrollment) => ({
      ...enrollment,
      offering: enrollment.course_offering,
      course: enrollment.course_offering?.course
    });

    return res.status(200).json({
      success: true,
      data: {
        pendingAsInstructor: pendingAsInstructor.map(flattenEnrollment),
        pendingAsAdvisor: pendingAsAdvisor.map(flattenEnrollment)
      },
      isAdvisor: isAdvisor
    });

  } catch (err) {
    console.error("[MY-PENDING-WORKS] Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

