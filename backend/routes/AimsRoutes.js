<<<<<<< HEAD
import express from 'express';
import { 
  getHelp,
  createUser,
  createCourse,
  createInstructor,
  getInstructors,
  getInstructor,
  updateInstructor,
  deleteInstructor
} from '../controllers/aimsController.js';

const router = express.Router();

// Help endpoint
router.get('/help', getHelp);

// User routes
router.post('/user', createUser);

// Course routes
router.post('/course', createCourse);

// Instructor routes
router.post('/instructor', createInstructor);
router.get('/instructor', getInstructors);
router.get('/instructor/:user_id', getInstructor);
router.put('/instructor/:user_id', updateInstructor);
router.delete('/instructor/:user_id', deleteInstructor);

export default router;
=======
import express from "express"
import {getHelp,createUser,createCourse} from "../controllers/aimsController.js"
const router=express.Router();
router.get("/help",getHelp);
// router.get("/:id",getProduct);
router.post("/user.add",createUser);
router.post("/instructor/:instructorId/course",createCourse);
export default router;
>>>>>>> 3996f80bb9d566ef3da04289fd7a9c5b4e6079bc
