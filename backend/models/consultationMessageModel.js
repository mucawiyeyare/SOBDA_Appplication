import mongoose from "mongoose";

// One message in a donor <-> doctor conversation. A conversation is the pair (donor, doctor).
const consultationMessageSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    sender: { type: String, enum: ["donor", "doctor"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readByDonor: { type: Boolean, default: false },
    readByDoctor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

consultationMessageSchema.index({ donor: 1, doctor: 1, createdAt: 1 });

export default mongoose.model("ConsultationMessage", consultationMessageSchema);
