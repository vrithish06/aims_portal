import supabase from "../config/db.js";
import bcrypt from "bcrypt";

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
    role
  } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "email, password and role are required"
    });
  }

  try {
    // 1️⃣ Hash password
    const password_hashed = await bcrypt.hash(password, 10);

    // 2️⃣ Insert into user table
    const { data, error } = await supabase
      .from("user")
      .insert({
        is_deleted: false,
        txn_no: 1,
        ins_ts: new Date(),
        upd_ts: new Date(),
        password_hashed,
        email,
        first_name,
        last_name,
        is_locked: false,
        role
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getProducts=async (req,res) =>{
    try{
        const products=await sql`SELECT * FROM products ORDER BY created_at DESC`;
        res.status(200).json({success:true,data:products});

    }
    catch(err){
        res.status(500).json({success:false,message:"Server Error"});   
        console.log("error in getPRoduct function",err);

    }
};

export const createProducts = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide name" });
  }

  try {
    const { data, error } = await supabase
      .from("test_table")
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error("error in createProducts function", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const getProduct = async (req,res) =>{
    const {id}=req.params;
    try{
        const existingProduct=await sql`SELECT * FROM products WHERE id=${id}`;
        res.status(200).json({success:true,data:existingProduct[0]});
    }
    catch(err){
        res.status(500).json({success:false,message:"Server Error"});   
        console.log("error in getProduct function",err);
    }
};
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, image, price } = req.body;

    try {
        const updatedProduct = await sql`
            UPDATE products
            SET name = ${name}, image = ${image}, price = ${price}
            WHERE id = ${id}
            RETURNING *
        `;

        if (updatedProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: updatedProduct[0]
        });

    } catch (err) {
        console.log("error in updateProduct function", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

export const deleteProduct = async (req,res) =>{
    const {id}=req.params;
    try{
        const deletedProduct=await sql`DELETE FROM products WHERE id=${id} RETURNING *`;
        if(deletedProduct.length===0){
            return res.status(404).json({success:false,message:"Product not found"});
        }
        res.status(200).json({success:true,message:"Product deleted successfully"});
    }
    catch(err){
        res.status(500).json({success:false,message:"Server Error"});   
        console.log("error in deleteProduct function",err);
    }
};

