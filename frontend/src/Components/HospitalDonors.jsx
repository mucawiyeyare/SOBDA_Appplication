import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Droplet,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Send,
  Users,
  CheckSquare,
  Square,
  Building2,
  LayoutGrid,
  List as ListIcon,
  X,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import WhatsAppConnectModal from "./WhatsAppConnectModal";

function HospitalDonors() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WhatsApp Gateway Modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppInfo, setWhatsAppInfo] = useState({ status: "disconnected" });

  // View Mode: 'list' or 'grid'
  const [viewMode, setViewMode] = useState("list");

  // Filters
  const [filterBloodType, setFilterBloodType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterStatus, setFilterStatus] = useState("Available");
  const [filterGender, setFilterGender] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Multi-select state for Batch Request
  const [selectedDonorIds, setSelectedDonorIds] = useState([]);

  // Batch Request Modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchUrgency, setBatchUrgency] = useState("Urgent");
  const [batchMessage, setBatchMessage] = useState(
    `Asc Wll,\n\nWaxaan kula soo xiriiraynaa Isbitaalka 🏥\n\n🩸 Waxaa loo baahan yahay dhiig-bixin degdeg ah si loogu caawiyo bukaan u baahan dhiig. ❤️\n\nFadlan haddii aad awooddo, booqo Isbitaalka si aad uga qeyb qaadato dhiig-bixinta.\n\nMahadsanid walaal.\nCaawintaadu waxay badbaadin kartaa nolol Allaha ka ajarsiyo. ❤️🩸\n\n— SOBDA System`
  );

  // Patient Info Modal state (single request)
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [pendingDonor, setPendingDonor] = useState(null);
  const [patientInfo, setPatientInfo] = useState({
    name: "", age: "", phone: "", diagnosis: "", causeOfInjury: "", notes: "", urgency: "Urgent",
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Lightbox modal for enlarged profile image
  const [lightboxImage, setLightboxImage] = useState(null);

  // Toast / notification banner
  const [toastMessage, setToastMessage] = useState(null);

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await axios.get("/api/whatsapp/status");
      setWhatsAppInfo(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDonors();
    fetchWhatsAppStatus();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [donors, filterBloodType, filterLocation, filterStatus, filterGender, searchTerm]);

  // Auto clear toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchDonors = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login.");
        setLoading(false);
        return;
      }

      const res = await axios.get("/api/users/donors", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDonors(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching donors:", err);
      setError(err.response?.data?.message || "Failed to load donors");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...donors];

    if (filterBloodType) {
      filtered = filtered.filter((d) => d.bloodType === filterBloodType);
    }
    if (filterLocation) {
      filtered = filtered.filter((d) => d.location.toLowerCase().includes(filterLocation.toLowerCase()));
    }
    if (filterStatus) {
      filtered = filtered.filter((d) => d.status.toLowerCase() === filterStatus.toLowerCase());
    }
    if (filterGender) {
      filtered = filtered.filter((d) => d.gender === filterGender);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.location.toLowerCase().includes(term) ||
          (d.nationalId && d.nationalId.toLowerCase().includes(term)) ||
          d.phone.includes(term)
      );
    }

    setFilteredDonors(filtered);
  };

  // Format phone number for Somalia WhatsApp (e.g. 616408886 -> 252616408886)
  const formatPhoneForWhatsApp = (rawPhone) => {
    if (!rawPhone) return "";
    let cleaned = rawPhone.toString().replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "252" + cleaned.substring(1);
    } else if (!cleaned.startsWith("252") && cleaned.length <= 9) {
      cleaned = "252" + cleaned;
    }
    return cleaned;
  };

  // Open Patient Info Modal instead of sending directly
  const handleDirectSendRequest = (donor) => {
    if (!donor || donor.status !== "Available") return;
    setPendingDonor(donor);
    setPatientInfo({ name: "", age: "", phone: "", diagnosis: "", causeOfInjury: "", notes: "", urgency: "Urgent" });
    setShowPatientModal(true);
  };

  // Submit patient info and send the actual request
  const handleSubmitPatientRequest = async (e) => {
    e.preventDefault();
    if (!pendingDonor) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/requests/create",
        {
          donorId: pendingDonor._id,
          bloodType: pendingDonor.bloodType,
          urgency: patientInfo.urgency || "Urgent",
          patientInfo: {
            name: patientInfo.name,
            age: patientInfo.age ? Number(patientInfo.age) : undefined,
            phone: patientInfo.phone,
            diagnosis: patientInfo.diagnosis,
            causeOfInjury: patientInfo.causeOfInjury,
            notes: patientInfo.notes,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowPatientModal(false);
      setPendingDonor(null);
      const carrier = res.data.sms?.carrier || "Network";
      setToastMessage({
        type: "success",
        title: "Request Dispatched ✅",
        description: `Blood request sent to ${pendingDonor.name} via WhatsApp & In-System Notification.`,
      });
      fetchDonors();
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      let friendlyMsg;
      if (!err.response) {
        friendlyMsg = "Server unreachable. Check your connection and try again.";
      } else if (serverMsg?.toLowerCase().includes("cooldown")) {
        friendlyMsg = `${pendingDonor?.name} recently donated and is in a 90-day cooldown period.`;
      } else if (serverMsg?.toLowerCase().includes("active")) {
        friendlyMsg = `${pendingDonor?.name} already has an active pending request.`;
      } else if (serverMsg?.toLowerCase().includes("not found")) {
        friendlyMsg = `Donor not found or is no longer registered.`;
      } else {
        friendlyMsg = serverMsg || `Could not send request to ${pendingDonor?.name}. Please try again.`;
      }
      setToastMessage({
        type: "warning",
        title: "Request Failed",
        description: friendlyMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle selection for batch requests
  const toggleSelectDonor = (donorId) => {
    if (selectedDonorIds.includes(donorId)) {
      setSelectedDonorIds(selectedDonorIds.filter((id) => id !== donorId));
    } else {
      setSelectedDonorIds([...selectedDonorIds, donorId]);
    }
  };

  const selectAllFiltered = () => {
    const eligibleIds = filteredDonors.filter((d) => d.status === "Available").map((d) => d._id);
    setSelectedDonorIds(eligibleIds);
  };

  const clearSelection = () => {
    setSelectedDonorIds([]);
  };

  // Batch Request Submit
  const handleBatchRequestSubmit = async (e) => {
    e.preventDefault();
    if (selectedDonorIds.length === 0) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/requests/create-batch",
        {
          donorIds: selectedDonorIds,
          bloodType: filterBloodType || undefined,
          urgency: batchUrgency,
          message: batchMessage || "Asc wll waxa laga raba in add dhiiig shubto",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToastMessage({
        type: "success",
        title: "Batch Request Dispatched",
        description: `Successfully sent requests to ${res.data.createdCount} donors with 2-hour arrival windows.`,
      });

      setShowBatchModal(false);
      setSelectedDonorIds([]);
      fetchDonors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create batch requests");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Available":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Available
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending (2h Window)
          </span>
        );
      case "Arrived":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            Arrived at Clinic
          </span>
        );
      case "Donated":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
            <Droplet className="w-3.5 h-3.5 text-red-600" />
            In Cooldown
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading registered blood donors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-md p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all ${
            toastMessage.type === "success"
              ? "bg-white border-emerald-200 text-emerald-950 shadow-emerald-600/10"
              : "bg-white border-amber-200 text-amber-950 shadow-amber-600/10"
          }`}
        >
          <div
            className={`p-2 rounded-xl flex-shrink-0 ${
              toastMessage.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">{toastMessage.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5">{toastMessage.description}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Droplet className="w-6 h-6" />
            </span>
            Available Donors
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse registered donors, send requests, and automatically connect via WhatsApp
          </p>
        </div>

        {/* View Mode Switcher & Batch Action & WhatsApp Gateway */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* WhatsApp Gateway Status Button */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              whatsAppInfo.status === "connected"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 animate-pulse"
            }`}
            title="Configure Automatic WhatsApp Sender Bot (616408886)"
          >
            <MessageSquare className={`w-4 h-4 ${whatsAppInfo.status === "connected" ? "text-emerald-600" : "text-amber-600"}`} />
            <span>
              {whatsAppInfo.status === "connected"
                ? `WhatsApp Bot Active (${whatsAppInfo.connectedNumber || "616408886"})`
                : "Link WhatsApp (616408886)"}
            </span>
          </button>

          {/* View Toggle Buttons */}
          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Card View</span>
            </button>
          </div>

          {/* Batch action trigger button */}
          {selectedDonorIds.length > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-red-600/30 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Request {selectedDonorIds.length} Selected</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Filter className="w-4 h-4 text-red-600" />
            <span>Filter Donors</span>
          </div>
          {(filterBloodType || filterLocation || filterGender || filterStatus !== "Available" || searchTerm) && (
            <button
              onClick={() => {
                setFilterBloodType("");
                setFilterLocation("");
                setFilterStatus("Available");
                setFilterGender("");
                setSearchTerm("");
              }}
              className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Search Term */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
          </div>

          {/* Blood Type */}
          <select
            value={filterBloodType}
            onChange={(e) => setFilterBloodType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500 font-semibold text-slate-700"
          >
            <option value="">All Blood Types</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O- (Universal)</option>
          </select>

          {/* Location */}
          <input
            type="text"
            placeholder="Filter location (e.g. Hodan)..."
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
          />

          {/* Donor Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
          >
            <option value="Available">Available Only</option>
            <option value="Pending">Pending (Requested)</option>
            <option value="Arrived">Arrived at Clinic</option>
            <option value="Donated">In Cooldown</option>
            <option value="">All Statuses</option>
          </select>

          {/* Gender */}
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Selection summary bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900">{filteredDonors.length}</strong> matching donors
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={selectAllFiltered}
              className="text-sky-600 hover:text-sky-700 font-bold hover:underline flex items-center gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Select All Available ({filteredDonors.filter((d) => d.status === "Available").length})
            </button>
            {selectedDonorIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-slate-500 hover:text-slate-700 font-bold hover:underline"
              >
                Clear Selected ({selectedDonorIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Donor List / Grid Display */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Donors Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search criteria, blood type, or location filters.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW / TABLE DESIGN */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4 w-10 text-center">Select</th>
                  <th className="py-3.5 px-4">Donor Information</th>
                  <th className="py-3.5 px-4 text-center">Blood Group</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Phone / WhatsApp</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {filteredDonors.map((donor) => {
                  const isSelected = selectedDonorIds.includes(donor._id);
                  const isAvailable = donor.status === "Available";
                  const isProcessing = actionLoadingId === donor._id;

                  return (
                    <tr
                      key={donor._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-red-50/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        {isAvailable ? (
                          <button
                            onClick={() => toggleSelectDonor(donor._id)}
                            className="text-slate-400 hover:text-red-600 transition-colors inline-block"
                            title="Select donor"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-red-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300">•</span>
                        )}
                      </td>

                      {/* Donor Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => {
                              if (donor.profileImage) {
                                setLightboxImage({
                                  src: donor.profileImage,
                                  name: donor.name,
                                  bloodType: donor.bloodType,
                                  location: donor.location,
                                });
                              }
                            }}
                            className={`w-10 h-10 rounded-xl overflow-hidden bg-slate-100 text-slate-700 font-black flex items-center justify-center text-xs flex-shrink-0 border border-slate-200 ${
                              donor.profileImage
                                ? "cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-sm ring-2 ring-red-500/20"
                                : ""
                            }`}
                            title={donor.profileImage ? "Click to view photo" : ""}
                          >
                            {donor.profileImage ? (
                              <img
                                src={donor.profileImage}
                                alt={donor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>
                                {donor.name
                                  ? donor.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .substring(0, 2)
                                      .toUpperCase()
                                  : "D"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-snug">{donor.name}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>ID: {donor.nationalId || "N/A"}</span>
                              {donor.gender && <span>• {donor.gender}</span>}
                              {donor.age && <span>• {donor.age} yrs</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs shadow-sm shadow-red-600/20">
                          {donor.bloodType}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{donor.location || "Mogadishu"}</span>
                        </div>
                      </td>

                      {/* Phone / WhatsApp */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{donor.phone}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">{getStatusBadge(donor.status)}</td>

                      {/* Single Unified 'Send Request' Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDirectSendRequest(donor)}
                          disabled={!isAvailable || isProcessing}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all ${
                            isAvailable
                              ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-red-600/20 hover:shadow-md cursor-pointer"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          }`}
                          title={
                            isAvailable
                              ? "Send Request & Automatically Open WhatsApp (Asc wll waxa laga raba in add dhiiig shubto)"
                              : "Donor is not available right now"
                          }
                        >
                          <Send className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                          <span>{isProcessing ? "Sending..." : isAvailable ? "Send Request" : donor.status}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonors.map((donor) => {
            const isSelected = selectedDonorIds.includes(donor._id);
            const isAvailable = donor.status === "Available";
            const isProcessing = actionLoadingId === donor._id;

            return (
              <div
                key={donor._id}
                className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border relative flex flex-col justify-between ${
                  isSelected ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20" : "border-slate-200"
                }`}
              >
                {/* Checkbox for batch select */}
                {isAvailable && (
                  <button
                    onClick={() => toggleSelectDonor(donor._id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-600 transition-colors"
                    title="Select for batch request"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-red-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}

                <div>
                  {/* Donor Header */}
                  <div className="flex items-start gap-3.5 mb-4 pr-7">
                    <div
                      onClick={() => {
                        if (donor.profileImage) {
                          setLightboxImage({
                            src: donor.profileImage,
                            name: donor.name,
                            bloodType: donor.bloodType,
                            location: donor.location,
                          });
                        }
                      }}
                      className={`w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0 ${
                        donor.profileImage
                          ? "cursor-pointer hover:opacity-90 hover:scale-105 transition-all ring-2 ring-red-500/30"
                          : ""
                      }`}
                      title={donor.profileImage ? "Click to view photo" : ""}
                    >
                      {donor.profileImage ? (
                        <img
                          src={donor.profileImage}
                          alt={donor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{donor.bloodType}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-base leading-snug">{donor.name}</h3>
                        {donor.profileImage && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                            {donor.bloodType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>ID: {donor.nationalId || "N/A"}</span>
                        {donor.gender && <span>• {donor.gender}</span>}
                        {donor.age && <span>• {donor.age} yrs</span>}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="font-medium truncate">{donor.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-medium font-mono">{donor.phone}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4 flex items-center justify-between">
                    {getStatusBadge(donor.status)}
                    {donor.status === "Donated" && donor.cooldownEndsAt && (
                      <span className="text-[10px] text-red-600 font-semibold">
                        Eligible: {new Date(donor.cooldownEndsAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Unified Single Action Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleDirectSendRequest(donor)}
                    disabled={!isAvailable || isProcessing}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isAvailable
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md shadow-red-600/20 cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    }`}
                  >
                    <Send className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                    <span>
                      {isProcessing
                        ? "Dispatching Request..."
                        : isAvailable
                        ? "Send Request"
                        : `Status: ${donor.status}`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Batch Multi-Donor Request */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">Dispatch Batch Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sending request to <strong>{selectedDonorIds.length}</strong> selected donors
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-xl p-3.5 mb-4 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong className="block font-bold mb-1">Batch 2-Hour Window:</strong>
              All selected donors will receive this emergency request. Once any donor completes donation, remaining requests can be resolved.
            </div>

            <form onSubmit={handleBatchRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Urgency Level *</label>
                <select
                  value={batchUrgency}
                  onChange={(e) => setBatchUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500"
                >
                  <option value="Emergency">🚨 Emergency (Immediate Need)</option>
                  <option value="Urgent">⚡ Urgent (Within 2 Hours)</option>
                  <option value="Routine">📋 Routine (Scheduled Need)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Message Template</label>
                <textarea
                  value={batchMessage}
                  onChange={(e) => setBatchMessage(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Users className="w-3.5 h-3.5" />
                  {submitting ? "Dispatching..." : `Send to ${selectedDonorIds.length} Donors`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Connect & Pairing Modal */}
      <WhatsAppConnectModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onStatusChange={(status) => setWhatsAppInfo(status)}
      />

      {/* Patient Info Modal */}
      {showPatientModal && pendingDonor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-white font-black text-lg">🩸 Blood Request Details</h2>
                <p className="text-red-200 text-xs mt-0.5">Sending request to <strong className="text-white">{pendingDonor.name}</strong> — {pendingDonor.bloodType}</p>
              </div>
              <button onClick={() => setShowPatientModal(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPatientRequest} className="p-6 space-y-4">
              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Urgency Level <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {["Routine", "Urgent", "Emergency"].map((u) => (
                    <button key={u} type="button"
                      onClick={() => setPatientInfo(p => ({ ...p, urgency: u }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        patientInfo.urgency === u
                          ? u === "Emergency" ? "bg-red-600 text-white border-red-600"
                          : u === "Urgent" ? "bg-amber-500 text-white border-amber-500"
                          : "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >{u}</button>
                  ))}
                </div>
              </div>

              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Patient Full Name <span className="text-red-500">*</span></label>
                <input required value={patientInfo.name}
                  onChange={e => setPatientInfo(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Fatuma Mohamed Ali"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none" />
              </div>

              {/* Age + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Patient Age</label>
                  <input type="number" min="0" max="120" value={patientInfo.age}
                    onChange={e => setPatientInfo(p => ({ ...p, age: e.target.value }))}
                    placeholder="e.g. 34"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Patient Phone</label>
                  <input value={patientInfo.phone}
                    onChange={e => setPatientInfo(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 0612345678"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Diagnosis / Injury Type <span className="text-red-500">*</span></label>
                <input required value={patientInfo.diagnosis}
                  onChange={e => setPatientInfo(p => ({ ...p, diagnosis: e.target.value }))}
                  placeholder="e.g. Road accident, Surgery, Anemia..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none" />
              </div>

              {/* Cause of Injury */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Cause of Injury</label>
                <input value={patientInfo.causeOfInjury}
                  onChange={e => setPatientInfo(p => ({ ...p, causeOfInjury: e.target.value }))}
                  placeholder="e.g. Car accident on Afgooye road"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Additional Notes</label>
                <textarea value={patientInfo.notes} rows={2}
                  onChange={e => setPatientInfo(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any extra information for the donor..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPatientModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all disabled:opacity-60">
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending..." : "Send Blood Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Overlay for Enlarged Donor Profile Photos */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-sm w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-red-50 hover:text-red-600 shadow-xl text-xl font-bold z-10"
              title="Close"
            >
              ×
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.name}
                className="w-full h-auto max-h-[70vh] object-cover"
              />
            </div>
            <div className="text-center mt-3 text-white">
              <p className="font-black text-lg tracking-wide drop-shadow">{lightboxImage.name}</p>
              {lightboxImage.bloodType && (
                <p className="text-xs text-red-300 font-semibold mt-0.5">
                  Blood Group: {lightboxImage.bloodType} {lightboxImage.location ? `• ${lightboxImage.location}` : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalDonors;
