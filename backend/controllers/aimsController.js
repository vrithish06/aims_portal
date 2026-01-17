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
//creating the user by admin
export const createUser = async (req, res) => {
  const {
    email,
    password,
    first_name,
    last_name,
    role,
    branch
  } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "email, password and role are required"
    });
  }

  try {
    // hash password
    const password_hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("user")
      .insert({
        email,
        password_hashed,
        first_name,
        last_name,
        role,
        branch
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("createUser error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
//creating course
export const createCourse = async (req, res) => {
  const {
    code,
    title,
    ltp,
    status,
    author_id,
    has_lab,
    prereqs,
    objectives
  } = req.body;
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
        is_deleted: false,
        ins_ts: new Date(),
        upd_ts: new Date(),
        code,
        title,
        ltp,
        status,
        author_id,
        has_lab,
        prereqs,
        objectives
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


