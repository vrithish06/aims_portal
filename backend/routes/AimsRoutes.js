import express from "express"
import {getHelp,createProducts,createUser} from "../controllers/aimsController.js"
const router=express.Router();
router.get("/help",getHelp);
// router.get("/:id",getProduct);
router.post("/",createProducts);
router.post("/createusr",createUser);
// router.put("/:id",updateProduct);
// router.delete("/:id",deleteProduct);
export default router;