import React, { useState, useEffect } from "react";
import {
  Users,
  Droplet,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  Building2,
  Clock,
  CheckCircle2,
  HeartHandshake,
  ArrowUpRight,
} from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";

function DashboardHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalHospitals: 0,
    totalDonations: 0,
    activeRequests: 0,
    bloodTypeCounts: {},
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      let totalUsers = 0;
      let totalDonors = 0;
      let totalHospitals = 0;
      let totalDonations = 0;
      let activeRequests = 0;
      let bloodTypeCounts = {};

      if (role === "admin" || role === "health_institution") {
        const statsRes = await axios.get("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        totalUsers = statsRes.data.totalUsers;
        totalDonors = statsRes.data.totalDonors;
        totalHospitals = statsRes.data.totalHospitals;
        totalDonations = statsRes.data.totalDonations;
        activeRequests = statsRes.data.activeRequests;
        bloodTypeCounts = statsRes.data.bloodTypeCounts || {};
      } else if (role === "hospital") {
        const donorsRes = await axios.get("/api/users/donors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        totalDonors = donorsRes.data.length;

        const reqRes = await axios.get("/api/requests/hospital", {
          headers: { Authorization: `Bearer ${token}` },
        });
        activeRequests = reqRes.data.filter((r) => r.status === "Pending" || r.status === "Arrived").length;
        totalDonations = reqRes.data.filter((r) => r.status === "Completed").length;

        // Blood distribution
        donorsRes.data.forEach((d) => {
          bloodTypeCounts[d.bloodType] = (bloodTypeCounts[d.bloodType] || 0) + 1;
        });
      }

      setStats({
        totalUsers,
        totalDonors,
        totalHospitals,
        totalDonations,
        activeRequests,
        bloodTypeCounts,
      });

      // Activity logs
      const activityResponse = await axios.get("/api/activity?limit=6", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(activityResponse.data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, linkTo }) => {
    const card = (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3.5 rounded-2xl bg-soft group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6 text-brand" />
          </div>
          {linkTo && <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mb-1">{value}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    );

    return linkTo ? <Link to={linkTo}>{card}</Link> : card;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading system statistics...</p>
        </div>
      </div>
    );
  }

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          Welcome to SOBDA Overview
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Real-time blood network metrics, emergency response counters, and system activity
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={Droplet}
          title="Registered Donors"
          value={stats.totalDonors}
          subtitle="Voluntary blood donors in directory"
          color="bg-red-600"
          linkTo="/dashboard/donors"
        />

        {userRole === "admin" && (
          <StatCard
            icon={Building2}
            title="Registered Hospitals"
            value={stats.totalHospitals}
            subtitle="Verified medical clinics"
            color="bg-sky-600"
            linkTo="/dashboard/hospitals"
          />
        )}

        <StatCard
          icon={Clock}
          title="Active Requests"
          value={stats.activeRequests}
          subtitle="2-hour arrival window active"
          color="bg-amber-500"
          linkTo={userRole === "hospital" ? "/dashboard/hospital-requests" : undefined}
        />

        <StatCard
          icon={CheckCircle2}
          title="Fulfilled Donations"
          value={stats.totalDonations}
          subtitle="Completed life-saving donations"
          color="bg-emerald-600"
          linkTo={userRole === "hospital" ? "/dashboard/hospital-history" : undefined}
        />
      </div>

      {/* 2-Column: Blood Inventory Matrix & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Blood Type Matrix */}
        <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-red-600" />
                <span>Donor Blood Type Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">Available registered donors by ABO/Rh group</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {bloodTypes.map((bt) => {
              const count = stats.bloodTypeCounts[bt] || 0;
              return (
                <div
                  key={bt}
                  className="bg-slate-50 hover:bg-red-50 p-4 rounded-xl border border-slate-200/80 text-center transition-colors group"
                >
                  <p className="text-lg font-black text-red-600 group-hover:scale-110 transition-transform">
                    {bt}
                  </p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{count}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Donors</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>
              <strong>O- Negative</strong> is the universal red blood cell donor group and critical for trauma emergencies.
            </span>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Recent System Activity</span>
              </h3>
              <p className="text-xs text-slate-500">Real-time audit log of donations, requests & users</p>
            </div>
            {userRole === "admin" && (
              <Link to="/dashboard/activity" className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline">
                View All
              </Link>
            )}
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No recent activity recorded.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act._id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{act.action}</p>
                    <p className="text-slate-500 truncate">{act.details || "System event"}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
