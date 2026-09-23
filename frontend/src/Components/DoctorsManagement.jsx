import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Stethoscope,
  Plus,
  Trash2,
  Pencil,
  Image as ImageIcon,
  X,
  EyeOff,
  Eye,
  KeyRound,
  MessageCircle,
} from "lucide-react";
import ImageCropModal from "./ImageCropModal.jsx";
import DoctorCard from "./DoctorCard.jsx";
import { SOCIAL_LINKS } from "../utils/doctorStyle.js";

const emptyForm = {
  name: "",
  specialty: "",
  title: "",
  bio: "",
  photo: "",
  highlights: ["", "", ""],
  facebook: "",
  linkedin: "",
  twitter: "",
  email: "",
  password: "",
  phone: "",
};

const inputClass = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500";
const labelClass = "block text-xs font-bold text-slate-700 uppercase mb-1";

function DoctorsManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/doctors", authHeaders);
      setDoctors(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setEditingDoctor(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (doctor) => {
    const h = doctor.highlights || [];
    setEditingDoctor(doctor);
    setForm({
      name: doctor.name,
      specialty: doctor.specialty,
      title: doctor.title || "",
      bio: doctor.bio || "",
      photo: doctor.photo || "",
      highlights: [h[0] || "", h[1] || "", h[2] || ""],
      facebook: doctor.socials?.facebook || "",
      linkedin: doctor.socials?.linkedin || "",
      twitter: doctor.socials?.twitter || "",
      email: doctor.user?.email || "",
      password: "",
      phone: "",
    });
    setShowModal(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Photo is too large (max 10MB). Please choose a smaller image.");
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
    setForm((f) => ({ ...f, photo: croppedBase64 }));
    setCropImageSrc(null);
  };

  const hasLogin = Boolean(editingDoctor?.user);

  const setHighlight = (index, value) =>
    setForm((f) => ({ ...f, highlights: f.highlights.map((h, i) => (i === index ? value : h)) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.specialty.trim()) {
      alert("Please provide the doctor's name and specialty.");
      return;
    }

    const account = {};
    if (form.email.trim()) account.email = form.email.trim();
    if (form.password) account.password = form.password;
    if (form.phone.trim() && !hasLogin) account.phone = form.phone.trim();

    if (!hasLogin && account.email && !account.password) {
      alert("Please set a password for the doctor's login (at least 6 characters).");
      return;
    }
    if (account.password && account.password.length < 6) {
      alert("The password must be at least 6 characters.");
      return;
    }

    const payload = {
      name: form.name,
      specialty: form.specialty,
      title: form.title,
      bio: form.bio,
      photo: form.photo,
      highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
      socials: { facebook: form.facebook, linkedin: form.linkedin, twitter: form.twitter },
    };
    if (Object.keys(account).length) payload.account = account;

    setSubmitting(true);
    try {
      if (editingDoctor) {
        await axios.put(`/api/admin/doctors/${editingDoctor._id}`, payload, authHeaders);
      } else {
        await axios.post("/api/admin/doctors", payload, authHeaders);
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save doctor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (doctor) => {
    try {
      await axios.put(`/api/admin/doctors/${doctor._id}`, { isActive: !doctor.isActive }, authHeaders);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update doctor");
    }
  };

  const handleDelete = async (doctor) => {
    const extra = doctor.user ? " Their login account and all their conversations with donors will be deleted too." : "";
    if (!window.confirm(`Remove "${doctor.name}" from doctors?${extra} This can't be undone.`)) return;
    try {
      await axios.delete(`/api/admin/doctors/${doctor._id}`, authHeaders);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete doctor");
    }
  };

  const actionButton = "p-1.5 rounded-lg text-slate-400";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-red-600" />
            Doctors
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cards below look exactly like they do on the website. Add the details and links here, and give a
            doctor a login so they can answer donors' questions inside SOBDA.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Doctor
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading doctors...</div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No doctors added yet. Click "Add Doctor" to add the first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="flex flex-col gap-2">
              <div className="flex-1 [&>article]:h-full">
                <DoctorCard
                  doctor={{ ...doctor, canChat: Boolean(doctor.user) }}
                  preview
                  dimmed={!doctor.isActive}
                  adminActions={
                    <>
                      <button onClick={() => openEditModal(doctor)} className={`${actionButton} hover:text-sky-600 hover:bg-sky-50`} aria-label="Edit" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(doctor)}
                        className={`${actionButton} hover:text-amber-600 hover:bg-amber-50`}
                        aria-label={doctor.isActive ? "Hide from website" : "Show on website"}
                        title={doctor.isActive ? "Hide from website" : "Show on website"}
                      >
                        {doctor.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(doctor)} className={`${actionButton} hover:text-red-600 hover:bg-red-50`} aria-label="Delete" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  }
                />
              </div>
              <div className="rounded-xl border border-line bg-white px-4 py-2 text-xs">
                {doctor.user ? (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Can chat · login {doctor.user.email}</span>
                  </span>
                ) : (
                  <span className="text-slate-500">No login yet, so donors cannot chat with this doctor.</span>
                )}
                {!doctor.isActive && <span className="ml-2 font-bold uppercase text-slate-400">Hidden on website</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-800">
                {editingDoctor ? "Edit Doctor" : "Add Doctor"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-red-400 overflow-hidden bg-slate-50"
                >
                  {form.photo ? (
                    <img src={form.photo} alt="Doctor preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                  )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-red-600 hover:underline">
                  {form.photo ? "Change Photo" : "Upload Photo (optional)"}
                </button>
              </div>

              <div>
                <label className={labelClass}>Doctor Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ubax Farax" className={inputClass} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Specialty (badge) *</label>
                  <input type="text" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="e.g. Hematology" className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Title under the name</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hematologist" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows="3"
                  placeholder="A few lines about the doctor and their experience"
                  className={inputClass}
                />
              </div>

              {/* Highlights */}
              <div>
                <label className={labelClass}>Highlights (up to 3 lines with icons)</label>
                <div className="space-y-2">
                  {form.highlights.map((value, i) => (
                    <input
                      key={i}
                      type="text"
                      value={value}
                      maxLength={60}
                      onChange={(e) => setHighlight(i, e.target.value)}
                      placeholder={["e.g. 10+ Years Experience", "e.g. Specialized in Blood Disorders", "e.g. Trusted by Thousands"][i]}
                      className={inputClass}
                    />
                  ))}
                </div>
              </div>

              {/* Social links */}
              <div>
                <label className={labelClass}>Social media links (optional)</label>
                <div className="space-y-2">
                  {SOCIAL_LINKS.map(({ key, label, Icon }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600" title={label}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={`${label} link, e.g. https://…`}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Only links you fill in appear on the doctor's card.</p>
              </div>

              {/* Login account */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <KeyRound className="w-4 h-4 text-sky-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-sky-900 uppercase">
                      {hasLogin ? "Doctor login" : "Doctor login (optional)"}
                    </p>
                    <p className="text-[11px] text-sky-800/80 mt-0.5">
                      {hasLogin
                        ? "This doctor can sign in and answer donors. Change the email, or set a new password."
                        : "With a login the doctor can sign in, read donors' questions and answer them inside SOBDA. Leave empty for a website profile only."}
                    </p>
                  </div>
                </div>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Login email" autoComplete="off" className={`${inputClass} bg-white`} />
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={hasLogin ? "New password (leave empty to keep)" : "Password (min 6 characters)"}
                  autoComplete="new-password"
                  className={`${inputClass} bg-white`}
                />
                {!hasLogin && (
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className={`${inputClass} bg-white`} />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs">
                  {submitting ? "Saving..." : editingDoctor ? "Save Changes" : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <ImageCropModal shape="rect" imageSrc={cropImageSrc} onCancel={() => setCropImageSrc(null)} onCropComplete={handleCropComplete} />
      )}
    </div>
  );
}

export default DoctorsManagement;
