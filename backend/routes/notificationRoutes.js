import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import ExpoPushToken from "../models/expoPushTokenModel.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getVapidPublicKey,
  savePushSubscription,
  testPushNotification,
  getMyDevices,
  revokeDevice,
} from "../controllers/notificationController.js";

const router = express.Router();

// Mobile app: register / remove this device's Expo push token
router.post("/subscribe-mobile", protect, async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (typeof token !== "string" || !/^(Expo|Exponent)PushToken\[.+\]$/.test(token)) {
      return res.status(400).json({ message: "A valid Expo push token is required" });
    }
    // A token belongs to one user at a time (device may have changed hands)
    await ExpoPushToken.findOneAndUpdate(
      { token },
      { user: req.user._id, platform: ["ios", "android"].includes(platform) ? platform : "unknown" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/subscribe-mobile", protect, async (req, res) => {
  try {
    if (req.body?.token) await ExpoPushToken.deleteOne({ token: req.body.token, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET public VAPID key
router.get("/vapid-key", getVapidPublicKey);

// POST save push subscription
router.post("/subscribe", protect, savePushSubscription);

// POST test push notification (with delay)
router.post("/test-push", protect, testPushNotification);

// GET list this user's registered push devices
router.get("/devices", protect, getMyDevices);

// DELETE revoke one of this user's registered push devices
router.delete("/devices/:id", protect, revokeDevice);

// GET all notifications for logged-in user
router.get("/", protect, getUserNotifications);

// PUT mark single notification as read
router.put("/:id/read", protect, markNotificationAsRead);

// PUT mark all as read
router.put("/read-all", protect, markAllNotificationsAsRead);

// DELETE single notification
router.delete("/:id", protect, deleteNotification);

export default router;
