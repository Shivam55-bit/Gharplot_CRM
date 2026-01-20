import express from "express";
import { getRecentProperties, getRecentAllProperties } from "../controllers/recentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// recently added properties with optional limit
router.get("/recent", verifyToken, getRecentProperties);

// recently added properties excluding user's own with optional limit
router.get("/recent/all", verifyToken, getRecentAllProperties);

export default router;
