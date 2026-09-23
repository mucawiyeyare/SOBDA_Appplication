import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ShieldCheck,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  Droplet,
  ArrowRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import SobdaLogo from "./SobdaLogo.jsx";
import { SOMALIA_REGIONS } from "../utils/somaliaLocations.js";
import { validateFullName } from "../utils/nameValidator.js";
import GlobalPhoneInput from "./GlobalPhoneInput.jsx";

function DonorRegistrationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    nationalId: "",
    gender: "Male",
    name: "",
    email: "",
    password: "",
    carrierCode: "+252 61",
    carrierName: "Hormuud",
    phone: "",
    region: "",
    district: "",
    bloodType: "O+",
    age: "",
    allowPublicLeaderboard: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenModal = () => {
      setErrorMessage("");
      setNameError("");
      setSuccessMessage("");
    };
    window.addEventListener("open-donor-register", handleOpenModal);
    return () => window.removeEventListener("open-donor-register", handleOpenModal);
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const parsed = parseSomaliPhone(value, formData.carrierCode);
      setFormData(prev => ({
        ...prev,
        phone: parsed.subscriberNumber,
        carrierCode: parsed.carrierCode,
        carrierName: parsed.carrierName,
      }));
      return;
    }

    if (name === "carrierSelect") {
      const selected = SOMALI_CARRIERS.find(c => c.code === value) || SOMALI_CARRIERS[0];
      setFormData(prev => ({
        ...prev,
        carrierCode: selected.code,
        carrierName: selected.name,
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "name") {
      const nameCheck = validateFullName(value);
      setNameError(value ? nameCheck.error : "");
    }
  };

  const handleRegionChange = (e) => {
    const region = e.target.value;
    setFormData({
      ...formData,
      region,
      district: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameCheck = validateFullName(formData.name);
    if (!nameCheck.isValid) {
      setNameError(nameCheck.error);
      setErrorMessage(nameCheck.error);
      return;
    }
    if (!formData.region) {
      setErrorMessage("Please select your region.");
      return;
    }
    if (!formData.district) {
      setErrorMessage("Please select your district.");
      return;
    }
    setErrorMessage("");
    setNameError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const formattedPhone = `${formData.carrierCode} ${formData.phone}`.trim();
      const payload = {
        ...formData,
        phone: formattedPhone,
        location: `${formData.district}, ${formData.region}`,
      };
      const res = await axios.post("/api/users/register", payload);
      setSuccessMessage(res.data.message || "Registration successful! Welcome to SOBDA.");
      setTimeout(() => {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("role", "donor");
          window.location.href = "/dashboard/profile";
        } else {
          onClose();
          navigate("/signin");
        }
      }, 1200);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 transform transition-all">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-rose-500 to-red-600"></div>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-50 text-red-600">
              <HeartHandshake className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">Become a Blood Donor</h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  Free & Voluntary
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Register in less than a minute to save lives during hospital emergencies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 pt-4">
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Government / National ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Government / National ID *
              </label>
              <input
                type="text"
                name="nationalId"
                required
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="e.g. SOM-987654"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ahmed Mohamed Ali"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:ring-2 transition-all ${
                  nameError
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                    : "border-slate-200 focus:ring-red-500 focus:border-transparent"
                }`}
              />
              {nameError && (
                <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Blood Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Blood Type *
              </label>
              <select
                name="bloodType"
                required
                value={formData.bloodType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-red-600 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => (
                  <option key={bt} value={bt}>
                    {bt} {bt === "O-" ? "(Universal Donor)" : bt === "AB+" ? "(Universal Recipient)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gender *
              </label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Phone (WhatsApp capable with Global Country Selector) */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Phone Number *
              </label>
              <GlobalPhoneInput
                value={formData.phone}
                countryCode="SO"
                onChange={({ dialCode, phone }) => {
                  setFormData((prev) => ({
                    ...prev,
                    phone,
                    carrierCode: dialCode,
                  }));
                }}
                placeholder="615000000 or 0771007272"
                required
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Region *
              </label>
              <select
                name="region"
                required
                value={formData.region}
                onChange={handleRegionChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Select region</option>
                {Object.keys(SOMALIA_REGIONS).map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                District *
              </label>
              <select
                name="district"
                required
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.region}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:bg-slate-100/80 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.region ? "Select district" : "Choose region first"}
                </option>
                {formData.region && SOMALIA_REGIONS[formData.region]?.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Age (16+ years) *
              </label>
              <input
                type="number"
                name="age"
                required
                min="16"
                max="65"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 24"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ahmed@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Create Password *
              </label>
              <input
                type="password"
                name="password"
                required
                minLength="6"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 🏆 Hall of Heroes Leaderboard Visibility Preference */}
            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm mt-0.5">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider mb-0.5">
                    Hall of Heroes Visibility *
                  </label>
                  <p className="text-[11px] text-slate-600 mb-2 leading-tight">
                    Do you allow your profile to appear on the public <strong>Top Blood Heroes</strong> leaderboard on the homepage?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, allowPublicLeaderboard: true }))}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                        formData.allowPublicLeaderboard !== false
                          ? "bg-white border-amber-500 ring-2 ring-amber-500/20 text-slate-900 shadow-sm"
                          : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          formData.allowPublicLeaderboard !== false ? "border-amber-600 bg-amber-600" : "border-slate-300"
                        }`}
                      >
                        {formData.allowPublicLeaderboard !== false && (
                          <span className="w-1 h-1 rounded-full bg-white"></span>
                        )}
                      </div>
                      <div>
                        <span className="block text-slate-900 font-bold text-[11px]">⭐ Yes, Show in Top Heroes</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, allowPublicLeaderboard: false }))}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                        formData.allowPublicLeaderboard === false
                          ? "bg-white border-slate-700 ring-2 ring-slate-700/20 text-slate-900 shadow-sm"
                          : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          formData.allowPublicLeaderboard === false ? "border-slate-800 bg-slate-800" : "border-slate-300"
                        }`}
                      >
                        {formData.allowPublicLeaderboard === false && (
                          <span className="w-1 h-1 rounded-full bg-white"></span>
                        )}
                      </div>
                      <div>
                        <span className="block text-slate-900 font-bold text-[11px]">🔒 No, Keep Me Private</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Registering Donor...</span>
                ) : (
                  <>
                    <span>Complete Donor Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DonorRegistrationModal;
