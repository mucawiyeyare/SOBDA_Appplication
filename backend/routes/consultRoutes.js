import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/authMiddleware.js";
import Doctor from "../models/doctorModel.js";
import User from "../models/usermodel.js";
import ConsultationMessage from "../models/consultationMessageModel.js";
import { createNotification } from "../controllers/notificationController.js";
import { sendUrgentPushToUser } from "../services/pushNotificationService.js";

// In-app conversations between donors and doctors. Nothing here goes to WhatsApp.
const router = express.Router();

const MAX_TEXT = 2000;
const DONOR_HOURLY_LIMIT = 40;

const isId = (value) => mongoose.Types.ObjectId.isValid(value);
const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const donorOnly = (req, res, next) => {
  if (req.user.role !== "donor") {
    return res.status(403).json({ message: "Only donors can ask doctors questions." });
  }
  next();
};

// Doctors act through the Doctor profile linked to their login account
const doctorOnly = async (req, res, next) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Doctors only." });
    }
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(403).json({ message: "No doctor profile is linked to this account. Ask an administrator." });
    }
    req.doctorProfile = profile;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const notify = async ({ recipient, sender, title, message, actionUrl }) => {
  try {
    await createNotification({
      recipient,
      sender,
      title,
      message,
      type: "doctor_message",
      channel: "system",
      data: { actionUrl },
    });
    sendUrgentPushToUser(recipient, { title, body: message, urgency: "normal", data: { actionUrl } }).catch(() => {});
  } catch (err) {
    console.error("[Consult] notification error:", err.message);
  }
};

const preview = (text) => (text.length > 110 ? `${text.slice(0, 110)}…` : text);

