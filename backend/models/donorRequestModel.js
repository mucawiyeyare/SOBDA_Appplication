import mongoose from "mongoose";

const donorRequestSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bloodType: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    urgency: {
      type: String,
      enum: ["Routine", "Urgent", "Emergency"],
      default: "Routine",
    },
    message: {
      type: String,
      required: false,
    },
    patientInfo: {
      name: { type: String, required: false },
      age: { type: Number, required: false },
      phone: { type: String, required: false },
      diagnosis: { type: String, required: false },
      causeOfInjury: { type: String, required: false },
      notes: { type: String, required: false },
    },
    status: {
      type: String,
      enum: ["Pending", "Arrived", "Accepted", "Declined", "Completed", "Cancelled", "Expired"],
      default: "Pending",
    },
    availabilityTime: {
      type: String,
      required: false,
    },
    requestDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    pendingUntil: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // Default 2 hours from now
    },
    arrivedAt: {
      type: Date,
      required: false,
    },
    responseDate: {
      type: Date,
      required: false,
    },
    completionDate: {
      type: Date,
      required: false,
    },
    declineReason: {
      type: String,
      required: false,
    },
    batchId: {
      type: String,
      required: false,
      index: true,
    },
    whatsappSent: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
donorRequestSchema.index({ hospitalId: 1, status: 1 });
donorRequestSchema.index({ donorId: 1, status: 1 });
donorRequestSchema.index({ pendingUntil: 1, status: 1 });

export default mongoose.model("DonorRequest", donorRequestSchema);
