import React, { useState, useRef } from "react";
import axios from "axios";
import { 
  Phone, Mail, MapPin, Clock, Building2, Send, 
  AlertCircle, CheckCircle, Users, Heart, Activity, 
  Headphones, FileText, HelpCircle, Shield,
  UploadCloud, Paperclip, FileCheck, X, Eye, Image as ImageIcon,
  File, Trash2, Check, Sparkles, AlertTriangle
} from "lucide-react";
import ChatBot from "../Components/ChatBot.jsx";
import { validateFullName } from "../utils/nameValidator.js";
import GlobalPhoneInput from "../Components/GlobalPhoneInput.jsx";

const SOMALI_CARRIERS = [
  { id: "hormuud", name: "Hormuud", code: "+252 61", label: "Hormuud (+252 61 / 061)", prefix: "61" },
  { id: "somlink_77", name: "Somlink / Hormuud 77", code: "+252 77", label: "Somlink / Hormuud (+252 77 / 077)", prefix: "77" },
  { id: "somtel_62", name: "Somtel", code: "+252 62", label: "Somtel (+252 62 / 062)", prefix: "62" },
  { id: "somtel_65", name: "Somtel", code: "+252 65", label: "Somtel (+252 65 / 065)", prefix: "65" },
  { id: "telesom", name: "Telesom", code: "+252 63", label: "Telesom (+252 63 / 063)", prefix: "63" },
  { id: "golis", name: "Golis", code: "+252 90", label: "Golis (+252 90 / 090)", prefix: "90" },
  { id: "somnet", name: "Somnet", code: "+252 68", label: "Somnet (+252 68 / 068)", prefix: "68" },
  { id: "other", name: "National", code: "+252", label: "Other / (+252)", prefix: "" },
];

const JUSTIFICATION_CATEGORIES = [
  "Hospital Requisition Letter",
  "Doctor's Prescription",
  "Blood Crossmatch Slip",
  "Medical Diagnostic Report",
  "Patient Summary / ID",
  "Other Justification"
];

const COMMON_SUBJECTS = [
  "Urgent Blood Request",
  "Hospital Verification",
  "Blood Justification Proof",
  "Emergency Donor Dispatch",
  "Donor Registration Inquiry",
  "Technical Support"
];

import SplitHero from "../Components/SplitHero.jsx";
import CtaBanner from "../Components/CtaBanner.jsx";

