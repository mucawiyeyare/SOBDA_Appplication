import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapPin, Save, Loader, CheckCircle, AlertCircle, Navigation } from "lucide-react";
function DonorLocationPicker() {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [organType, setOrganType] = useState("None");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [mapLoaded, setMapLoaded] = useState(false);

  // Google Maps API Key - Get from: https://console.cloud.google.com/
  // For now using a placeholder - IMPORTANT: Replace with your actual API key
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

  useEffect(() => {
    loadGoogleMapsScript();
    fetchCurrentLocation();
  }, []);

  /**
   * 📦 Load Google Maps JavaScript API
   */
  const loadGoogleMapsScript = () => {
    // Check if script already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
      initializeMap();
    };
    script.onerror = () => {
      setMessage({ type: "error", text: "Failed to load Google Maps. Please check your API key." });
    };
    document.head.appendChild(script);
  };

  /**
   * 🗺️ Initialize Google Map
   */
  const initializeMap = () => {
    // Default center (you can change this to your region)
    const defaultCenter = { lat: 31.5204, lng: 74.3587 }; // Lahore, Pakistan

    const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(mapInstance);

    // Add click listener to map
    mapInstance.addListener("click", (event) => {
      handleMapClick(event.latLng);
    });
  };

  /**
   * 📍 Handle map click event
   */
  const handleMapClick = async (latLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    setSelectedLocation({ latitude: lat, longitude: lng });

    // Remove existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Add new marker
    const newMarker = new window.google.maps.Marker({
      position: latLng,
      map: map,
      title: "Selected Location",
      animation: window.google.maps.Animation.DROP,
    });

    setMarker(newMarker);

    // Fetch address using reverse geocoding
    await fetchAddress(lat, lng);
  };

  /**
   * 🔍 Fetch address using Google Maps Geocoding API
   */
  const fetchAddress = async (lat, lng) => {
    try {
      setLoading(true);
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          setAddress(results[0].formatted_address);
          setMessage({ type: "success", text: "Address fetched successfully!" });
        } else {
          setAddress("Address not found");
          setMessage({ type: "error", text: "Could not fetch address for this location" });
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching address:", error);
      setMessage({ type: "error", text: "Failed to fetch address" });
      setLoading(false);
    }
  };

  /**
   * 📍 Get current location using browser geolocation
   */
  const fetchCurrentLocation = async () => {
    try {
      const savedLocation = await axios.get("/api/geolocation/my-location", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (savedLocation.data.hasLocation) {
        const { latitude, longitude, address: savedAddress, organType: savedOrgan } = savedLocation.data.location;
        setSelectedLocation({ latitude, longitude });
        setAddress(savedAddress || "");
        setOrganType(savedOrgan || "None");
        
        // Center map on saved location if map is loaded
        if (map) {
          map.setCenter({ lat: latitude, lng: longitude });
          const newMarker = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: map,
            title: "Your Saved Location",
          });
          setMarker(newMarker);
        }
      }
    } catch (error) {
      console.error("Error fetching saved location:", error);
    }
  };

  /**
   * 📍 Use browser's current location
   */
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (map) {
            const latLng = new window.google.maps.LatLng(lat, lng);
            map.setCenter(latLng);
            map.setZoom(15);
            handleMapClick(latLng);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setMessage({ type: "error", text: "Could not get your current location" });
          setLoading(false);
        }
      );
    } else {
      setMessage({ type: "error", text: "Geolocation is not supported by your browser" });
    }
  };

  /**
   * 💾 Save location to database
   */
  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      setMessage({ type: "error", text: "Please select a location on the map" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/geolocation/set-location",
        {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: address,
          organType: organType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: "Location saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error saving location:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save location"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <MapPin className="w-10 h-10 text-red-600" />
            Set Your Location
          </h1>
          <p className="text-gray-600">Click on the map to select your location for donation purposes</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Interactive Map</h2>
                <button
                  onClick={useCurrentLocation}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Use Current Location
                </button>
              </div>
              
              {/* Google Map */}
              <div id="map" className="w-full h-[500px] bg-gray-200">
                {!mapLoaded && (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading map...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Details Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Location Details</h2>

              {/* Coordinates */}
              {selectedLocation && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Coordinates:</p>
                  <p className="text-xs text-gray-600">
                    Lat: {selectedLocation.latitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Lng: {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Address */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address will appear here after selecting location"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows="4"
                />
              </div>

              {/* Organ Type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organ Type (Optional)
                </label>
                <select
                  value={organType}
                  onChange={(e) => setOrganType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="None">None</option>
                  <option value="Kidney">Kidney</option>
                  <option value="Liver">Liver</option>
                  <option value="Heart">Heart</option>
                  <option value="Lungs">Lungs</option>
                  <option value="Pancreas">Pancreas</option>
                  <option value="Cornea">Cornea</option>
                </select>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveLocation}
                disabled={loading || !selectedLocation}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Location
                  </>
                )}
              </button>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-semibold mb-2">📍 Instructions:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Click anywhere on the map to select your location</li>
                  <li>• The address will be automatically fetched</li>
                  <li>• You can edit the address if needed</li>
                  <li>• Click "Save Location" to update your profile</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonorLocationPicker;
