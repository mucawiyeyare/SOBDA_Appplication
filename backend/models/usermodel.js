import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String,
       required: true },

    email: { 
      type: String,
       required: true, unique: true },

    password: { 
      type: String,
       required: true },

    nationalId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    phone: { 
      type: String,
      required: true 
    },
    location: {
      type: String, 
      required: true 
    }, // Text location (city/area)
    bloodType: {
      type: String,
      required: false,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "O+",
    },
    role: {
      type: String,
      enum: ["donor", "hospital", "admin", "health_institution", "doctor"],
      default: "donor",
    },
    age: {
      type: Number,
      required: false,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    // Hospital specific fields
    hospitalLicense: {
      type: String,
      required: false,
    },
    // Donor-specific fields
    lastDonationDate: {
      type: Date,
      required: false,
    },
    profileImage: {
      type: String,
      required: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    // Donor GPS position (set from the mobile app / web location picker); used for nearest-donor search
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      address: { type: String, trim: true },
      updatedAt: { type: Date },
    },
    // Top Heroes / Leaderboard visibility preference (Public vs Private)
    allowPublicLeaderboard: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);



export default mongoose.model("User", userSchema);
