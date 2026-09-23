import express from "express";
import { protect, adminOnly, adminOrHealthInstitution } from "../middleware/authMiddleware.js";
import User from "../models/usermodel.js";
import DonorRequest from "../models/donorRequestModel.js";
import Donation from "../models/donationModel.js";
import Partner from "../models/partnerModel.js";
import Doctor from "../models/doctorModel.js";
import ConsultationMessage from "../models/consultationMessageModel.js";
import bcrypt from "bcryptjs";
import { createLog } from "../controllers/activityLogController.js";

const router = express.Router();

// 1. Get all users (Admin only)
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Get user by ID
router.get("/users/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user.role !== "admin" && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this profile" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Admin registers a new user (Donor, Hospital, Admin, Health Institution)
router.post("/register-user", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, location, bloodType, role, nationalId, gender, age, hospitalLicense, specialty, bio } = req.body;

    if (!name || !email || !password || !phone || !location) {
      return res.status(400).json({ message: "Name, email, password, phone, and location are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }

    if (nationalId) {
      const existingId = await User.findOne({ nationalId: nationalId.trim() });
      if (existingId) {
        return res.status(400).json({ message: "Government / National ID is already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      location: location.trim(),
      bloodType: bloodType || "O+",
      role: role || "donor",
      nationalId: nationalId ? nationalId.trim() : undefined,
      gender: gender || "Male",
      age: age ? Number(age) : undefined,
      hospitalLicense,
      isAvailable: true,
    });

    await newUser.save();

    // A doctor account comes with the public doctor profile it answers questions as
    if (newUser.role === "doctor") {
      await Doctor.create({
        name: newUser.name,
        specialty: (specialty || "").trim() || "General Physician",
        bio: (bio || "").trim(),
        user: newUser._id,
      });
    }

    await createLog(req.user._id, "Admin created user", "user", "success", `Created ${newUser.role}: ${newUser.name}`);

    res.status(201).json({
      message: `${role || "User"} registered successfully by admin`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        location: newUser.location,
        phone: newUser.phone,
        bloodType: newUser.bloodType,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Admin updates user profile (Generic Edit)
router.put("/update-user/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, location, bloodType, role, isAvailable, lastDonationDate, nationalId, gender, age, hospitalLicense } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();
    if (location) user.location = location.trim();
    if (bloodType) user.bloodType = bloodType;
    if (role && ["donor", "hospital", "admin", "health_institution", "doctor"].includes(role)) user.role = role;
    if (nationalId !== undefined) user.nationalId = nationalId.trim();
    if (gender) user.gender = gender;
    if (age !== undefined) user.age = Number(age);
    if (hospitalLicense !== undefined) user.hospitalLicense = hospitalLicense;
    if (typeof isAvailable !== "undefined") user.isAvailable = isAvailable;
    if (lastDonationDate !== undefined) user.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : null;

    await user.save();

    await createLog(req.user._id, "Admin updated user", "user", "success", `Updated: ${user.name} (${user.role})`);

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        bloodType: user.bloodType,
        role: user.role,
        isAvailable: user.isAvailable,
        lastDonationDate: user.lastDonationDate,
        nationalId: user.nationalId,
        gender: user.gender,
        age: user.age,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Admin deletes a user
router.delete("/delete-user/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    await User.findByIdAndDelete(req.params.id);
    await Doctor.updateMany({ user: user._id }, { $set: { user: null } });

    await createLog(req.user._id, "Admin deleted user", "user", "warning", `Deleted: ${user.name} (${user.role})`);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Admin Hospital Management: Get all hospitals with donation & request statistics
router.get("/hospitals", protect, adminOrHealthInstitution, async (req, res) => {
  try {
    const hospitals = await User.find({ role: "hospital" }).select("-password").sort({ name: 1 });

    const hospitalsWithStats = await Promise.all(
      hospitals.map(async (hospital) => {
        const totalRequests = await DonorRequest.countDocuments({ hospitalId: hospital._id });
        const completedDonations = await Donation.countDocuments({ hospitalId: hospital._id });
        const activeRequests = await DonorRequest.countDocuments({
          hospitalId: hospital._id,
          status: { $in: ["Pending", "Arrived"] },
        });

        return {
          ...hospital.toObject(),
          totalRequests,
          completedDonations,
          activeRequests,
        };
      })
    );

    res.json(hospitalsWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. System Stats & Overview
router.get("/stats", protect, adminOrHealthInstitution, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalDonors = await User.countDocuments({ role: "donor" });
    const totalHospitals = await User.countDocuments({ role: "hospital" });
    const totalDonations = await Donation.countDocuments({ status: "Completed" });
    const activeRequests = await DonorRequest.countDocuments({ status: { $in: ["Pending", "Arrived"] } });

    // Blood type distribution of registered donors
    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const bloodTypeCounts = {};
    res.json({
      totalUsers,
      totalDonors,
      totalHospitals,
      totalDonations,
      activeRequests,
      bloodTypeCounts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. Admin Approve / Suspend Hospital
router.put("/approve-hospital/:id", protect, adminOnly, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const hospital = await User.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    hospital.isApproved = typeof isApproved === "boolean" ? isApproved : true;
    await hospital.save();

    await createLog(
      req.user._id,
      hospital.isApproved ? "Hospital Approved" : "Hospital Suspended",
      "user",
      hospital.isApproved ? "success" : "warning",
      `Hospital: ${hospital.name} (Approval: ${hospital.isApproved})`
    );

    res.json({
      message: `Hospital ${hospital.isApproved ? "approved and activated" : "placed on pending/suspended"} successfully`,
      hospital: {
        id: hospital._id,
        name: hospital.name,
        isApproved: hospital.isApproved,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. Admin: Get all partners (including inactive), for the management screen
router.get("/partners", protect, adminOnly, async (req, res) => {
  try {
    const partners = await Partner.find({}).sort({ order: 1, createdAt: 1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 10. Admin: Add a partner (name, logo, website link)
router.post("/partners", protect, adminOnly, async (req, res) => {
  try {
    const { name, logo, websiteUrl, order } = req.body;

    if (!name || !logo || !websiteUrl) {
      return res.status(400).json({ message: "Name, logo, and website URL are required" });
    }

    const partner = new Partner({
      name: name.trim(),
      logo,
      websiteUrl: websiteUrl.trim(),
      order: order || 0,
    });
    await partner.save();

    await createLog(req.user._id, "Admin added partner", "system", "success", `Partner: ${partner.name}`);

    res.status(201).json({ message: "Partner added successfully", partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 11. Admin: Update a partner
router.put("/partners/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, logo, websiteUrl, order, isActive } = req.body;

    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    if (name) partner.name = name.trim();
    if (logo) partner.logo = logo;
    if (websiteUrl) partner.websiteUrl = websiteUrl.trim();
    if (order !== undefined) partner.order = order;
    if (typeof isActive === "boolean") partner.isActive = isActive;

    await partner.save();

    await createLog(req.user._id, "Admin updated partner", "system", "success", `Partner: ${partner.name}`);

    res.json({ message: "Partner updated successfully", partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 12. Admin: Delete a partner
router.delete("/partners/:id", protect, adminOnly, async (req, res) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    await createLog(req.user._id, "Admin deleted partner", "system", "warning", `Partner: ${partner.name}`);

    res.json({ message: "Partner deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates the login account (role "doctor") for a doctor profile. Throws {status, message} on bad input.
async function createDoctorUser({ name, email, password, phone }) {
  const cleanEmail = (email || "").toLowerCase().trim();
  if (!EMAIL_RE.test(cleanEmail)) throw { status: 400, message: "Please enter a valid login email for the doctor." };
  if (!password || password.length < 6) throw { status: 400, message: "The doctor's password must be at least 6 characters." };
  if (await User.findOne({ email: cleanEmail })) throw { status: 400, message: "That email is already registered." };
  const cleanPhone = (phone || "").trim();
  if (cleanPhone && (await User.findOne({ phone: cleanPhone }))) throw { status: 400, message: "That phone number is already registered." };

  return User.create({
    name: name.trim(),
    email: cleanEmail,
    password: await bcrypt.hash(password, 10),
    phone: cleanPhone || "N/A",
    location: "Somalia",
    role: "doctor",
    isAvailable: false,
  });
}

const cleanHighlights = (value) =>
  Array.isArray(value)
    ? value.map((v) => String(v || "").trim().slice(0, 60)).filter(Boolean).slice(0, 3)
    : [];

// Only real http(s) links are stored, so a saved link can never be a javascript: URL
const cleanUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) throw new Error("bad");
    return url.href.slice(0, 300);
  } catch {
    throw { status: 400, message: `"${raw}" is not a valid link.` };
  }
};

const cleanSocials = (socials = {}) => ({
  facebook: cleanUrl(socials.facebook),
  linkedin: cleanUrl(socials.linkedin),
  twitter: cleanUrl(socials.twitter),
});

const sendError = (res, err) => res.status(err.status || 500).json({ message: err.message });

// 13. Admin: Get all doctors (including hidden), with their login email, for the management screen
router.get("/doctors", protect, adminOnly, async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ order: 1, createdAt: 1 }).populate("user", "email");
    res.json(doctors);
  } catch (err) {
    sendError(res, err);
  }
});

// 14. Admin: Add a doctor (profile + optional login account so the doctor can answer donors)
router.post("/doctors", protect, adminOnly, async (req, res) => {
  let doctorUser = null;
  try {
    const { name, specialty, title, bio, highlights, socials, photo, order, account } = req.body;

    if (!name || !specialty) {
      return res.status(400).json({ message: "Doctor name and specialty are required" });
    }

    const cleanedSocials = cleanSocials(socials);

    if (account && account.email) {
      doctorUser = await createDoctorUser({ name, ...account });
    }

    const doctor = new Doctor({
      name: name.trim(),
      specialty: specialty.trim(),
      title: (title || "").trim(),
      bio: (bio || "").trim(),
      highlights: cleanHighlights(highlights),
      socials: cleanedSocials,
      photo: photo || "",
      user: doctorUser ? doctorUser._id : null,
      order: order || 0,
    });
    await doctor.save();

    await createLog(req.user._id, "Admin added doctor", "system", "success", `Doctor: ${doctor.name}${doctorUser ? " (with login)" : ""}`);

    res.status(201).json({ message: "Doctor added successfully", doctor });
  } catch (err) {
    if (doctorUser) await User.findByIdAndDelete(doctorUser._id).catch(() => {});
    sendError(res, err);
  }
});

// 15. Admin: Update a doctor (and create / update the login account)
router.put("/doctors/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, specialty, title, bio, highlights, socials, photo, order, isActive, account } = req.body;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (name) doctor.name = name.trim();
    if (specialty) doctor.specialty = specialty.trim();
    if (title !== undefined) doctor.title = String(title).trim();
    if (bio !== undefined) doctor.bio = bio.trim();
    if (highlights !== undefined) doctor.highlights = cleanHighlights(highlights);
    if (socials !== undefined) doctor.socials = cleanSocials(socials);
    if (photo !== undefined) doctor.photo = photo;
    if (order !== undefined) doctor.order = order;
    if (typeof isActive === "boolean") doctor.isActive = isActive;

    if (account) {
      if (!doctor.user) {
        if (account.email) {
          const created = await createDoctorUser({ name: doctor.name, ...account });
          doctor.user = created._id;
        }
      } else {
        const update = { name: doctor.name };
        if (account.password) {
          if (account.password.length < 6) throw { status: 400, message: "The doctor's password must be at least 6 characters." };
          update.password = await bcrypt.hash(account.password, 10);
        }
        if (account.email) {
          const cleanEmail = account.email.toLowerCase().trim();
          if (!EMAIL_RE.test(cleanEmail)) throw { status: 400, message: "Please enter a valid login email for the doctor." };
          const taken = await User.findOne({ email: cleanEmail, _id: { $ne: doctor.user } });
          if (taken) throw { status: 400, message: "That email is already registered." };
          update.email = cleanEmail;
        }
        await User.findByIdAndUpdate(doctor.user, { $set: update });
      }
    } else if (name && doctor.user) {
      await User.findByIdAndUpdate(doctor.user, { $set: { name: doctor.name } });
    }

    await doctor.save();

    await createLog(req.user._id, "Admin updated doctor", "system", "success", `Doctor: ${doctor.name}`);

    res.json({ message: "Doctor updated successfully", doctor });
  } catch (err) {
    sendError(res, err);
  }
});

// 16. Admin: Delete a doctor (removes the login account and the conversations too)
router.delete("/doctors/:id", protect, adminOnly, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.user) await User.findByIdAndDelete(doctor.user);
    await ConsultationMessage.deleteMany({ doctor: doctor._id });

    await createLog(req.user._id, "Admin deleted doctor", "system", "warning", `Doctor: ${doctor.name}`);

    res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
