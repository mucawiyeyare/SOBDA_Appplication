import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true }, // optional line under the name, e.g. "Consultant Hematologist"
    bio: { type: String, default: "", trim: true },
    highlights: { type: [String], default: [] }, // up to 3 short lines shown with icons on the card
    socials: {
      facebook: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    photo: { type: String, default: "" }, // base64 data URL, same pattern as User.profileImage
    whatsapp: { type: String, default: "", trim: true }, // international format, digits only, for click-to-chat
    // Login account (role "doctor") that answers donors' questions; null = profile only, no chat
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
