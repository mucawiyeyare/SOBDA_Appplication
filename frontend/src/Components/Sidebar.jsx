import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Droplet,
  UserCircle,
  BarChart3,
  FileText,
  Activity,
  UserPlus,
  Inbox,
  MessageSquare,
  Building2,
  CheckCircle2,
  History,
  Send,
  Handshake,
  Stethoscope,
  MessageCircle,
} from "lucide-react";
import useConsultUnread from "../hooks/useConsultUnread.js";
import SobdaLogo from "./SobdaLogo.jsx";

function Sidebar({ isOpen, onClose }) {
  const role = localStorage.getItem("role"); // admin / donor / hospital / health_institution / doctor
  const unreadMessages = useConsultUnread(role);
  const unreadBadge =
    unreadMessages > 0 ? (
      <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">{unreadMessages}</span>
    ) : null;

  // Navigation link style helper
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-red-50 text-brand font-semibold"
        : "text-slate-600 hover:bg-soft hover:text-navy"
    }`;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <div
      className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 h-screen bg-white text-slate-700 
        flex flex-col p-4 shadow-sm border-r border-line
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Brand Logo Header */}
      <div className="pb-6 mb-4 border-b border-line">
        <Link to="/" title="Go to Website Home" className="block bg-white hover:bg-soft p-3 rounded-2xl border border-line flex justify-center items-center transition-all group">
          <SobdaLogo size="sm" />
        </Link>
        <div className="mt-3 px-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {role === "health_institution" ? "Ministry Portal" : `${role || "User"} Portal`}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
            Live
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
        {/* ADMIN ROLE */}
        {role === "admin" && (
          <>
            <NavLink to="/dashboard" end className={linkClass} onClick={handleLinkClick}>
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/dashboard/hospitals" className={linkClass} onClick={handleLinkClick}>
              <Building2 className="w-5 h-5" />
              <span>Hospitals</span>
            </NavLink>
            <NavLink to="/dashboard/donors" className={linkClass} onClick={handleLinkClick}>
              <Droplet className="w-5 h-5" />
              <span>Donors</span>
            </NavLink>
            <NavLink to="/dashboard/users" className={linkClass} onClick={handleLinkClick}>
              <Users className="w-5 h-5" />
              <span>System Users</span>
            </NavLink>
            <NavLink to="/dashboard/register-user" className={linkClass} onClick={handleLinkClick}>
              <UserPlus className="w-5 h-5" />
              <span>Register User</span>
            </NavLink>
            <NavLink to="/dashboard/reports" className={linkClass} onClick={handleLinkClick}>
              <FileText className="w-5 h-5" />
              <span>Reports</span>
            </NavLink>
            <NavLink to="/dashboard/analysis" className={linkClass} onClick={handleLinkClick}>
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/dashboard/activity" className={linkClass} onClick={handleLinkClick}>
              <Activity className="w-5 h-5" />
              <span>Activity Log</span>
            </NavLink>
            <NavLink to="/dashboard/messages" className={linkClass} onClick={handleLinkClick}>
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </NavLink>
            <NavLink to="/dashboard/send-messages" className={linkClass} onClick={handleLinkClick}>
              <Send className="w-5 h-5" />
              <span>Send Messages</span>
            </NavLink>
            <NavLink to="/dashboard/partners" className={linkClass} onClick={handleLinkClick}>
              <Handshake className="w-5 h-5" />
              <span>Partners</span>
            </NavLink>
            <NavLink to="/dashboard/doctors" className={linkClass} onClick={handleLinkClick}>
              <Stethoscope className="w-5 h-5" />
              <span>Doctors</span>
            </NavLink>
            <NavLink to="/dashboard/profile" className={linkClass} onClick={handleLinkClick}>
              <UserCircle className="w-5 h-5" />
              <span>My Profile</span>
            </NavLink>
          </>
        )}

        {/* HOSPITAL ROLE */}
        {role === "hospital" && (
          <>
            <NavLink to="/dashboard" end className={linkClass} onClick={handleLinkClick}>
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/dashboard/hospital-donors" className={linkClass} onClick={handleLinkClick}>
              <Droplet className="w-5 h-5" />
              <span>Available Donors</span>
            </NavLink>
            <NavLink to="/dashboard/hospital-requests" className={linkClass} onClick={handleLinkClick}>
              <Inbox className="w-5 h-5" />
              <span>Active Requests</span>
            </NavLink>
            <NavLink to="/dashboard/hospital-history" className={linkClass} onClick={handleLinkClick}>
              <History className="w-5 h-5" />
              <span>Donations History</span>
            </NavLink>
            <NavLink to="/dashboard/reports" className={linkClass} onClick={handleLinkClick}>
              <FileText className="w-5 h-5" />
              <span>Reports</span>
            </NavLink>
            <NavLink to="/dashboard/profile" className={linkClass} onClick={handleLinkClick}>
              <UserCircle className="w-5 h-5" />
              <span>Hospital Profile</span>
            </NavLink>
          </>
        )}

        {/* DONOR ROLE */}
        {role === "donor" && (
          <>
            <NavLink to="/dashboard/donor-requests" className={linkClass} onClick={handleLinkClick}>
              <Inbox className="w-5 h-5" />
              <span>My Status & Requests</span>
            </NavLink>
            <NavLink to="/dashboard/ask-doctor" className={linkClass} onClick={handleLinkClick}>
              <MessageCircle className="w-5 h-5" />
              <span>Ask a Doctor</span>
              {unreadBadge}
            </NavLink>
            <NavLink to="/dashboard/profile" className={linkClass} onClick={handleLinkClick}>
              <UserCircle className="w-5 h-5" />
              <span>Profile & History</span>
            </NavLink>
          </>
        )}

        {/* DOCTOR ROLE */}
        {role === "doctor" && (
          <>
            <NavLink to="/dashboard/doctor-inbox" className={linkClass} onClick={handleLinkClick}>
              <MessageCircle className="w-5 h-5" />
              <span>Donor Questions</span>
              {unreadBadge}
            </NavLink>
            <NavLink to="/dashboard/profile" className={linkClass} onClick={handleLinkClick}>
              <UserCircle className="w-5 h-5" />
              <span>My Profile</span>
            </NavLink>
          </>
        )}

        {/* HEALTH INSTITUTION / MINISTRY OF HEALTH */}
        {role === "health_institution" && (
          <>
            <NavLink to="/dashboard" end className={linkClass} onClick={handleLinkClick}>
              <LayoutDashboard className="w-5 h-5" />
              <span>National Dashboard</span>
            </NavLink>
            <NavLink to="/dashboard/reports" className={linkClass} onClick={handleLinkClick}>
              <FileText className="w-5 h-5" />
              <span>National Reports & Export</span>
            </NavLink>
            <NavLink to="/dashboard/donors" className={linkClass} onClick={handleLinkClick}>
              <Droplet className="w-5 h-5" />
              <span>National Donors Registry</span>
            </NavLink>
            <NavLink to="/dashboard/hospitals" className={linkClass} onClick={handleLinkClick}>
              <Building2 className="w-5 h-5" />
              <span>Hospitals Directory</span>
            </NavLink>
            <NavLink to="/dashboard/analysis" className={linkClass} onClick={handleLinkClick}>
              <BarChart3 className="w-5 h-5" />
              <span>Health Analytics</span>
            </NavLink>
            <NavLink to="/dashboard/activity" className={linkClass} onClick={handleLinkClick}>
              <Activity className="w-5 h-5" />
              <span>Activity Log</span>
            </NavLink>
            <NavLink to="/dashboard/profile" className={linkClass} onClick={handleLinkClick}>
              <UserCircle className="w-5 h-5" />
              <span>Institution Profile</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer System Info */}
      <div className="pt-4 mt-auto border-t border-line text-center">
        <p className="text-[11px] text-slate-400 font-medium">SOBDA BDMS v2.0</p>
        <p className="text-[10px] text-slate-500">Ministry of Health & Healthcare Partners</p>
      </div>
    </div>
  );
}

export default Sidebar;
