import User from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createLog } from "./activityLogController.js";
import DonorRequest from "../models/donorRequestModel.js";
import { resolveExpiredRequests } from "./donorRequestController.js";

/** Generate JWT Token */
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/** Register User (Donor or Hospital) */
export const registerDonor = async (req, res) => {
  try {
    const { nationalId, gender, name, email, password, phone, location, bloodType, age, dateOfBirth, role, hospitalLicense, allowPublicLeaderboard } = req.body;
    const userRole = role === "hospital" ? "hospital" : "donor";

    if (userRole === "hospital") {
      if (!name || !email || !password || !phone || !location) {
        return res.status(400).json({ message: "Hospital Name, Official Email, Password, Emergency Phone, and Location are all required." });
      }
    } else {
      if (!nationalId || !gender || !name || !email || !password || !phone || !location || !bloodType) {
        return res.status(400).json({ message: "Government ID, Full Name, Gender, Phone, Location, Blood Type, Email, and Password are all required." });
      }
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) return res.status(400).json({ message: "Email is already registered" });

    const phoneExists = await User.findOne({ phone: phone.trim() });
    if (phoneExists) return res.status(400).json({ message: "Phone number is already registered" });

    if (userRole === "donor" && nationalId) {
      const nationalIdExists = await User.findOne({ nationalId: nationalId.trim() });
      if (nationalIdExists) return res.status(400).json({ message: "Government / National ID is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const isApproved = userRole === "hospital" ? false : true;

    const newUser = await User.create({
      nationalId: userRole === "donor" && nationalId ? nationalId.trim() : undefined,
      gender: userRole === "donor" ? gender : undefined,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      location: location.trim(),
      bloodType: userRole === "donor" ? bloodType : (bloodType || "O+"),
      age: userRole === "donor" && age ? Number(age) : undefined,
      dateOfBirth: userRole === "donor" && dateOfBirth ? new Date(dateOfBirth) : undefined,
      hospitalLicense: userRole === "hospital" && hospitalLicense ? hospitalLicense.trim() : undefined,
      role: userRole,
      isAvailable: true,
      isApproved,
      allowPublicLeaderboard: typeof allowPublicLeaderboard === "boolean" ? allowPublicLeaderboard : true,
    });

    await createLog(
      newUser._id,
      userRole === "hospital" ? "New hospital registered (Pending Approval)" : "New donor registered",
      "user",
      "success",
      userRole === "hospital" ? `Hospital: ${newUser.name} (Waiting for Admin Approval)` : `Donor: ${newUser.name} (${newUser.bloodType})`
    );

    // If hospital, do not provide login token yet since admin approval is required
    if (userRole === "hospital") {
      return res.status(201).json({
        message: "Hospital registration submitted successfully! Your account is currently PENDING ADMINISTRATOR APPROVAL. Please wait for the admin to verify and activate your facility before logging in.",
        isPendingApproval: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          location: newUser.location,
          role: newUser.role,
          isApproved: false,
        },
      });
    }

    const token = generateToken(newUser);

    res.status(201).json({
      message: "Donor registered successfully in SOBDA system",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        location: newUser.location,
        bloodType: newUser.bloodType,
        role: newUser.role,
        nationalId: newUser.nationalId,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: "Email is already registered" });
      }
      if (error.keyPattern?.phone) {
        return res.status(400).json({ message: "Phone number is already registered" });
      }
      if (error.keyPattern?.nationalId) {
        return res.status(400).json({ message: "Government / National ID is already registered" });
      }
    }
    res.status(500).json({ message: error.message });
  }
};

/** Login User */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Block unapproved hospitals from logging in
    if (user.role === "hospital" && user.isApproved === false) {
      return res.status(403).json({
        message: "Your hospital account is currently pending administrator verification and approval. Please wait for an administrator to review and activate your facility before signing in.",
        isPendingApproval: true,
      });
    }

    const token = generateToken(user);

    await createLog(user._id, "User signed in", "user", "success", `Role: ${user.role}`);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        nationalId: user.nationalId,
        gender: user.gender,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        bloodType: user.bloodType,
        age: user.age,
        role: user.role,
        isAvailable: user.isAvailable,
        lastDonationDate: user.lastDonationDate,
        isApproved: user.isApproved,
        allowPublicLeaderboard: user.allowPublicLeaderboard,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Get All Users (Admin) */
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get Donors with Calculated Status and Filtering */
export const getDonors = async (req, res) => {
  try {
    await resolveExpiredRequests();

    const { status, bloodType, location, gender, search } = req.query;

    const query = { role: "donor" };
    if (bloodType) query.bloodType = bloodType;
    if (gender) query.gender = gender;
    if (location) query.location = new RegExp(location, "i");
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { nationalId: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
      ];
    }

    const donors = await User.find(query).select("-password").sort({ createdAt: -1 });

    const now = new Date();

    const donorsWithStatus = await Promise.all(
      donors.map(async (donor) => {
        let donorStatus = "Available";
        let cooldownEndsAt = null;
        let activeRequest = null;
        let remainingSeconds = 0;

        // 1. Check if in cooldown (90 days)
        if (donor.lastDonationDate) {
          const cooldownDate = new Date(donor.lastDonationDate);
          cooldownDate.setDate(cooldownDate.getDate() + 90);

          if (cooldownDate > now) {
            donorStatus = "Donated";
            cooldownEndsAt = cooldownDate;
          }
        }

        // 2. Check for active Pending or Arrived request
        if (donorStatus === "Available") {
          const pendingRequest = await DonorRequest.findOne({
            donorId: donor._id,
            status: { $in: ["Pending", "Arrived", "Accepted"] },
          })
            .populate("hospitalId", "name location phone")
            .sort({ requestDate: -1 });

          if (pendingRequest) {
            donorStatus = pendingRequest.status === "Arrived" ? "Arrived" : "Pending";
            activeRequest = pendingRequest;
            if (pendingRequest.pendingUntil) {
              remainingSeconds = Math.max(0, Math.floor((new Date(pendingRequest.pendingUntil) - now) / 1000));
            }
          }
        }

        // 3. Check manual availability
        if (donor.isAvailable === false && donorStatus === "Available") {
          donorStatus = "Unavailable";
        }

        return {
          ...donor.toObject(),
          status: donorStatus,
          cooldownEndsAt,
          activeRequest,
          remainingSeconds,
        };
      })
    );

    let filteredDonors = donorsWithStatus;
    if (status) {
      filteredDonors = donorsWithStatus.filter((d) => d.status.toLowerCase() === status.toLowerCase());
    }

    res.json(filteredDonors);
  } catch (err) {
    console.error("Error in getDonors:", err);
    res.status(500).json({ message: "Server Error loading donors: " + err.message });
  }
};

/** Get Own Profile */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
