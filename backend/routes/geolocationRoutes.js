import express from "express";
import User from "../models/usermodel.js";
import { protect, adminOrHospital } from "../middleware/authMiddleware.js";

const router = express.Router();

const toRad = (d) => (d * Math.PI) / 180;
// Great-circle distance in km
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const validCoords = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

// Donor saves their current position
router.post("/set-location", protect, async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({ message: "Only donors can set a donation location" });
    }
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    if (!validCoords(latitude, longitude)) {
      return res.status(400).json({ message: "A valid latitude and longitude are required" });
    }
    const address = typeof req.body.address === "string" ? req.body.address.trim().slice(0, 200) : "";

    await User.updateOne(
      { _id: req.user._id },
      { $set: { coordinates: { latitude, longitude, address, updatedAt: new Date() } } }
    );
    res.json({ message: "Location saved successfully", location: { latitude, longitude, address } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Donor reads their saved position
router.get("/my-location", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("coordinates");
    const c = user?.coordinates;
    if (!c || c.latitude == null || c.longitude == null) return res.json({ hasLocation: false });
    res.json({ hasLocation: true, location: { latitude: c.latitude, longitude: c.longitude, address: c.address || "" } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hospital/admin: available donors within a radius of a point, nearest first
router.post("/nearest-donors", protect, adminOrHospital, async (req, res) => {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    if (!validCoords(latitude, longitude)) {
      return res.status(400).json({ message: "A valid latitude and longitude are required" });
    }
    const radius = Math.min(Math.max(Number(req.body.radius) || 25, 1), 500);
    const limit = Math.min(Math.max(Number(req.body.limit) || 50, 1), 200);

    const filter = {
      role: "donor",
      isAvailable: { $ne: false },
      "coordinates.latitude": { $ne: null },
      "coordinates.longitude": { $ne: null },
    };
    if (req.body.bloodType) filter.bloodType = req.body.bloodType;

    const donors = await User.find(filter).select("name email phone bloodType location coordinates lastDonationDate");
    const cooldownEdge = new Date();
    cooldownEdge.setDate(cooldownEdge.getDate() - 90);

    const results = donors
      // skip donors still inside the 90-day cooldown, same rule as request creation
      .filter((d) => !d.lastDonationDate || d.lastDonationDate <= cooldownEdge)
      .map((d) => ({
        _id: d._id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        bloodType: d.bloodType,
        location: d.location,
        address: d.coordinates.address,
        coordinates: { latitude: d.coordinates.latitude, longitude: d.coordinates.longitude },
        distance: Number(haversineKm(latitude, longitude, d.coordinates.latitude, d.coordinates.longitude).toFixed(1)),
      }))
      .filter((d) => d.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    res.json({ searchLocation: { latitude, longitude }, radius, donors: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
