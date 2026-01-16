import express from "express"
import {getHelp,createProducts,createUser,createCourse} from "../controllers/aimsController.js"
const router=express.Router();
router.get("/help",getHelp);
// router.get("/:id",getProduct);
router.post("/",createProducts);
router.post("/user.add",createUser);
router.post("/co.add",createCourse);
// router.put("/:id",updateProduct);
// router.delete("/:id",deleteProduct);
export default router;