function Contact() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    carrier: "Hormuud",
    carrierCode: "+252 61",
    phone: "",
    subject: "",
    urgency: "Urgent",
    message: ""
  });
  
  const [attachments, setAttachments] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Hospital Requisition Letter");
  const [isDragging, setIsDragging] = useState(false);
  const [formStatus, setFormStatus] = useState(null); // 'success', 'error', or null
  const [statusMessage, setStatusMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // for lightbox / modal
  
  const fileInputRef = useRef(null);

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fullName") {
      const check = validateFullName(value);
      setNameError(value ? check.error : "");
    }
    
    if (name === "phone") {
      let cleanVal = value.replace(/\D/g, "");
      
      // If user typed with leading 0 (e.g. 0771007272 or 0616408886)
      let strippedLeadingZero = cleanVal.startsWith("0") ? cleanVal.substring(1) : cleanVal;
      
      // Auto detect carrier if user starts typing with 77, 61, 62, 63, 65, 68, 90 or 077, 061, etc.
      let detectedCarrier = SOMALI_CARRIERS.find(c => c.prefix && strippedLeadingZero.startsWith(c.prefix));
      if (detectedCarrier && strippedLeadingZero.length >= 2) {
        let subscriberPart = strippedLeadingZero.startsWith(detectedCarrier.prefix) 
          ? strippedLeadingZero.substring(detectedCarrier.prefix.length)
          : strippedLeadingZero;

        setFormData(prev => ({
          ...prev,
          phone: subscriberPart || cleanVal,
          carrier: detectedCarrier.name,
          carrierCode: detectedCarrier.code
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        phone: cleanVal
      }));
      return;
    }

    if (name === "carrierSelect") {
      const selected = SOMALI_CARRIERS.find(c => c.code === value) || SOMALI_CARRIERS[0];
      setFormData(prev => ({
        ...prev,
        carrier: selected.name,
        carrierCode: selected.code
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Process and convert files to base64
  const processFiles = (files) => {
    const validFiles = Array.from(files);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    validFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" exceeds the 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        const newAttachment = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          category: activeCategory,
          data: base64Data,
          isImage: file.type.startsWith("image/"),
          isPdf: file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
        };

        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ""; // reset
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const updateAttachmentCategory = (id, newCat) => {
    setAttachments(prev => prev.map(att => att.id === id ? { ...att, category: newCat } : att));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameCheck = validateFullName(formData.fullName);
    if (!nameCheck.isValid) {
      setNameError(nameCheck.error);
      setFormStatus("error");
      setStatusMessage(nameCheck.error);
      return;
    }
    setSubmitting(true);
    setFormStatus(null);

    const formattedPhoneNumber = formData.phone
      ? `${formData.carrierCode} ${formData.phone}`.trim()
      : "";

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      carrier: formData.carrier,
      carrierCode: formData.carrierCode,
      formattedPhone: formattedPhoneNumber,
      subject: formData.subject,
      urgency: formData.urgency,
      message: formData.message,
      attachments: attachments.map(({ name, type, size, category, data }) => ({
        name,
        type,
        size,
        category,
        data
      }))
    };

    try {
      await axios.post("/api/contact", payload);
      setFormStatus("success");
      setStatusMessage("Thank you! Your message and medical justification documents have been submitted successfully. Our team and emergency dispatchers will review it immediately.");
      setFormData({
        fullName: "",
        email: "",
        carrier: "Hormuud",
        carrierCode: "+252 61",
        phone: "",
        subject: "",
        urgency: "Urgent",
        message: ""
      });
      setAttachments([]);
      setTimeout(() => setFormStatus(null), 8000);
    } catch (error) {
      console.error("Error sending message:", error);
      setFormStatus("error");
      setStatusMessage(error.response?.data?.message || "Failed to send your request. Please check your details and try again.");
      setTimeout(() => setFormStatus(null), 8000);
    } finally {
      setSubmitting(false);
    }
  };

  // Computed formatted preview phone
  const formattedDisplayPhone = `${formData.carrierCode} ${formData.phone || "XXXXXXX"}`;

  return (
    <div className="font-brand min-h-screen bg-white">
      {/* Hero Section */}
      <SplitHero
        eyebrow="Contact Us"
        title={
          <>
            We&apos;re here to <span className="text-brand">help</span>
          </>
        }
        text="Blood Donation Management System - Ministry of Health, Federal Government of Somalia. We're here to help you save lives. Reach out to us anytime."
        image="/hero3.jpg"
        imageAlt="Blood bags stored at a blood bank"
        tagline="Reach out anytime"
      />

      {/* Emergency Hotline Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-3xl border border-line border-l-4 border-l-brand bg-white px-6 py-6 shadow-sm sm:px-10">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">24/7 Emergency Hotline</p>
                <p className="text-2xl font-extrabold text-navy">888 (Toll-Free)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0 text-brand" />
              <p className="text-base sm:text-lg">For urgent blood requirements, call immediately</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Contact Information */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ContactInfoCard
            icon={Building2}
            title="Main Office"
            lines={[
              "Ministry of Health",
              "Mogadishu, Somalia",
              "Blood Donation Division"
            ]}
          />
          <ContactInfoCard
            icon={Phone}
            title="Phone Numbers"
            lines={[
              "General: +252 61 640 8886",
              "Emergency: 061 640 8886 (24/7)",
              "Mon-Fri: 8:00 AM - 5:00 PM"
            ]}
          />
          <ContactInfoCard
            icon={Mail}
            title="Email Addresses"
            lines={[
              "info@bdms.gov.so",
              "support@bdms.gov.so",
              "Response within 24 hours"
            ]}
          />
          <ContactInfoCard
            icon={Clock}
            title="Working Hours"
            lines={[
              "Monday - Friday",
              "8:00 AM - 5:00 PM",
              "Emergency: 24/7"
            ]}
          />
        </div>
      </section>

      {/* Department Directory */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-navy mb-3">Department Directory</h2>
          <p className="text-base text-slate-600">Contact specific departments for specialized assistance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DepartmentCard
            icon={Heart}
            title="Blood Bank Operations"
            description="Blood inventory, storage, and distribution"
            email="bloodbank@sobda.org"
            phone="+252 61 640 8886"
          />
          <DepartmentCard
            icon={Users}
            title="Donor Services"
            description="Donor registration, scheduling, and support"
            email="donors@sobda.org"
            phone="+252 61 640 8886"
          />
          <DepartmentCard
            icon={Activity}
            title="Hospital Relations"
            description="Hospital partnerships and blood requests"
            email="hospitals@sobda.org"
            phone="+252 61 640 8886"
          />
          <DepartmentCard
            icon={Headphones}
            title="Technical Support"
            description="System access, account issues, and IT help"
            email="support@sobda.org"
            phone="+252 61 640 8886"
          />
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 md:p-12 border border-line">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Emergency & Inquiry Dispatch</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-navy mb-3">Send Us a Message</h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
              Submit blood requests, hospital verifications, or general inquiries with medical justification documents
            </p>
          </div>

          {formStatus === 'success' && (
            <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 animate-fadeIn">
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-base">Request Submitted Successfully</h4>
                <p className="text-emerald-700 text-sm mt-1">{statusMessage}</p>
              </div>
            </div>
          )}

          {formStatus === 'error' && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 animate-fadeIn">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 text-base">Submission Error</h4>
                <p className="text-red-700 text-sm mt-1">{statusMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  YOUR FULL NAME <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3.5 bg-slate-50/50 border rounded-2xl focus:bg-white focus:ring-2 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm sm:text-base shadow-sm ${
                    nameError
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-slate-200 focus:ring-red-500 focus:border-red-500"
                  }`}
                  placeholder="e.g. Dr. Ali Mohamed"
                />
                {nameError && (
                  <p className="text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {nameError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  EMAIL ADDRESS <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm sm:text-base shadow-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Phone Number with Global Country Selector */}
            <div>
              <label htmlFor="phone" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                PHONE / WHATSAPP NUMBER <span className="text-red-600">*</span>
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

            {/* Subject / Inquiry Type */}
            <div>
              <label htmlFor="subject" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                SUBJECT / INQUIRY TYPE <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm sm:text-base shadow-sm"
                placeholder="e.g. Urgent Blood Request / Hospital Verification"
              />

              {/* Quick subject chips */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {COMMON_SUBJECTS.map((sub, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, subject: sub }))}
                    className={`text-xs px-3 py-1 rounded-xl transition-all font-semibold border ${
                      formData.subject === sub
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Details */}
            {/* MESSAGE DETAILS WITH DIRECT FILE ATTACHMENT & UPLOAD */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label htmlFor="message" className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  MESSAGE DETAILS <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-xl border border-red-200 transition-all cursor-pointer shadow-xs"
                    title="Upload justification documents"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach Files / Proof</span>
                  </button>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                  >
                    <option value="Urgent">🔴 Urgent</option>
                    <option value="Emergency">🚨 Emergency</option>
                    <option value="Normal">🟢 Normal</option>
                  </select>
                </div>
              </div>

              {/* Message Box & Drag Drop Container */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl transition-all border ${
                  isDragging 
                    ? "ring-2 ring-red-500 border-red-500 bg-red-50/30" 
                    : "border-slate-300 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 bg-white"
                } shadow-sm overflow-hidden`}
              >
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  required
                  rows="5"
                  className="w-full px-4 py-3.5 bg-slate-50/40 focus:bg-white focus:outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm sm:text-base resize-none border-b border-slate-100"
                  placeholder="Describe your request, patient details, blood group requirement, or inquiry..."
                ></textarea>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept="image/*,application/pdf,.doc,.docx"
                  className="hidden"
                />

                {/* Integrated Attachment Bar */}
                <div className="bg-slate-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-red-600" />
                      <span>Upload Medical Justification</span>
                    </button>
                    <span className="hidden sm:inline text-[11px] text-slate-400">
                      (PDF, JPG, PNG, DOCX up to 10MB • Drag or paste files)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold">Document Type:</span>
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-xs focus:ring-1 focus:ring-red-500 cursor-pointer"
                    >
                      {JUSTIFICATION_CATEGORIES.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ATTACHMENTS PREVIEW LIST */}
              {attachments.length > 0 && (
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                    <span className="flex items-center gap-1 text-slate-800">
                      <Paperclip className="w-3.5 h-3.5 text-red-600" />
                      Attached Medical Justification Documents ({attachments.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments([])}
                      className="text-red-600 hover:text-red-700 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {file.isImage ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                              className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer border border-slate-200 relative group-hover:opacity-90"
                            >
                              <img
                                src={file.data}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                              className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex-shrink-0 flex items-center justify-center border border-red-100 cursor-pointer"
                            >
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-500">
                                {formatFileSize(file.size)}
                              </span>
                              <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                {file.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAttachment(file.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy notice banner */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3.5">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>Data Protection & Medical Confidentiality:</strong> All uploaded prescriptions and requisition files are securely stored, encrypted, and accessible solely to authorized hospital medical officers and emergency blood bank coordinators.
              </p>
            </div>

            {/* Transmit Message Submit Button (Matching User's Red Action Button) */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-8 py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg shadow-red-600/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Transmitting Message & Files...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Transmit Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  {previewFile.isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate max-w-sm">{previewFile.name}</h3>
                  <p className="text-xs text-slate-400">
                    {previewFile.category} • {formatFileSize(previewFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[300px]">
              {previewFile.isImage ? (
                <img
                  src={previewFile.data}
                  alt={previewFile.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md"
                />
              ) : previewFile.isPdf ? (
                <iframe
                  src={previewFile.data}
                  title={previewFile.name}
                  className="w-full h-[60vh] rounded-xl border border-slate-300"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                  <File className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1">{previewFile.name}</h4>
                  <p className="text-xs text-slate-500 mb-4">Binary Document ({formatFileSize(previewFile.size)})</p>
                  <a
                    href={previewFile.data}
                    download={previewFile.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <a
                href={previewFile.data}
                download={previewFile.name}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Download
              </a>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-navy mb-3">Quick Links</h2>
          <p className="text-base text-slate-600">Find answers and resources</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickLinkCard
            icon={HelpCircle}
            title="FAQs"
            description="Common questions answered"
            link="#"
          />
          <QuickLinkCard
            icon={AlertCircle}
            title="Emergency Procedures"
            description="Urgent blood request guide"
            link="#"
          />
          <QuickLinkCard
            icon={FileText}
            title="Feedback Form"
            description="Share your experience"
            link="#"
          />
          <QuickLinkCard
            icon={Phone}
            title="Report an Issue"
            description="Technical problems or concerns"
            link="#"
          />
        </div>
      </section>

      {/* Location Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-line shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 md:p-10">
              <h2 className="text-3xl font-extrabold text-navy mb-4">Visit Our Office</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-800">Ministry of Health</p>
                    <p className="text-gray-600">Blood Donation Management Division</p>
                    <p className="text-gray-600">Mogadishu, Somalia</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-800">Office Hours</p>
                    <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                    <p className="text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
                    <p className="text-gray-600">Sunday: Closed (Emergency line available)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-800">Contact Numbers</p>
                    <p className="text-gray-600">Main: +252 61 640 8886</p>
                    <p className="text-gray-600">Emergency: +252 61 640 8886 (24/7)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-soft to-white p-8 md:p-10 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-24 h-24 text-red-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-800 mb-2">Location Map</p>
                <p className="text-gray-600">Ministry of Health Building</p>
                <p className="text-gray-600">Mogadishu, Somalia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner
        variant="red"
        title="Be Part of the Change"
        text="Donate blood today and help build a healthier Somalia."
        label="Become Donor"
        to="/signup"
      />

      {/* Floating AI ChatBot */}
      <ChatBot />
    </div>
  );
}

// Contact Info Card Component
function ContactInfoCard({ icon: Icon, title, lines }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soft text-brand">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-3 text-lg font-extrabold text-navy">{title}</h3>
      <div className="space-y-1">
        {lines.map((line, index) => (
          <p key={index} className="text-sm text-slate-600">{line}</p>
        ))}
      </div>
    </div>
  );
}

// Department Card Component
function DepartmentCard({ icon: Icon, title, description, email, phone }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft text-brand">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-lg font-extrabold text-navy">{title}</h3>
          <p className="mb-4 text-sm text-slate-600">{description}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <a href={`mailto:${email}`} className="break-all text-brand hover:text-brand-dark hover:underline">
                {email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <a href={`tel:${phone}`} className="text-slate-700 hover:text-brand">
                {phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Link Card Component
function QuickLinkCard({ icon: Icon, title, description, link }) {
  return (
    <a
      href={link}
      className="group rounded-2xl border border-line bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-soft text-navy transition-colors group-hover:bg-brand group-hover:text-white">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-extrabold text-navy transition-colors group-hover:text-brand">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </a>
  );
}

export default Contact;
