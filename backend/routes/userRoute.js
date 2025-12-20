import express from "express";
import {
  getAllUsers,
  getUserByToken,
  updateUser,
  deleteUser,
  forgetPassword,
  verifyResetToken,
  updatePassword
} from "../controllers/userController.js";
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();


router.get("/",  getAllUsers);
router.get("/user", verifyToken, getUserByToken);
router.put("/:id",  updateUser);
router.delete("/:id",  deleteUser);



router.post("/forget-password", forgetPassword);
router.post("/reset-password", verifyResetToken);
router.post("/update-password", updatePassword);


export default router;
