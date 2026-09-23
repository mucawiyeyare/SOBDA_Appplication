import mongoose from "mongoose";

// Expo push token of one installed copy of the mobile app. Separate from PushSubscription (browser Web Push).
const expoPushTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["ios", "android", "unknown"], default: "unknown" },
  },
  { timestamps: true }
);

export default mongoose.model("ExpoPushToken", expoPushTokenSchema);
