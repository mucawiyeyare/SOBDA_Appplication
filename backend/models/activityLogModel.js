import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false // System actions might not have a user
    },
    action: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["user", "donation", "report", "system"],
      default: "system"
    },
    status: {
      type: String,
      enum: ["success", "error", "warning"],
      default: "success"
    },
    details: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("ActivityLog", activityLogSchema);
