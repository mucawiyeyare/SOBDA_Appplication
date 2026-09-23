import React, { useEffect, useState } from "react";
import axios from "axios";
import RegionDistrictSelect from "./RegionDistrictSelect.jsx";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Save,
  CheckCircle2,
  Inbox,
  Award,
} from "lucide-react";

function HospitalManagement() {
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    hospitalLicense: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    location: "",
    hospitalLicense: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const [approvalFilter, setApprovalFilter] = useState("all"); // 'all' | 'pending' | 'approved'

  useEffect(() => {
    let result = hospitals;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(term) ||
          h.location.toLowerCase().includes(term) ||
          h.email.toLowerCase().includes(term) ||
          (h.hospitalLicense && h.hospitalLicense.toLowerCase().includes(term))
      );
    }
    if (approvalFilter === "pending") {
      result = result.filter((h) => h.isApproved === false);
    } else if (approvalFilter === "approved") {
      result = result.filter((h) => h.isApproved !== false);
    }
    setFilteredHospitals(result);
  }, [hospitals, searchTerm, approvalFilter]);

  const pendingHospitalsCount = hospitals.filter((h) => h.isApproved === false).length;
  const approvedHospitalsCount = hospitals.filter((h) => h.isApproved !== false).length;

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/hospitals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHospitals(res.data);
      setFilteredHospitals(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
      setError(err.response?.data?.message || "Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/admin/register-user",
        {
          ...addForm,
          role: "hospital",
          bloodType: "O+",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Hospital registered successfully!");
      setShowAddModal(false);
      setAddForm({ name: "", email: "", password: "", phone: "", location: "", hospitalLicense: "" });
      fetchHospitals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add hospital");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (hospital) => {
    setEditingHospital(hospital);
    setEditForm({
      name: hospital.name,
      phone: hospital.phone,
      location: hospital.location,
      hospitalLicense: hospital.hospitalLicense || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingHospital) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/update-user/${editingHospital._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Hospital updated successfully!");
      setShowEditModal(false);
      fetchHospitals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update hospital");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleApproval = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/api/admin/approve-hospital/${id}`,
        { isApproved: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || `Hospital ${newStatus ? "approved" : "suspended"} successfully!`);
      fetchHospitals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update approval status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete hospital "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/delete-user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Hospital deleted successfully");
      fetchHospitals();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete hospital");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading hospitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Building2 className="w-6 h-6" />
            </span>
            Hospital Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create, view, update, and manage verified healthcare facilities in Somalia
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hospital</span>
        </button>
      </div>

      {/* Search Bar & Approval Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by hospital name, location, license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Approval Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setApprovalFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              approvalFilter === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({hospitals.length})
          </button>
          <button
            onClick={() => setApprovalFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              approvalFilter === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-800 hover:bg-amber-50"
            }`}
          >
            <span>Pending Approval</span>
            {pendingHospitalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-800 text-[10px] font-black">
                {pendingHospitalsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setApprovalFilter("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              approvalFilter === "approved"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            Approved ({approvedHospitalsCount})
          </button>
        </div>
      </div>

      {/* Hospitals Grid */}
      {filteredHospitals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Hospitals Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Add a new hospital or adjust your search / approval filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital._id}
              className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border flex flex-col justify-between ${
                hospital.isApproved === false
                  ? "border-amber-300 ring-1 ring-amber-300/40 bg-amber-50/10"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {hospital.profileImage ? (
                      <img src={hospital.profileImage} alt={`${hospital.name} logo`} className="w-11 h-11 rounded-xl border border-slate-200 bg-white object-contain" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                        <Building2 className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{hospital.name}</h3>
                      <p className="text-xs text-slate-500">{hospital.email}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      hospital.isApproved === false
                        ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {hospital.isApproved === false ? "Pending ⏳" : "Approved ✅"}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="font-medium truncate">{hospital.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span className="font-medium">{hospital.phone}</span>
                  </div>
                  {hospital.hospitalLicense && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="font-medium">Lic: {hospital.hospitalLicense}</span>
                    </div>
                  )}
                </div>

                {/* Hospital Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                    <p className="text-xs font-bold text-amber-900">{hospital.activeRequests || 0}</p>
                    <p className="text-[10px] text-amber-700 font-semibold">Active Req</p>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-2 border border-sky-100">
                    <p className="text-xs font-bold text-sky-900">{hospital.totalRequests || 0}</p>
                    <p className="text-[10px] text-sky-700 font-semibold">Total Req</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-900">{hospital.completedDonations || 0}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">Donations</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                {hospital.isApproved === false ? (
                  <button
                    onClick={() => handleToggleApproval(hospital._id, false)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Hospital</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleApproval(hospital._id, true)}
                    className="py-2 px-3 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    title="Suspend Hospital Access"
                  >
                    <span>Suspend</span>
                  </button>
                )}

                <button
                  onClick={() => handleEditClick(hospital)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(hospital._id, hospital.name)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">Register New Hospital</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add verified medical facility to SOBDA network</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hospital / Clinic Name *</label>
                <input
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Mogadishu General Hospital"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address (Login) *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="hospital@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Password *</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Create secure password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                <input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+252 61 0000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Region, District & Road *</label>
                <RegionDistrictSelect withRoad required value={addForm.location} onChange={(location) => setAddForm({ ...addForm, location })} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ministry License / Registration #</label>
                <input
                  value={addForm.hospitalLicense}
                  onChange={(e) => setAddForm({ ...addForm, hospitalLicense: e.target.value })}
                  placeholder="e.g. MOH-HOSP-2026-90"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
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
                  {submitting ? "Saving..." : "Create Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hospital Modal */}
      {showEditModal && editingHospital && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit Hospital Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingHospital.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hospital Name *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location *</label>
                <RegionDistrictSelect withRoad required value={editForm.location} onChange={(location) => setEditForm({ ...editForm, location })} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">License #</label>
                <input
                  value={editForm.hospitalLicense}
                  onChange={(e) => setEditForm({ ...editForm, hospitalLicense: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
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
    </div>
  );
}

export default HospitalManagement;
