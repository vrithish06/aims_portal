import express from "express"
import {getHelp,createUser,createCourse} from "../controllers/aimsController.js"
const router=express.Router();
router.get("/help",getHelp);
// router.get("/:id",getProduct);
router.post("/user.add",createUser);
router.post("/instructor/:instructorId/course",createCourse);
export default router;