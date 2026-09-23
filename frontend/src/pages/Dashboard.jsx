import React, { useState } from "react";
import { Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar.jsx";
import NotificationDropdown from "../Components/NotificationDropdown.jsx";
import ThemeToggle from "../Components/ThemeToggle.jsx";
import { LogOut, Menu, X, UserCheck, Shield, Droplet, Building2, Bell, BellOff, Stethoscope } from "lucide-react";
import { useNotifications } from "../context/NotificationContext.jsx";

const isPushSupported =
  typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

// iOS only delivers Web Push to a site that's been added to the Home Screen
// (Apple platform restriction) — Notification.requestPermission() silently
// does nothing useful in a regular Safari tab, so we show instructions instead.
const isIOS =
  typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isIOSStandalone =
  typeof navigator !== "undefined" && window.navigator.standalone === true;

function Dashboard({ setUser }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { permissionStatus, isSubscribing, requestNotificationPermission } = useNotifications();

  const role = localStorage.getItem("role") || "user";
  const userName = localStorage.getItem("userName") || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0];
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    });
    if (setUser) {
      setUser(null);
    }
    navigate("/", { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getRoleBadge = () => {
    const [Icon, label] =
      {
        hospital: [Building2, "Hospital"],
        admin: [Shield, "Administrator"],
        health_institution: [Shield, "Ministry of Health"],
        doctor: [Stethoscope, "Doctor"],
      }[role] || [Droplet, "Blood Donor"];

    return (
      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-soft text-navy border border-line text-xs font-bold uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5 text-brand" />
        {label}
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-50 overflow-auto relative flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 right-0 z-20 flex justify-between items-center px-4 sm:px-6 py-3.5 bg-white border-b border-line text-slate-800">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-colors"
              title="Toggle Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-navy">SOBDA</span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-medium">Somalia Blood Donation Network</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notification Center Bell */}
            <NotificationDropdown />
            <ThemeToggle />

            {getRoleBadge()}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border border-line"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Persistent prompt until the device is actually subscribed to push —
            WhatsApp needs no opt-in and always fires, but the on-screen push
            alert does nothing until the browser grants permission here. */}
        {(isPushSupported || (isIOS && !isIOSStandalone)) &&
          permissionStatus !== "granted" &&
          !bannerDismissed && (
          <div
            className={`flex flex-col sm:flex-row sm:items-center gap-2.5 px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold ${
              "bg-soft text-slate-700 border-b border-line"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {permissionStatus === "denied" || (isIOS && !isIOSStandalone) ? (
                <BellOff className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Bell className="w-4 h-4 flex-shrink-0 animate-pulse" />
              )}
              <span className="min-w-0">
                {isIOS && !isIOSStandalone
                  ? "On iPhone/iPad: tap the Share icon, then \"Add to Home Screen\", and open SOBDA from your Home Screen to turn on notifications — iOS only allows push alerts for installed apps."
                  : permissionStatus === "denied"
                  ? "Notifications are blocked in your browser. Open your browser's site settings for this page and allow Notifications to get instant alerts on your phone."
                  : "Turn on notifications so urgent blood requests pop up on your phone screen instantly — not just on WhatsApp."}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              {permissionStatus !== "denied" && !(isIOS && !isIOSStandalone) && (
                <button
                  onClick={requestNotificationPermission}
                  disabled={isSubscribing}
                  className="px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60 font-bold transition-colors"
                >
                  {isSubscribing ? "Enabling…" : "Enable Notifications"}
                </button>
              )}
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 rounded-lg hover:bg-slate-200"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Nested View */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
