import webpush from "web-push";
import PushSubscription from "../models/pushSubscriptionModel.js";
import ExpoPushToken from "../models/expoPushTokenModel.js";

// Initialize VAPID
const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY ||
  "BPujmoXAqNxiD7WW-5HZSoPFpGXlxI0C8L37Vh-O7XrBwcwEvnTQodYaYNG-fMSI5z6IH9kygseS6qr5krEQ41M";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "RpBA2KSe7_rODbG0-CSk4KQLZZHq1HJVSkPweC8_m28";
const vapidEmail =
  process.env.VAPID_EMAIL || "mailto:support@sobda.org";

try {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  console.log("[WebPush] VAPID details configured successfully");
} catch (err) {
  console.error("[WebPush] Failed to set VAPID details:", err.message);
}

/**
 * Send high-priority OS-level warning push notification to user
 * Will wake up phone and show on top of YouTube or other running apps
 */
const sendWebPushToUser = async (
  userId,
  {
    title = "🚨 DIGIIN DEGDEG AH: Waxaa loo baahan yahay dhiig!",
    body = "Isbitaal ayaa si degdeg ah ugu baahan dhiig. Fadlan fur codsiga.",
    urgency = "high",
    data = {},
  }
) => {
  try {
    if (!userId) return { success: false, reason: "No userId provided" };

    const subscriptions = await PushSubscription.find({ user: userId });
    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, reason: "No push subscriptions for user" };
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: `sobda-warning-${Date.now()}`,
      vibrate: [400, 200, 400, 200, 400],
      requireInteraction: true, // Remains on top until touched
      data: {
        ...data,
        actionUrl: data.actionUrl || "/dashboard/donor-requests",
        timestamp: Date.now(),
      },
      actions: [
        { action: "open", title: "Fur Codsiga (Open)" },
        { action: "close", title: "Xir (Dismiss)" },
      ],
    });

    const pushPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payload, {
          urgency: urgency === "high" ? "high" : "normal",
          TTL: 60 * 60 * 2, // 2 hours
        });
        return { success: true, endpoint: sub.endpoint };
      } catch (error) {
        // HTTP 410 or 404 indicates subscription expired/unregistered
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[WebPush] Pruning expired subscription for user ${userId}`);
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`[WebPush] Push failed for ${sub.endpoint}:`, error.message);
        }
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(pushPromises);
    const sentCount = results.filter((r) => r.success).length;

    console.log(
      `[WebPush] Dispatched OS warning to user ${userId}: ${sentCount}/${subscriptions.length} devices reached`
    );

    return {
      success: sentCount > 0,
      sentCount,
      totalDevices: subscriptions.length,
    };
  } catch (err) {
    console.error("[WebPush] General error sending push notification:", err);
    return { success: false, error: err.message };
  }
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Send the same alert to every mobile app install (Expo push) the user has registered. */
const sendExpoPushToUser = async (userId, { title, body, data = {} }) => {
  try {
    const tokens = await ExpoPushToken.find({ user: userId }).lean();
    if (!tokens.length) return { success: false, sentCount: 0, totalDevices: 0 };

    const messages = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data,
      sound: "default",
      priority: "high",
      channelId: "urgent",
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    const json = await res.json();
    const tickets = Array.isArray(json.data) ? json.data : [];

    // Drop tokens Expo reports as no longer registered (app uninstalled)
    const dead = tokens.filter((_, i) => tickets[i]?.details?.error === "DeviceNotRegistered").map((t) => t.token);
    if (dead.length) await ExpoPushToken.deleteMany({ token: { $in: dead } });

    const sentCount = tickets.filter((t) => t.status === "ok").length;
    return { success: sentCount > 0, sentCount, totalDevices: tokens.length };
  } catch (err) {
    console.error("[ExpoPush] Error sending push notification:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send an urgent alert to all of a user's devices: browsers (Web Push) and the mobile app (Expo push).
 * Keeps the original return shape (sums both channels) so existing callers are unaffected.
 */
export const sendUrgentPushToUser = async (userId, opts = {}) => {
  const [web, mobile] = await Promise.all([
    sendWebPushToUser(userId, opts),
    sendExpoPushToUser(userId, {
      title: opts.title || "🚨 DIGIIN DEGDEG AH: Waxaa loo baahan yahay dhiig!",
      body: opts.body || "Isbitaal ayaa si degdeg ah ugu baahan dhiig. Fadlan fur codsiga.",
      data: opts.data || {},
    }),
  ]);
  const sentCount = (web.sentCount || 0) + (mobile.sentCount || 0);
  return {
    success: sentCount > 0,
    sentCount,
    totalDevices: (web.totalDevices || 0) + (mobile.totalDevices || 0),
    ...(sentCount === 0 && web.reason ? { reason: web.reason } : {}),
  };
};
