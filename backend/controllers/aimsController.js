import supabase from "../config/db.js";
import bcrypt from "bcrypt";

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
  const { instructorId } = req.params;

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
  const { rs_id, instructor_number, branch, year_joined } = req.body;

  if (!rs_id || !instructor_number) {
    return res.status(400).json({
      success: false,
      message: "rs_id and instructor_number are required"
    });
  }

  try {
    const { data, error } = await supabase
      .from("instructor")
      .insert({ 
        rs_id, 
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
  const { rs_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("instructor")
      .select("*")
      .eq('rs_id', rs_id)
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: "Instructor not found" });
  }
};

// Update instructor
export const updateInstructor = async (req, res) => {
  const { rs_id } = req.params;
  const { instructor_number, branch, salary, year_joined } = req.body;
  try {
    const { data, error } = await supabase
      .from("instructor")
      .update({ instructor_number, branch, salary, year_joined })
      .eq('rs_id', rs_id)
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
  const { rs_id } = req.params;
  try {
    const { error } = await supabase.from("instructor").delete().eq('rs_id', rs_id);
    if (error) throw error;
    return res.status(200).json({ success: true, message: "Instructor deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// add course enrollment
export const createEnrollment = async (req, res) => {
  const { studentId, offeringId } = req.params;
  try{
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

    const { data, error } = await supabase
    .from("course_enrollment")
    .insert({
      student_id: studentId,
      offering_id: offeringId,
      enrol_type,
      enrol_status
    })
    .select()
    .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data : data 
    })
  } catch (err) {
    console.error("createEnrollment error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

//create course offering
export const createOffering = async (req, res) => {
  const { instructorId, courseId } = req.params;
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
  const { studentId, offeringId } = req.params;
  try{
    const {
      enrol_status,
      grade
    } = req.body;

    const { data, error } = await supabase
    .from("course_enrollment")
    .update({
      enrol_status,
      grade
    })
    .eq('student_id', studentId)
    .eq('offering_id', offeringId)
    .select()
    .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data : data 
    })
  }
  catch (err) {
    console.error("updateEnrollment error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}