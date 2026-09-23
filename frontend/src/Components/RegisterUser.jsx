import React, { useState } from "react";
import axios from "axios";
import { UserPlus, Mail, Lock, Phone, MapPin, Droplet, User, Shield, AlertCircle } from "lucide-react";
import { validateFullName } from "../utils/nameValidator.js";

function RegisterUser() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    bloodType: "",
    role: "donor",
    specialty: "",
    bio: ""
  });
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "name") {
      const check = validateFullName(value);
      setNameError(value ? check.error : "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameCheck = validateFullName(formData.name);
    if (!nameCheck.isValid) {
      setNameError(nameCheck.error);
      setMessage({ type: "error", text: nameCheck.error });
      return;
    }
    setLoading(true);
    setNameError("");
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/admin/register-user",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: "success", text: res.data.message || "User registered successfully!" });
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        location: "",
        bloodType: "",
        role: "donor",
        specialty: "",
        bio: ""
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to register user"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <UserPlus className="w-10 h-10 text-red-600" />
            Register New User
          </h1>
          <p className="text-gray-600">Create a new user account (Admin only)</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          {/* Message Alert */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 2-Column Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 transition-all ${
                    nameError
                      ? "border-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-gray-300 focus:border-red-500"
                  }`}
                  required
                />
                {nameError && (
                  <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              {/* Blood Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Droplet className="w-4 h-4" />
                  Blood Type
                </label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select Blood Type</option>
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

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  User Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="donor">Donor</option>
                  <option value="hospital">Hospital</option>
                  <option value="admin">Admin</option>
                  <option value="health_institution">Health Institution (Ministry)</option>
                  <option value="doctor">Doctor (answers donors' questions)</option>
                </select>
              </div>

              {formData.role === "doctor" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
                    <input
                      type="text"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      placeholder="e.g. Hematologist"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Short bio (shown on the website)</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="2"
                      placeholder="e.g. Blood Disorders & Transfusion"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? "Registering..." : "Register User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterUser;
