import React, { useEffect, useState } from "react";
import axios from "axios";
import RegionDistrictSelect from "./RegionDistrictSelect.jsx";
import { SOMALIA_REGIONS } from "../utils/somaliaLocations.js";
import {
  Search,
  Filter,
  MapPin,
  Droplet,
  X,
  Send,
  AlertCircle,
  Edit,
  Save,
  User as UserIcon,
  Phone,
  Mail,
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Building2,
  XCircle,
  MessageCircle,
  CheckSquare,
  Square,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  MessageSquare,
  Hospital,
  ChevronDown,
} from "lucide-react";
import WhatsAppConnectModal from "./WhatsAppConnectModal";

function Donors() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'list' (Table) or 'grid' (Cards)
  const [viewMode, setViewMode] = useState("list");

  // WhatsApp Gateway Modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppInfo, setWhatsAppInfo] = useState({ status: "disconnected" });

  // Lightbox modal for enlarged profile image
  const [lightboxImage, setLightboxImage] = useState(null);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBloodType, setSelectedBloodType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [userRole, setUserRole] = useState("");

  // Multi-select for Batch Request
  const [selectedDonorIds, setSelectedDonorIds] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchHospitalId, setBatchHospitalId] = useState("");
  const [batchUrgency, setBatchUrgency] = useState("Urgent");
  const [batchMessage, setBatchMessage] = useState(
    `Asc Wll,\n\nWaxaan kula soo xiriiraynaa Isbitaalka 🏥\n\n🩸 Waxaa loo baahan yahay dhiig-bixin degdeg ah si loogu caawiyo bukaan u baahan dhiig. ❤️\n\nFadlan haddii aad awooddo, booqo Isbitaalka si aad uga qeyb qaadato dhiig-bixinta.\n\nMahadsanid walaal.\nCaawintaadu waxay badbaadin kartaa nolol Allaha ka ajarsiyo. ❤️🩸\n\n— SOBDA System`
  );

  // Single Request Modal (with Patient Info & Hospital Selection)
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [pendingDonor, setPendingDonor] = useState(null);
  const [singleHospitalId, setSingleHospitalId] = useState("");
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    age: "",
    phone: "",
    diagnosis: "",
    causeOfInjury: "",
    notes: "",
    urgency: "Urgent",
  });

  // Admin Management Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);

  const [addForm, setAddForm] = useState({
    nationalId: "",
    name: "",
    gender: "Male",
    phone: "",
    location: "",
    bloodType: "O+",
    email: "",
    password: "",
    age: "",
  });

  const [editForm, setEditForm] = useState({
    nationalId: "",
    name: "",
    gender: "Male",
    phone: "",
    location: "",
    bloodType: "",
    age: "",
    isAvailable: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Clear toast automatically
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await axios.get("/api/whatsapp/status");
      setWhatsAppInfo(res.data);
    } catch (e) {}
  };

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("/api/admin/hospitals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHospitals(res.data || []);
      if (res.data && res.data.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(res.data[0]._id);
        setSingleHospitalId(res.data[0]._id);
        setBatchHospitalId(res.data[0]._id);
      }
    } catch (e) {
      console.error("Error fetching hospitals:", e);
    }
  };

  const fetchDonors = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
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

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role);
    fetchDonors();
    fetchHospitals();
    fetchWhatsAppStatus();
  }, []);

  useEffect(() => {
    let list = [...donors];

    if (searchName) {
      const term = searchName.toLowerCase();
      list = list.filter(
        (d) =>
          d.name?.toLowerCase().includes(term) ||
          d.email?.toLowerCase().includes(term) ||
          d.phone?.includes(term) ||
          (d.nationalId && d.nationalId.toLowerCase().includes(term))
      );
    }
    if (selectedRegion || selectedDistrict) {
      list = list.filter((d) => {
        const loc = (d.location || "").toLowerCase();
        return (!selectedRegion || loc.includes(selectedRegion.toLowerCase())) && (!selectedDistrict || loc.includes(selectedDistrict.toLowerCase()));
      });
    }
    if (selectedBloodType) {
      list = list.filter((d) => d.bloodType === selectedBloodType);
    }
    if (selectedStatus) {
      list = list.filter((d) => d.status?.toLowerCase() === selectedStatus.toLowerCase());
    }
    if (selectedGender) {
      list = list.filter((d) => d.gender === selectedGender);
    }

    setFilteredDonors(list);
  }, [donors, searchName, selectedRegion, selectedDistrict, selectedBloodType, selectedStatus, selectedGender]);

  // Multi-select helpers
  const handleSelectDonor = (id) => {
    setSelectedDonorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const available = filteredDonors.filter((d) => d.status === "Available");
    if (selectedDonorIds.length === available.length && available.length > 0) {
      setSelectedDonorIds([]);
    } else {
      setSelectedDonorIds(available.map((d) => d._id));
    }
  };

  // Open single request modal
  const openSingleRequestModal = (donor) => {
    if (!donor || donor.status !== "Available") return;
    setPendingDonor(donor);
    setSingleHospitalId(selectedHospitalId || (hospitals[0]?._id || ""));
    setPatientInfo({
      name: "",
      age: "",
      phone: "",
      diagnosis: "",
      causeOfInjury: "",
      notes: "",
      urgency: "Urgent",
    });
    setShowPatientModal(true);
  };

  // Submit single request
  const handleSendSingleRequest = async (e) => {
    e.preventDefault();
    if (!pendingDonor) return;

    setSubmitting(true);
    setActionLoadingId(pendingDonor._id);

    try {
      const token = localStorage.getItem("token");
      const chosenHospital = hospitals.find((h) => h._id === singleHospitalId);
      const hospitalName = chosenHospital?.name || "Isbitaalka";
      const hospitalLoc = chosenHospital?.location || "Mogadishu";

      let dynamicMsg = `Asc Wll ${pendingDonor.name},\n\nWaxaan kula soo xiriiraynaa *${hospitalName}* 🏥\n\n🩸 *Waxaa loo baahan yahay dhiig-bixin degdeg ah!*`;
      if (patientInfo.name) {
        dynamicMsg += `\n\n📋 *Macluumaadka Bukaanka:*\n👤 Magac: ${patientInfo.name}`;
        if (patientInfo.age) dynamicMsg += `\n🎂 Da': ${patientInfo.age} sano`;
        if (patientInfo.phone) dynamicMsg += `\n📞 Tel: ${patientInfo.phone}`;
        if (patientInfo.diagnosis) dynamicMsg += `\n🩺 Xaaladda: ${patientInfo.diagnosis}`;
        if (patientInfo.causeOfInjury) dynamicMsg += `\n⚠️ Sababta: ${patientInfo.causeOfInjury}`;
      }
      dynamicMsg += `\n\nFadlan haddii aad awooddo, kaalay *${hospitalName}*\n📍 Goobta: ${hospitalLoc}\n\nMahadsanid walaal ${pendingDonor.name}.\nCaawintaadu waxay badbaadin kartaa nolol Allaha ka ajarsiyo. ❤️🩸\n\n— *SOBDA System*`;

      await axios.post(
        "/api/requests/create",
        {
          donorId: pendingDonor._id,
          hospitalId: singleHospitalId || undefined,
          bloodType: pendingDonor.bloodType,
          urgency: patientInfo.urgency || "Urgent",
          message: dynamicMsg,
          patientInfo,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToastMessage({
        type: "success",
        title: "Codsigii Waa La Diray (Request Sent)",
        description: `Fariinta dhiig-bixinta waxaa loo diray ${pendingDonor.name} (${pendingDonor.phone}) isbitaalka: ${hospitalName}. 2-saac ayaa bilaabatay.`,
      });

      setShowPatientModal(false);
      setPendingDonor(null);
      fetchDonors();
    } catch (err) {
      console.error("Error creating request:", err);
      setToastMessage({
        type: "warning",
        title: "Digniin / Ogaysiis",
        description: err.response?.data?.message || "Codsiga lama diri karin xilligan.",
      });
    } finally {
      setSubmitting(false);
      setActionLoadingId(null);
    }
  };

  // Submit batch request
  const handleSendBatchRequest = async (e) => {
    e.preventDefault();
    if (selectedDonorIds.length === 0) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const chosenHospital = hospitals.find((h) => h._id === batchHospitalId);
      const hospitalName = chosenHospital?.name || "Isbitaalka";

      const res = await axios.post(
        "/api/requests/batch-create",
        {
          donorIds: selectedDonorIds,
          hospitalId: batchHospitalId || undefined,
          urgency: batchUrgency,
          message: batchMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToastMessage({
        type: "success",
        title: "Codsiyada Waa La Diray (Batch Sent)",
        description: `Waxaa si guul leh loo diray ${res.data.count || selectedDonorIds.length} codsi oo loogu talagalay ${hospitalName}.`,
      });

      setSelectedDonorIds([]);
      setShowBatchModal(false);
      fetchDonors();
    } catch (err) {
      console.error("Batch request error:", err);
      setToastMessage({
        type: "warning",
        title: "Khalad / Error",
        description: err.response?.data?.message || "Khalad ayaa dhacay xilliga dirista codsiyada.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Create Donor
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/admin/register-user",
        {
          ...addForm,
          role: "donor",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToastMessage({
        type: "success",
        title: "Deeq-Bixiye Cusub Waa La Abuuray",
        description: `Deeq-bixiyaha ${addForm.name} si guul leh ayaa loogu diiwaangeliyey nidaamka.`,
      });
      setShowAddModal(false);
      setAddForm({
        nationalId: "",
        name: "",
        gender: "Male",
        phone: "",
        location: "",
        bloodType: "O+",
        email: "",
        password: "",
        age: "",
      });
      fetchDonors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add donor");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Edit Donor
  const handleEditClick = (donor) => {
    setEditingDonor(donor);
    setEditForm({
      nationalId: donor.nationalId || "",
      name: donor.name,
      gender: donor.gender || "Male",
      phone: donor.phone,
      location: donor.location,
      bloodType: donor.bloodType,
      age: donor.age || "",
      isAvailable: donor.isAvailable !== false,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/update-user/${editingDonor._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToastMessage({
        type: "success",
        title: "Profile-ka Waa La Cusboonaysiiyey",
        description: `Xogta ${editForm.name} si guul leh ayaa loo keydiyey.`,
      });
      setShowEditModal(false);
      fetchDonors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update donor");
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Delete Donor
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete donor "${name}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/delete-user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setToastMessage({
        type: "success",
        title: "Waa La Tiray (Deleted)",
        description: `Deeq-bixiyaha ${name} waa laga saaray nidaamka.`,
      });
      fetchDonors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete donor");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Available":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Available
          </span>
        );
      case "Pending":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending (2h)
          </span>
        );
      case "Arrived":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            Arrived
          </span>
        );
      case "Donated":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
            <Droplet className="w-3.5 h-3.5 text-red-600" />
            In Cooldown
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
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
          <p className="text-slate-600 font-semibold">Loading donors database...</p>
        </div>
      </div>
    );
  }

  const availableCount = filteredDonors.filter((d) => d.status === "Available").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
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

      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-start gap-3 shadow-lg border animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">{toastMessage.title}</h4>
            <p className="text-xs mt-0.5 opacity-90">{toastMessage.description}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Droplet className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Donor Directory & Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Manage voluntary blood donors, view profile photos, and dispatch requests on behalf of hospitals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* WhatsApp Bot Connection Status Pill */}
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
              whatsAppInfo.status === "connected"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
            title="Configure Automatic WhatsApp Sender Bot"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                whatsAppInfo.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>
              Bot: {whatsAppInfo.status === "connected" ? "Online (616408886)" : "Connect WhatsApp"}
            </span>
          </button>

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              title="Table / List View"
            >
              <ListIcon className="w-4 h-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
              title="Cards / Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </button>
          </div>

          {/* Batch Request Button */}
          {selectedDonorIds.length > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 transition-all animate-bounce-short"
            >
              <Send className="w-4 h-4" />
              <span>Send Batch ({selectedDonorIds.length})</span>
            </button>
          )}

          {/* Admin Add New Donor Button */}
          {userRole === "admin" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Donor</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Hospital Selection Toolbar */}
      {userRole === "admin" && hospitals.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 mb-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-xl">
              <Hospital className="w-5 h-5 text-red-400" />
            </span>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Admin Request Dispatcher
              </p>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Dispatch requests on behalf of a Registered Hospital:
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-[280px]">
            <label className="text-xs font-bold text-slate-300 flex-shrink-0">Target Hospital:</label>
            <select
              value={selectedHospitalId}
              onChange={(e) => {
                setSelectedHospitalId(e.target.value);
                setSingleHospitalId(e.target.value);
                setBatchHospitalId(e.target.value);
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            >
              {hospitals.map((h) => (
                <option key={h._id} value={h._id} className="bg-slate-900 text-white">
                  🏥 {h.name} ({h.location || "Mogadishu"})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Search Term */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search donor name, ID, phone..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Blood Type */}
          <select
            value={selectedBloodType}
            onChange={(e) => setSelectedBloodType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500 font-semibold"
          >
            <option value="">All Blood Types</option>
            {bloodTypes.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>

          {/* Region */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedDistrict("");
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Regions</option>
            {Object.keys(SOMALIA_REGIONS).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* District (depends on region) */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedRegion}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500 disabled:opacity-60"
          >
            <option value="">{selectedRegion ? "All Districts" : "Choose region first"}</option>
            {(SOMALIA_REGIONS[selectedRegion] || []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Pending">Pending (2h)</option>
            <option value="Arrived">Arrived</option>
            <option value="Donated">In Cooldown</option>
            <option value="Unavailable">Unavailable</option>
          </select>

          {/* Gender */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-red-600"
            >
              {selectedDonorIds.length > 0 && selectedDonorIds.length === availableCount ? (
                <CheckSquare className="w-4 h-4 text-red-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All Available ({availableCount})</span>
            </button>
            <span>•</span>
            <span>
              Showing <strong className="text-slate-900">{filteredDonors.length}</strong> of{" "}
              <strong>{donors.length}</strong> donors
            </span>
          </div>

          {(searchName || selectedRegion || selectedDistrict || selectedBloodType || selectedStatus || selectedGender) && (
            <button
              onClick={() => {
                setSearchName("");
                setSelectedRegion("");
                setSelectedDistrict("");
                setSelectedBloodType("");
                setSelectedStatus("");
                setSelectedGender("");
              }}
              className="text-red-600 hover:text-red-700 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Donors List/Grid Views */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Donors Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">Try adjusting your search criteria or filters.</p>
        </div>
      ) : viewMode === "list" ? (
        /* TABLE / LIST VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedDonorIds.length > 0 && selectedDonorIds.length === availableCount}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Donor Profile</th>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Phone / Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDonors.map((donor) => {
                  const isSelected = selectedDonorIds.includes(donor._id);
                  const isAvailable = donor.status === "Available";
                  const isLoadingThis = actionLoadingId === donor._id;

                  return (
                    <tr
                      key={donor._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          disabled={!isAvailable}
                          checked={isSelected}
                          onChange={() => handleSelectDonor(donor._id)}
                          className={`w-4 h-4 rounded text-red-600 focus:ring-red-500 ${
                            isAvailable ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Profile Image with Lightbox Trigger */}
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
                            className={`w-10 h-10 rounded-xl overflow-hidden bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200 flex-shrink-0 ${
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
                              <span>{donor.name?.charAt(0)?.toUpperCase() || "D"}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{donor.name}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>ID: {donor.nationalId || "N/A"}</span>
                              {donor.gender && <span>• {donor.gender}</span>}
                              {donor.age && <span>• {donor.age} yrs</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-xs shadow-sm">
                          {donor.bloodType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">{donor.phone}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{donor.email}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          {donor.location}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {getStatusBadge(donor.status)}
                          {donor.status === "Donated" && donor.cooldownEndsAt && (
                            <p className="text-[10px] text-red-600 font-semibold mt-1">
                              Eligible: {new Date(donor.cooldownEndsAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Request Button */}
                          <button
                            onClick={() => openSingleRequestModal(donor)}
                            disabled={!isAvailable || isLoadingThis}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                              isAvailable && !isLoadingThis
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                            title={isAvailable ? "Send donation request to donor" : "Donor unavailable"}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isLoadingThis ? "Sending..." : "Send Request"}</span>
                          </button>

                          {/* Admin Edit */}
                          {userRole === "admin" && (
                            <button
                              onClick={() => handleEditClick(donor)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Donor"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin Delete */}
                          {userRole === "admin" && (
                            <button
                              onClick={() => handleDelete(donor._id, donor.name)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Donor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS / GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonors.map((donor) => {
            const isSelected = selectedDonorIds.includes(donor._id);
            const isAvailable = donor.status === "Available";
            const isLoadingThis = actionLoadingId === donor._id;

            return (
              <div
                key={donor._id}
                className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border flex flex-col justify-between ${
                  isSelected ? "border-red-400 ring-2 ring-red-400/20 bg-red-50/20" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar with Clickable Lightbox */}
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
                        className={`w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0 ${
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

                    <input
                      type="checkbox"
                      disabled={!isAvailable}
                      checked={isSelected}
                      onChange={() => handleSelectDonor(donor._id)}
                      className={`w-5 h-5 rounded text-red-600 focus:ring-red-500 mt-1 ${
                        isAvailable ? "cursor-pointer" : "opacity-30 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="font-medium truncate">{donor.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                      <span className="font-medium">{donor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium truncate">{donor.email}</span>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    {getStatusBadge(donor.status)}
                    {donor.status === "Donated" && donor.cooldownEndsAt && (
                      <span className="text-[10px] text-red-600 font-semibold">
                        Eligible: {new Date(donor.cooldownEndsAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                  {/* Send Request Button */}
                  <button
                    onClick={() => openSingleRequestModal(donor)}
                    disabled={!isAvailable || isLoadingThis}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                      isAvailable && !isLoadingThis
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isLoadingThis ? "Sending Request..." : "Send Request"}</span>
                  </button>

                  {/* Admin Edit / Delete Actions */}
                  {userRole === "admin" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(donor)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(donor._id, donor.name)}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SINGLE REQUEST / PATIENT DETAILS MODAL */}
      {showPatientModal && pendingDonor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-red-600" />
                  Send Donation Request
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  To: <strong className="text-slate-800">{pendingDonor.name}</strong> ({pendingDonor.bloodType} • {pendingDonor.phone})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPatientModal(false);
                  setPendingDonor(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendSingleRequest} className="space-y-3.5">
              {/* Target Hospital Selector for Admin */}
              {userRole === "admin" && hospitals.length > 0 && (
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-3">
                  <label className="block text-xs font-black text-red-900 uppercase mb-1">
                    Select Requesting Hospital *
                  </label>
                  <select
                    value={singleHospitalId}
                    onChange={(e) => setSingleHospitalId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-red-500"
                    required
                  >
                    {hospitals.map((h) => (
                      <option key={h._id} value={h._id}>
                        🏥 {h.name} – {h.location || "Mogadishu"} ({h.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Patient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientInfo.name}
                    onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                    placeholder="e.g. Maryam Ali"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Age</label>
                  <input
                    type="number"
                    value={patientInfo.age}
                    onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                    placeholder="e.g. 32"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Diagnosis / Condition</label>
                  <input
                    type="text"
                    value={patientInfo.diagnosis}
                    onChange={(e) => setPatientInfo({ ...patientInfo, diagnosis: e.target.value })}
                    placeholder="e.g. Anemia, Surgery, Trauma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Urgency Level</label>
                  <select
                    value={patientInfo.urgency}
                    onChange={(e) => setPatientInfo({ ...patientInfo, urgency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Urgent">🔴 Urgent (Immediate)</option>
                    <option value="Routine">🔵 Routine (Scheduled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cause of Injury / Notes</label>
                <input
                  type="text"
                  value={patientInfo.causeOfInjury}
                  onChange={(e) => setPatientInfo({ ...patientInfo, causeOfInjury: e.target.value })}
                  placeholder="e.g. Car accident / Emergency C-Section"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Automatic Action:</p>
                <p className="mt-0.5">
                  Clicking "Dispatch Request" will start a 2-hour arrival window for this donor and automatically send a formal WhatsApp notice from the system bot (`616408886`).
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPatientModal(false);
                    setPendingDonor(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/30"
                >
                  {submitting ? "Dispatching..." : "Dispatch Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH REQUEST MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-red-600" />
                  Send Batch Request
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sending to <strong className="text-red-600">{selectedDonorIds.length}</strong> selected donors
                </p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendBatchRequest} className="space-y-3.5">
              {/* Target Hospital Selector */}
              {userRole === "admin" && hospitals.length > 0 && (
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-3">
                  <label className="block text-xs font-black text-red-900 uppercase mb-1">
                    Select Requesting Hospital *
                  </label>
                  <select
                    value={batchHospitalId}
                    onChange={(e) => setBatchHospitalId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-red-500"
                    required
                  >
                    {hospitals.map((h) => (
                      <option key={h._id} value={h._id}>
                        🏥 {h.name} – {h.location || "Mogadishu"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Urgency Level</label>
                <select
                  value={batchUrgency}
                  onChange={(e) => setBatchUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                >
                  <option value="Urgent">🔴 Urgent (Degdeg ah)</option>
                  <option value="Routine">🔵 Routine (Caadi ah)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Custom Notice Message</label>
                <textarea
                  rows={4}
                  value={batchMessage}
                  onChange={(e) => setBatchMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex gap-3 pt-3">
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/30"
                >
                  {submitting ? "Sending Batch..." : `Dispatch All (${selectedDonorIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD DONOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">Add New Donor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Admin registration for blood donor</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Government ID *</label>
                <input
                  value={addForm.nationalId}
                  onChange={(e) => setAddForm({ ...addForm, nationalId: e.target.value })}
                  placeholder="e.g. SOM-998811"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender *</label>
                <select
                  value={addForm.gender}
                  onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Donor full name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Phone *</label>
                <input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+252 61 0000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Type *</label>
                <select
                  value={addForm.bloodType}
                  onChange={(e) => setAddForm({ ...addForm, bloodType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                  required
                >
                  {bloodTypes.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location *</label>
                <RegionDistrictSelect value={addForm.location} onChange={(location) => setAddForm({ ...addForm, location })} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age</label>
                <input
                  type="number"
                  value={addForm.age}
                  onChange={(e) => setAddForm({ ...addForm, age: e.target.value })}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="donor@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Create password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="sm:col-span-2 flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {submitting ? "Creating..." : "Create Donor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN EDIT DONOR MODAL */}
      {showEditModal && editingDonor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit Donor Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingDonor.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Government ID</label>
                <input
                  value={editForm.nationalId}
                  onChange={(e) => setEditForm({ ...editForm, nationalId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Phone *</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location *</label>
                <RegionDistrictSelect value={editForm.location} onChange={(location) => setEditForm({ ...editForm, location })} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Type</label>
                <select
                  value={editForm.bloodType}
                  onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                >
                  {bloodTypes.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age</label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="avail_edit"
                  checked={editForm.isAvailable}
                  onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded cursor-pointer"
                />
                <label htmlFor="avail_edit" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Donor is Available
                </label>
              </div>

              <div className="sm:col-span-2 flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP BOT CONNECT MODAL */}
      <WhatsAppConnectModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false);
          fetchWhatsAppStatus();
        }}
      />
    </div>
  );
}

export default Donors;
