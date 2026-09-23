import express from "express";
import { registerDonor, loginUser, getAllUsers, getProfile, getDonors } from "../controllers/usercontrollers.js";
import { adminOnly, protect, adminOrHospital, adminOrHealthInstitution, adminOrHospitalOrHealthInstitution } from "../middleware/authMiddleware.js";
import User from "../models/usermodel.js";
import bcrypt from "bcryptjs";

// Route to fetch all donors

const router = express.Router();

// Donor Registration
router.post("/register", registerDonor);
// User Login
router.post("/login", loginUser);
router.get("/all", protect, adminOnly, getAllUsers);
router.get("/donors", protect, adminOrHospitalOrHealthInstitution, getDonors); // Admin, Hospital, and Health Institution can view donors

router.get("/profile", protect, getProfile);

// Update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, location, bloodType, nationalId, gender, age, profileImage, allowPublicLeaderboard } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (location) user.location = location.trim();
    if (bloodType) user.bloodType = bloodType;
    if (nationalId) user.nationalId = nationalId.trim();
    if (gender) user.gender = gender;
    if (age !== undefined) user.age = Number(age);
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (allowPublicLeaderboard !== undefined) user.allowPublicLeaderboard = Boolean(allowPublicLeaderboard);

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        nationalId: user.nationalId,
        gender: user.gender,
        age: user.age,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        bloodType: user.bloodType,
        role: user.role,
        isAvailable: user.isAvailable,
        lastDonationDate: user.lastDonationDate,
        profileImage: user.profileImage,
        allowPublicLeaderboard: user.allowPublicLeaderboard,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new password" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public analytics report (for Home page & statistics)
router.get("/public-report", async (req, res) => {
  try {
    const donors = await User.find({ role: "donor" });
    const allUsers = await User.find();

    const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const bloodTypeCount = {};
    const totalDonors = donors.length;

    bloodTypes.forEach((type) => {
      const count = donors.filter((d) => d.bloodType === type).length;
      bloodTypeCount[type] = {
        count: count,
        percentage: totalDonors > 0 ? ((count / totalDonors) * 100).toFixed(1) : 0,
      };
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthDonors = donors.filter((d) => {
      const createdDate = new Date(d.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    });

    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthDonors = donors.filter((d) => {
      const createdDate = new Date(d.createdAt);
      return createdDate.getMonth() === lastMonth.getMonth() && createdDate.getFullYear() === lastMonth.getFullYear();
    });

    const percentageChange =
      lastMonthDonors.length > 0
        ? (((thisMonthDonors.length - lastMonthDonors.length) / lastMonthDonors.length) * 100).toFixed(1)
        : 100;

    // Count unique regions from donor location strings (format: "District, Region")
    const regionSet = new Set();
    donors.forEach((d) => {
      if (d.location && d.location.includes(",")) {
        const region = d.location.split(",").pop().trim();
        if (region) regionSet.add(region);
      }
    });
    const regionsCovered = regionSet.size || 0;

    res.json({
      bloodTypeStats: bloodTypeCount,
      monthlyStats: {
        totalDonationsThisMonth: thisMonthDonors.length,
        newDonorsThisMonth: thisMonthDonors.length,
        percentageChange: Number(percentageChange),
      },
      activityStats: {
        totalDonors: donors.length,
        totalHospitals: allUsers.filter((u) => u.role === "hospital").length,
        totalUsers: allUsers.length,
        regionsCovered,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
