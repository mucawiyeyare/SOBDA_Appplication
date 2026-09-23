import express from "express";
import Doctor from "../models/doctorModel.js";

const router = express.Router();

// GET active doctors for the public homepage and Doctors page.
// The linked login account and WhatsApp number are never exposed; `canChat` says whether the
// doctor has an account and can answer questions in the in-app chat.
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    res.json(
      doctors.map(({ user, whatsapp, ...doctor }) => ({
        ...doctor,
        canChat: Boolean(user),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
