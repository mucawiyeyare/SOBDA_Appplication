import express from "express";
import Partner from "../models/partnerModel.js";

const router = express.Router();

// GET active partners for the public homepage logo strip
router.get("/", async (req, res) => {
  try {
    const partners = await Partner.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
