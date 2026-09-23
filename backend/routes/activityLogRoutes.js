import express from "express";
import { getRecentActivity } from "../controllers/activityLogController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getRecentActivity);

export default router;
