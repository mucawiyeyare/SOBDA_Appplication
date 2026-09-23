import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Droplet, Building2, User, Mail, Lock, Phone, MapPin,
  ShieldCheck, HeartHandshake, Calendar, AlertCircle, CheckCircle2,
  FileCheck2, Sparkles, Activity, Trophy, Award
} from "lucide-react";
import SobdaLogo from "../Components/SobdaLogo.jsx";
import { SOMALIA_REGIONS } from "../utils/somaliaLocations.js";
import { validateFullName } from "../utils/nameValidator.js";
import GlobalPhoneInput from "../Components/GlobalPhoneInput.jsx";

function Signup() {
  const [role, setRole] = useState("donor"); // 'donor' | 'hospital'

  // Donor form fields
  const [donorData, setDonorData] = useState({
    nationalId: "",
    gender: "Male",
    name: "",
    email: "",
    password: "",
    phone: "",
    dialCode: "+252",
    region: "",
    district: "",
    bloodType: "O+",
    age: "",
    allowPublicLeaderboard: true,
  });

  // Hospital form fields
  const [hospitalData, setHospitalData] = useState({
    name: "",
    hospitalLicense: "",
    email: "",
    password: "",
    phone: "",
    dialCode: "+252",
    region: "",
    district: "",
    road: "",
  });

  const [hospitalPendingSubmitted, setHospitalPendingSubmitted] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // Handle donor field change
  const handleDonorChange = (e) => {
    const { name, value } = e.target;
    setDonorData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      const nameCheck = validateFullName(value);
      setNameError(value ? nameCheck.error : "");
    }
  };

  // Handle hospital field change
  const handleHospitalChange = (e) => {
    const { name, value } = e.target;
    setHospitalData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setNameError(value.trim().length < 3 ? "Hospital name must be at least 3 characters." : "");
    }
  };

  // Region change handlers
  const handleDonorRegionChange = (e) => {
    const region = e.target.value;
    setDonorData((prev) => ({ ...prev, region, district: "" }));
  };

  const handleHospitalRegionChange = (e) => {
    const region = e.target.value;
    setHospitalData((prev) => ({ ...prev, region, district: "", road: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setNameError("");
    setSuccessMessage("");

    if (role === "donor") {
      const nameCheck = validateFullName(donorData.name);
      if (!nameCheck.isValid) {
        setNameError(nameCheck.error);
        setErrorMessage(nameCheck.error);
        return;
      }
      if (!donorData.region) {
        setErrorMessage("Please select your region.");
        return;
      }
      if (!donorData.district) {
        setErrorMessage("Please select your district.");
        return;
      }
      if (!donorData.phone) {
        setErrorMessage("Please enter your WhatsApp phone number.");
        return;
      }

      setLoading(true);
      try {
        const formattedPhone = `${donorData.dialCode} ${donorData.phone}`.trim();
        const payload = {
          role: "donor",
          nationalId: donorData.nationalId,
          gender: donorData.gender,
          name: donorData.name,
          email: donorData.email,
          password: donorData.password,
          phone: formattedPhone,
          location: `${donorData.district}, ${donorData.region}`,
          bloodType: donorData.bloodType,
          age: donorData.age,
          allowPublicLeaderboard: donorData.allowPublicLeaderboard !== false,
        };

        const res = await axios.post("/api/users/register", payload);
        setSuccessMessage(res.data.message || "Donor registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/signin");
        }, 1500);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Registration failed. Please check your information.");
      } finally {
        setLoading(false);
      }
    } else {
      // Hospital registration
      if (!hospitalData.name || hospitalData.name.trim().length < 3) {
        setErrorMessage("Please enter a valid Hospital name.");
        return;
      }
      if (!hospitalData.region) {
        setErrorMessage("Please select hospital region.");
        return;
      }
      if (!hospitalData.district) {
        setErrorMessage("Please select hospital district.");
        return;
      }
      if (!hospitalData.phone) {
        setErrorMessage("Please enter hospital emergency phone number.");
        return;
      }

      setLoading(true);
      try {
        const formattedPhone = `${hospitalData.dialCode} ${hospitalData.phone}`.trim();
        const payload = {
          role: "hospital",
          name: hospitalData.name,
          hospitalLicense: hospitalData.hospitalLicense,
          email: hospitalData.email,
          password: hospitalData.password,
          phone: formattedPhone,
          location: [hospitalData.road.trim(), hospitalData.district, hospitalData.region].filter(Boolean).join(", "),
        };

        const res = await axios.post("/api/users/register", payload);
        setHospitalPendingSubmitted({
          name: hospitalData.name,
          email: hospitalData.email,
          phone: formattedPhone,
          location: [hospitalData.road.trim(), hospitalData.district, hospitalData.region].filter(Boolean).join(", "),
          license: hospitalData.hospitalLicense,
        });
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Hospital registration failed. Please check your information.");
      } finally {
        setLoading(false);
      }
    }
  };

  const donorDistricts = SOMALIA_REGIONS[donorData.region] || [];
  const hospitalDistricts = SOMALIA_REGIONS[hospitalData.region] || [];

  // If a hospital just registered, show the dedicated Pending Admin Approval notice
  if (hospitalPendingSubmitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {/* Top Centered Branding Logo */}
          <div className="text-center mb-6 flex flex-col items-center">
            <Link to="/" className="inline-block transform hover:scale-105 transition-transform duration-200 mb-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/80">
              <SobdaLogo size="lg" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 relative overflow-hidden text-center">
            {/* Top Amber Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-brand"></div>

            <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-200 animate-pulse">
              <Building2 className="w-10 h-10 text-amber-600" />
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider mb-4">
              ⏳ Pending Administrator Approval
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              Registration Received!
            </h2>
            <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
              Your hospital registration for <strong className="text-slate-900 font-bold">{hospitalPendingSubmitted.name}</strong> has been submitted. In accordance with healthcare protocols, all medical facilities must be reviewed and approved by an administrator before access is granted.
            </p>

            {/* Hospital Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Hospital Name:</span>
                <span className="font-bold text-slate-900">{hospitalPendingSubmitted.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="font-bold text-slate-900">{hospitalPendingSubmitted.location}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Official Email:</span>
                <span className="font-bold text-slate-900">{hospitalPendingSubmitted.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Approval Status:</span>
                <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                  Awaiting Admin Verification
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-line text-slate-700 text-xs text-left mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Next Step:</strong> Our administrative team will verify your facility details. You will not be able to log in to dispatch donor requests until your account is approved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/"
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Return to Homepage
              </Link>
              <Link
                to="/signin"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Top Centered Branding Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link to="/" className="inline-block transform hover:scale-105 transition-transform duration-200 mb-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/80">
            <SobdaLogo size="lg" />
          </Link>
          <p className="text-sm font-medium text-slate-600 max-w-md mx-auto text-center">
            {role === "donor"
              ? "Register as a voluntary blood donor to save lives in emergency hospital cases"
              : "Register medical facility to request blood donors and connect in real time"}
          </p>
        </div>

        {/* ────────────────── Segmented Role Switcher Pill ────────────────── */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center max-w-sm w-full border border-line">
            <button
              type="button"
              onClick={() => {
                setRole("donor");
                setErrorMessage("");
                setNameError("");
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                role === "donor"
                  ? "bg-navy text-white shadow-md"
                  : "text-slate-500 hover:text-navy"
              }`}
            >
              <Droplet className="w-4 h-4" />
              <span>Blood Donor</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("hospital");
                setErrorMessage("");
                setNameError("");
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                role === "hospital"
                  ? "bg-navy text-white shadow-md"
                  : "text-slate-500 hover:text-navy"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Hospital</span>
            </button>
          </div>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 relative overflow-hidden">
          {/* Top accent bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-2 transition-all duration-300 ${
              role === "donor"
                ? "bg-brand"
                : "bg-brand"
            }`}
          ></div>

          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {role === "donor" ? "Voluntary Donor Registration" : "Hospital & Medical Facility Registration"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {role === "donor"
                  ? "Provide your details to be matched with emergency requests in your area"
                  : "Register your hospital to dispatch emergency donor requests across Somalia"}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wide">
              <ShieldCheck className={`w-4 h-4 ${role === "donor" ? "text-red-600" : "text-emerald-600"}`} />
              <span>{role === "donor" ? "Donor Portal" : "Hospital Portal"}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ═══════════════════════════════════════════════════ */}
            {/* 1. DONOR REGISTRATION FIELDS                        */}
            {/* ═══════════════════════════════════════════════════ */}
            {role === "donor" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Government / National ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      National / Govt ID *
                    </label>
                    <input
                      name="nationalId"
                      placeholder="e.g. SOM-889900 or Passport"
                      value={donorData.nationalId}
                      onChange={handleDonorChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={donorData.gender}
                      onChange={handleDonorChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Donor Full Name (First & Last) *
                  </label>
                  <input
                    name="name"
                    placeholder="e.g. Mohamed Ali"
                    value={donorData.name}
                    onChange={handleDonorChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 text-sm transition-all ${
                      nameError
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                        : "border-slate-200 focus:ring-red-500 focus:border-red-500"
                    }`}
                    required
                  />
                  {nameError && (
                    <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {nameError}
                    </p>
                  )}
                </div>

                {/* Telephone (WhatsApp Capable with Global Country Selector) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Phone Number *
                  </label>
                  <GlobalPhoneInput
                    value={donorData.phone}
                    countryCode="SO"
                    onChange={({ dialCode, phone }) => {
                      setDonorData((prev) => ({
                        ...prev,
                        phone,
                        dialCode,
                      }));
                    }}
                    placeholder="615000000 or 0771007272"
                    required
                  />
                </div>

                {/* Blood Type & Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Blood Type *
                    </label>
                    <select
                      name="bloodType"
                      value={donorData.bloodType}
                      onChange={handleDonorChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-semibold text-red-600 transition-all"
                      required
                    >
                      <option value="A+">A+ (A Positive)</option>
                      <option value="A-">A- (A Negative)</option>
                      <option value="B+">B+ (B Positive)</option>
                      <option value="B-">B- (B Negative)</option>
                      <option value="AB+">AB+ (AB Positive)</option>
                      <option value="AB-">AB- (AB Negative)</option>
                      <option value="O+">O+ (Universal Red Cell Donor)</option>
                      <option value="O-">O- (Universal Donor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      name="age"
                      min="18"
                      max="65"
                      placeholder="e.g. 24"
                      value={donorData.age}
                      onChange={handleDonorChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Location (Region & District) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Region (Gobol) *
                    </label>
                    <select
                      name="region"
                      value={donorData.region}
                      onChange={handleDonorRegionChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                      required
                    >
                      <option value="">Select Region</option>
                      {Object.keys(SOMALIA_REGIONS).map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      District (Degmo) *
                    </label>
                    <select
                      name="district"
                      value={donorData.district}
                      onChange={handleDonorChange}
                      disabled={!donorData.region}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all disabled:opacity-50"
                      required
                    >
                      <option value="">{donorData.region ? "Select District" : "Select Region First"}</option>
                      {donorDistricts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. mohamed@example.com"
                      value={donorData.email}
                      onChange={handleDonorChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={donorData.password}
                      onChange={handleDonorChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 🏆 Hall of Heroes Leaderboard Visibility Preference */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-line shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-200 text-slate-700 rounded-xl shadow-sm mt-0.5">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                        Hall of Heroes Leaderboard Visibility *
                      </label>
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        Do you allow your name and donation achievements to be publicly featured on the <strong>Top Blood Heroes</strong> leaderboard on the homepage?
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setDonorData((prev) => ({ ...prev, allowPublicLeaderboard: true }))}
                          className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                            donorData.allowPublicLeaderboard !== false
                              ? "bg-white border-amber-500 ring-2 ring-amber-500/20 text-slate-900 shadow-sm"
                              : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              donorData.allowPublicLeaderboard !== false ? "border-navy bg-navy" : "border-slate-300"
                            }`}
                          >
                            {donorData.allowPublicLeaderboard !== false && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            )}
                          </div>
                          <div>
                            <span className="block text-slate-900 font-bold">⭐ Yes, Feature My Profile</span>
                            <span className="block text-[10px] text-slate-500 font-normal">Show me in Top Heroes if I rank</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDonorData((prev) => ({ ...prev, allowPublicLeaderboard: false }))}
                          className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                            donorData.allowPublicLeaderboard === false
                              ? "bg-white border-slate-700 ring-2 ring-slate-700/20 text-slate-900 shadow-sm"
                              : "bg-white/60 border-slate-200 text-slate-500 hover:bg-white"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              donorData.allowPublicLeaderboard === false ? "border-slate-800 bg-slate-800" : "border-slate-300"
                            }`}
                          >
                            {donorData.allowPublicLeaderboard === false && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            )}
                          </div>
                          <div>
                            <span className="block text-slate-900 font-bold">🔒 No, Keep Me Private</span>
                            <span className="block text-[10px] text-slate-500 font-normal">Never show me on leaderboard</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* 2. HOSPITAL REGISTRATION FIELDS                     */}
            {/* ═══════════════════════════════════════════════════ */}
            {role === "hospital" && (
              <>
                {/* Hospital Official Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hospital / Medical Facility Name *
                  </label>
                  <input
                    name="name"
                    placeholder="e.g. Digfeer Hospital, Medina Hospital, Kalkaal Hospital"
                    value={hospitalData.name}
                    onChange={handleHospitalChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all font-semibold text-slate-900"
                    required
                  />
                </div>

                {/* MOH License / Accreditation ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ministry of Health License / Accreditation ID
                  </label>
                  <input
                    name="hospitalLicense"
                    placeholder="e.g. MOH-HOSP-2024-041"
                    value={hospitalData.hospitalLicense}
                    onChange={handleHospitalChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Official MOH facility accreditation identifier</p>
                </div>

                {/* Emergency Telephone / WhatsApp (Global Selector) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hospital Emergency Phone / WhatsApp *
                  </label>
                  <GlobalPhoneInput
                    value={hospitalData.phone}
                    countryCode="SO"
                    onChange={({ dialCode, phone }) => {
                      setHospitalData((prev) => ({
                        ...prev,
                        phone,
                        dialCode,
                      }));
                    }}
                    placeholder="615000000 or 0771007272"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Direct hotline used to coordinate with voluntary blood donors</p>
                </div>

                {/* Hospital Location (Region & District) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hospital Region (Gobol) *
                    </label>
                    <select
                      name="region"
                      value={hospitalData.region}
                      onChange={handleHospitalRegionChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                      required
                    >
                      <option value="">Select Region</option>
                      {Object.keys(SOMALIA_REGIONS).map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hospital District (Degmo) *
                    </label>
                    <select
                      name="district"
                      value={hospitalData.district}
                      onChange={handleHospitalChange}
                      disabled={!hospitalData.region}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all disabled:opacity-50"
                      required
                    >
                      <option value="">{hospitalData.region ? "Select District" : "Select Region First"}</option>
                      {hospitalDistricts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Road / Specific Area (Xafada)
                  </label>
                  <input
                    type="text"
                    name="road"
                    value={hospitalData.road}
                    onChange={handleHospitalChange}
                    disabled={!hospitalData.district}
                    placeholder="Enter the road or area of the hospital in this district"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all disabled:opacity-50"
                  />
                </div>

                {/* Hospital Email & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Hospital Official Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. emergency@digfeer.so"
                      value={hospitalData.email}
                      onChange={handleHospitalChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={hospitalData.password}
                      onChange={handleHospitalChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-white font-bold rounded-xl transition-all duration-200 shadow-md text-sm sm:text-base flex items-center justify-center gap-2 ${
                role === "donor"
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/30"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/30"
              }`}
            >
              {loading ? (
                <span>Registering {role === "donor" ? "Donor" : "Hospital"}...</span>
              ) : (
                <>
                  <span>Create {role === "donor" ? "Donor Account" : "Hospital Account"}</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Already registered?{" "}
              <Link to="/signin" className="font-bold text-red-600 hover:text-red-700 hover:underline">
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
