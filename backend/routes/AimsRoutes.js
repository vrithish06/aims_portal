import express from 'express';
import { 
  getHelp,
  createUser,
  createCourse,
  createInstructor,
  getInstructors,
  getInstructor,
  updateInstructor,
  deleteInstructor,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent
} from '../controllers/aimsController.js';

const router = express.Router();

// Help endpoint
router.get('/help', getHelp);

// Instructor routes
router.post('/instructor', createInstructor);
router.get('/instructor', getInstructors);
router.get('/instructor/:user_id', getInstructor);
router.put('/instructor/:user_id', updateInstructor);
router.delete('/instructor/:user_id', deleteInstructor);

//create user
router.post("/user.add",createUser);
router.get('/student', getStudents);
router.get('/student/:user_id', getStudent);
router.put('/student/:user_id', updateStudent);
router.delete('/student/:user_id', deleteStudent);
//create course
router.post("/instructor/:instructorId/course",createCourse);
export default router;
//kumarnaidu//tharun//"rithish"