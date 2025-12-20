import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeePassword,
  getEmployeeDashboardStats
} from "../controllers/employeeController.js";
import { verifyAdminToken } from "../middlewares/adminAuthMiddleware.js";

const router = express.Router();

// Protected routes - require admin authentication
router.use(verifyAdminToken); // Apply admin authentication to all routes below

// Dashboard stats - admin access
router.get("/dashboard-stats", getEmployeeDashboardStats);

// Create new employee - admin access
router.post("/", createEmployee);

// Get all employees - admin access
router.get("/", getAllEmployees);

// Get employee by ID - admin access
router.get("/:id", getEmployeeById);

// Update employee - admin access
router.put("/:id", updateEmployee);

// Update employee password - admin access
router.put("/:id/password", updateEmployeePassword);

// Delete employee - admin access
router.delete("/:id", deleteEmployee);

export default router;