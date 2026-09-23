import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Droplet,
  Shield,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  History,
  Award,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Heart,
  Sparkles,
  Camera,
  Upload,
  Trash2,
  Trophy,
} from "lucide-react";
import SobdaLogo from "./SobdaLogo.jsx";
import ImageCropModal from "./ImageCropModal.jsx";
import NotificationDevices from "./NotificationDevices.jsx";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  // Donation history state
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);

  // Certificate modal
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Donor stats (lives saved)
  const [donorStats, setDonorStats] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchDonations();
    fetchDonorStats();
  }, []);

  const fetchDonorStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      if (!token || role !== "donor") return;
      const res = await axios.get("/api/requests/my-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonorStats(res.data);
    } catch (err) {
      // silently ignore if not a donor
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setMessage({ type: "error", text: "Selected photo is too large (max 25MB). Please choose a smaller image." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setMessage({ type: "error", text: "Failed to read image file from your device." });
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBase64) => {
    setUploadingImage(true);
    setMessage({ type: "", text: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "/api/users/profile",
        { profileImage: croppedBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data.user);
      setEditForm(res.data.user);
      setCropImageSrc(null);
      setMessage({ type: "success", text: "Profile photo arranged & updated successfully!" });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Failed to update profile photo";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    setUploadingImage(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "/api/users/profile",
        { profileImage: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(res.data.user);
      setEditForm(res.data.user);
      setMessage({ type: "success", text: "Profile photo removed." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove image" });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      const res = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(res.data);
      setEditForm(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      if (!token) return;

      setLoadingDonations(true);
      const url =
        role === "hospital"
          ? "/api/requests/hospital-donations"
          : "/api/requests/donor-donations";

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDonations(res.data);
    } catch (err) {
      console.error("Error fetching donation history:", err);
    } finally {
      setLoadingDonations(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm(profile);
    setMessage({ type: "", text: "" });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(profile);
    setMessage({ type: "", text: "" });
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put("/api/users/profile", editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(res.data.user);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "/api/users/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: "Password changed successfully!" });
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
            <User className="w-6 h-6" />
          </span>
          My Profile & Donation History
        </h1>
        <p className="text-sm text-slate-600 mt-1">Manage personal details and view donation certifications</p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {profile?.role === "donor" && (() => {
        const savedCount = donorStats ? donorStats.livesHelped : donations.length;
        return (
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-600/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white">
                <Heart className="w-8 h-8 fill-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-red-200 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Life-Saver Impact Dashboard</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  {savedCount === 1 ? "1 Person Saved! 🩸" : `${savedCount} People Saved! 🩸`}
                </h2>
                <p className="text-red-100 text-xs sm:text-sm mt-1 max-w-xl">
                  {savedCount === 1
                    ? "Incredible contribution! You saved 1 person with your life-saving donation. Keep saving lives!"
                    : savedCount > 1
                    ? `Incredible contribution! You saved ${savedCount} people across Somalia. Keep saving lives!`
                    : "Every blood donation you make directly saves lives across Somalia. Thank you for your generosity!"}
                </p>
              </div>
            </div>
            <div className="flex sm:flex-col items-center justify-center bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 text-center min-w-[130px]">
              <span className="text-3xl font-black text-white">{savedCount}</span>
              <span className="text-[11px] font-bold text-red-200 uppercase tracking-wider">
                {savedCount === 1 ? "Person Saved" : "People Saved"}
              </span>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Profile Photo Avatar with Edit Overlay */}
          <div className="relative group mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-black text-2xl">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile?.bloodType || <User className="w-10 h-10" />}</span>
              )}
            </div>

            {/* Camera Edit Trigger Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              title="Upload / Change profile photo"
              className="absolute bottom-0 right-0 p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md border-2 border-white transition-transform transform hover:scale-110 disabled:opacity-60"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              <span>{uploadingImage ? "Uploading..." : profile?.profileImage ? "Change Photo" : "Upload Photo"}</span>
            </button>
            {profile?.profileImage && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  onClick={handleRemoveImage}
                  disabled={uploadingImage}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
          <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            {profile?.role}
          </span>

          <div className="w-full mt-6 space-y-3 text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Government ID:</span>
              <span className="font-mono font-bold text-slate-800">{profile?.nationalId || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Blood Type:</span>
              <span className="font-black text-red-600">{profile?.bloodType || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Gender:</span>
              <span className="font-bold text-slate-800">{profile?.gender || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Age:</span>
              <span className="font-bold text-slate-800">{profile?.age ? `${profile.age} yrs` : "N/A"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Location:</span>
              <span className="font-bold text-slate-800 truncate max-w-[140px]">{profile?.location}</span>
            </div>
          </div>

          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="mt-6 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Lock className="w-4 h-4 text-slate-500" />
            <span>{showPasswordForm ? "Hide Password Form" : "Change Password"}</span>
          </button>
        </div>

        {/* Right Column: Editable Form / Password Change */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Account Details</h3>
              <p className="text-xs text-slate-500">Update your contact and regional information</p>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                name="name"
                value={isEditing ? editForm.name || "" : profile?.name || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Government ID</label>
              <input
                name="nationalId"
                value={isEditing ? editForm.nationalId || "" : profile?.nationalId || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                name="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Phone</label>
              <input
                name="phone"
                value={isEditing ? editForm.phone || "" : profile?.phone || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location</label>
              <input
                name="location"
                value={isEditing ? editForm.location || "" : profile?.location || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Type</label>
              <select
                name="bloodType"
                value={isEditing ? editForm.bloodType || "" : profile?.bloodType || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-red-600 disabled:bg-slate-100"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* 🏆 Hall of Heroes Leaderboard Visibility Setting (For Donors) */}
          {profile?.role === "donor" && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm mt-0.5">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Hall of Heroes Leaderboard Visibility</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Allow your name and donation rank to be publicly displayed on the homepage Top Heroes board.
                    </p>
                    <span className="inline-block mt-1 text-[11px] font-bold text-slate-700">
                      Current Setting:{" "}
                      <strong className={profile?.allowPublicLeaderboard !== false ? "text-emerald-700" : "text-slate-600"}>
                        {profile?.allowPublicLeaderboard !== false ? "⭐ Public (Visible on Leaderboard)" : "🔒 Private (Hidden from Leaderboard)"}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const nextVal = !(profile?.allowPublicLeaderboard !== false);
                    try {
                      const token = localStorage.getItem("token");
                      const res = await axios.put(
                        "/api/users/profile",
                        { allowPublicLeaderboard: nextVal },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      setProfile(res.data.user);
                      setMessage({
                        type: "success",
                        text: `Leaderboard visibility updated to: ${nextVal ? "Public ⭐" : "Private 🔒"}`,
                      });
                    } catch (err) {
                      setMessage({ type: "error", text: "Failed to update visibility setting." });
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                    profile?.allowPublicLeaderboard !== false
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  {profile?.allowPublicLeaderboard !== false ? (
                    <>
                      <span>Switch to Private 🔒</span>
                    </>
                  ) : (
                    <>
                      <span>Make Public ⭐</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Change Password Sub-form */}
          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-sm text-slate-800">Change Account Password</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Notification Devices Section */}
      <div className="mt-8">
        <NotificationDevices />
      </div>

      {/* 3. Donation History Section (donors only: hospitals and staff do not donate) */}
      {profile?.role === "donor" && (
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>Historical Donation Records</span>
            </h3>
            <p className="text-xs text-slate-500">Record of hospitals that received your blood donations</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            Total Donations: {donations.length}
          </span>
        </div>

        {donations.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500">No completed donations recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Hospital / Center</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Blood Type</th>
                  <th className="py-3 px-4">Volume</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {new Date(d.donationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      {d.hospitalId?.name || d.collectionCenter || "Hospital Clinic"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{d.hospitalId?.location || "Mogadishu"}</td>
                    <td className="py-3.5 px-4 font-black text-red-600">{d.bloodType || profile?.bloodType}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{d.volume || 450} ml</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Completed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCertificate(d)}
                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-xs flex items-center gap-1 ml-auto border border-red-200 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 text-red-600" />
                        <span>Certificate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Certificate Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 border-4 border-red-600/30 text-center relative overflow-hidden">
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Certificate Branding */}
            <div className="flex justify-center mb-4">
              <SobdaLogo size="md" />
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-widest mb-3">
              Official Certificate of Appreciation
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">Life Saver Award</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
              This certificate is proudly awarded to recognize voluntary blood donation and vital contribution to saving lives in Somalia.
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-2 mb-6 text-xs sm:text-sm">
              <p>
                <strong className="text-slate-800">Donor Name:</strong> {profile?.name}
              </p>
              <p>
                <strong className="text-slate-800">Government ID:</strong> {profile?.nationalId || "Verified"}
              </p>
              <p>
                <strong className="text-slate-800">Blood Type:</strong>{" "}
                <span className="font-bold text-red-600">{selectedCertificate.bloodType || profile?.bloodType}</span>
              </p>
              <p>
                <strong className="text-slate-800">Receiving Hospital:</strong>{" "}
                {selectedCertificate.hospitalId?.name || selectedCertificate.collectionCenter || "Hospital Clinic"}
              </p>
              <p>
                <strong className="text-slate-800">Date of Donation:</strong>{" "}
                {new Date(selectedCertificate.donationDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs text-slate-500">
              <div className="text-left">
                <p className="font-bold text-slate-800">SOBDA Network</p>
                <p className="text-[10px]">Ministry of Health & Healthcare Partners</p>
              </div>
              <button
                onClick={() => window.print()}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop & Arrange Modal */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          isSaving={uploadingImage}
          onCancel={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

export default Profile;
