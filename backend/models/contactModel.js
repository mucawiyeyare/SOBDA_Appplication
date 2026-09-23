import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    carrier: {
      type: String,
      trim: true,
      default: "Hormuud"
    },
    carrierCode: {
      type: String,
      trim: true,
      default: "+252 61"
    },
    formattedPhone: {
      type: String,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    urgency: {
      type: String,
      enum: ["Normal", "Urgent", "Emergency"],
      default: "Normal"
    },
    attachments: [
      {
        name: { type: String, required: true },
        type: { type: String },
        size: { type: Number },
        category: { type: String, default: "Medical Justification" },
        data: { type: String, required: true } // base64 data URI
      }
    ],
    status: {
      type: String,
      enum: ["New", "Read", "Replied"],
      default: "New"
    }
  },
  {
    timestamps: true
  }
);

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
