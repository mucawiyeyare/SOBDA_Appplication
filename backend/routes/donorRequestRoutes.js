import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRequest,
  createBatchRequest,
  getHospitalRequests,
  getDonorRequests,
  respondToRequest,
  markArrived,
  markCompleted,
  cancelRequest,
  cancelBatchRequests,
  getDonorStatus,
  getHospitalDonationHistory,
  getDonorDonationHistory,
  getLeaderboard,
  getDonorStats,
} from "../controllers/donorRequestController.js";

const router = express.Router();

// Hospital creates single request (Option A)
router.post("/create", protect, createRequest);

// Hospital creates batch requests for multiple donors (Option B)
router.post("/create-batch", protect, createBatchRequest);
router.post("/batch-create", protect, createBatchRequest);

// Get all requests made by a hospital
router.get("/hospital", protect, getHospitalRequests);

// Get all requests received by a donor
router.get("/donor", protect, getDonorRequests);

// Donor responds to a request (accept or decline)
router.put("/:id/respond", protect, respondToRequest);

// Hospital marks donor as Arrived
router.put("/:id/arrived", protect, markArrived);

// Hospital marks donation as Completed / Donated
router.put("/:id/complete", protect, markCompleted);

// Hospital cancels a pending request
router.delete("/:id", protect, cancelRequest);

// Hospital cancels an entire batch
router.delete("/batch/:batchId", protect, cancelBatchRequests);

// Get real-time donor status
router.get("/status/:donorId", protect, getDonorStatus);

// Hospital donations history
router.get("/hospital-donations", protect, getHospitalDonationHistory);

// Donor donations history
router.get("/donor-donations", protect, getDonorDonationHistory);

// Public leaderboard - top 3 donors
router.get("/leaderboard", getLeaderboard);

// Donor stats - lives saved
router.get("/my-stats", protect, getDonorStats);

export default router;
