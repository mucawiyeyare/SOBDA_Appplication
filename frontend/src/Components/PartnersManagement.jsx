import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Handshake,
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Image as ImageIcon,
  X,
  EyeOff,
  Eye,
} from "lucide-react";
import ImageCropModal from "./ImageCropModal.jsx";

const emptyForm = { name: "", websiteUrl: "", logo: "" };

function PartnersManagement() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/partners", authHeaders);
      setPartners(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setEditingPartner(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setForm({ name: partner.name, websiteUrl: partner.websiteUrl, logo: partner.logo });
    setShowModal(true);
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Logo image is too large (max 10MB). Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64) => {
    setForm((f) => ({ ...f, logo: croppedBase64 }));
    setCropImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.websiteUrl.trim() || !form.logo) {
      alert("Please provide a name, website link, and logo.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingPartner) {
        await axios.put(`/api/admin/partners/${editingPartner._id}`, form, authHeaders);
      } else {
        await axios.post("/api/admin/partners", form, authHeaders);
      }
      setShowModal(false);
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save partner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (partner) => {
    try {
      await axios.put(`/api/admin/partners/${partner._id}`, { isActive: !partner.isActive }, authHeaders);
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update partner");
    }
  };

  const handleDelete = async (partner) => {
    if (!window.confirm(`Remove "${partner.name}" from partners? This can't be undone.`)) return;
    try {
      await axios.delete(`/api/admin/partners/${partner._id}`, authHeaders);
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete partner");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Handshake className="w-7 h-7 text-red-600" />
            Partners
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage the partner logos shown in the scrolling strip on the homepage. Each logo links
            out to that partner's website when clicked.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading partners...</div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      ) : partners.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No partners added yet. Click "Add Partner" to add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div
              key={partner._id}
              className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm ${
                partner.isActive ? "border-slate-200" : "border-slate-200 opacity-50"
              }`}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="w-14 h-14 rounded-full object-cover border border-slate-200 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-800 truncate">{partner.name}</p>
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 truncate"
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{partner.websiteUrl}</span>
                </a>
                {!partner.isActive && (
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase text-slate-400">Hidden</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openEditModal(partner)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                  aria-label="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(partner)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                  aria-label={partner.isActive ? "Hide from homepage" : "Show on homepage"}
                  title={partner.isActive ? "Hide from homepage" : "Show on homepage"}
                >
                  {partner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(partner)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">
                {editingPartner ? "Edit Partner" : "Add Partner"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoSelect}
                  accept="image/*"
                  className="hidden"
                  id="partner-logo-input"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-red-400 overflow-hidden bg-slate-50"
                >
                  {form.logo ? (
                    <img src={form.logo} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  {form.logo ? "Change Logo" : "Upload Logo"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Partner Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ministry of Health & Human Services"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Website Link *
                </label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://moh.gov.so"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Opens in a new tab when someone clicks this partner's logo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs"
                >
                  {submitting ? "Saving..." : editingPartner ? "Save Changes" : "Add Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCancel={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

export default PartnersManagement;
