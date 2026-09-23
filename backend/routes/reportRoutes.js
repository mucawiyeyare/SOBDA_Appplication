import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getReportOverview,
  getBloodGroupReports,
  getBloodGroupDetails,
  getHospitalReports,
  getHospitalDetailReport,
  getDonorMatchingReport,
  getDonationHistoryReport,
  getIndividualDonorReport,
} from "../controllers/reportController.js";

const router = express.Router();

// All reporting routes protected with JWT authentication
router.get("/overview", protect, getReportOverview);
router.get("/blood-groups", protect, getBloodGroupReports);
router.get("/blood-groups/:bloodType", protect, getBloodGroupDetails);
router.get("/hospitals", protect, getHospitalReports);
router.get("/hospitals/:hospitalId", protect, getHospitalDetailReport);
router.get("/matching", protect, getDonorMatchingReport);
router.get("/history", protect, getDonationHistoryReport);
router.get("/donor/:donorId", protect, getIndividualDonorReport);

export default router;
