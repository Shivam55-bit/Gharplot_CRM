import express from "express";
import { saveToken, saveEmployeeToken } from "../controllers/fcmController.js";
import admin from "../config/firebase.js";

const router = express.Router();

//  Route to save FCM token for users
router.post("/save-token", saveToken);

//  Route to save FCM token for employees
router.post("/save-employee-token", saveEmployeeToken);

export default router;
