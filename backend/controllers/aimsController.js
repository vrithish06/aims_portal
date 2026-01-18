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
  const { user_id } = req.params;
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
  const { user_id } = req.params;
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
  const { user_id } = req.params;
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
  const { user_id } = req.params;
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
  const { user_id } = req.params;
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
  const { user_id } = req.params;
  try {
    const { error } = await supabase.from("student").delete().eq('user_id', user_id);
    if (error) throw error;
    return res.status(200).json({ success: true, message: "Student deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
