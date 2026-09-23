import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Droplet,
  Building2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Smartphone,
  X,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    permissionStatus,
    requestNotificationPermission,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return "Just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type) => {
    const isBloodReq = type === "blood_request" || type === "batch_request";
    const isAccepted = type === "request_accepted" || type === "donation_completed";
    const isDeclined = type === "request_declined";

    const bg = isBloodReq
      ? "#c62828"
      : isAccepted
      ? "#25D366"
      : isDeclined
      ? "#e65100"
      : "#1565c0";

    const emoji = isBloodReq ? "🩸" : isAccepted ? "✅" : isDeclined ? "❌" : "🏥";

    return (
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "18px",
          lineHeight: 1,
        }}
      >
        {emoji}
      </div>
    );
  };

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    setIsOpen(false);
    const targetUrl = item.data?.actionUrl || "/dashboard/donor-requests";
    navigate(targetUrl);
  };

  const filteredList =
    filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 flex items-center justify-center border border-line"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute top-14 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white text-slate-800 rounded-2xl shadow-2xl border border-line overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-soft border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-900">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-semibold transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Browser Push Permission Banner */}
          {permissionStatus !== "granted" && (
            <div className="p-2.5 bg-soft border-b border-line flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-[11px] text-slate-600 truncate">
                  Get WhatsApp & Phone top alerts
                </span>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="px-2.5 py-1 rounded-lg bg-brand hover:bg-brand-dark text-white text-[11px] font-bold flex-shrink-0 transition-colors shadow"
              >
                Enable
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="px-3 pt-2 pb-1 flex items-center gap-2 bg-white border-b border-line text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === "all"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                filter === "unread"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line custom-scrollbar">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  When hospitals send messages or blood requests, they will appear here.
                </p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 group hover:bg-slate-50 ${
                    !item.isRead ? "bg-soft" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5
                        className={`text-xs font-bold truncate ${
                          !item.isRead ? "text-slate-900" : "text-slate-600"
                        }`}
                      >
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {item.channel === "both" && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp & System alert dispatched</span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-soft border-t border-line text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/dashboard/donor-requests");
              }}
              className="text-xs font-bold text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1"
            >
              <span>View all blood requests</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
