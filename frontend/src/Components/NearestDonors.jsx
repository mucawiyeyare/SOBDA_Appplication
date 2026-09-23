import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, MapPin, Phone, Mail, Droplet, Navigation, Loader, AlertCircle, User } from "lucide-react";

function NearestDonors() {
  const [searchParams, setSearchParams] = useState({
    latitude: "",
    longitude: "",
    bloodType: "",
    organType: "None",
    maxDistance: 50000
  });
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

  useEffect(() => {
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => initializeMap();
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    const defaultCenter = { lat: 31.5204, lng: 74.3587 };
    const mapInstance = new window.google.maps.Map(document.getElementById("donors-map"), {
      center: defaultCenter,
      zoom: 11,
      mapTypeControl: true,
    });
    setMap(mapInstance);
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchParams({
            ...searchParams,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          });
          setMessage({ type: "success", text: "Current location detected!" });
          setLoading(false);
        },
        (error) => {
          setMessage({ type: "error", text: "Could not get your current location" });
          setLoading(false);
        }
      );
    }
  };

  const handleSearch = async () => {
    if (!searchParams.latitude || !searchParams.longitude) {
      setMessage({ type: "error", text: "Please provide your location coordinates" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/geolocation/nearest-donors",
        searchParams,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDonors(response.data.donors);
      
      if (response.data.donors.length === 0) {
        setMessage({ type: "error", text: "No donors found matching your criteria" });
      } else {
        setMessage({ type: "success", text: `Found ${response.data.donors.length} donor(s)` });
        displayDonorsOnMap(response.data.donors, response.data.searchLocation);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to search donors"
      });
    } finally {
      setLoading(false);
    }
  };

  const displayDonorsOnMap = (donorsList, searchLocation) => {
    if (!map) return;

    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    const hospitalMarker = new window.google.maps.Marker({
      position: { lat: parseFloat(searchLocation.latitude), lng: parseFloat(searchLocation.longitude) },
      map: map,
      title: "Your Location",
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      }
    });
    newMarkers.push(hospitalMarker);
    bounds.extend(hospitalMarker.getPosition());

    donorsList.forEach((donor, index) => {
      if (donor.coordinates) {
        const marker = new window.google.maps.Marker({
          position: { lat: donor.coordinates.latitude, lng: donor.coordinates.longitude },
          map: map,
          title: donor.name,
          label: (index + 1).toString(),
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding: 10px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">${donor.name}</h3>
            <p style="margin: 2px 0;">Blood Type: ${donor.bloodType}</p>
            <p style="margin: 2px 0;">Distance: ${donor.distance} km</p>
            <p style="margin: 2px 0;">Phone: ${donor.phone}</p>
          </div>`
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
        bounds.extend(marker.getPosition());
      }
    });

    setMarkers(newMarkers);
    map.fitBounds(bounds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Search className="w-10 h-10 text-red-600" />
            Find Nearest Donors
          </h1>
          <p className="text-gray-600">Search for available donors near your location</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            <AlertCircle className="w-5 h-5" />
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Search Criteria</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={searchParams.latitude}
                onChange={(e) => setSearchParams({ ...searchParams, latitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="31.5204"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={searchParams.longitude}
                onChange={(e) => setSearchParams({ ...searchParams, longitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="74.3587"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Type</label>
              <select
                value={searchParams.bloodType}
                onChange={(e) => setSearchParams({ ...searchParams, bloodType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Types</option>
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Organ Type</label>
              <select
                value={searchParams.organType}
                onChange={(e) => setSearchParams({ ...searchParams, organType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
          </div>

          <div className="flex gap-3">
            <button
              onClick={useCurrentLocation}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Navigation className="w-5 h-5" />
              Use My Location
            </button>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search Donors
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Donors Map</h2>
              </div>
              <div id="donors-map" className="w-full h-[500px] bg-gray-200"></div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Search Results ({donors.length})
              </h2>

              {donors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No donors found. Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {donors.map((donor, index) => (
                    <div key={donor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{donor.name}</h3>
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                          </div>
                        </div>
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                          {donor.bloodType}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="font-semibold">{donor.distance} km away</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${donor.phone}`} className="hover:text-red-600">{donor.phone}</a>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${donor.email}`} className="hover:text-red-600">{donor.email}</a>
                        </div>

                        {donor.organType && donor.organType !== "None" && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Droplet className="w-4 h-4" />
                            <span>Organ: {donor.organType}</span>
                          </div>
                        )}

                        {donor.address && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            {donor.address}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NearestDonors;
