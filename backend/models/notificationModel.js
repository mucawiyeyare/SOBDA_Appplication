import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "blood_request",
        "batch_request",
        "request_accepted",
        "request_declined",
        "donor_arrived",
        "donation_completed",
        "whatsapp_message",
        "doctor_message",
        "system_alert",
      ],
      default: "blood_request",
    },
    channel: {
      type: String,
      enum: ["system", "whatsapp", "both"],
      default: "both",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      requestId: { type: mongoose.Schema.Types.ObjectId, ref: "DonorRequest" },
      bloodType: { type: String },
      urgency: { type: String },
      hospitalName: { type: String },
      hospitalLocation: { type: String },
      donorName: { type: String },
      donorPhone: { type: String },
      patientInfo: { type: Object },
      actionUrl: { type: String },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
