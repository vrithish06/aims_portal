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

// Instructor routes
router.post('/instructor', createInstructor);
router.get('/instructor', getInstructors);
router.get('/instructor/:user_id', getInstructor);
router.put('/instructor/:user_id', updateInstructor);
router.delete('/instructor/:user_id', deleteInstructor);

//create user
router.post("/user.add",createUser);

//create course
router.post("/instructor/:instructorId/course",createCourse);
export default router;
//kumarnaidu