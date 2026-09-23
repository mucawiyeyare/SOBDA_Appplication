import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { playNotificationChime } from "../utils/notificationSound";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Utility to convert VAPID base64 string to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTopBanner, setActiveTopBanner] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const knownIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);
  const pollTimerRef = useRef(null);
  const swRegistrationRef = useRef(null);

  // Subscribe device to native OS-level Web Push (VAPID)
  const subscribeToWebPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.debug("Web Push not supported on this browser");
      return false;
    }

    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      setIsSubscribing(true);
      const reg = await navigator.serviceWorker.ready;
      swRegistrationRef.current = reg;

      // 1. Fetch server's public VAPID key
      const keyRes = await axios.get("/api/notifications/vapid-key");
      const vapidPublicKey = keyRes.data?.publicKey;
      if (!vapidPublicKey) {
        throw new Error("No VAPID public key received from server");
      }

      // 2. Check existing subscription or subscribe
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // 3. Send subscription to backend
      await axios.post(
        "/api/notifications/subscribe",
        subscription.toJSON(),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsPushSubscribed(true);
      console.log("[WebPush] Device successfully subscribed to OS emergency alerts");
      return true;
    } catch (err) {
      console.error("[WebPush] Subscription error:", err);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          swRegistrationRef.current = reg;
          // If already granted, ensure device subscription is active
          if (Notification.permission === "granted") {
            subscribeToWebPush();
          }
        })
        .catch((err) => {
          console.debug("Service worker registration failed:", err);
        });
    }

    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, [subscribeToWebPush]);

  // Request browser push notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return "unsupported";

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        await subscribeToWebPush();
      }
      return permission;
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return "denied";
    }
  };

  // Trigger delayed push test (delays 4 seconds so user can switch to YouTube)
  const triggerDelayedPushTest = async (delaySeconds = 4) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, message: "Please login first" };

    try {
      // Ensure subscribed
      if (!isPushSubscribed) {
        await subscribeToWebPush();
      }

      const res = await axios.post(
        "/api/notifications/test-push",
        { delaySeconds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data;
    } catch (err) {
      console.error("Error triggering test push:", err);
      throw err;
    }
  };

  // Trigger native mobile browser push notification
  const triggerNativeNotification = useCallback((notification) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const title = notification.title || "🚨 DIGIIN DEGDEG AH: Dhiig Baa Loo Baahan Yahay!";
    const requestId = notification.data?.requestId;
    const options = {
      body: notification.message || "Waxaad heshay codsi dhiig-bixin degdeg ah.",
      icon: "/logo.png",
      badge: "/logo.png",
      vibrate: [400, 200, 400, 200, 400],
      requireInteraction: true,
      tag: `sobda-${notification._id || Date.now()}`,
      data: {
        url: notification.data?.actionUrl || "/dashboard/donor-requests",
        requestId,
      },
      actions: requestId
        ? [
            { action: "accept", title: "✅ Accept" },
            { action: "decline", title: "❌ Decline" },
          ]
        : undefined,
    };

    if (swRegistrationRef.current && "showNotification" in swRegistrationRef.current) {
      swRegistrationRef.current.showNotification(title, options).catch(() => {
        try {
          new Notification(title, options);
        } catch (e) {}
      });
    } else {
      try {
        const n = new Notification(title, options);
        n.onclick = () => {
          window.focus();
          if (notification.data?.actionUrl) {
            window.location.href = notification.data.actionUrl;
          }
          n.close();
        };
      } catch (e) {}
    }
  }, []);

  // Trigger mobile top notification heads-up banner & audio chime
  const notifyUser = useCallback(
    (notification) => {
      playNotificationChime();
      setActiveTopBanner(notification);
      triggerNativeNotification(notification);
    },
    [triggerNativeNotification]
  );

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("/api/notifications?limit=30", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const incoming = res.data.notifications || [];
        setNotifications(incoming);
        setUnreadCount(res.data.unreadCount || 0);

        if (isInitialLoadRef.current) {
          incoming.forEach((n) => knownIdsRef.current.add(n._id));
          isInitialLoadRef.current = false;
        } else {
          const newItems = incoming.filter(
            (n) => !knownIdsRef.current.has(n._id) && !n.isRead
          );

          if (newItems.length > 0) {
            const latest = newItems[0];
            notifyUser(latest);
            newItems.forEach((n) => knownIdsRef.current.add(n._id));
          }
        }
      }
    } catch (err) {
      console.debug("Error fetching notifications:", err.message);
    }
  }, [notifyUser]);

  // Polling loop when authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
    pollTimerRef.current = setInterval(fetchNotifications, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        `/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(
        "/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const deleteNotification = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const dismissTopBanner = () => {
    setActiveTopBanner(null);
  };

  // List / revoke this user's registered push devices (profile "My Devices" section)
  const listMyDevices = async () => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, message: "Please login first" };

    try {
      const res = await axios.get("/api/notifications/devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, devices: res.data.devices || [] };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to load devices",
      };
    }
  };

  const revokeDevice = async (deviceId) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, message: "Please login first" };

    try {
      await axios.delete(`/api/notifications/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to revoke device",
      };
    }
  };

  // Endpoint URL of this browser's own active push subscription, so the
  // device list can flag "This device" and warn before it's revoked.
  const getCurrentDeviceEndpoint = async () => {
    try {
      if (!swRegistrationRef.current) return null;
      const sub = await swRegistrationRef.current.pushManager.getSubscription();
      return sub?.endpoint || null;
    } catch {
      return null;
    }
  };

  // Donor responds (accept/decline) directly from a push notification / banner,
  // without navigating to the full requests page.
  const respondToDonorRequest = async (requestId, response, extra = {}) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, message: "Please login first" };

    try {
      const res = await axios.put(
        `/api/requests/${requestId}/respond`,
        {
          response,
          availabilityTime: extra.availabilityTime,
          declineReason: extra.declineReason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to send your response",
      };
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeTopBanner,
        permissionStatus,
        isPushSubscribed,
        isSubscribing,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        dismissTopBanner,
        requestNotificationPermission,
        subscribeToWebPush,
        triggerDelayedPushTest,
        notifyUser,
        respondToDonorRequest,
        listMyDevices,
        revokeDevice,
        getCurrentDeviceEndpoint,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
