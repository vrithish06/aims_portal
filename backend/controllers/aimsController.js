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

//create course offering
// export const createOffering = async (req, res) => {
//   // Instructor identity must come from session; courseId comes from URL
//   const userId = req.user?.user_id;
//   const { courseId } = req.params;
//   try{
//   const {
//     degree,
//     dept_name,
//     acad_session,
//     status,
//     slot,
//     section,
//     is_coordinator
//   } = req.body;

//   // Get instructor_id from user_id
//   const { data: instructorData, error: instructorError } = await supabase
//     .from("instructor")
//     .select("instructor_id")
//     .eq('user_id', userId)
//     .single();

//   if (instructorError || !instructorData) {
//     return res.status(404).json({
//       success: false,
//       message: "Instructor record not found"
//     });
//   }

//   const {data , error} = await supabase
//     .from("course_offering")
//     .insert({
//       course_id: parseInt(courseId),
//       degree: degree,
//       dept_name: dept_name,
//       acad_session: acad_session,
//       status: status,
//       slot: slot,
//       section: section,
//       instructor_id: instructorData.instructor_id,
//       is_coordinator: is_coordinator || false
//     })
//     .select()
//     .single();

//     if (error) {
//       console.error("createOffering error:", error);
//       return res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }

//     return res.status(201).json({
//       success: true,
//       data
//     });
//   } catch (err) {
//     console.error("createOffering error:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// }

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

    // Enrich offerings with instructor and dept_name data
    const enrichedData = offerings.map(offering => ({
      ...offering,
      dept_name: instructorMap[offering.offering_id]?.coordinator?.branch || 'N/A'
    }));

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
    Rejected: "Rejected",
  };

  // Direct lifecycle statuses
  const directStatuses = [
    "Enrolling",
    "Running",
    "Completed",
    "Canceled",
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
          "Invalid status. Allowed values: Accepted, Rejected, Enrolling, Running, Completed, Cancelled",
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


// Update specific enrollment status (for teacher/admin to approve pending students)
export const updateEnrollmentStatus = async (req, res) => {
  const { offeringId, enrollmentId } = req.params;
  const { enrol_status } = req.body;
  const userId = req.user?.user_id;

  try {
    // Get the enrollment to verify it exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("course_enrollment")
      .select("*")
      .eq('enrollment_id', enrollmentId)
      .eq('offering_id', offeringId)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found"
      });
    }

    // For instructors: verify offering belongs to them
    if (userId) {
      const { data: instructor, error: instructorError } = await supabase
        .from("instructor")
        .select("instructor_id")
        .eq('user_id', userId)
        .single();

      if (!instructorError && instructor) {
        const { data: offering } = await supabase
          .from("course_offering")
          .select("instructor_id")
          .eq('offering_id', offeringId)
          .single();

        if (offering && offering.instructor_id !== instructor.instructor_id) {
          return res.status(403).json({
            success: false,
            message: "You can only update enrollments for your offerings"
          });
        }
      }
    }

    // Update enrollment status (convert underscores to spaces for database compatibility)
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
    return res.status(500).json({
      success: false,
      message: err.message
    });
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
      .update({ enrol_status: 'withdrawn' })
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
      .update({ enrol_status: 'dropped' })
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

    // Update offering status to Cancelled
    const { error: updateOfferingError } = await supabase
      .from("course_offering")
      .update({ status: 'Cancelled' })
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

// Get pending enrollments for advisor (pending advisor approval for their batch/degree)
export const getPendingAdvisorEnrollments = async (req, res) => {
  const userId = req.user?.user_id;

  try {
    // First, get the instructor (advisor) record for this user
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

    // Get faculty advisor record to find the batch and degree this advisor manages
    const { data: advisorData, error: advisorError } = await supabase
      .from("faculty_advisor")
      .select("for_degree, batch")
      .eq('instructor_id', instructorData.instructor_id)
      .single();

    if (advisorError || !advisorData) {
      return res.status(404).json({
        success: false,
        message: "Faculty advisor record not found. You are not assigned as an advisor."
      });
    }

    const { for_degree, batch } = advisorData;

    // Get all course offerings for the degree this advisor manages
    const { data: offerings, error: offeringsError } = await supabase
      .from("course_offering")
      .select("offering_id")
      .eq('degree', for_degree)
      .eq('acad_session', batch); // batch is the academic session

    if (offeringsError) throw offeringsError;

    const offeringIds = offerings.map(o => o.offering_id);

    if (offeringIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get enrollments with pending advisor approval for students in this batch/degree
    const { data: enrollments, error: enrollmentsError } = await supabase
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
          users:user_id (
            first_name,
            last_name,
            email
          )
        )
      `)
      .in('offering_id', offeringIds)
      .eq('enrol_status', 'pending advisor approval')
      .eq('is_deleted', false);

    if (enrollmentsError) throw enrollmentsError;

    // Flatten the response
    const flattenedEnrollments = (enrollments || []).map(enrollment => ({
      ...enrollment,
      offering: enrollment.course_offering,
      course: enrollment.course_offering?.course
    }));

    return res.status(200).json({
      success: true,
      data: flattenedEnrollments,
      advisorInfo: {
        degree: for_degree,
        batch: batch
      }
    });

  } catch (err) {
    console.error("getPendingAdvisorEnrollments error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get pending enrollments for instructor (pending instructor approval + pending advisor approval)
export const getPendingInstructorEnrollments = async (req, res) => {
  const userId = req.user?.user_id;

  try {
    // First, get the instructor record for this user
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

    // PART 1: Get enrollments pending instructor approval from courses this instructor teaches
    const { data: offerings, error: offeringsError } = await supabase
      .from("course_offering")
      .select("offering_id")
      .eq('instructor_id', instructorData.instructor_id);

    if (offeringsError) throw offeringsError;

    const offeringIds = offerings.map(o => o.offering_id);

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
      enrollments = [...enrollments, ...(instructorApprovals || [])];
    }

    // PART 2: Get enrollments pending advisor approval where this instructor is the advisor for that batch
    const { data: advisorAssignments, error: advisorError } = await supabase
      .from("faculty_advisor")
      .select("for_degree, batch")
      .eq('instructor_id', instructorData.instructor_id);

    if (advisorError) throw advisorError;

    // For each degree/batch combination, find students and their pending advisor approvals
    if (advisorAssignments && advisorAssignments.length > 0) {
      for (const assignment of advisorAssignments) {
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

        // Filter for students from this batch
        const advisorPendingsForBatch = (advisorPendings || []).filter(
          e => e.student?.degree === assignment.for_degree && e.student?.batch === assignment.batch
        );

        enrollments = [...enrollments, ...advisorPendingsForBatch];
      }
    }

    // Remove duplicates based on enrollment_id
    const uniqueEnrollments = Array.from(
      new Map(enrollments.map(e => [e.enrollment_id, e])).values()
    );

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


// Get all instructors (for dropdown in AddOfferingPage)
export const getAllInstructors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("instructor")
      .select(`
        instructor_id,
        user_id,
        users:user_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq("is_deleted", false);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error("getAllInstructors error:", err);
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
