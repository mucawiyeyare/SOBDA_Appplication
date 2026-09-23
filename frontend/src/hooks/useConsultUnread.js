import { useEffect, useState } from "react";
import axios from "axios";

// Number of unread doctor-chat messages for the signed-in donor or doctor (for the sidebar badge).
// Chat pages fire a "consult-unread-changed" event after marking messages as read.
export default function useConsultUnread(role, intervalMs = 15000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (role !== "donor" && role !== "doctor") return undefined;
    let active = true;

    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get("/api/consult/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setCount(res.data?.count || 0);
      } catch {
        // keep the last known number
      }
    };

    load();
    const timer = setInterval(load, intervalMs);
    window.addEventListener("consult-unread-changed", load);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("consult-unread-changed", load);
    };
  }, [role, intervalMs]);

  return count;
}
