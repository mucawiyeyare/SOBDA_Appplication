import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DonorRequest",
      required: false,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: false,
    },
    donationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    appointmentDate: {
      type: Date,
      required: false,
    },
    collectionCenter: {
      type: String,
      required: false,
    },
    donationType: {
      type: String,
      enum: ["Whole Blood", "Plasma", "Platelets", "Double Red Cells"],
      default: "Whole Blood",
    },
    volume: {
      type: Number, // in ml
      required: true,
      default: 450,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Collected", "Testing", "Processed", "Completed", "Rejected"],
      default: "Scheduled",
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    vitalSigns: {
      bloodPressure: String,
      pulse: Number,
      temperature: Number,
      hemoglobin: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Donation", donationSchema);