// ── Unread badge for the sidebar (donor: doctor replies; doctor: donor questions)
router.get("/unread-count", protect, async (req, res) => {
  try {
    let count = 0;
    if (req.user.role === "donor") {
      count = await ConsultationMessage.countDocuments({ donor: req.user._id, sender: "doctor", readByDonor: false });
    } else if (req.user.role === "doctor") {
      const profile = await Doctor.findOne({ user: req.user._id }).select("_id");
      if (profile) {
        count = await ConsultationMessage.countDocuments({ doctor: profile._id, sender: "donor", readByDoctor: false });
      }
    }
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────── Donor side ─────────────── */

// The donor's conversations, newest first
router.get("/my-threads", protect, donorOnly, async (req, res) => {
  try {
    const rows = await ConsultationMessage.aggregate([
      { $match: { donor: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$doctor",
          last: { $first: "$$ROOT" },
          unread: {
            $sum: { $cond: [{ $and: [{ $eq: ["$sender", "doctor"] }, { $eq: ["$readByDonor", false] }] }, 1, 0] },
          },
        },
      },
      { $sort: { "last.createdAt": -1 } },
    ]);

    const doctors = await Doctor.find({ _id: { $in: rows.map((r) => r._id) } }).select("name specialty photo").lean();
    const byId = new Map(doctors.map((d) => [String(d._id), d]));

    res.json(
      rows
        .filter((r) => byId.has(String(r._id)))
        .map((r) => ({
          doctorId: r._id,
          doctor: byId.get(String(r._id)),
          lastMessage: { text: r.last.text, sender: r.last.sender, createdAt: r.last.createdAt },
          unread: r.unread,
        }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Messages with one doctor (marks the doctor's replies as read)
router.get("/thread/:doctorId", protect, donorOnly, async (req, res) => {
  try {
    if (!isId(req.params.doctorId)) return res.status(400).json({ message: "Invalid doctor" });
    const doctor = await Doctor.findById(req.params.doctorId).select("name specialty photo isActive").lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const filter = { donor: req.user._id, doctor: doctor._id };
    const messages = await ConsultationMessage.find(filter).sort({ createdAt: 1 }).limit(500).lean();
    await ConsultationMessage.updateMany({ ...filter, sender: "doctor", readByDonor: false }, { $set: { readByDonor: true } });

    res.json({ doctor, messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ask a doctor a question
router.post("/thread/:doctorId", protect, donorOnly, async (req, res) => {
  try {
    if (!isId(req.params.doctorId)) return res.status(400).json({ message: "Invalid doctor" });

    const text = cleanText(req.body.text);
    if (!text) return res.status(400).json({ message: "Please write your question." });
    if (text.length > MAX_TEXT) return res.status(400).json({ message: `Message is too long (max ${MAX_TEXT} characters).` });

    const doctor = await Doctor.findOne({ _id: req.params.doctorId, isActive: true, user: { $ne: null } });
    if (!doctor) return res.status(404).json({ message: "This doctor is not available for chat right now." });

    const sentLastHour = await ConsultationMessage.countDocuments({
      donor: req.user._id,
      sender: "donor",
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });
    if (sentLastHour >= DONOR_HOURLY_LIMIT) {
      return res.status(429).json({ message: "You have sent many messages recently. Please wait a while before sending more." });
    }

    const message = await ConsultationMessage.create({
      donor: req.user._id,
      doctor: doctor._id,
      sender: "donor",
      text,
      readByDonor: true,
      readByDoctor: false,
    });

    notify({
      recipient: doctor.user,
      sender: req.user._id,
      title: `💬 New question from ${req.user.name}`,
      message: preview(text),
      actionUrl: `/dashboard/doctor-inbox?donor=${req.user._id}`,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────── Doctor side ─────────────── */

// Donors who wrote to this doctor, newest first
router.get("/inbox", protect, doctorOnly, async (req, res) => {
  try {
    const rows = await ConsultationMessage.aggregate([
      { $match: { doctor: req.doctorProfile._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$donor",
          last: { $first: "$$ROOT" },
          unread: {
            $sum: { $cond: [{ $and: [{ $eq: ["$sender", "donor"] }, { $eq: ["$readByDoctor", false] }] }, 1, 0] },
          },
        },
      },
      { $sort: { "last.createdAt": -1 } },
    ]);

    // Doctors see the donor's name and blood group only (no phone or ID)
    const donors = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select("name bloodType profileImage").lean();
    const byId = new Map(donors.map((d) => [String(d._id), d]));

    res.json(
      rows.map((r) => ({
        donorId: r._id,
        donor: byId.get(String(r._id)) || { name: "Former donor" },
        lastMessage: { text: r.last.text, sender: r.last.sender, createdAt: r.last.createdAt },
        unread: r.unread,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/inbox/:donorId", protect, doctorOnly, async (req, res) => {
  try {
    if (!isId(req.params.donorId)) return res.status(400).json({ message: "Invalid donor" });
    const donor = await User.findOne({ _id: req.params.donorId, role: "donor" }).select("name bloodType profileImage").lean();
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const filter = { doctor: req.doctorProfile._id, donor: donor._id };
    const messages = await ConsultationMessage.find(filter).sort({ createdAt: 1 }).limit(500).lean();
    await ConsultationMessage.updateMany({ ...filter, sender: "donor", readByDoctor: false }, { $set: { readByDoctor: true } });

    res.json({ donor, messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Answer a donor
router.post("/inbox/:donorId", protect, doctorOnly, async (req, res) => {
  try {
    if (!isId(req.params.donorId)) return res.status(400).json({ message: "Invalid donor" });

    const text = cleanText(req.body.text);
    if (!text) return res.status(400).json({ message: "Please write your reply." });
    if (text.length > MAX_TEXT) return res.status(400).json({ message: `Message is too long (max ${MAX_TEXT} characters).` });

    const donor = await User.findOne({ _id: req.params.donorId, role: "donor" }).select("_id name");
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    // A doctor answers questions; they can only reply where the donor already wrote
    const hasConversation = await ConsultationMessage.exists({ doctor: req.doctorProfile._id, donor: donor._id });
    if (!hasConversation) return res.status(403).json({ message: "You can only reply to donors who have written to you." });

    const message = await ConsultationMessage.create({
      donor: donor._id,
      doctor: req.doctorProfile._id,
      sender: "doctor",
      text,
      readByDonor: false,
      readByDoctor: true,
    });

    notify({
      recipient: donor._id,
      sender: req.user._id,
      title: `💬 Dr. ${req.doctorProfile.name.replace(/^dr\.?\s+/i, "")} replied to your question`,
      message: preview(text),
      actionUrl: `/dashboard/ask-doctor?doctor=${req.doctorProfile._id}`,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
