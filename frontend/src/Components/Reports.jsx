import React, { useState, useEffect, useMemo } from "react";
import {
  FileText, Download, Calendar, Filter, Printer, Droplet, Building2, Users,
  CheckCircle2, Clock, Sparkles, AlertCircle, Search, ArrowUpRight, ShieldCheck,
  TrendingUp, Activity, RefreshCw, ChevronRight, Eye, Phone, MapPin, HeartHandshake,
  BarChart3, UserCheck, X, FileSpreadsheet, Layers, Check, Share2
} from "lucide-react";
import axios from "axios";
import SobdaLogo from "./SobdaLogo.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Reports() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | blood_groups | blood_group_detail | hospitals | matching | history
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Data States
  const [overviewData, setOverviewData] = useState(null);
  const [bloodGroupReports, setBloodGroupReports] = useState([]);
  const [hospitalReports, setHospitalReports] = useState([]);
  const [matchingReports, setMatchingReports] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);

  // Drill-down & Detail States
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("O+");
  const [bloodGroupDetail, setBloodGroupDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Selected Hospital for drill-down modal
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalDetailData, setHospitalDetailData] = useState(null);
  const [showHospitalModal, setShowHospitalModal] = useState(false);

  // Selected Donor for individual donor modal / print
  const [selectedDonorReport, setSelectedDonorReport] = useState(null);
  const [showDonorModal, setShowDonorModal] = useState(false);

  // Global & Local Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterDateRange, setFilterDateRange] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Print Mode State
  const [printableReport, setPrintableReport] = useState(null); // { type: 'blood_group' | 'donor' | 'hospital' | 'history', data: ... }

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role);
    fetchAllReportData();
  }, []);

  // When selectedBloodGroup changes in blood_group_detail tab
  useEffect(() => {
    if (activeTab === "blood_group_detail") {
      fetchBloodGroupDetail(selectedBloodGroup);
    }
  }, [selectedBloodGroup, activeTab, filterStatus, filterLocation]);

  // When date range or filters change in history tab
  useEffect(() => {
    if (activeTab === "history") {
      fetchDonationHistory();
    }
  }, [activeTab, filterDateRange, filterBloodGroup, customStartDate, customEndDate]);

  const fetchAllReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [overviewRes, bloodGroupsRes, hospitalsRes, matchingRes] = await Promise.all([
        axios.get("/api/reports/overview", config),
        axios.get("/api/reports/blood-groups", config),
        axios.get("/api/reports/hospitals", config),
        axios.get("/api/reports/matching", config),
      ]);

      setOverviewData(overviewRes.data);
      setBloodGroupReports(bloodGroupsRes.data);
      setHospitalReports(hospitalsRes.data);
      setMatchingReports(matchingRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllReportData();
    if (activeTab === "blood_group_detail") {
      await fetchBloodGroupDetail(selectedBloodGroup);
    } else if (activeTab === "history") {
      await fetchDonationHistory();
    }
    setRefreshing(false);
  };

  const fetchBloodGroupDetail = async (bloodType) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filterStatus !== "All") params.append("status", filterStatus);
      if (filterLocation !== "All") params.append("location", filterLocation);
      if (searchQuery) params.append("search", searchQuery);

      const res = await axios.get(`/api/reports/blood-groups/${encodeURIComponent(bloodType)}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBloodGroupDetail(res.data);
      setDetailLoading(false);
    } catch (err) {
      console.error("Error fetching blood group detail:", err);
      setDetailLoading(false);
    }
  };

  const fetchDonationHistory = async () => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("dateRange", filterDateRange);
      if (filterBloodGroup !== "All") params.append("bloodType", filterBloodGroup);
      if (filterDateRange === "custom" && customStartDate && customEndDate) {
        params.append("startDate", customStartDate);
        params.append("endDate", customEndDate);
      }
      if (searchQuery) params.append("search", searchQuery);

      const res = await axios.get(`/api/reports/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonationHistory(res.data.donations || []);
      setDetailLoading(false);
    } catch (err) {
      console.error("Error fetching donation history:", err);
      setDetailLoading(false);
    }
  };

  const openHospitalDetailModal = async (hospital) => {
    setSelectedHospital(hospital);
    setShowHospitalModal(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/reports/hospitals/${hospital.hospitalId || hospital._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHospitalDetailData(res.data);
    } catch (err) {
      console.error("Error fetching hospital detail:", err);
    }
  };

  const openIndividualDonorModal = async (donorId) => {
    setShowDonorModal(true);
    setSelectedDonorReport(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/reports/donor/${donorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedDonorReport(res.data);
    } catch (err) {
      console.error("Error fetching donor report:", err);
    }
  };

  // CSV Export Utility
  const exportToCSV = (data, filename = "sobda_report.csv") => {
    if (!data || data.length === 0) {
      alert("No records found to export.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    data.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header] === null || row[header] === undefined ? "" : row[header];
        const escaped = ("" + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = (reportConfig) => {
    setPrintableReport(reportConfig);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (loading && !overviewData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-14 h-14 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-700 text-base">Generating Blood Donation Reports...</p>
        <p className="text-xs text-slate-500 mt-1">Aggregating real-time donor, hospital, and emergency request data</p>
      </div>
    );
  }

  const summary = overviewData?.summary || {};
  const matrix = overviewData?.bloodGroupMatrix || [];
  const monthly = overviewData?.monthlyDonations || [];
  const activities = overviewData?.recentActivities || [];
  const patientsSaved = overviewData?.patientsSaved || [];

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      {/* ────────────────── Header & Actions ────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Blood Donation Reporting Module
                </h1>
                {userRole === "health_institution" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    Ministry / Health Institution Portal
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Comprehensive reporting connecting hospitals with blood donors • Real-time emergency analytics
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-red-600" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() =>
              handlePrint({
                type: "national_summary",
                title: "SOBDA — National Blood Donation Summary Report",
                summary,
                matrix,
                generatedAt: new Date().toLocaleString(),
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Master Report</span>
          </button>
        </div>
      </div>

      {/* ────────────────── System Rule Notice Banner ────────────────── */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-red-400">
              Donor Connection & Emergency Matching Architecture
            </p>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Reports reflect verified voluntary donors, hospital emergency requests, and successful donations. Zero inventory or warehouse stock.
            </p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Somalia National BDMS</span>
        </div>
      </div>

      {/* ────────────────── Main Navigation Tabs ────────────────── */}
      <div className="mb-6 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: "overview", label: "Overview Dashboard", icon: Activity },
          { id: "blood_groups", label: "All Blood Groups", icon: Droplet },
          { id: "blood_group_detail", label: "Specific Blood Group", icon: Filter },
          { id: "hospitals", label: "Hospital Reports", icon: Building2 },
          { id: "matching", label: "Donors Matched to Hospitals", icon: UserCheck },
          { id: "history", label: "Donation History", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: MAIN REPORT OVERVIEW DASHBOARD                                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-fade-in">
          {/* 10 Key Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Donors</span>
                <Users className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalDonors || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Voluntary registered network</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Available Donors</span>
                <CheckCircle2 className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.availableDonors || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Ready for immediate dispatch</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">In Cooldown (90d)</span>
                <Clock className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.cooldownDonors || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Protected safety period</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Hospitals</span>
                <Building2 className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalHospitals || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Verified medical facilities</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Requests</span>
                <Droplet className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalRequests || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Emergency blood calls</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Requests</span>
                <Clock className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.pendingRequests || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">2-hour arrival window</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Arrived Donors</span>
                <UserCheck className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.arrivedRequests || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Checked in at hospital</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Completed Donations</span>
                <CheckCircle2 className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.completedRequests || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Verified fulfilled transfers</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Cancelled / Expired</span>
                <AlertCircle className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-600">{summary.cancelledRequests || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Unfulfilled requests</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Patients Saved</span>
                <Sparkles className="w-4 h-4 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.patientsSaved || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Patients who received blood</p>
            </div>
          </div>

          {/* Patients saved: names */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand" />
                  Patients Saved ({patientsSaved.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Patients whose blood request was completed, with their hospital and donors</p>
              </div>
              <button
                onClick={() =>
                  exportToCSV(
                    patientsSaved.map((p) => ({
                      Patient: p.name,
                      Age: p.age,
                      Condition: p.diagnosis,
                      Hospital: p.hospital,
                      BloodType: p.bloodType,
                      Donors: p.donors,
                      Date: p.date ? new Date(p.date).toLocaleDateString() : "",
                    })),
                    "patients_saved.csv"
                  )
                }
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
            {patientsSaved.length === 0 ? (
              <p className="text-sm text-slate-500">No completed requests yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 text-xs font-black uppercase tracking-wider">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Hospital</th>
                      <th className="px-4 py-3">Blood</th>
                      <th className="px-4 py-3">Donors</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientsSaved.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {p.name}
                          {p.age ? <span className="ml-1 font-normal text-slate-500">({p.age} yrs)</span> : null}
                          {p.diagnosis ? <p className="text-xs font-normal text-slate-500">{p.diagnosis}</p> : null}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{p.hospital}</td>
                        <td className="px-4 py-3 font-bold text-brand">{p.bloodType}</td>
                        <td className="px-4 py-3 text-slate-700">{p.donors}</td>
                        <td className="px-4 py-3 text-slate-500">{p.date ? new Date(p.date).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Blood Group Matrix Statistics Bar */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  Blood Group Distribution Matrix
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Real-time donor counts, available responders, and completed donations across all 8 blood types
                </p>
              </div>

              <button
                onClick={() => exportToCSV(matrix, "blood_group_matrix.csv")}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Matrix CSV</span>
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 text-xs font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4 rounded-l-xl">Blood Group</th>
                    <th className="py-3.5 px-4 text-center">Total Donors</th>
                    <th className="py-3.5 px-4 text-center">Active Donors</th>
                    <th className="py-3.5 px-4 text-center">Available Donors</th>
                    <th className="py-3.5 px-4 text-center">Completed Donations</th>
                    <th className="py-3.5 px-4 text-center">Requesting Hospitals</th>
                    <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {matrix.map((row) => (
                    <tr key={row.bloodType} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-10 h-8 rounded-xl font-black text-sm bg-red-100 text-red-700 border border-red-200 shadow-sm">
                          {row.bloodType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{row.totalDonors}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{row.activeDonors}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                          {row.availableDonors} Available
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-black text-red-600">{row.totalDonations}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{row.requestingHospitalsCount}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedBloodGroup(row.bloodType);
                            setActiveTab("blood_group_detail");
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1"
                        >
                          <span>View Report</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Donation Timeline & Recent Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Visual */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-red-600" />
                Donation Activity (Past 6 Months)
              </h3>
              <div className="space-y-3.5">
                {monthly.map((m) => {
                  const maxVal = Math.max(...monthly.map((x) => x.donations), 1);
                  const pct = Math.round((m.donations / maxVal) * 100);
                  return (
                    <div key={m.month}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700">{m.month}</span>
                        <span className="text-red-600 font-black">{m.donations} donations</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-red-600" />
                Recent Blood Donation Activity
              </h3>
              <div className="divide-y divide-slate-100">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No recent activity records.</p>
                ) : (
                  activities.map((act, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="font-bold text-slate-800 leading-snug">{act.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {act.party} {act.bloodType ? `• Blood Group: ${act.bloodType}` : ""}{" "}
                            {act.urgency ? `• ${act.urgency}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: VIEW ALL BLOOD GROUPS (Cards Grid)                            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "blood_groups" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900">All Blood Groups Directory</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Overview of donor registration, active availability, and hospital demand for every blood group
              </p>
            </div>
            <button
              onClick={() =>
                handlePrint({
                  type: "all_blood_groups",
                  title: "All Blood Groups Summary Report",
                  data: bloodGroupReports,
                  generatedAt: new Date().toLocaleString(),
                })
              }
              className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All Groups</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bloodGroupReports.map((bg) => (
              <div
                key={bg.bloodType}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Accent Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-600"></div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-600/20">
                      {bg.bloodType}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                      {bg.availableDonors} Available
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Registered:</span>
                      <span className="font-bold text-slate-900">{bg.totalDonors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Donors:</span>
                      <span className="font-bold text-slate-800">{bg.activeDonors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Donations:</span>
                      <span className="font-black text-red-600">{bg.totalDonations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requesting Hospitals:</span>
                      <span className="font-bold text-slate-800">{bg.requestingHospitalsCount}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBloodGroup(bg.bloodType);
                    setActiveTab("blood_group_detail");
                  }}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>View {bg.bloodType} Detailed Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: SPECIFIC BLOOD GROUP REPORT                                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "blood_group_detail" && (
        <div className="space-y-6 animate-fade-in">
          {/* Blood Group Switcher Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-2">Select Blood Group:</span>
              {BLOOD_GROUPS.map((bt) => (
                <button
                  key={bt}
                  onClick={() => setSelectedBloodGroup(bt)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                    selectedBloodGroup === bt
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                handlePrint({
                  type: "specific_blood_group",
                  bloodType: selectedBloodGroup,
                  summary: bloodGroupDetail?.summary,
                  donors: bloodGroupDetail?.donors || [],
                  generatedAt: new Date().toLocaleString(),
                })
              }
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {selectedBloodGroup} Report</span>
            </button>
          </div>

          {/* Blood Group Summary Banner */}
          {bloodGroupDetail && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-700 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                    {selectedBloodGroup}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">{selectedBloodGroup} Blood Donor & Request Report</h2>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      National Registry Summary for {selectedBloodGroup}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(bloodGroupDetail.donors, `${selectedBloodGroup}_donors.csv`)}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export {selectedBloodGroup} CSV</span>
                  </button>
                </div>
              </div>

              {/* 5 Stats Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total Donors</p>
                  <p className="text-2xl font-black mt-1 text-white">{bloodGroupDetail.summary?.totalDonors || 0}</p>
                </div>
                <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-bold uppercase">Available Now</p>
                  <p className="text-2xl font-black mt-1 text-emerald-400">
                    {bloodGroupDetail.summary?.availableDonors || 0}
                  </p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total Donations</p>
                  <p className="text-2xl font-black mt-1 text-red-400">
                    {bloodGroupDetail.summary?.totalDonations || 0}
                  </p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total Requests</p>
                  <p className="text-2xl font-black mt-1 text-amber-400">
                    {bloodGroupDetail.summary?.totalRequests || 0}
                  </p>
                </div>
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-400 font-bold uppercase">Requesting Hospitals</p>
                  <p className="text-2xl font-black mt-1 text-indigo-400">
                    {bloodGroupDetail.summary?.requestingHospitalsCount || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search donor name, phone, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available Only</option>
                <option value="Donated">In Cooldown (Donated)</option>
              </select>

              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="All">All Locations</option>
                <option value="Mogadishu">Mogadishu</option>
                <option value="Hargeisa">Hargeisa</option>
                <option value="Garowe">Garowe</option>
                <option value="Kismayo">Kismayo</option>
                <option value="Baidoa">Baidoa</option>
              </select>
            </div>
          </div>

          {/* Donor Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-red-600" />
                <span>{selectedBloodGroup} Verified Voluntary Donors ({bloodGroupDetail?.donors?.length || 0})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Donor Name</th>
                    <th className="py-3 px-4">National ID</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Donations</th>
                    <th className="py-3 px-4 text-center">Registered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {detailLoading ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-xs text-slate-500">
                        Loading {selectedBloodGroup} donors...
                      </td>
                    </tr>
                  ) : !bloodGroupDetail?.donors || bloodGroupDetail.donors.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-xs text-slate-400">
                        No {selectedBloodGroup} donors found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    bloodGroupDetail.donors.map((donor) => (
                      <tr key={donor._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 text-sm leading-snug">{donor.name}</p>
                          <p className="text-[10px] text-slate-400">{donor.gender || "Donor"}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {donor.nationalId || "SOM-" + donor._id.substring(donor._id.length - 6).toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold font-mono">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{donor.phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{donor.location}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              donor.status === "Available"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {donor.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-red-600">
                          {donor.donationsCount || 0}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-500">
                          {new Date(donor.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openIndividualDonorModal(donor._id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                              title="View Individual Donor Report"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Report</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: HOSPITAL REPORTS                                               */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "hospitals" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900">Hospital Emergency Request Reports</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Hospital emergency requests, matched donor response rates, and fulfilled donations
              </p>
            </div>

            <button
              onClick={() => exportToCSV(hospitalReports, "hospital_reports.csv")}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Hospital Name</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-center">Total Requests</th>
                    <th className="py-3.5 px-4 text-center">Pending (2h)</th>
                    <th className="py-3.5 px-4 text-center">Arrived Donors</th>
                    <th className="py-3.5 px-4 text-center">Completed Donations</th>
                    <th className="py-3.5 px-4 text-center">Requested Blood Groups</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {hospitalReports.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-xs text-slate-400">
                        No hospital reports recorded.
                      </td>
                    </tr>
                  ) : (
                    hospitalReports.map((hosp) => (
                      <tr key={hosp.hospitalId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{hosp.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{hosp.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{hosp.location}</td>
                        <td className="py-3.5 px-4 text-center font-black text-slate-800">{hosp.totalRequests}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {hosp.pendingRequests}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {hosp.arrivedRequests || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-emerald-700">
                          {hosp.completedRequests}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap max-w-[160px] mx-auto">
                            {hosp.requestedBloodTypes?.map((bt) => (
                              <span key={bt} className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700">
                                {bt}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openHospitalDetailModal(hosp)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Full Report</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: DONORS MATCHED TO HOSPITALS                                   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "matching" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900">Hospital & Donor Matching Log</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Traceable emergency blood matches connecting hospitals and voluntary donors
              </p>
            </div>

            <button
              onClick={() => exportToCSV(matchingReports, "donor_hospital_matches.csv")}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Matches CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Donor Details</th>
                    <th className="py-3.5 px-4 text-center">Blood Group</th>
                    <th className="py-3.5 px-4">Hospital</th>
                    <th className="py-3.5 px-4">Patient / Reason</th>
                    <th className="py-3.5 px-4 text-center">Urgency</th>
                    <th className="py-3.5 px-4 text-center">Match Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {matchingReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-xs text-slate-400">
                        No donor matching records found.
                      </td>
                    </tr>
                  ) : (
                    matchingReports.map((m) => (
                      <tr key={m.matchId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 leading-snug">{m.donorName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{m.donorPhone || "N/A"}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-red-100 text-red-700">
                            {m.donorBloodType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 text-xs">{m.hospitalName}</p>
                          <p className="text-[10px] text-slate-500">{m.hospitalLocation}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{m.patientName}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                              m.urgency === "Emergency"
                                ? "bg-red-600 text-white"
                                : m.urgency === "Urgent"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {m.urgency}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                          {new Date(m.matchDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              m.matchStatus === "Completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : m.matchStatus === "Pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {m.matchStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: COMPLETE DONATION HISTORY REPORT                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Completed Donation History</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Verified records of all fulfilled blood donations across Somalia
              </p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "today", label: "Today" },
                { id: "this_week", label: "This Week" },
                { id: "this_month", label: "This Month" },
                { id: "last_month", label: "Last Month" },
                { id: "this_year", label: "This Year" },
                { id: "custom", label: "Custom Range" },
              ].map((dr) => (
                <button
                  key={dr.id}
                  onClick={() => setFilterDateRange(dr.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterDateRange === dr.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {dr.label}
                </button>
              ))}

              <button
                onClick={() => exportToCSV(donationHistory, "completed_donation_history.csv")}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ml-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Custom Date Inputs */}
          {filterDateRange === "custom" && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-xs font-bold">
              <span className="text-slate-500">From Date:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl outline-none"
              />
              <span className="text-slate-500">To Date:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          )}

          {/* Donations Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Donor Name</th>
                    <th className="py-3.5 px-4 text-center">Blood Group</th>
                    <th className="py-3.5 px-4">Hospital / Location</th>
                    <th className="py-3.5 px-4">Patient Information</th>
                    <th className="py-3.5 px-4 text-center">Donation Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {detailLoading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-xs text-slate-500">
                        Filtering donation history...
                      </td>
                    </tr>
                  ) : donationHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-xs text-slate-400">
                        No completed donation records found for this period.
                      </td>
                    </tr>
                  ) : (
                    donationHistory.map((dn) => (
                      <tr key={dn.donationId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 leading-snug">{dn.donorName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {dn.donationId.substring(dn.donationId.length - 8).toUpperCase()}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-red-100 text-red-700">
                            {dn.bloodGroup}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 text-xs">{dn.hospital}</p>
                          <p className="text-[10px] text-slate-500">{dn.hospitalLocation}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{dn.patientName}</td>
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                          {new Date(dn.donationDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Completed ✅
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: INDIVIDUAL DONOR REPORT                                       */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showDonorModal && selectedDonorReport && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDonorModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl font-bold"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                {selectedDonorReport.donor?.bloodType}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedDonorReport.donor?.name}</h3>
                <p className="text-xs text-slate-500">
                  Donor ID: {selectedDonorReport.donor?._id} • {selectedDonorReport.donor?.location}
                </p>
              </div>
            </div>

            {/* Profile Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">Total Donations</p>
                <p className="text-xl font-black text-red-600 mt-0.5">
                  {selectedDonorReport.summary?.totalDonations || 0}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">Current Status</p>
                <p className="text-xs font-black text-emerald-700 mt-1">
                  {selectedDonorReport.donor?.status}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">Connected Hospitals</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {selectedDonorReport.summary?.hospitalsConnectedCount || 0}
                </p>
              </div>
            </div>

            {/* Donation History List */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                Verified Donation History
              </h4>
              {selectedDonorReport.donationHistory?.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                  No previous donations recorded for this donor.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDonorReport.donationHistory?.map((dn) => (
                    <div
                      key={dn.donationId}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{dn.hospital}</p>
                        <p className="text-[11px] text-slate-500">{dn.hospitalLocation}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-emerald-700 font-bold">
                          {new Date(dn.donationDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDonorModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
              <button
                onClick={() =>
                  handlePrint({
                    type: "individual_donor",
                    donor: selectedDonorReport.donor,
                    summary: selectedDonorReport.summary,
                    history: selectedDonorReport.donationHistory || [],
                    generatedAt: new Date().toLocaleString(),
                  })
                }
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Donor Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: HOSPITAL DETAIL REPORT                                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {showHospitalModal && selectedHospital && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowHospitalModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl font-bold"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedHospital.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedHospital.location} • Phone: {selectedHospital.phone}
                </p>
              </div>
            </div>

            {/* Hospital Request Summary */}
            <div className="grid grid-cols-4 gap-3 text-center mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500">Total Requests</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{selectedHospital.totalRequests}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                <p className="text-[11px] font-bold text-amber-800">Pending</p>
                <p className="text-xl font-black text-amber-700 mt-0.5">{selectedHospital.pendingRequests}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                <p className="text-[11px] font-bold text-blue-800">Arrived</p>
                <p className="text-xl font-black text-blue-700 mt-0.5">{selectedHospital.arrivedRequests || 0}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <p className="text-[11px] font-bold text-emerald-800">Completed</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{selectedHospital.completedRequests}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowHospitalModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
              <button
                onClick={() =>
                  handlePrint({
                    type: "hospital_report",
                    hospital: selectedHospital,
                    generatedAt: new Date().toLocaleString(),
                  })
                }
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Hospital Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* HIDDEN PRINT VIEW CONTAINER (Triggered on window.print)             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {printableReport && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
          {/* Official Letterhead */}
          <div className="border-b-2 border-red-600 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-red-600 tracking-wide">SOBDA</h1>
              <p className="text-xs font-bold text-slate-600">Somalia National Blood Donation & Management Network</p>
              <p className="text-[11px] text-slate-500">Official Healthcare Reporting System (Mogadishu, Somalia)</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Report Date: {printableReport.generatedAt}</p>
              <p className="text-slate-500">Zero Inventory System • Donor & Hospital Matrix</p>
            </div>
          </div>

          <h2 className="text-lg font-black mb-4 uppercase">{printableReport.title || "Official System Report"}</h2>

          {/* National Summary Print */}
          {printableReport.type === "national_summary" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2 border p-3 rounded-lg mb-4">
                <div><strong>Registered Donors:</strong> {printableReport.summary?.totalDonors}</div>
                <div><strong>Available Donors:</strong> {printableReport.summary?.availableDonors}</div>
                <div><strong>Hospitals:</strong> {printableReport.summary?.totalHospitals}</div>
                <div><strong>Completed Donations:</strong> {printableReport.summary?.completedRequests}</div>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2">Blood Group</th>
                    <th className="border p-2 text-center">Total Donors</th>
                    <th className="border p-2 text-center">Active</th>
                    <th className="border p-2 text-center">Available</th>
                    <th className="border p-2 text-center">Completed Donations</th>
                    <th className="border p-2 text-center">Requesting Hospitals</th>
                  </tr>
                </thead>
                <tbody>
                  {printableReport.matrix?.map((row) => (
                    <tr key={row.bloodType}>
                      <td className="border p-2 font-bold">{row.bloodType}</td>
                      <td className="border p-2 text-center">{row.totalDonors}</td>
                      <td className="border p-2 text-center">{row.activeDonors}</td>
                      <td className="border p-2 text-center font-bold text-emerald-700">{row.availableDonors}</td>
                      <td className="border p-2 text-center font-bold text-red-600">{row.totalDonations}</td>
                      <td className="border p-2 text-center">{row.requestingHospitalsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Specific Blood Group Print */}
          {printableReport.type === "specific_blood_group" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2 border p-3 rounded-lg mb-4">
                <div><strong>Blood Group:</strong> {printableReport.bloodType}</div>
                <div><strong>Total Donors:</strong> {printableReport.summary?.totalDonors}</div>
                <div><strong>Available Donors:</strong> {printableReport.summary?.availableDonors}</div>
                <div><strong>Completed Donations:</strong> {printableReport.summary?.totalDonations}</div>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2">Donor Name</th>
                    <th className="border p-2">Phone</th>
                    <th className="border p-2">Location</th>
                    <th className="border p-2 text-center">Status</th>
                    <th className="border p-2 text-center">Donations Count</th>
                  </tr>
                </thead>
                <tbody>
                  {printableReport.donors?.map((d) => (
                    <tr key={d._id}>
                      <td className="border p-2 font-bold">{d.name}</td>
                      <td className="border p-2 font-mono">{d.phone}</td>
                      <td className="border p-2">{d.location}</td>
                      <td className="border p-2 text-center">{d.status}</td>
                      <td className="border p-2 text-center font-bold">{d.donationsCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer signature */}
          <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between text-[11px] text-slate-600">
            <div>
              <p>Generated by: <strong>SOBDA Reporting System</strong></p>
              <p>URL: https://sobda.org</p>
            </div>
            <div className="text-right">
              <p className="mt-4 border-t border-slate-400 pt-1 font-bold">Authorized Healthcare Official</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
