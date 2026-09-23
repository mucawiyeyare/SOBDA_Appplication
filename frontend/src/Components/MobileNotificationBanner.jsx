import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

const ETA_CHOICES = [
  { label: "Now", value: "Leaving now (approx 10-15 mins)" },
  { label: "15 min", value: "In 15 minutes" },
  { label: "30 min", value: "In 30 minutes" },
  { label: "1 hour", value: "In 1 hour" },
];

/* ─────────────────────────────────────────────────────────────
   WhatsApp-style native Android heads-up notification banner.
   Slides down from the top of the screen, dark frosted card.
   For live blood-request notifications it lets the donor Accept
   or Decline right here, without leaving whatever they're doing.
───────────────────────────────────────────────────────────── */
export default function MobileNotificationBanner() {
  const navigate = useNavigate();
  const { activeTopBanner, dismissTopBanner, markAsRead, respondToDonorRequest } =
    useNotifications();
  const [visible, setVisible] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | eta | submitting | done | error
  const [resultText, setResultText] = useState("");
  const timerRef = useRef(null);

  const isActionable =
    !!activeTopBanner &&
    (activeTopBanner.type === "blood_request" || activeTopBanner.type === "batch_request") &&
    !!activeTopBanner.data?.requestId;

  const closeSoon = (delay = 320) => {
    setVisible(false);
    setTimeout(dismissTopBanner, delay);
  };

  /* Slide-in when a new banner appears; auto-dismiss unless the donor is mid-action */
  useEffect(() => {
    clearTimeout(timerRef.current);
    setPhase("idle");
    setResultText("");

    if (!activeTopBanner) {
      setVisible(false);
      return;
    }
    requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      closeSoon();
    }, isActionable ? 12000 : 6000);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopBanner]);

  if (!activeTopBanner) return null;

  /* Tap anywhere on a non-actionable card to open it */
  const handleTap = () => {
    if (phase !== "idle") return;
    if (activeTopBanner._id) markAsRead(activeTopBanner._id);
    const url = activeTopBanner.data?.actionUrl || "/dashboard/donor-requests";
    closeSoon(280);
    setTimeout(() => navigate(url), 280);
  };

  /* Swipe-up to dismiss (only while idle) */
  const handleTouchStart = (e) => setTouchStartY(e.touches[0].clientY);
  const handleTouchEnd = (e) => {
    if (touchStartY === null || phase !== "idle") return;
    if (touchStartY - e.changedTouches[0].clientY > 30) {
      closeSoon();
    }
    setTouchStartY(null);
  };

  const requestId = activeTopBanner.data?.requestId;

  const handleAcceptTap = (e) => {
    e.stopPropagation();
    clearTimeout(timerRef.current);
    setPhase("eta");
  };

  const handleDeclineTap = async (e) => {
    e.stopPropagation();
    clearTimeout(timerRef.current);
    setPhase("submitting");
    const res = await respondToDonorRequest(requestId, "decline", {});
    if (activeTopBanner._id) markAsRead(activeTopBanner._id);
    if (res.success) {
      setResultText("Declined. You're still available for other requests.");
      setPhase("done");
    } else {
      setResultText(res.message || "Couldn't send your response.");
      setPhase("error");
    }
    timerRef.current = setTimeout(() => closeSoon(), 3000);
  };

  const handleEtaPick = async (etaLabel) => {
    setPhase("submitting");
    const res = await respondToDonorRequest(requestId, "accept", { availabilityTime: etaLabel });
    if (activeTopBanner._id) markAsRead(activeTopBanner._id);
    if (res.success) {
      setResultText(`Accepted — hospital notified. ETA: ${etaLabel}`);
      setPhase("done");
    } else {
      setResultText(res.message || "Couldn't send your response.");
      setPhase("error");
    }
    timerRef.current = setTimeout(() => closeSoon(), 3200);
  };

  const isEmergency =
    activeTopBanner.data?.urgency === "Emergency" ||
    activeTopBanner.type === "blood_request";

  /* Time string like "9:52 AM" */
  const timeLabel = activeTopBanner.createdAt
    ? new Date(activeTopBanner.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  /* ── Inline styles so nothing fights Tailwind purge ── */
  const card = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: "8px 10px 4px",
    transform: visible ? "translateY(0)" : "translateY(-115%)",
    transition: "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
    pointerEvents: visible ? "auto" : "none",
  };

  const innerCard = {
    background: "rgba(28,28,30,0.97)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderRadius: "16px",
    padding: "10px 12px",
    boxShadow: "0 8px 36px rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    cursor: phase === "idle" ? "pointer" : "default",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
  };

  const iconCircle = {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background:
      phase === "done" ? "#2e7d32" : phase === "error" ? "#8e8e93" : isEmergency ? "#c62828" : "#25D366",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "21px",
    lineHeight: 1,
    boxShadow: isEmergency
      ? "0 2px 12px rgba(198,40,40,0.55)"
      : "0 2px 12px rgba(37,211,102,0.4)",
  };

  const acceptBtn = {
    flex: 1,
    background: "#25D366",
    color: "#04210f",
    border: "none",
    borderRadius: "10px",
    padding: "8px 0",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  };

  const declineBtn = {
    flex: 1,
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 0",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  };

  const etaChip = {
    background: "rgba(255,255,255,0.10)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <aside
      aria-live="assertive"
      aria-label="Notification"
      style={card}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── WhatsApp-style card ── */}
      <div style={innerCard} onClick={handleTap}>
        {/* Left green/red circle icon */}
        <div style={iconCircle}>
          {phase === "done" ? "✅" : phase === "error" ? "⚠️" : isEmergency ? "🩸" : "🏥"}
        </div>

        {/* Center content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* App label row + time — exactly like WhatsApp */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#8e8e93",
                fontWeight: 500,
                letterSpacing: "0.1px",
              }}
            >
              SOBDA
              {isEmergency && phase === "idle" && (
                <span style={{ color: "#ff453a", fontWeight: 700 }}>
                  {" "}• EMERGENCY
                </span>
              )}
            </span>
            <span
              style={{ fontSize: "11px", color: "#8e8e93", flexShrink: 0 }}
            >
              {timeLabel}
            </span>
          </div>

          {/* Sender name — bold, like WhatsApp contact name */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.3",
            }}
          >
            {activeTopBanner.title}
          </div>

          {/* Message preview / status text */}
          <div
            style={{
              fontSize: "13px",
              color: phase === "done" ? "#8ce29b" : phase === "error" ? "#ff9f9f" : "#aeaeb2",
              lineHeight: "1.4",
              marginTop: "1px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {phase === "done" || phase === "error" ? resultText : activeTopBanner.message}
          </div>

          {/* Inline Accept / Decline — the whole point: act right from the notification */}
          {isActionable && phase === "idle" && (
            <div
              style={{ display: "flex", gap: "8px", marginTop: "8px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button style={acceptBtn} onClick={handleAcceptTap}>
                ✅ Accept
              </button>
              <button style={declineBtn} onClick={handleDeclineTap}>
                Decline
              </button>
            </div>
          )}

          {/* ETA quick-picks after tapping Accept */}
          {isActionable && phase === "eta" && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "8px",
                flexWrap: "wrap",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {ETA_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  style={etaChip}
                  onClick={() => handleEtaPick(choice.value)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}

          {phase === "submitting" && (
            <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "6px" }}>
              Sending your response…
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {phase === "idle" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeSoon();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#636366",
              fontSize: "15px",
              lineHeight: 1,
              cursor: "pointer",
              padding: "0 2px",
              flexShrink: 0,
              marginTop: "1px",
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      {/* Swipe-up hint pill (visible on mobile) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "5px",
          paddingBottom: "2px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 4,
            background: "rgba(255,255,255,0.15)",
          }}
        />
      </div>
    </aside>
  );
}
